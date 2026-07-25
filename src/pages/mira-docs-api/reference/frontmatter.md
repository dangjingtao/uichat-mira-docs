---
title: Frontmatter 参考
description: MiraDocs 标准字段、YAML 解析与消费者扩展规则。
group: 参考
order: 20
---

# Frontmatter 参考

MiraDocs 优先使用标准 YAML 解析 Frontmatter。为兼容历史内容，标准 YAML 失败时会回退到宽松的 `key: value` 与列表解析。

新文档应始终写合法 YAML；兼容回退只用于迁移，不应成为新的写作规范。

## 完整示例

```yaml
---
id: mira-docs-static-build
path: /mira-docs/static-build
type: doc
title: 静态构建
description: 为每条公开路由生成静态 HTML。
group: Guide
order: 8
date: 2026-07-26
tags:
  - MiraDocs
  - Vite
status: stable
cover: /images/mira-docs.png
author:
  - Mira
  - Tomz Dang
---
```

## 核心字段

### `id`

稳定内容标识。缺失时由 `path` 生成。

### `path`

页面路径。缺失时由源文件路径生成；`index.md` 映射到所在目录。

### `type`

内容类型。内置常用值为 `doc`、`article`、`project` 和 `page`，也允许自定义字符串。

### `title`

页面、导航、静态 HTML 与结构化数据标题。缺失时回退到路径。

### `description`

页面摘要、description、Open Graph 与 JSON-LD 描述。

### `group`

内容分组。没有声明时根据类型回退到“文档”“博客”或“项目”。

### `order`

排序数字，默认 `99`。

### `date`

文章日期。文章列表默认按日期倒序。

### `tags`

支持 YAML 数组，也兼容逗号、中文逗号或 `|` 分隔文本。

### `status`

项目或内容状态，例如 `draft`、`active`、`archived`。

### `cover`

封面或分享图。可以是绝对 URL，也可以是相对站点资源。

## 消费者扩展

未被核心识别的字段仍会保存在 `doc.data`。当前 UIChat Mira 站点使用：

- `author`
- `image`
- `nav`
- `merge`
- `mergeIndex`

这些字段不会污染核心类型，却可以被站点适配器、静态构建器或 Skill 读取。

## 标题

正文中的 Markdown `##` 到 `####` 和 HTML `h2` 到 `h4` 会按原文顺序进入 `headings`。重复标题会自动获得递增锚点。