---
title: 对话工作区
description: Thread、Message、Attachment、Role 与 AgentRun 在聊天主界面中的职责和边界。
group: 产品能力
order: 7
---

# 对话工作区

## 文档范围

本页说明 Mira 对话工作区的主要对象、上下文组成、Agent 状态呈现和当前边界。

## 核心对象

| 对象 | 职责 |
| --- | --- |
| Workspace | 提供文件和任务的默认工作环境 |
| Thread | 保存一次持续对话或任务上下文 |
| Message | 记录用户、模型和系统产生的可见消息 |
| Attachment | 保存与消息关联的文件或媒体引用 |
| Role | 提供可复用的角色指令和生成参数 |
| Knowledge Context | 为本轮请求提供检索到的资料 |
| AgentRun | 保存任务状态、Evidence、审批、Trace 和最终交付 |

这些对象不能被压缩为一段不可追踪的 Prompt 文本。每一层应保留独立来源和生命周期。

## 工作区结构

```text
Conversation Workspace
├─ Thread Header / Model Selection
├─ Message Timeline
├─ Composer / Attachments
├─ Role and Knowledge Context
├─ Agent Status / Approval / Requirement
├─ Evidence and Tool Result Presentation
└─ Artifact Delivery
```

## 普通对话路径

```text
User Message
→ Thread Context Assembly
→ Role / Model / Optional Knowledge
→ Provider Request
→ Assistant Message
→ Persistence
```

普通对话不自动启用 Agent Tool Runtime。是否使用知识、工具或 Agent 由当前模式和请求路径决定。

## Agent 任务路径

```text
User Goal
→ AgentRun
→ Planner / Tool / SubAgent
→ Evidence / Artifact
→ Final Answer
→ Thread Delivery
```

UI 中应区分：

- 正在规划；
- 正在执行具体工具；
- 等待用户输入；
- 等待审批；
- 已完成；
- 失败；
- 已产生 Artifact。

界面状态必须来自 AgentRun 或 Runtime 真实状态，不能仅根据模型文本推断。

## 请求上下文

一次请求可能包含：

```text
System Rules
Role Context
Skill Context
Knowledge Retrieval
Thread History / Summary
Current User Input
Tool Exposure or Execution Profile
```

各层职责：

| 上下文层 | 作用 |
| --- | --- |
| System | 固定运行规则与安全边界 |
| Role | 身份、表达方式和约束 |
| Skill | 领域知识、执行说明和可选 Runtime Profile |
| Knowledge | 本轮检索到的资料 |
| History | 当前线程的真实消息或摘要 |
| User Input | 本轮目标和约束 |
| Tool Exposure | Planner 本轮可见的 concrete tools |

Role、Knowledge、Memory、Skill 和 Tool 不能互相替代。

## 附件与 Artifact

附件是用户输入材料；Artifact 是系统执行产生的交付结果。

```text
Attachment
→ 进入请求、检索或领域 Runtime

Artifact
→ 来自 Tool / Skill / MicroApp 执行
→ 经过验证
→ 返回线程或专用预览区
```

只有文件引用、媒体记录和真实存储都成立时，才能声明 Artifact 已生成。

## 审批与用户输入

当任务缺少信息或涉及高风险动作时，工作区需要显示明确的暂停状态：

- `waiting_user`：缺少必要输入；
- `waiting_approval`：具体 Invocation 已冻结，等待批准或拒绝。

用户回复“同意”不应触发重新猜测参数。系统应从原 checkpoint 恢复同一调用。

## 当前边界

对话工作区当前不等于：

- 所有微应用的管理后台；
- 完整文件管理器；
- 允许 Agent 绕过审批的万能入口；
- 跨设备实时同步服务；
- 已完成的长期记忆系统；
- 所有外部平台消息的无差别镜像。

MicroApp Studio、企业集成和设置页面可以产生或消费线程结果，但仍保留自己的领域状态。

## 验证要点

- 线程切换后消息和 Agent 状态是否一致；
- 模型、角色和知识配置是否来自当前线程；
- waiting 状态是否可恢复；
- Tool Result 是否先进入 Evidence；
- Artifact 是否可访问；
- 失败是否保留原因和下一步；
- UI 是否错误地提前显示“完成”。

## 相关文档

- [角色工作台](/docs/product/roles-microapps)
- [知识库与评测](/docs/product/knowledge)
- [Agent 当前运行真相](/docs/architecture/agent)
- [Harness 与工具边界](/docs/architecture/harness)
