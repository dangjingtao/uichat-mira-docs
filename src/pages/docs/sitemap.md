---
title: Sitemap
description: UIChat Mira 公共产品文档的目录职责、推荐阅读顺序与状态判断方法。
group: 导航
order: 99
---

# Sitemap

## 文档用途

本页提供 UIChat Mira 公共产品文档的推荐阅读顺序。

公共文档用于解释当前产品、操作方式、稳定架构和明确计划。完整施工记录、测试证据和历史方案保存在主仓库工程文档中。

## 推荐阅读顺序

### 1. 认识 Mira

用于建立一级产品定义：

- [Mira 是什么](/docs/about/origin)
- [项目与维护者](/docs/about/author)
- [产品地图](/docs/about/product-map)
- [关于页说明](/docs/about/product-about)

这些页面回答：产品是什么、由谁维护、包含哪些产品域，以及桌面端“关于”页展示什么。

### 2. 产品哲学

用于理解稳定设计约束：

- [本地优先原则](/docs/philosophy/local-first)
- [可控自主原则](/docs/philosophy/controlled-agency)
- [证据优先原则](/docs/philosophy/evidence)

这些原则用于评审数据位置、执行权限、SubAgent 委派、Evidence 和完成声明。

### 3. 产品能力

用于了解用户可进入的主要功能：

- [对话工作区](/docs/product/workspace)
- [知识库与评测](/docs/product/knowledge)
- [角色工作台](/docs/product/roles-microapps)
- [微应用中心](/docs/product/microapps)
- [企业集成](/docs/product/enterprise-integrations)

产品能力页优先说明前置条件、对象、操作、状态、限制和验证方式。

### 4. 架构

用于理解 Runtime 和不变量：

- [桌面运行时](/docs/architecture/runtime)
- [Agent 当前运行真相](/docs/architecture/agent)
- [Harness 与工具边界](/docs/architecture/harness)
- [Agent 策略](/docs/architecture/agent-strategy)
- [MicroApps 与独立 Runtime](/docs/architecture/microapps)
- [Provider 与上下文](/docs/architecture/provider-context)

架构页回答：状态由谁持有、调用链如何流转、哪些职责不能混合，以及当前有哪些实现偏差。

### 5. 配置

用于完成具体设置：

- [应用基础信息](/docs/configuration/application-basics)
- [通用设置与个人数据](/docs/configuration/general-settings)
- [模型设置](/docs/configuration/model-settings)
- [工具工作台](/docs/configuration/tools)
- [MCP](/docs/configuration/mcp)

配置页应按前置条件、配置项、保存、验证和失败处理阅读。

### 6. 工程

用于开发和诊断：

- [开发与验证](/docs/engineering/development)
- [源码地图](/docs/engineering/repository)
- [文档系统](/docs/engineering/docs-system)
- [开发控制台](/docs/engineering/development-console)

完整源码合同和施工记录仍以主仓库 `dev` 分支为准。

### 7. 现状与方向

用于区分当前事实和计划：

- [当前实现快照](/docs/status/current)
- [下一段路](/docs/status/roadmap)

当前快照只记录可核验事实；路线图只记录计划和完成条件。

## 状态判断

阅读页面时使用以下顺序判断可信度：

```text
Current Code + Repeatable Verification
→ Current Contract / Snapshot
→ Public Product Documentation
→ Construction and Test Record
→ Plan / Proposal / POC
→ Historical Archive
```

常见状态：

| 状态 | 含义 |
| --- | --- |
| Current | 当前已验证 |
| Partial | 部分实现，需检查具体边界 |
| Experimental | 有真实实现，但合同仍可能变化 |
| Planned | 计划，不代表已经交付 |
| Historical | 历史资料，不回答当前行为 |

## 搜索

使用 `Ctrl + K` 或 `Command + K` 搜索标题、描述和 Markdown 正文。

搜索可以跨目录找到概念，但不能自动判断内容生命周期。对于能力状态、审批或运行时问题，应优先阅读 Current 页面和对应架构文档。

## 文档与博客的区别

| 文档 | 博客 |
| --- | --- |
| 定义当前对象和边界 | 记录过程、判断和经验 |
| 提供操作和验证方式 | 解释为什么这样做 |
| 区分当前、部分、实验和计划 | 可以保留时间背景和个人叙事 |
| 作为产品参考 | 不自动成为产品合同 |

文档语言规范见：[文档系统](/docs/engineering/docs-system)。
