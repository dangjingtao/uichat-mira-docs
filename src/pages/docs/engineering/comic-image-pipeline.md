---
title: 画册图片管线契约
description: 规定画册源图、派生图片、manifest、校验、缓存、R2 发布与前端消费的稳定边界。
group: 工程
order: 17
---

# 画册图片管线契约

画册图片不由页面代码临时压缩、拼接或猜测尺寸。正式链路采用四层边界：

```text
原始图片
→ 可重复执行的图片管线
→ manifest 与派生资源
→ 阅读器消费
```

核心约定是：

> 原图是事实，管线负责派生，manifest 是唯一交付物，前端不得参与图片加工。

第一阶段 CLI 已在 `scripts/comic-pipeline/` 落地，支持源图检查、WebP 构建、产物校验与显式 R2 发布。当前《余光·上》阅读器仍使用低清精灵图与分片；它尚未切换到新 manifest，因此图片管线已经可用，不等于阅读端迁移已经完成。

## 已实现范围

当前实现包含：

- `comic:inspect`：检查配置、页码、缺页、重复页、尺寸和比例；
- `comic:build`：生成多尺寸 WebP、内容哈希文件名、manifest 与报告；
- `comic:verify`：校验文件存在性、宽高、体积与 SHA-256；
- `comic:publish`：使用 staging 前缀提升到 R2 正式目录；
- `comic:test`：在临时目录生成 fixture，完整覆盖 inspect、build 和 verify；
- 本地构建采用临时目录完成后整体替换，失败时不留下半成品。

第一阶段暂不生成 CBZ 和 PDF。它们以后必须从同一份源图和 manifest 派生，不能建立第二套页码事实。

## 非目标

本管线不负责：

- AI 放大或重绘；
- 自动裁切、构图修正或补页；
- 自动调色、提亮、锐化、降噪；
- 用超出源图宽度的文件制造“假高清”；
- 在网站运行时加工原图；
- `build` 完成后自动执行外部上传。

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

可选字段：

```json
{
  "aspectRatioOverrides": [7]
}
```

只有人工确认某页确实采用不同构图时，才能把页码放入 `aspectRatioOverrides`。它不是跳过全部比例检查的开关。

硬规则：

- `id` 在作品生命周期内保持稳定；
- 内容变化时必须提升 `edition`；
- 缺页必须显式列入 `missingPages`；
- 已声明缺页的位置不得同时存在页图；
- 不允许重复页码；
- 不裁切、不拉伸、不改变原始构图；
- EXIF 方向可以归一化；
- 输出颜色空间统一为 sRGB；
- 页面内容、亮度和颜色不得被程序主观修改。

支持的输入格式为 PNG、JPEG、WebP 和 TIFF。输出第一阶段统一为 WebP。

## 派生尺寸规则

页面候选宽度：

```text
320
960
1600
原图宽度
```

封面额外包含 480px 档：

```text
320
480
960
1600
原图宽度
```

程序只生成不超过源图宽度的候选项，并对重复宽度去重。例如源图宽度为 1450px，页面实际输出为：

```text
001-320.<hash>.webp
001-960.<hash>.webp
001-1450.<hash>.webp
```

每张派生图：

- 保持原始比例；
- 使用 `withoutEnlargement`；
- 归一化 EXIF 方向；
- 转为 sRGB；
- 使用 WebP quality 84、effort 5；
- 文件名包含派生文件 SHA-256 的前 8 位。

各档用途：

| 宽度 | 用途 |
| --- | --- |
| 320 | 目录缩略图与小尺寸列表 |
| 480 | 画册封面列表 |
| 960 | 普通手机与低倍率阅读 |
| 1600 | 高分屏手机、平板与桌面 |
| 原图宽度 | 放大阅读与最终兜底 |

## 本地输出契约

默认构建目录：

```text
.mira-cache/
└── comics/
    └── yuguang-vol-1/
        └── v1/
            ├── manifest.json
            ├── report.json
            ├── cover/
            └── pages/
```

`.mira-cache/` 已加入 `.gitignore`。构建过程先写入同级 staging 目录，完成校验后再替换目标目录。目标目录不会在生成一半时被阅读器或发布命令消费。

也可以显式指定输出目录：

```bash
pnpm comic:build -- D:/MiraAssets/comics/yuguang-vol-1 \
  --output D:/MiraBuild/yuguang-vol-1-v1
```

## manifest 契约

阅读器只消费 manifest，不读取源目录，也不推断文件名。

```json
{
  "schemaVersion": 1,
  "pipelineVersion": 1,
  "id": "yuguang-vol-1",
  "edition": "v1",
  "title": "余光·上",
  "subtitle": "第一次讲话",
  "expectedPages": 30,
  "availablePages": 29,
  "missingPages": [22],
  "readingDirection": "ltr",
  "releaseFingerprint": "...",
  "cover": {
    "original": {
      "width": 1456,
      "height": 1055,
      "aspectRatio": 1.38,
      "bytes": 123456,
      "sha256": "..."
    },
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
      "original": {
        "width": 1456,
        "height": 1055,
        "aspectRatio": 1.38,
        "bytes": 234567,
        "sha256": "..."
      },
      "sources": [
        {
          "width": 960,
          "height": 696,
          "src": "pages/001-960.f20a177b.webp",
          "bytes": 108240,
          "sha256": "..."
        }
      ]
    }
  ]
}
```

