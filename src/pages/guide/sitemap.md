---
title: Sitemap
description: UIChat Mira 公共产品文档的目录职责、首次使用路径、推荐阅读顺序与状态判断方法。
group: 导航
order: 99
---

# Sitemap

## 文档用途

本页提供 UIChat Mira 公共产品文档的推荐阅读顺序。

公共文档用于解释当前产品、操作方式、稳定架构和明确计划。完整施工记录、测试证据和历史方案保存在主仓库工程文档中。

## 首次使用路径

全新安装先完成：

1. [应用基础信息](/docs/configuration/application-basics)：确认运行形态和首次可用条件；
2. [模型设置](/docs/configuration/model-settings)：配置 Provider Connection、绑定主模型并得到真实 Chat 回复；
3. [对话工作区](/docs/product/workspace)：开始普通对话或创建工作线程。

需要使用自己的资料时，再继续：

4. [知识库与 RAG](/docs/product/knowledge)：配置 Embedding，上传文本，等待索引 ready，并验证真实 Sources。

需要保护 RAG 回归时，再继续：

5. [评测工作台](/docs/product/evaluation)：准备 Evaluation ZIP、校验 Dataset、运行 Sample，并按当前算法解释指标。

不要在主模型尚未验证时，同时配置所有高级角色、工具和微应用。

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

- [应用基础信息](/docs/configuration/application-basics)
- [模型设置](/docs/configuration/model-settings)
- [对话工作区](/docs/product/workspace)
- [知识库与 RAG](/docs/product/knowledge)
- [评测工作台](/docs/product/evaluation)
- [角色工作台](/docs/product/roles-microapps)
- [微应用中心](/docs/product/microapps)
- [企业集成](/docs/product/enterprise-integrations)

产品能力页优先说明前置条件、对象、操作、状态、限制和验证方式。

Knowledge Base 和 Evaluation 是相邻但独立的产品域。前者持有文档、Chunk 和索引；后者持有 Dataset、Run 和诊断结果。

### 4. 架构

用于理解 Runtime 和不变量：

- [桌面运行时](/docs/architecture/runtime)
- [Provider 与模型运行时](/docs/architecture/provider-context)
- [Knowledge Base 与 RAG Runtime](/docs/architecture/knowledge-rag)
- [Evaluation Runtime 与指标语义](/docs/architecture/evaluation-runtime)
- [Agent 当前运行真相](/docs/architecture/agent)
- [Harness 与工具边界](/docs/architecture/harness)
- [Agent 策略](/docs/architecture/agent-strategy)
- [MicroApps 与独立 Runtime](/docs/architecture/microapps)

架构页回答：状态由谁持有、调用链如何流转、哪些职责不能混合，以及当前有哪些实现偏差。

### 5. 配置

用于完成具体设置：

- [应用基础信息](/docs/configuration/application-basics)
- [模型设置](/docs/configuration/model-settings)
- [通用设置与个人数据](/docs/configuration/general-settings)
- [工具工作台](/docs/configuration/tools)
- [MCP](/docs/configuration/mcp)

配置页应按前置条件、配置项、保存、验证和失败处理阅读。

模型设置必须区分：

```text
模型绑定已保存
!= 模型目录同步成功
!= 真实模型请求成功
```

Evaluation 还必须区分：

```text
evaluation role 已绑定
!= 已配置 Judge Model
```

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

对于 Provider 还要分别判断：

| 状态 | 需要的证据 |
| --- | --- |
| Connection 已配置 | Base URL、凭据和实例已保存 |
| 模型目录已同步 | 最近一次列表接口成功 |
| 模型角色已绑定 | model id 已分配给具体 role |
| Runtime 已验证 | 真实 Chat、Embedding 或 Rerank 请求成功 |

对于 Knowledge Base 还要分别判断：

| 状态 | 需要的证据 |
| --- | --- |
| Document 已创建 | 上传请求已接受并写入记录 |
| Index processing | 正在等待或执行切分与 Embedding |
| Index ready | Chunk 和向量已写入 |
| Document enabled | 允许进入检索 |
| Retrieval verified | 真实问题命中正确 Chunk |
| RAG verified | 回答展示真实 Sources，且没有超出来源 |

```text
上传成功
!= 索引 ready
!= 检索命中
!= 回答正确
```

对于 Evaluation 还要分别判断：

| 状态 | 需要的证据 |
| --- | --- |
| Package generated | ZIP 已写出；不证明 Dataset 或 Gold 正确 |
| Dataset valid | 没有 validation error，Knowledge Base 当前存在 |
| Run persisted | Run JSON 已写入 SQLite；不证明可重启恢复 |
| Sample complete | 当前问题有 Attempt 结果 |
| Metric available | 当前启发式公式已产出数值 |
| Result reviewed | 人工检查 Sources、Answer 和失败样本 |

```text
Metric Label
!= Standard Algorithm
!= Release Gate
```

## 搜索

使用 `Ctrl + K` 或 `Command + K` 搜索标题、描述和 Markdown 正文。

搜索可以跨目录找到概念，但不能自动判断内容生命周期。对于能力状态、Provider、Knowledge Base、Evaluation、审批或运行时问题，应优先阅读 Current 页面和对应架构文档。

## 文档与博客的区别

| 文档 | 博客 |
| --- | --- |
| 定义当前对象和边界 | 记录过程、判断和经验 |
| 提供操作和验证方式 | 解释为什么这样做 |
| 区分当前、部分、实验和计划 | 可以保留时间背景和个人叙事 |
| 作为产品参考 | 不自动成为产品合同 |

文档语言规范见：[文档系统](/docs/engineering/docs-system)。
