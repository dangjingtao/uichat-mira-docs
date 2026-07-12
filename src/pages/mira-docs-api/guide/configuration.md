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
  "visual/product-design-system": "产品设计系统",
  "visual/theme": "主题",
};
```

这只改变显示名称，不改变目录、URL 或 Markdown 索引规则。
