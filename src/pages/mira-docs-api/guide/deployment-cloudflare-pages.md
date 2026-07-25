---
title: 部署到 Cloudflare Pages
description: 使用 Cloudflare Pages 发布根站并审查迁移分支预览。
group: 部署
order: 9
---

# 部署到 Cloudflare Pages

当前 UIChat Mira 文档站通过 Cloudflare Pages 的 GitHub 集成部署。生产分支与功能分支使用不同地址，因此适合迁移阶段的人工对比。

## 生产部署

生产配置保持：

```text
Production branch: main
Build command: pnpm run build
Build output: dist
Node.js: 22
```

`main` 更新时，Cloudflare 独立完成检出、锁定依赖安装、Vite 构建和发布。

## 分支预览

Draft PR 或功能分支更新后，Cloudflare 会生成：

- 每个提交的临时预览地址。
- 稳定的分支预览地址。

迁移分支预览不会覆盖生产域名，适合检查页面视觉、导航、搜索、主题与移动端。

## 构建差异

Cloudflare Pages 设置 `CF_PAGES=1`。当前 Vite 配置把它视为根路径部署，即使外部设置误用了 `github-pages` mode，也不会追加仓库 base。

MiraDocs 静态构建仍会生成：

- 路由目录下的 `index.html`
- `404.html`
- `sitemap.xml`
- `robots.txt`
- canonical、社交元数据与 JSON-LD

因此当前产物不是“只有一个 index.html 的纯 SPA”；React 会在静态 HTML 之后继续接管交互。

## 手动补发

仓库保留手动 Wrangler 工作流，仅在 Cloudflare Git 集成异常时使用。不要同时让两条流程响应 `main`，否则一次提交会产生重复部署。

## 发布前验证

```bash
pnpm install --frozen-lockfile
pnpm run build
pnpm run verify:static-output
```

随后检查首页、深层文档、博客详情、搜索、主题切换、PWA 和分享元数据。