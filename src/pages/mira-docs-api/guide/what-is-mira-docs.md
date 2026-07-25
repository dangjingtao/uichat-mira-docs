---
title: MiraDocs 是什么
nav: MiraDocs
group: 快速开始
order: 1
description: MiraDocs 的产品定位、运行边界和当前生产验证状态。
---

# MiraDocs 是什么

MiraDocs 是一个 **Git-native 的文档、发布与项目门户运行时**。它把仓库中的 Markdown 转换成可导航、可搜索、可静态发布的网站，同时给 UIChat Mira 的 Skill 提供稳定的内容协议。

它不是某一个站点皮肤，也不是只服务 UIChat Mira 的一次性脚本。当前这个文档站是 MiraDocs 的第一个生产级消费者，用真实内容反向验证运行时契约。

## 它解决什么问题

传统文档站常把内容、导航、路由、SEO 和部署逻辑散落在页面组件与构建脚本里。MiraDocs 把这些职责拆成几层：

- Markdown 与 Frontmatter 是内容源。
- `@mira/docs` 提供统一内容模型和解析能力。
- `@mira/docs/vite` 负责内容发现、热更新和静态构建。
- React 站点决定视觉、交互与品牌表达。
- GitHub Actions、Cloudflare Pages 等平台负责部署。
- MiraDocs Skill 通过 GitHub 能力管理内容、分支、PR 与发布流程。

## 当前能力

当前预发布版本已经具备：

- 标准 YAML Frontmatter，并兼容旧站宽松格式。
- `doc`、`article`、`project`、`page` 等统一内容类型。
- Vite 虚拟模块 `virtual:mira-docs/content`。
- 内容过滤、URL 映射和 Markdown 热更新。
- Markdown 与 HTML 标题的统一目录提取。
- 可配置静态 HTML、canonical、Open Graph、Twitter Card 和 JSON-LD。
- `404.html`、`sitemap.xml` 与 `robots.txt`。
- GitHub Pages 项目路径和根路径部署。
- React 默认运行时，也允许消费者保留自己的 UI。

## 当前不是什么

MiraDocs 当前不是：

- HTTP API 服务。
- 强制使用某一套 React 页面或主题的站点生成器。
- GitHub API 的重新封装。
- UIChat Mira Skill 的唯一源码位置。
- 已经发布到 npm 的稳定版本。

正式 Skill 由 UIChat Mira 仓库维护；MiraDocs 仓库中的 `skill-backup` 只是只读备份。当前旧站通过固定 Git commit 使用预览包，契约稳定后再进入 npm 发布。

## 三个仓库的关系

```text
uichat-mira
└── MiraDocs Skill 的正式来源与执行入口

mira-docs
├── @mira/docs 运行时
├── Vite 与静态构建契约
├── Schema、Starter 与官方自举站
└── Skill 只读备份

uichat-mira-docs
└── 第一个生产级消费者与兼容性基准
```

下一步从[快速开始](./getting-started)了解如何在当前迁移分支中运行和验证它。