---
title: 仓库与 Skill 边界
description: MiraDocs 运行时、UIChat Mira Skill 和生产站点如何协作。
group: 核心概念
order: 7
---

# 仓库与 Skill 边界

MiraDocs 的目标不是再造一个封闭 CMS，而是把 Git 仓库变成可由人和 Agent 共同维护的内容系统。

## UIChat Mira

UIChat Mira 是 Skill Host。正式的 MiraDocs Skill 放在 UIChat Mira 仓库中，负责理解用户意图并编排已有 GitHub 能力：

```text
读取仓库
→ 修改 Markdown
→ 建立分支
→ 提交与 PR
→ 查看 Actions
→ 发布或回滚
```

Skill 不重新实现 GitHub API，也不绕过权限与审批。

## mira-docs

`mira-docs` 仓库维护产品与协议：

```text
packages/mira-docs   @uichat-mira/docs 运行时
apps/site            官方自举站
schemas              内容与配置 Schema
starter              可部署起点
skill-backup         正式 Skill 的只读备份
```

正式 Skill 的单一真相源仍是 UIChat Mira。

## uichat-mira-docs

当前仓库是第一个生产级消费者。它承担两个角色：

1. 保留 UIChat Mira 已有的视觉、URL、博客、搜索和 PWA。
2. 用 86 个真实 Markdown 与现有部署链路验证 MiraDocs 契约。

因此迁移遵循“先抽能力，后换依赖，最后人工对比”，而不是重写整个站点。

## 内容协议

Skill 与运行时共同依赖稳定字段，例如：

```text
id / path / type / title / description
group / order / date / tags / status / cover
```

消费者专属字段保留在 `data` 中。只要内容协议稳定，Mira 可以维护文档、博客、项目、里程碑和决策记录，而不需要编辑页面组件。