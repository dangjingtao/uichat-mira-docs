---
title: 部署到 GitHub Pages
description: 使用仓库内置的 GitHub Actions 工作流将 Mira-Docs 部署到 GitHub Pages。
group: 快速开始
order: 8
---

# 部署到 GitHub Pages

仓库已经提供 [`.github/workflows/deploy-pages.yml`](/D:/workspace/uichat-mira-docs/.github/workflows/deploy-pages.yml:1)，用于把 Mira-Docs 发布到 GitHub Pages。

这份流程不是把源码直接丢给 GitHub Pages，而是先在 Actions 中构建，再把 `dist` 产物上传给 Pages。

## 这份工作流实际做了什么

当前工作流顺序如下：

1. 检出仓库代码。
2. 使用 Node.js 22 和 lockfile 安装依赖。
3. 运行 `npm run build -- --mode github-pages`。
4. 调用 `actions/configure-pages@v5` 配置 Pages 环境。
5. 调用 `actions/upload-pages-artifact@v3` 上传 `dist`。
6. 调用 `actions/deploy-pages@v4` 完成发布。

这里最关键的是第三步。当前工作流明确使用了 `--mode github-pages`，它应该和仓库里的 GitHub Pages 路径策略保持一致。

## 先打开 GitHub Pages

在 GitHub 仓库中进入：

`Settings → Pages`

然后确认：

- Source 使用 GitHub Actions
- 仓库允许 Actions 部署 Pages

如果这里仍然是旧的 branch-based Pages 发布方式，先切换成 GitHub Actions。

## 这套流程依赖什么权限

当前工作流已经声明了这些权限：

```yml
permissions:
  contents: read
  pages: write
  id-token: write
```

通常不需要额外新增 Secrets。和 Cloudflare Pages 不同，GitHub Pages 这套流程默认使用 GitHub 自己的部署能力，不要求你手动提供外部平台 Token。

## 什么时候会触发部署

默认触发条件有两个：

- push 到 `main`
- 手动执行 `workflow_dispatch`

也就是说，只要主分支更新，这份 Pages 工作流就会重新构建并发布站点。

## 为什么这里要用 `github-pages` 模式

当前仓库同时支持本地开发、Cloudflare Pages 和 GitHub Pages。

GitHub Pages 常见的问题不是构建失败，而是资源路径或路由基座不对，结果表现为：

- 静态资源 404
- 二级页面刷新后回到首页
- 文档区和博客区的导航状态错乱

因此 GitHub Pages 发布流程必须和仓库的路径基座保持一致。当前工作流已经把这个差异放进 `npm run build -- --mode github-pages`。

## 发布前检查

提交前建议先执行：

```bash
npm ci
npm run build
npm run preview
```

如果你这次改动涉及路径、导航或路由，再额外检查：

- 首页能否正常打开
- `/blogs`
- 某个博客详情页
- `/mira-docs-api`
- 某个深层文档页刷新后是否仍然正常

这样可以更早发现 GitHub Pages 路径问题，而不是等线上产物发布后再回滚。
