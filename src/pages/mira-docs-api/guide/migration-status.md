---
title: 生产迁移状态
description: UIChat Mira 文档站接入 MiraDocs 的当前进度和验证边界。
group: 核心概念
order: 8
---

# 生产迁移状态

当前迁移在独立分支 `codex/mira-docs-migration-20260725` 和 Draft PR 中进行，`main` 与线上根站未被直接修改。

## 已完成

### 内容模型

- `App.tsx` 不再维护 Frontmatter 解析器。
- 文档模型、排序和标题提取由 `@uichat-mira/docs` 提供。
- 标准 YAML 失败时兼容旧站宽松 Frontmatter。
- 站点适配层保留作者、博客日期、合并页和目录约定。

### 内容发现

- `miraDocs()` Vite 插件接管 `src/pages`。
- 删除旧的 `virtual:page-directories`。
- React 端消费 `virtual:mira-docs/content`。
- `exclude` 排除 README。
- `route` 保持历史 URL。

### 静态发布

- 删除旧站内置 SEO 写盘插件。
- MiraDocs 统一写出静态路由、404、Sitemap 和 robots。
- 站点适配器只提供品牌 HTML、作者映射、分享图和 JSON-LD 内容。

## 永久验证

迁移 CI 当前检查：

```text
pnpm install --frozen-lockfile
→ 真实 Markdown 兼容检查
→ TypeScript
→ Vite
→ GitHub Pages 构建
→ 静态产物检查
```

静态产物检查覆盖：

- 所有可见内容路由。
- GitHub Pages base。
- canonical 与 JSON-LD。
- Open Graph 与 Twitter Card。
- 404 的 `noindex,nofollow`。
- Sitemap 覆盖。
- robots 的 Sitemap 地址。

## 在线预览

Cloudflare Pages 会为迁移分支生成独立预览。新的 `mira-docs` 仓库计划在 `/legacy-preview/` 挂载同一分支的 GitHub Pages 构建，用于真实项目路径环境对比。

## 合入原则

在进入 `main` 前还需要：

1. 人工对比首页、文档区、博客与深层路由。
2. 验证主题、搜索、PWA 和移动端。
3. 确认生成 HTML 与分享预览没有回退。
4. 先合入 MiraDocs 运行时，再更新旧站依赖来源。
5. 保留可回滚的旧站部署路径。