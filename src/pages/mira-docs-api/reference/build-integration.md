---
title: 构建集成
description: Mira-Docs 在 Vite 构建中的实际接入点。
group: 参考
order: 21
---

# 构建集成

Mira-Docs 的目录感知能力由 Vite 配置和 React 页面共同完成。两边职责不同。

## Markdown 模块

`src/App.tsx` 使用以下 glob 读取文章原文：

```ts
import.meta.glob("./pages/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
})
```

读取结果经过 frontmatter 解析，得到标题、描述、路径、分组、排序值和 `##` 标题列表。

## 顶层目录模块

`vite.config.ts` 注册 `page-directories` 插件。插件负责两件事：

- 生成 `virtual:page-directories`，内容是 `src/pages` 的一级目录名
- 监听目录变化，失效虚拟模块并触发完整刷新

React 端据此生成独立文档区的顶部导航和目录路由。页面组件不写死 `mira-docs-api`，也不会把其他目录的文章放进默认文档区。

## 路由

路由由 `allDocs` 和 `siteAreas` 映射生成：

- 文档文件生成文章路由
- 顶层目录生成文档区入口路由
- 空目录仍生成入口路由，但入口页面显示 404 状态

因此新增文章或新增文档区时，通常只需要改 `src/pages`。只有改变元数据格式、路由规则或目录边界时，才需要修改解析器和布局代码。

## 检查构建

提交前执行：

```bash
npm run build
```

这个命令会先运行 `tsc -b`，再生成 Vite 静态产物。Markdown 内容错误、类型错误或构建配置错误都会在这里暴露。

## 博客目录检查

博客分类由 frontmatter 的 `group` 决定，物理目录仍然需要遵守对应约定：

| 分类 | 目录 |
| --- | --- |
| `产品手记` | `src/pages/blogs/product-journal` |
| `工程现场` | `src/pages/blogs/engineering` |
| `共同思考` | `src/pages/blogs/shared-thinking` |
| `Mira 来信` | `src/pages/blogs/mira-letters` |
| `开发者生活` | `src/pages/blogs/developer-life` |

Vite 构建会检查博客文件的 `group` 与物理目录是否一致。不一致时会输出明确警告，但不会自动移动文件，因为移动目录会改变文章 URL。需要移动已有文章时，应把文件移动和链接影响作为同一次变更处理。

## SEO 构建

SEO 由 `src/site.config.ts` 中的 `seo.enabled` 控制：

```ts
export const seo = {
  enabled: true,
} as const;
```

开启后，`npm run build` 会为公开路由在 `dist` 中生成对应的目录式 `index.html`，并生成 `sitemap.xml` 与 `robots.txt`。GitHub Pages 使用 `npm run build:github-pages`，自动把 `/uichat-mira-docs/` 作为资源、canonical 和 Sitemap 的基础路径。
