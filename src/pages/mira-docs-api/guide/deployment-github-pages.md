---
title: 部署到 GitHub Pages
description: 使用 GitHub Actions 构建 MiraDocs 项目路径站点与迁移预览。
group: 部署
order: 10
---

# 部署到 GitHub Pages

MiraDocs 把 GitHub Pages 作为一等部署目标。项目站点需要同时处理资源 base、BrowserRouter 路径和静态 SEO 地址。

## 启用 Pages

仓库第一次部署前，在 GitHub 中进入：

```text
Settings → Pages → Build and deployment
```

Source 选择 `GitHub Actions`。这一步是仓库级设置，工作流中的 `pages: write` 不能代替它。

## 官方工作流

推荐流程：

```text
checkout
→ 安装锁定依赖
→ 构建
→ configure-pages
→ upload-pages-artifact
→ deploy-pages
```

权限：

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

当前工作流使用：

```yaml
actions/configure-pages@v5
actions/upload-pages-artifact@v4
actions/deploy-pages@v4
```

## 项目路径

UIChat Mira 旧站的生产地址使用：

```text
/uichat-mira-docs/
```

构建命令：

```bash
pnpm run build:github-pages
```

MiraDocs 会从 Vite `base` 读取项目路径，并同步应用到：

- JS、CSS 与图片。
- 页面链接。
- canonical 与 Open Graph URL。
- Sitemap 与 robots。
- `404.html`。

## 迁移预览

旧站仓库的 `github-pages` 环境只允许受信任分支部署，因此迁移分支不直接覆盖旧站 Pages。预览由新的 `mira-docs` 仓库承载在独立子路径：

```text
/mira-docs/legacy-preview/
```

这样可以验证真实 GitHub Pages 项目路径，又不会修改旧站线上根目录。

## 发布前检查

```bash
pnpm install --frozen-lockfile
pnpm run build:github-pages
EXPECTED_BASE=uichat-mira-docs pnpm run verify:static-output
```

重点检查深层页面刷新、资源路径、404、canonical、Sitemap 和 PWA scope。