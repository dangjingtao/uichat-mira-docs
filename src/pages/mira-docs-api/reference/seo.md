---
title: SEO 构建 API
description: 使用可选 SEO 构建模式生成静态页面、页面元信息、Sitemap 和 robots.txt。
group: 参考
order: 22
---

# SEO 构建 API

Mira-Docs 通过网站配置控制是否生成 SEO 静态页面。开启后，它会在 Vite 构建完成后，为公开路由生成包含正文和 SEO 元信息的静态 `index.html`；浏览器继续加载 React 脚本，接管搜索、主题和其他交互。

## 配置 API

配置位于 `src/site.config.ts`：

```ts
export const siteUrl = "https://tomz.io";
export const logoUrl = "https://assets.tomz.io/images/mira-logo.png";
export const seo = {
  enabled: true,
} as const;
```

### `siteUrl`

生产站点的协议和域名，不要在末尾添加 `/`。SEO 构建使用它生成：

- `canonical`
- Open Graph `og:url`
- JSON-LD `url`
- `sitemap.xml` 中的 `<loc>`
- `robots.txt` 中的 Sitemap 地址

GitHub Pages 的仓库路径不写进 `siteUrl`，由 `github-pages` 构建模式自动追加。

### `logoUrl`

站点 Logo 的线上地址。它同时用于页面页头、页尾和 SEO 的 Open Graph 图片。线上资源加载失败时，页面回退到 `public/mira-logo.png`。

## 构建 API

根路径部署使用：

```bash
npm run build
```

GitHub Pages 使用：

```bash
npm run build:github-pages
```

`seo.enabled` 为 `true` 时，构建会先执行 TypeScript 检查和 Vite 构建，再生成 SEO 文件；设为 `false` 时只生成普通 SPA 产物。

## 生成内容

SEO 构建会在 `dist` 中生成：

```text
dist/
├── index.html
├── blogs/index.html
├── blogs/<article>/index.html
├── <document>/index.html
├── sitemap.xml
└── robots.txt
```

文档和博客页面的静态 HTML 会包含：

- `title` 和 `description`
- `canonical`
- Open Graph 和 Twitter Card
- 文档 `TechArticle` 或博客 `Article` JSON-LD
- Markdown 转换后的正文

文章标题、摘要、日期、作者和分类均来自 Markdown frontmatter。新增文章后重新运行 SEO 构建即可进入静态产物和 Sitemap。

## 基础路径

GitHub Pages 模式生成的地址示例：

```text
https://tomz.io/uichat-mira-docs/architecture/agent-strategy/
```

资源、静态链接、canonical、Sitemap 和 robots 地址都会使用 `/uichat-mira-docs/`。如果部署仓库或域名发生变化，需要同步检查 `siteUrl` 和构建模式。

## 限制

SEO 构建只处理公开路由和 Markdown 文档，不为博客分类 query 生成重复页面。例如：

```text
/blogs?category=产品手记
```

这类页面仍然由 React 在浏览器中筛选，搜索引擎入口统一使用 `/blogs/`。动态搜索结果、主题状态和用户本地偏好不会进入 Sitemap。
