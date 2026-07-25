---
title: 静态构建与 SEO
description: MiraDocs 的静态路由、元数据、JSON-LD、Sitemap 与 robots 契约。
group: 参考
order: 22
---

# 静态构建与 SEO

MiraDocs 在 Vite 构建完成后，为公开路由生成目录式 HTML。浏览器加载这些页面后，React 继续接管搜索、主题、PWA 与其他交互。

## 静态路由

```ts
type MiraDocsStaticRoute = {
  path: string
  title: string
  description: string
  body: string
  type?: string
  image?: string
  robots?: string
  jsonLd?: unknown
  doc?: MiraDoc
}
```

消费者可以通过 `routes(context)` 提供首页、栏目页和正文页，通过 `notFound(context)` 提供 404。

## 构建选项

```ts
type MiraDocsStaticBuildOptions = {
  routes?: (context) => MiraDocsStaticRoute[]
  notFound?: (context) => MiraDocsStaticRoute
  locale?: string
  siteName?: string
  defaultImage?: string
  image?: { type?: string; width?: number; height?: number }
  twitterCard?: "summary" | "summary_large_image"
  title?: (route, config) => string
  transformTemplate?: (template, context) => string
  rootPlaceholder?: string
  sitemap?: boolean
  robots?: boolean
}
```

MiraDocs 负责通用机制，消费者负责品牌内容。

## 自动注入

每个静态页面可包含：

- `title`
- `description`
- `robots`
- canonical
- Open Graph
- Twitter Card
- JSON-LD
- 服务端可见正文

消费者未提供 JSON-LD 时，MiraDocs 为站点页生成 `WebSite`，为文档生成 `TechArticle`，为文章生成 `Article`。

## 输出

```text
dist/
├── index.html
├── <route>/index.html
├── 404.html
├── sitemap.xml
└── robots.txt
```

`base` 来自 Vite，因此根域名、Cloudflare Pages 和 GitHub Pages 项目路径使用同一套写盘逻辑。

## 当前 UIChat Mira 适配

当前站点的 `mira-docs-static.ts` 只保留：

- UIChat Mira 首页、栏目页和正文 HTML。
- 作者与合并文章映射。
- 品牌图与页面文案。
- `Article`、`TechArticle` 和 `WebSite` JSON-LD 内容。

文件写盘、URL 拼接、metadata 注入、404、Sitemap 与 robots 已全部进入 MiraDocs。

## 产物验证

迁移分支永久检查所有公开内容路由，并验证：

- canonical 带正确 base。
- description 不重复。
- JSON-LD 存在。
- 404 为 `noindex,nofollow`。
- Sitemap 覆盖内容。
- robots 指向正确 Sitemap。