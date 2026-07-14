---
title: Mira-Docs 是什么
nav: Mira-Docs
group: 快速开始
order: 1
---

# Mira-Docs 是什么

Mira-Docs 是一个由 Markdown 驱动的文档站。思路借鉴于[vitepress](https://github.com/vuejs/vitepress)，采用vite + react构建。文章是源码，页面、路由、顶部导航和侧边导航由构建阶段读取目录后生成。

它解决的是文档站本身的问题：让文件结构成为信息架构，让新增目录可以进入站点，而不是再维护一份导航清单。

## 内容边界

Mira-Docs 当前包含：

- Markdown 文件的编译期索引
- 基于文件目录的顶部导航
- 基于 Markdown 所在子目录的侧边导航
- frontmatter 元数据解析
- React Router 页面切换
- 深色主题、站内搜索和 PWA 构建
- Claude、Apple、Supabase 主题在线切换
- 顶部导航顺序配置
- 多 Markdown 合并为单页面
- Markdown 中的自定义 HTML 块

在 Markdown 中使用 `::: html` 块，可以直接嵌入自定义 HTML 结构，用于组件示例、视觉参考和静态 HTML 预览。完整用法见[编写文档](./authoring)。

Mira-Docs 当前不提供 HTTP API。仓库里没有可供外部调用的 API 服务，因此这里不编写接口、认证或请求示例。

## 源码位置

文档内容位于 `src/pages`。其中 `src/pages/docs` 是默认文档区，其他同级目录会成为独立的顶部导航区域。

```text
src/pages/
├── docs/                 # 默认文档区
└── mira-docs-api/        # 独立文档区
    ├── guide/            # 一个侧边导航分组
    └── reference/        # 另一个侧边导航分组
```

空目录也会生成顶部导航和路由，但页面显示 404 状态；它不会借用 `docs` 的文章或侧边导航。
