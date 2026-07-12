---
title: 导航如何生成
description: Mira-Docs 如何从目录和 Markdown 文件生成页面导航。
group: 快速开始
order: 3
---

# 导航如何生成

Mira-Docs 有两套导航规则。它们服务于不同的内容区，不能混用。

## 默认文档区

`src/pages/docs` 下的文章根据 frontmatter 的 `group` 进入现有文档分组。这个区域使用文档自己的分组信息。

```text
src/pages/docs/architecture/runtime.md
```

它的 URL 是 `/architecture/runtime`，不会把物理目录名 `docs` 暴露到 URL 中。

## 独立文档区

`src/pages` 下与 `docs` 同级的目录拥有自己的导航边界：

```text
src/pages/mira-docs-api/
├── guide/what-is-mira-docs.md
└── reference/frontmatter.md
```

顶部导航来自 `mira-docs-api` 目录。侧边导航来自 `guide` 和 `reference` 目录，文章列表来自这些目录中的 Markdown 文件。

访问 `/mira-docs-api` 时只显示这个文档区自己的内容。如果目录为空，页面显示 404；不会退回默认文档区。

## 路由生成

构建阶段会读取：

```ts
import.meta.glob("./pages/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
})
```

顶层目录清单由 Vite 的虚拟模块生成。文章路由和目录路由都由这两份数据生成，界面组件不维护文章列表。

## 顶部导航排序

页面目录由构建阶段动态发现，顺序由 `src/site.config.ts` 控制：

```ts
export const topNavigationOrder = [
  "docs",
  "mira-docs-api",
  "design-md",
  "blogs",
];
```

数组中的值是 `src/pages` 一级目录名。没有写入配置的新目录不会消失，会按照生成顺序追加到已配置项目之后。配置只改变顶部顺序，不改变路由和侧边导航。

## 合并文档

一个较大的页面可以拆成多个 Markdown 文件，再通过相同的 `merge` 值合并：

```text
src/pages/design-md/visual/
├── product-design-system.md
└── product-design-system/
    ├── overview.md
    ├── type.md
    └── components.md
```

入口文件声明：

```yaml
merge: product-design-system
mergeIndex: true
```

分段文件只声明 `merge`。构建时所有分段按 `order` 拼接，最终只生成入口文件的页面路由；分段中的 Markdown 标题和 HTML `h2` 都会进入页面目录。
