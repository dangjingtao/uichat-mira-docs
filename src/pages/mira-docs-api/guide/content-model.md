---
title: 内容模型
description: MiraDocs 如何把 Markdown、Frontmatter 和路径转换成统一的 MiraDoc。
group: 核心概念
order: 3
---

# 内容模型

MiraDocs 把每个 Markdown 文件解析为 `MiraDoc`。站点、搜索、导航、静态构建和 Skill 都围绕这一个模型工作，不再分别维护文章清单。

## MiraDoc

核心字段如下：

```ts
type MiraDoc = {
  id: string
  path: string
  sourcePath: string
  type: "doc" | "article" | "project" | "page" | string
  title: string
  description: string
  group: string
  order: number
  date?: string
  tags: string[]
  status?: string
  cover?: string
  body: string
  headings: MiraHeading[]
  data: Record<string, unknown>
}
```

`data` 保留完整 Frontmatter，因此消费者可以增加作者、合并规则或业务字段，而不用修改核心模型。

## 文件到路由

默认情况下，源文件路径转换为页面路径：

```text
guide/content-model.md
→ /guide/content-model

guide/index.md
→ /guide
```

Frontmatter 的 `path` 可以显式覆盖 URL。Vite 插件还提供 `route(sourcePath, doc)`，用于站点级兼容映射。

当前旧站使用这个回调移除默认文档区的 `/docs` 前缀，因此历史 URL 不变。

## 类型推断

没有声明 `type` 时，MiraDocs 根据顶层目录推断：

```text
blogs/*    → article
projects/* → project
其他        → doc
```

类型可以在 Frontmatter 中覆盖。它会影响默认分组、排序和静态结构化数据，但不会强制某一种页面组件。

## 排序

普通内容按 `order` 排序，再按路径排序。文章类型优先按 `date` 倒序，再使用 `order`。

## 标题目录

MiraDocs 同时提取：

- Markdown 的 `##`、`###`、`####`
- HTML 的 `<h2>`、`<h3>`、`<h4>`

标题按原文顺序合并，并生成稳定且去重的锚点。这个规则让历史 HTML 块和新 Markdown 内容可以共用一套页内目录。

## 旧站扩展

当前 UIChat Mira 文档站在适配层增加：

- `author`
- `image`
- `merge`
- `mergeIndex`
- 博客日期与作者关系
- 站点目录显示规则

这些是消费者扩展，不属于 MiraDocs 强制核心字段。