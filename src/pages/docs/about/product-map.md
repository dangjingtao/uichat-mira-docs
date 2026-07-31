---
title: 产品地图
description: UIChat Mira 的产品域、共享基础设施、主要调用路径与当前边界。
group: 认识 Mira
order: 3
---

# 产品地图

## 文档范围

本页提供 UIChat Mira 的一级产品地图，用于判断一项能力属于哪个产品域、通过什么入口使用，以及与其他模块如何连接。

具体功能状态以[当前实现快照](/docs/status/current)和对应模块文档为准。

## 产品域

| 产品域 | 主要对象 | 核心职责 | 典型入口 |
| --- | --- | --- | --- |
| 对话工作区 | Thread、Message、Attachment、AgentRun | 承载用户目标、上下文、执行过程与最终交付 | Chat |
| Provider 与模型 | Template、Connection、Model Cache、Role Binding | 管理模型连接、远端模型目录、用途绑定与调用解析 | 模型设置 |
| 知识与评测 | Knowledge Base、Document、Chunk、Evaluation Run | 文档入库、检索、RAG 和质量验证 | 知识库、评测中心 |
| 角色 | Role、Prompt Field、Generation Parameters | 管理可复用身份、表达方式和约束 | 角色工作台 |
| Agent 与工具 | AgentRun、Planner、Harness、Tool、Evidence、Artifact | 决策下一步并执行受治理的具体动作 | Chat、工具工作台 |
| MCP | Server、Transport、Discovered Tool、Agent Access | 连接和投影外部工具 | MCP 设置 |
| MicroApps Hub | Studio、Domain Runtime、Integration、External Connection | 提供独立业务工作台和连接入口 | 微应用、企业集成 |

## 共享基础设施

多个产品域复用以下基础能力：

```text
Identity / User Context
Configuration
SQLite Persistence
Provider Resolution
Harness Governance
Approval / Checkpoint
Evidence / Artifact / Trace
Local File and Runtime Boundary
```

一项能力出现在多个页面，不表示它拥有多份运行真相。应优先确定哪个 Service、Repository 或 Runtime 持有最终状态。

## 首次可用路径

全新安装首先需要配通一个主模型：

```text
启动本地模型服务或准备云端凭据
→ 创建或选择 Provider Connection
→ 同步模型目录，或手工填写 Model ID
→ 绑定 llm role
→ 在 Chat 中收到真实回复
```

模型卡“已配置”和 Provider `connected` 都不是最终验收。详细步骤见：[模型设置](/docs/configuration/model-settings)。

## 主要调用路径

### 普通对话

```text
User Message
→ Thread Context
→ llm Role Binding
→ Provider Resolution
→ Protocol Adapter
→ Model Response
→ Message Persistence
```

### 知识问答

```text
User Question
→ Knowledge Retrieval
→ Retrieved Chunks
→ Model Generation
→ Source / Evaluation Metadata
```

### Agent 任务

```text
User Goal
→ AgentRun
→ Main Planner
→ AgentTask Model / Direct Tool / Governed Delegation
→ Evidence / Artifact
→ Finalization
```

### MicroApp Studio

```text
Product Entry
→ Domain Service / Runtime
→ Task / Job / Artifact
→ Studio Result and Diagnostics
```

### 企业集成

```text
Platform
→ Instance
→ AccessPoint
→ MicroApp Binding
→ Business Workflow
→ Platform Reply / Notification
```

## Provider 与模型关系

Provider 产品域必须区分：

```text
Provider Template
→ Provider Connection
→ Provider Model Cache
→ Model Role Binding
→ Runtime Invocation
```

- Template 定义协议族和角色资格；
- Connection 保存真实 Base URL 与凭据；
- Model Cache 来自最近一次目录同步；
- Role Binding 决定 Chat、Agent、Embedding 等用途；
- Runtime Invocation 才证明本次调用成功。

Template capability 不等于具体模型的 Vision、Tool Calling 或上下文能力验证。

Image Generation 与 TTS 当前主要由各自 Studio 管理 Provider 配置，不应从主模型状态推断它们已经 ready。

详细说明见：[Provider 与模型运行时](/docs/architecture/provider-context)。

## Agent 与工具关系

Agent 决定下一步；Harness 管理具体工具的注册、可用性、暴露、审批、执行和审计。

当前执行路径包括：

- Main Agent 直接回答、检索或调用具体工具；
- `delegate_task` 启动单层 Generic SubAgent；
- 任务型 Skill 启动 Skill-owned SubAgent 或私有 Runtime。

`delegate_task` 不是普通 Harness Tool。Skill-private Runtime 也不会自动进入 Main Planner 的公共工具面。

## MicroApps Hub 关系

MicroApps Hub 是宽产品入口，不是一套统一 Runtime：

```text
MicroApps Hub
!= Integration MicroAPP Registry
!= Studio Runtime
!= Harness Tool Registry
!= Skill Runtime
```

判断一项 MicroApp 能力时需要分别确认：

1. 产品入口；
2. 共享 Definition；
3. 领域 Runtime；
4. Integration Invoke；
5. Agent Tool / Skill Access。

详细说明见：[MicroApps 与独立 Runtime](/docs/architecture/microapps)。

## 当前边界

Mira 当前不提供：

- 保存模型名称后自动保证 Provider 可用；
- 以模型目录同步替代真实 Chat 验证；
- 所有 OpenAI-compatible Provider 的完全一致行为；
- 根据供应商或模型名称自动确认全部模型能力；
- Chat、Image 和 TTS 已经统一完成的一套 Provider 配置源；
- 开放式多 Agent 自治与递归委派；
- 所有产品域共享一种通用 Runtime；
- 所有连接自动获得 Agent Access；
- 所有 POC 和入口卡片的生产可用承诺；
- 通用 durable workflow engine。

当前优先级是稳定既有能力、修复已知合同漂移、提高 Provider、Evidence 和 Artifact 的可信度。

## 相关文档

- [Mira 是什么](/docs/about/origin)
- [模型设置](/docs/configuration/model-settings)
- [Provider 与模型运行时](/docs/architecture/provider-context)
- [当前实现快照](/docs/status/current)
- [Agent 当前运行真相](/docs/architecture/agent)
- [Harness 与工具边界](/docs/architecture/harness)
- [MicroApps 与独立 Runtime](/docs/architecture/microapps)