`releaseFingerprint` 由作品配置、封面源哈希和全部页图源哈希计算。它用于识别一套输入事实，不包含本机绝对路径和构建时间。

`report.json` 可以包含构建时间、警告和产物体积，但不会暴露源图完整本地路径。

## CLI 使用

所有 pnpm 参数都放在 `--` 后面。

### 检查源图

```bash
pnpm comic:inspect -- D:/MiraAssets/comics/yuguang-vol-1
```

输出 JSON：

```bash
pnpm comic:inspect -- D:/MiraAssets/comics/yuguang-vol-1 --json
```

`inspect` 只读取源文件，不生成图片，不访问 R2。

### 构建

```bash
pnpm comic:build -- D:/MiraAssets/comics/yuguang-vol-1
```

### 校验已有构建

```bash
pnpm comic:verify -- .mira-cache/comics/yuguang-vol-1/v1
```

### 查看发布计划

```bash
pnpm comic:publish -- .mira-cache/comics/yuguang-vol-1/v1 --plan
```

`--plan` 不执行任何外部操作，也不要求真实密钥。

### 显式发布

```bash
pnpm comic:publish -- .mira-cache/comics/yuguang-vol-1/v1 --confirm
```

没有 `--confirm` 时，发布命令直接失败。

## R2 环境变量

发布复用 Mira Mobile 已有的密钥命名：

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
R2_ACCOUNT_ID
R2_BUCKET
R2_PUBLIC_BASE_URL        # 可选，仅用于打印公开 manifest 地址
R2_COMICS_PREFIX          # 可选，默认 mira/comics
```

本地发布依赖 AWS CLI。GitHub Runner 已预装 AWS CLI；Windows 本机执行前需要保证 `aws` 命令可用。

## R2 整目录替换语义

R2/S3 实际上没有可原子重命名的“文件夹”。因此不能假装一次 rename 就能替换整本画册，也不能直接逐个覆盖正式目录。

当前发布策略：

```text
本地完整构建
→ 上传到 .staging 临时前缀
→ dry-run 校验 staging 与本地一致
→ 先复制全部新图片到 current
→ 复制 report.json
→ 最后复制 manifest.json，完成版本切换
→ manifest 切换后删除 current 中的旧文件
→ dry-run 校验 current 与 staging 完全一致
→ 删除 staging 临时目录
```

正式路径固定为：

```text
mira/comics/<work-id>/current/
├── manifest.json
├── report.json
├── cover/
└── pages/
```

临时路径：

```text
mira/comics/.staging/<work-id>/<edition>-<fingerprint>-<timestamp>/
```

这套策略的效果是：

- 发布完成后，R2 只保留一份 `current`，不会永久堆积 edition 文件夹；
- 正式目录最终与本地构建完全一致，旧文件会被删除；
- 新 manifest 写入之前，新 manifest 引用的图片已经全部存在；
- staging 只在发布期间短暂占用空间，成功后立即清理；
- 发布失败时不会先清空正式目录。

对象存储无法提供真正的目录级原子事务。这里把 `manifest.json` 作为唯一切换点，是在不引入 Worker 和数据库的前提下最稳妥的边界。

派生图片使用：

```text
Cache-Control: public, max-age=31536000, immutable
```

manifest 与报告使用：

```text
Cache-Control: public, max-age=60, must-revalidate
```

## 校验语义

以下情况直接失败：

- 文件名不是合法三位页码；
- 页码重复；
- 出现未声明缺页；
- 已声明缺页的位置存在文件；
- 图片无法解码或宽高无效；
- 比例偏差超过 5% 且未人工声明 override；
- 派生图宽度超过源图；
- manifest 引用了不存在的文件；
- 文件体积、宽高或 SHA-256 与 manifest 不一致；
- R2 staging 或正式目录在提升后仍与本地构建不一致。

以下情况默认警告：

- 页面比例偏差超过 2%；
- 源图宽度低于 960px；
- 优化后的文件反而大于源文件；
- 构建目录出现未被 manifest 引用的额外文件。

程序不会自动裁切“修正”比例异常。

## 前端消费契约

画册列表、详情页和阅读器只根据 manifest 选择资源：

- 画册列表只加载封面小图；
- 页码目录只加载 320px 页图；
- 当前页根据容器宽度与设备像素比选择合适尺寸；
- 默认只预加载前一页和后一页；
- 放大时允许升级到更高尺寸；
- Service Worker 不预缓存整本书；
- 缺页由 manifest 明确渲染；
- 页面在图片返回前使用 manifest 宽高预留位置；
- 阅读进度和缓存键必须包含 edition。

前端不得拼 Base64 分片、生成精灵图、在浏览器里压缩源图或给原画应用全站明暗主题滤镜。

## 当前迁移顺序

1. `inspect / build / verify / publish`：已完成第一阶段实现；
2. 用《余光·上》原始页面跑真实构建并审查报告；
3. 上传 R2，确认 `current/manifest.json` 与缓存头；
4. 阅读器切换为逐页 manifest 加载；
5. 验证目录、翻页、缩放、缺页、缓存和移动流量；
6. 删除精灵图、Base64 分片和运行时 Blob 拼接逻辑；
7. 后续再从同一 manifest 增加 CBZ 与 PDF。

不允许长期并存“精灵图协议”和“逐页 manifest 协议”。任何无法由程序重复生成的手工图片处理，都不应进入正式发布链路。
