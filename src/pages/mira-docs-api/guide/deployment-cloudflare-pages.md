---
title: 部署到 Cloudflare Pages
description: 使用 Cloudflare Pages 的 GitHub 集成自动构建和发布 Mira-Docs。
group: 快速开始
order: 7
---

# 部署到 Cloudflare Pages

Mira-Docs 是 Vite 单页应用，构建产物位于 `dist`。当前 Cloudflare Pages 项目已经连接 GitHub 仓库，并启用了 `main` 分支自动部署。每次推送到 `main` 时，Cloudflare 会自动执行：

```text
npm ci
npm run build
```

## Cloudflare 的自动构建

Cloudflare Pages 项目配置如下：

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js version: `22`

推送到 `main` 后，Cloudflare 会独立完成检出、依赖安装、构建和发布。

如果你调整了构建命令、Node 版本或输出目录，部署文档和工作流需要一起更新。

## 手动补发部署

仓库仍保留 [`.github/workflows/deploy-cloudflare-pages.yml`](/D:/workspace/uichat-mira-docs/.github/workflows/deploy-cloudflare-pages.yml:1)，但它只响应 `workflow_dispatch`，用于 Cloudflare Git 集成异常时手动补发。需要配置：

| 类型 | 名称 | 值 |
| --- | --- | --- |
| Secret | `CLOUDFLARE_API_TOKEN` | Cloudflare API Token |
| Secret | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID |
| Variable | `CLOUDFLARE_PAGES_PROJECT_NAME` | `uichat-mira-docs` |

不要同时让 Cloudflare Git 集成和 GitHub Actions 都响应 `main` 推送，否则一次提交会触发两次 Cloudflare 构建。

## 部署触发方式

自动部署触发条件：

- push 到 `main`，由 Cloudflare Pages GitHub 集成触发
- 手动执行仓库内的 Wrangler 工作流，仅用于补发

这意味着你可以把 Cloudflare Pages 部署当成主分支发布流程，也可以在 Actions 页面手动补发一次。

## 路由与刷新行为

项目使用 `BrowserRouter`。Cloudflare Pages 在没有 `404.html` 时会将未知路径回退到 `index.html`，因此 `/docs/...`、`/mira-docs-api/...` 和其他动态文档路由可以直接刷新访问。

## 发布前检查

部署前运行：

```bash
npm ci
npm run build
npm run preview
```

然后检查首页、文档深层路由、暗色模式、主题切换和 PWA 资源是否正常加载。
