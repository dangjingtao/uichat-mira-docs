---
title: 编写文档
description: 使用 MiraDocs 创建文档、博客、项目和自定义页面。
group: 快速开始
order: 4
---

# 编写文档

MiraDocs 的基本写作单位是带 Frontmatter 的 Markdown 文件。当前站点内容位于 `src/pages`，新建文件后由 Vite 插件自动发现，无需手写 React Router 路由。

## 最小文档

```yaml
---
title: 编写文档
description: 使用 MiraDocs 创建和维护内容。
group: Guide
order: 4
---

# 编写文档

正文从这里开始。
```

## 推荐字段

| 字段 | 作用 |
| --- | --- |
| `id` | 稳定内容标识；缺失时由路径生成 |
| `path` | 显式页面路径 |
| `type` | `doc`、`article`、`project`、`page` 或自定义类型 |
| `title` | 页面、导航与 SEO 标题 |
| `description` | 摘要与 description |
| `group` | 内容分组 |
| `order` | 排序值，越小越靠前 |
| `date` | 文章日期 |
| `tags` | 标签数组或逗号分隔文本 |
| `status` | 项目或内容状态 |
| `cover` | 封面或分享图 |

完整字段见[Frontmatter 参考](../reference/frontmatter)。

## 博客

```yaml
---
type: article
title: 一篇工程手记
description: 记录一次真实迁移。
date: 2026-07-26
tags:
  - MiraDocs
  - 工程
author:
  - Mira
  - Tomz Dang
---
```

`author` 是当前站点扩展字段，MiraDocs 会把它保留在 `data` 中，静态构建适配器可据此生成 JSON-LD。

## 项目

```yaml
---
type: project
title: MiraDocs
status: active
order: 1
---
```

项目、里程碑和决策记录可以共享同一内容模型，再由站点选择不同展示方式。

## README 不进入站点

当前站点通过 Vite 插件的 `exclude` 回调排除所有 `README.md`。README 继续服务仓库阅读，不参与页面、导航、搜索和 Sitemap。

## HTML 与 Mermaid

当前 UIChat Mira 站点仍支持原有的 `::: html` 块、Mermaid 和代码高亮。这些是站点渲染能力，不是 MiraDocs 内容模型的强制要求。

复杂交互应使用 React 组件或站点扩展；不要在 Markdown 中依赖可执行 `<script>`。

## 合并内容

旧站允许多个 Markdown 通过 `merge` 与 `mergeIndex` 合并为一个页面。该规则保留在站点适配层，MiraDocs 核心只负责解析并保留这些字段。