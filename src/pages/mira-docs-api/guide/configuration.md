---
title: 站点配置与主题
description: Mira-Docs 的顶部导航排序和运行时主题切换配置。
group: 快速开始
order: 6
---

# 站点配置与主题

Mira-Docs 有两类配置：构建时的站点目录配置，以及运行时的主题选择。

## 顶部导航排序

在 `src/site.config.ts` 中调整一级目录的显示顺序：

```ts
export const topNavigationOrder = [
  "docs",
  "mira-docs-api",
  "design-md",
  "blogs",
];
```

这些值对应 `src/pages` 下的目录名。新目录可以不写入数组；它仍会被索引，并追加到已配置目录之后。这个配置不负责声明文章，也不负责生成路由。

## 主题文件

主题是独立的 CSS token 文件，当前仓库包含：

```text
src/
├── claude.theme.css
├── apple.theme.css
└── Supabase.theme.css
```

三套主题都会在 `src/main.tsx` 中加载。每套主题使用自己的 `data-theme` 作用域，页面不会因为同时加载多个文件而互相覆盖。

## 在线切换

顶部导航的“主题”菜单修改根元素的 `data-theme` 属性：

```html
<html data-theme="supabase">
```

可用值是 `claude`、`apple` 和 `supabase`。用户的选择保存在 `localStorage` 的 `mira-color-theme` 键中，刷新后恢复。明暗模式使用独立的 `dark` class，不和主题名称混在一起。

新增主题时需要完成三件事：

1. 创建同样接口的 `.theme.css` 文件。
2. 在 `src/main.tsx` 中加载它。
3. 在 `src/App.tsx` 的 `themeOptions` 中加入名称和显示文本。

主题文件只定义 token，不直接修改页面组件布局。组件通过 `var(--primary)`、`var(--canvas)`、`var(--surface-card)` 等语义变量读取主题。

## 目录显示名

独立文档区的侧边分组默认从物理目录名生成。需要中文或品牌化名称时，在 `src/site.config.ts` 的 `directoryLabels` 中配置：

```ts
export const directoryLabels = {
  "视觉/product-design-system": "产品设计系统",
  "视觉/theme": "主题",
};
```

这只改变显示名称，不改变目录、URL 或 Markdown 索引规则。

## Logo 资源

Logo 地址在 `src/site.config.ts` 中配置：

```ts
export const logoUrl = "https://assets.tomz.io/images/mira-logo.png";
```

配置了 `logoUrl` 时，页头和页尾优先使用线上地址。线上资源加载失败时，页面会自动回退到本地的 `public/mira-logo.png`，因此替换 CDN 地址不会让导航和页尾出现破图。

如果需要只使用本地 Logo，可以将 `logoUrl` 配置为空字符串：

```ts
export const logoUrl = "";
```

## SEO 构建模式

SEO 地址配置在 `src/site.config.ts`：

```ts
export const siteUrl = "https://tomz.io";
export const seo = {
  enabled: true,
} as const;
```

如果生产站点更换域名，只需要更新这个值，SEO 构建生成的 canonical、Open Graph、JSON-LD、Sitemap 和 robots 地址会一起更新。

SEO 是否启用也在同一个配置文件中控制。开启后，普通 `npm run build` 就会生成适合搜索引擎抓取的静态页面；设为 `false` 时恢复为普通 SPA 构建：

```ts
export const seo = {
  enabled: true,
} as const;
```

GitHub Pages 使用带基础路径的版本：

```bash
npm run build:github-pages
```

SEO 构建会为公开路由生成静态 `index.html`，并生成 `sitemap.xml`、`robots.txt`、页面 description、canonical、Open Graph、Twitter Card 和 JSON-LD。React 脚本仍会被保留，浏览器加载后继续接管搜索、主题切换和其他交互。
