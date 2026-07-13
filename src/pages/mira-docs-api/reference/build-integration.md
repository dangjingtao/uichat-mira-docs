---
title: 构建集成
description: Mira-Docs 在 Vite 构建中的实际接入点。
group: 参考
order: 21
---

# 构建集成

Mira-Docs 的目录感知能力由 Vite 配置和 React 页面共同完成。两边职责不同。

## Markdown 模块

`src/App.tsx` 使用以下 glob 读取文章原文：

```ts
import.meta.glob("./pages/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
})
```

读取结果经过 frontmatter 解析，得到标题、描述、路径、分组、排序值和 `##` 标题列表。

## 顶层目录模块

`vite.config.ts` 注册 `page-directories` 插件。插件负责两件事：

- 生成 `virtual:page-directories`，内容是 `src/pages` 的一级目录名
- 监听目录变化，失效虚拟模块并触发完整刷新

React 端据此生成独立文档区的顶部导航和目录路由。页面组件不写死 `mira-docs-api`，也不会把其他目录的文章放进默认文档区。

## 路由

路由由 `allDocs` 和 `siteAreas` 映射生成：

- 文档文件生成文章路由
- 顶层目录生成文档区入口路由
- 空目录仍生成入口路由，但入口页面显示 404 状态

因此新增文章或新增文档区时，通常只需要改 `src/pages`。只有改变元数据格式、路由规则或目录边界时，才需要修改解析器和布局代码。

## 检查构建

提交前执行：

```bash
npm run build
```

这个命令会先运行 `tsc -b`，再生成 Vite 静态产物。Markdown 内容错误、类型错误或构建配置错误都会在这里暴露。
