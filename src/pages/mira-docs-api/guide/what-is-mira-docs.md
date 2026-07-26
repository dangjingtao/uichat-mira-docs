---
title: MiraDocs 是什么
nav: MiraDocs
group: 快速开始
order: 1
description: MiraDocs 的产品定位、运行边界、公开版本与生产验证状态。
---

# MiraDocs 是什么

MiraDocs 是一个面向 Vite 与 React 的 **Git-native 文档、发布与项目门户运行时**。

它把仓库中的结构化 Markdown 转换成统一内容模型、导航与路由数据，以及可部署的静态页面产物。内容继续由 Git 管理与审阅，站点继续保留自己的视觉和交互，自动化则通过稳定协议工作，而不是直接修改页面实现。

它不是某一个站点皮肤，也不是只服务 UIChat Mira 的一次性脚本。当前这个文档站是 MiraDocs 的第一个生产级消费者，用真实内容持续验证运行时契约。

## 当前生产状态

MiraDocs 已经完成第一阶段发布闭环：

- `@uichat-mira/docs@0.1.0` 已公开发布到 npm；
- `v0.1.0` 已作为 GitHub Release 发布；
- 后续版本通过 npm Trusted Publishing 与 GitHub OIDC 发布；
- 本站已经从固定 Git commit 预览依赖切换到 npm 正式包；
- npm registry 安装、真实内容解析、TypeScript、Vite、GitHub Pages 与静态 SEO 产物均通过生产级验证。

```bash
npm install @uichat-mira/docs
```

## 它解决什么问题

传统文档站常把内容、导航、路由、SEO 和部署逻辑散落在页面组件与构建脚本里。MiraDocs 把这些职责拆成稳定层次：

- Markdown 与 YAML Frontmatter 是内容源；
- `@uichat-mira/docs` 提供统一内容模型、解析能力和轻量 React 运行时；
- `@uichat-mira/docs/vite` 负责内容发现、热更新、虚拟清单和静态构建；
- React 站点决定视觉、交互与品牌表达；
- GitHub Actions、Cloudflare Pages 等平台负责部署；
- MiraDocs Skill 通过 GitHub 能力管理内容、分支、PR 与发布流程。

## 当前能力

`0.1.0` 已具备：

- 标准 YAML Frontmatter，并兼容旧站宽松格式；
- `doc`、`article`、`project`、`page` 等统一内容类型；
- Vite 虚拟模块 `virtual:mira-docs/content`；
- 内容过滤、URL 映射和 Markdown 热更新；
- Markdown 与 HTML 标题的统一目录提取；
- 可配置静态 HTML、canonical、Open Graph、Twitter Card 和 JSON-LD；
- `404.html`、`sitemap.xml` 与 `robots.txt`；
- GitHub Pages 项目路径和根路径部署；
- 可直接使用、也可由消费者替换的轻量 React 运行时。

## 当前不是什么

MiraDocs 当前不是：

- HTTP API 服务；
- 托管式 CMS；
- 强制使用某一套 React 页面或主题的站点生成器；
- GitHub API 的重新封装；
- UIChat Mira Skill 的唯一源码位置。

MiraDocs 负责内容协议和静态构建契约；消费者负责品牌、页面组合、作者模型和产品交互。正式 Skill 由 UIChat Mira 仓库维护，MiraDocs 仓库中的 `skill-backup` 只是只读参考副本。

## 三个仓库的关系

```text
uichat-mira
└── MiraDocs Skill 的正式来源与执行入口

mira-docs
├── @uichat-mira/docs 公共运行时
├── Vite 与静态构建契约
├── Schema、官方自举站与发布流水线
└── Skill 只读参考副本

uichat-mira-docs
└── 第一个生产级消费者与兼容性基准
```

下一步从[快速开始](./getting-started)了解如何安装并接入 `@uichat-mira/docs`。
