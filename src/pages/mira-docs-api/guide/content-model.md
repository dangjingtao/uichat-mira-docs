---
title: 内容模型
description: Mira-Docs 如何把目录、Markdown 和元数据转换成页面。
group: 核心概念
order: 5
---

# 内容模型

Mira-Docs 的内容只有一个来源：`src/pages/**/*.md`。页面导航、URL 和搜索索引都从这些文件计算，不维护第二份文章清单。

## 文件到页面

文件路径先决定文档区，再决定页面路径：

```text
src/pages/mira-docs-api/guide/content-model.md
                    └─ 顶层目录       └─ 文章路径
```

对应 URL 是：

```text
/mira-docs-api/guide/content-model
```

`src/pages/docs` 是默认文档区，它的 `docs` 路径不会出现在 URL 中。与 `docs` 同级的其他目录会成为独立文档区，并拥有自己的顶部导航和侧边导航。

## 目录到导航

独立文档区的侧边导航使用 Markdown 的物理目录分组：

```text
mira-docs-api/
├── guide/
└── reference/
```

因此 `guide` 和 `reference` 是两个导航分组。新增一个同级目录并放入 Markdown 后，它会在该文档区新增一个分组，不需要修改 React 页面。

## Markdown 到搜索

构建阶段通过 `import.meta.glob` 读取 Markdown 原文。解析后的标题、描述、分组和路径进入搜索数据；文件名为 `README.md` 的文件会被排除，不会出现在页面、导航或搜索中。

页面内的 `##` 标题会生成页内导航。当前解析器不把 `#` 一级标题加入右侧目录，因为页面标题由 frontmatter 的 `title` 负责。
