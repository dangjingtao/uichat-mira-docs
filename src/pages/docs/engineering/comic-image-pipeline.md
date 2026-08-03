---
title: 画册图片管线契约
description: 规定画册源图、派生图片、manifest、校验、缓存、R2 发布与前端消费的稳定边界。
group: 工程
order: 17
---

# 画册图片管线契约

画册图片不应由页面代码临时压缩、拼接或猜测尺寸。正式链路采用三层边界：

```text
原始图片
→ 可重复执行的图片管线
→ manifest 与派生资源
→ 阅读器消费
```

核心约定是：

> 原图是事实，管线负责派生，manifest 是唯一交付物，前端不得参与图片加工。

本文先锁定契约，不代表相关 CLI、R2 发布命令和逐页阅读协议已经实现。当前《余光·上》实验分支仍使用低清精灵图与分片，仅用于验证页面顺序、缺页、目录和阅读器交互，正式化时应整体替换。

## 目标与非目标

本管线要解决：

- 同一批源图可以稳定生成同一套阅读资源；
- 页面尺寸、缺页、比例和文件体积可被程序校验；
- 手机、桌面、目录和放大阅读按需选择清晰度；
- 修改单页时不必重建整本精灵图；
- 生成物可追溯到源图和具体 edition；
- R2、CDN、PWA 缓存不会因覆盖旧文件而串版。

本管线不负责：

- AI 放大或重绘；
- 自动裁切、构图修正或补页；
- 自动调色、提亮、锐化、降噪；
- 用超出源图宽度的文件制造“假高清”；
- 在网站运行时加工原图；
- 本地构建完成后自动执行外部上传。

## 源文件契约

一本画册使用一个独立源目录：

```text
comic-source/
└── yuguang-vol-1/
    ├── work.json
    ├── cover.png
    └── pages/
        ├── 001.png
        ├── 002.png
        ├── 003.png
        ├── ...
        └── 030.png
```

页图文件名必须使用三位数字页码。管线不得根据目录顺序重新编号，也不得拿后一页填补缺页。

`work.json` 的最小结构：

```json
{
  "schemaVersion": 1,
  "id": "yuguang-vol-1",
  "edition": "v1",
  "title": "余光·上",
  "subtitle": "第一次讲话",
  "expectedPages": 30,
  "missingPages": [22],
  "readingDirection": "ltr",
  "expectedAspectRatio": 1.38
}
```

硬规则：

- `id` 在作品生命周期内保持稳定；
- `edition` 对应一套不可变发布物；
- 缺页必须显式列入 `missingPages`；
- 已声明缺页的位置不得同时存在页图；
- 不允许重复页码；
- 不裁切、不拉伸、不改变原始构图；
- EXIF 方向可以归一化；
- 输出颜色空间统一为 sRGB；
- 页面内容、亮度和颜色不得被程序主观修改。

## 派生尺寸规则

候选宽度统一为：

```text
320
960
1600
原图宽度
```

程序只生成不超过源图宽度的候选项，并对重复宽度去重。

例如源图宽度约为 1450px，实际输出应为：

```text
001-320.webp
001-960.webp
001-1450.webp
```

源图宽度为 2400px 时，才生成：

```text
001-320.webp
001-960.webp
001-1600.webp
001-2400.webp
```

各档用途：

| 宽度 | 用途 |
| --- | --- |
| 320 | 目录缩略图与小尺寸列表 |
| 960 | 普通手机与低倍率阅读 |
| 1600 | 高分屏手机、平板与桌面 |
| 原图宽度 | 放大阅读与最终兜底 |

封面遵守相同原则，但可以额外生成 480px 档用于画册列表。第一阶段统一输出 WebP，不同时引入 AVIF，避免增加构建、调试和兼容成本。

## 输出目录契约

本地构建产物按作品和 edition 隔离：

```text
comic-build/
└── yuguang-vol-1/
    └── v1/
        ├── manifest.json
        ├── report.json
        ├── cover/
        │   ├── cover-320.<hash>.webp
        │   ├── cover-480.<hash>.webp
        │   └── cover-1450.<hash>.webp
        ├── pages/
        │   ├── 001-320.<hash>.webp
        │   ├── 001-960.<hash>.webp
        │   ├── 001-1450.<hash>.webp
        │   └── ...
        ├── yuguang-vol-1.cbz
        └── yuguang-vol-1.pdf
```

文件名附带内容哈希，允许派生图片使用长期不可变缓存。`manifest.json` 不使用永久缓存，以便入口能切换到新 edition。

## manifest 契约

阅读器只消费 manifest，不读取源目录，也不推断文件名。

```json
{
  "schemaVersion": 1,
  "id": "yuguang-vol-1",
  "edition": "v1",
  "expectedPages": 30,
  "availablePages": 29,
  "missingPages": [22],
  "readingDirection": "ltr",
  "cover": {
    "width": 1456,
    "height": 1055,
    "aspectRatio": 1.38,
    "sources": [
      {
        "width": 320,
        "height": 232,
        "src": "cover/cover-320.a38f219c.webp",
        "bytes": 18420,
        "sha256": "..."
      }
    ]
  },
  "pages": [
    {
      "number": 1,
      "width": 1456,
      "height": 1055,
      "aspectRatio": 1.38,
      "sourceSha256": "...",
      "sources": [
        {
          "width": 320,
          "height": 232,
          "src": "pages/001-320.aa32f91c.webp",
          "bytes": 20481,
          "sha256": "..."
        },
        {
          "width": 960,
          "height": 696,
          "src": "pages/001-960.f20a177b.webp",
          "bytes": 108240,
          "sha256": "..."
        },
        {
          "width": 1456,
          "height": 1055,
          "src": "pages/001-1456.726cd9aa.webp",
          "bytes": 238012,
          "sha256": "..."
        }
      ]
    }
  ]
}
```

