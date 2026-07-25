---
title: 站点配置与扩展
description: MiraDocs 核心配置、Vite 插件选项和当前站点扩展。
group: 快速开始
order: 6
---

# 站点配置与扩展

MiraDocs 把配置分为三层：运行时站点配置、Vite 内容配置、消费者自己的视觉与业务配置。

## 运行时配置

```ts
type MiraDocsConfig = {
  title: string
  description: string
  logo?: string
  siteUrl?: string
  base?: string
  navigation?: { label: string; href: string }[]
  footer?: string
  github?: string
}
```

这组字段描述站点身份和公共链接，不包含某个消费者专属的主题实现。

## Vite 插件

```ts
miraDocs({
  contentDir: "src/pages",
  config: {
    title: "UIChat Mira",
    description: "本地优先的多模型智能体工作空间",
    siteUrl,
  },
  exclude,
  route,
  staticRoutes,
})
```

主要选项：

| 选项 | 作用 |
| --- | --- |
| `contentDir` | Markdown 根目录，默认 `content` |
| `config` | MiraDocs 站点配置 |
| `exclude` | 排除某些源文件 |
| `route` | 修改解析后的页面路径 |
| `staticRoutes` | 关闭、启用默认静态构建，或传入自定义静态构建契约 |

## React 扩展

使用 MiraDocs 默认运行时时，可以通过 slots 注入：

```ts
type MiraDocsSlots = {
  home?: ReactNode
  headerActions?: ReactNode
  articleFooter?: ReactNode
}
```

消费者也可以完全保留自己的 React 应用，只使用内容与构建能力。当前旧站就是这种模式。

## UIChat Mira 站点配置

以下内容仍由当前站点维护，而不是写入 MiraDocs 核心：

- Claude、Apple、Supabase 主题。
- 顶部导航顺序。
- 目录中文显示名。
- Logo 回退策略。
- PWA 与 Workbox。
- 博客目录检查。
- 作者关系与合并页。
- UIChat Mira 品牌静态 HTML 和 JSON-LD。

这种边界保证 MiraDocs 可以被其他项目复用，又不会把 UIChat Mira 的设计系统硬编码进运行时。