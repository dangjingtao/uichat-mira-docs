---
title: 编写文档
description: 在 Mira-Docs 中新增文章、目录和导航分组。
group: 快速开始
order: 4
---

# 编写文档

新增文档只需要在 `src/pages` 下创建 Markdown 文件。文件所在的顶层目录决定顶部导航，文件所在的下一级目录决定独立文档区的侧边分组。

## 新增文章

```text
src/pages/mira-docs-api/guide/authoring.md
```

这个文件会出现在 `Mira-Docs` 顶部导航下的 `Guide` 分组中，页面地址为：

```text
/mira-docs-api/guide/authoring
```

路径和导航都由索引生成，不需要在 React Router 中手写一条路由。

## frontmatter

当前解析器支持以下字段：

| 字段 | 作用 |
| --- | --- |
| `title` | 页面标题、侧边导航标题 |
| `description` | 页面摘要、文档区描述 |
| `nav` | 顶部导航名称。文档区通常只需要在第一篇文章中声明 |
| `group` | 默认文档区的分组名称 |
| `order` | 同一文档区中的排序值 |

```yaml
---
title: 编写文档
description: 在 Mira-Docs 中新增文章、目录和导航分组。
group: 快速开始
order: 2
---
```

## README 不属于文章

索引明确排除 `README.md`，包括大小写变体。项目说明文件不会出现在顶部导航、侧边导航、搜索或上一篇/下一篇中。

## 自定义 HTML 块

需要展示交互组件、视觉参考或独立 HTML 预览时，可以在 Markdown 中使用 `html` 块：

```md
::: html
<div class="example-block">自定义 HTML 内容</div>
:::
```

构建时会把块内容作为原始 HTML 交给 Markdown 页面渲染。复杂页面可以拆成多个 Markdown 文件，用 `merge` 合并为一个页面；Markdown 负责标题、说明和索引，HTML 块负责 Markdown 不适合表达的视觉组件。
