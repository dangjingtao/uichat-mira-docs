---
title: 快速开始
description: 在当前迁移分支中安装、开发、构建和验证 MiraDocs。
group: 快速开始
order: 2
---

# 快速开始

当前站点已经接入 MiraDocs，但仍处于 Draft PR 的迁移阶段。它通过固定 Git commit 安装 `@uichat-mira/docs`，不依赖尚未发布的 npm 版本。

## 环境

需要：

- Node.js 22
- pnpm 11.5.2
- Git

在仓库根目录安装锁定依赖：

```bash
pnpm install --frozen-lockfile
```

`pnpm-lock.yaml` 已锁定 MiraDocs 预览 commit。除非明确升级运行时，否则不要手动改写这个依赖。

## 开发

```bash
pnpm run dev
```

MiraDocs Vite 插件会监听 `src/pages`。新增、删除或修改 Markdown 时，虚拟内容模块失效并触发页面刷新。

## 构建

根路径部署：

```bash
pnpm run build
```

GitHub Pages 项目路径部署：

```bash
pnpm run build:github-pages
```

构建链路包括：

```text
真实 Markdown 兼容检查
→ TypeScript
→ Vite
→ MiraDocs 静态路由
→ SEO 与发布文件
```

输出目录为 `dist`。

## 验证

迁移分支提供两项永久检查：

```bash
pnpm run verify:mira-docs
pnpm run verify:static-output
```

第一项验证所有真实 Markdown、Frontmatter、正文和 URL 唯一性；第二项验证静态 HTML、canonical、JSON-LD、404、Sitemap 和 robots。

完整验证直接运行：

```bash
pnpm run build:github-pages
pnpm run verify:static-output
```

## 当前依赖方式

`package.json` 使用固定 Git commit：

```json
{
  "dependencies": {
    "@uichat-mira/docs": "github:dangjingtao/mira-docs#<commit-sha>"
  }
}
```

这是预发布阶段的临时分发方式。稳定顺序是：

```text
MiraDocs 内核 CI
→ 生成可安装预览 commit
→ 旧站锁定 commit
→ 真实内容与构建验证
→ npm 正式发布
```

## 预览

本分支会生成 Cloudflare Pages 分支预览。GitHub Pages 预览由新的 `mira-docs` 仓库承载，避免覆盖旧站线上根路径。