manifest 必须保留：

- 作品 ID 与 edition；
- 预期页数、可用页数和真实缺页；
- 原始宽高与比例；
- 每个派生文件的宽高、体积和哈希；
- 源文件哈希；
- 阅读方向。

## CLI 边界

计划提供三个相互独立的动作。命令名称是契约草案，落实现时可以调整参数，但不能合并职责。

### inspect

```bash
pnpm comic:inspect D:/MiraAssets/comics/yuguang-vol-1
```

只读取和检查源文件，不写图片、不上传资源。输出页码、缺页、尺寸范围、比例偏差和预计产物数量。

### build

```bash
pnpm comic:build D:/MiraAssets/comics/yuguang-vol-1
```

生成派生图片、manifest、报告和可选下载包，默认写入被 `.gitignore` 排除的本地缓存目录。

### publish

```bash
pnpm comic:publish yuguang-vol-1 --edition v1
```

发布前重新检查 manifest、哈希和文件数量，再显式上传 R2。`build` 不能隐式调用 `publish`。

第一阶段实现可使用 Node.js 与 `sharp`。`sharp` 只属于开发期图片工具，不进入网站运行时依赖。

## 校验语义

以下情况直接失败：

- 文件名不是合法三位页码；
- 页码重复；
- 出现未声明缺页；
- 已声明缺页的位置存在文件；
- 图片无法解码或宽高无效；
- 派生图宽度超过源图；
- manifest 引用了不存在的文件；
- 文件哈希与 manifest 不一致；
- 同一 edition 的源内容发生变化却试图覆盖旧发布物。

以下情况默认警告：

- 页面尺寸不完全一致；
- 页面比例偏差超过 2%；
- 源图宽度低于 960px；
- 优化后的文件反而大于源文件；
- 单页体积显著高于全书中位数。

比例偏差明显超过作品约定时，程序应要求人工确认，而不是自动裁切“修正”。

## 前端消费契约

画册列表、详情页和阅读器只根据 manifest 选择资源：

- 画册列表只加载封面小图；
- 页码目录只加载 320px 页图；
- 当前页根据容器宽度与设备像素比选择合适尺寸；
- 默认只预加载前一页和后一页；
- 放大时允许升级到更高尺寸；
- 离开页面后取消不再需要的请求；
- Service Worker 不预缓存整本书；
- 缺页由 manifest 明确渲染；
- 页面在图片返回前使用 manifest 宽高预留位置；
- 阅读进度和缓存键必须包含 edition。

推荐进度键：

```text
comic-progress:yuguang-vol-1:v1
```

前端不得：

- 拼接 Base64 分片；
- 生成精灵图；
- 在浏览器里压缩源图；
- 根据目录文件数量猜测缺页；
- 用后一页代替缺页；
- 给原画应用全站明暗主题滤镜。

## 仓库与 R2 边界

```text
原始 PNG：本地资产目录或私有存储
本地派生缓存：.mira-cache 或等价目录，不提交 Git
正式 WebP / CBZ / PDF：R2
网站仓库：阅读器代码、作品元数据、manifest 地址
```

R2 路径按不可变 edition 隔离：

```text
comics/yuguang-vol-1/v1/
├── manifest.json
├── report.json
├── cover/
├── pages/
├── yuguang-vol-1.cbz
└── yuguang-vol-1.pdf
```

派生图片使用：

```text
Cache-Control: public, max-age=31536000, immutable
```

修改任意正式页面都必须发布新 edition，不覆盖旧目录。这样 CDN、PWA 缓存、分享链接和阅读进度不会串版。

## 当前实验方案的处置

《余光·上》当前实验资源使用低清精灵图、Base64 分片与运行时 Blob 拼接。该方案只用于界面和交互验收，不进入正式协议。

迁移顺序固定为：

1. 实现 `inspect` 和 `build`；
2. 用原始页面生成多尺寸资源与正式 manifest；
3. 阅读器切换为逐页加载；
4. 验证页码、缺页、目录、翻页、缩放、缓存和移动流量；
5. 删除精灵图、Base64 分片和运行时拼接逻辑；
6. 最后接入显式 R2 发布。

不允许长期并存“精灵图协议”和“逐页 manifest 协议”，也不应继续给实验精灵图增加高清分支。

## 变更原则

后续修改本契约时，需要同时核对：

- 源目录兼容性；
- manifest schemaVersion；
- 已发布 edition 的不可变性；
- 阅读器资源选择与缓存逻辑；
- R2 路径与缓存头；
- CBZ、PDF 和网页版本是否仍来自同一套源事实。

任何无法由程序重复生成的手工图片处理，都不应进入正式发布链路。
