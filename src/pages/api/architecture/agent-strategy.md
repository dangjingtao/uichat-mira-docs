---
title: Agent 策略
description: Mira 如何在全局治理、局部执行、工具边界与证据之间保持可控。
group: 架构
order: 13
---

# Agent 策略

Mira 的目标不是“给模型更多工具，让它自己发挥”，而是建立一条能够规划、执行、观察、恢复，并允许用户介入的任务闭环。

当前策略可以概括成一句话：

> Main Agent 管全局目标与治理，具体动作受 Harness 约束，复杂局部施工可以委派，但所有结果必须回到 Evidence 和最终交付合同。

## 先建立运行真相，再谈智能

一次任务首先是 `AgentRun`，而不是一段临时 prompt。

AgentRun 持有目标、状态、Evidence、审批、checkpoint、SubAgent 结果和 finalization packet。这样系统才能回答：

- 当前在做什么；
- 为什么暂停；
- 哪次调用被批准；
- 已经获得哪些证据；
- 哪些目标仍未完成；
- 最终交付来自哪些真实结果。

## Main Planner 只做全局语义决策

Main Planner 负责理解用户的完整目标，并在每次观察后决定下一步。

它可以选择：

- 直接回答；
- 向用户补充提问；
- 检索；
- 调用一个 concrete tool；
- 委派一个局部工作包；
- 在 terminal failure 时结束。

Normalize、Policy、ToolNode、Retrieve、Evidence 和 SubAgent 都不能成为 shadow Planner。它们报告事实、执行动作或完成局部任务，但不替 Main Planner宣布全局完成。

## 直接执行与委派必须分开

简单任务不需要为了“像 Agent”而额外启动 Child。

```text
简单回答 / 检索 / 单个具体工具
→ Main Agent 直接推进
```

当一个工作包具备清晰目标、验收条件和局部恢复空间时，才适合交给 Generic SubAgent：

```text
Main Planner
→ delegate_task
→ Generic SubAgent
→ structured Evidence
→ Main Planner acceptance
```

当任务属于一个已经定义 execution profile 的专业 Skill 时，可以交给 Skill-owned SubAgent：

```text
Skill match
→ Skill-owned SubAgent
→ Skill-scoped tools / private Runtime
→ Evidence / Artifact / Requirement
→ Parent delivery
```

委派的价值不是“多一个 Agent”，而是把局部执行所有权交给更合适的执行单元，同时保持全局治理不变。

## Parent 与 Child 的责任边界

Parent 始终保留：

- 用户对话；
- 全局目标；
- Policy 与审批；
- waiting_user / waiting_approval / completed / failed 状态；
- 恢复和终止策略；
- Evidence 接收；
- 最终 Generate 与交付。

Child 只负责：

- 当前局部工作包；
- 局部计划与顺序工具调用；
- 观察结果和局部修复；
- 结构化提交 Evidence、Artifact 或 Requirement。

Generic SubAgent 完成后回 Main Planner 验收；Skill-owned SubAgent 完成后可以冻结 finalization packet，直接进入 Generate，避免 Parent 把已经完成的领域施工重新做一遍。

## Harness 只治理 concrete action

Harness 解决的是“系统这次实际执行什么”，不是“用户最终想完成什么”。

```text
CapabilityMatch
→ ToolExposure
→ Planner decision
→ Normalize
→ Policy / Approval
→ Invocation
→ ToolResult
→ Evidence
```

`delegate_task` 不属于普通 Harness Invocation，但 Child 内的真实工具调用仍然受 Harness、Policy、审批和 workspace 约束。

Skill-private Runtime 也不会自动变成全局工具。它只能在 Skill execution profile 的边界内使用，并把结果交回 Parent 治理。

## Evidence 不能替任务宣布完成

工具返回成功，只能证明一次调用执行完了。

必须继续区分：

- **Evidence answerable**：现有事实支持哪些回答；
- **Task completable**：用户要求的全部目标是否已经完成。

例如：

```text
定位到文件
≠ 已经阅读文件

生成一个文件
≠ 文件已经验证可用

Child completed
≠ 用户全局目标 completed
```

Main Planner 只能在目标覆盖成立、必要动作完成、Evidence 可引用时进入最终回答。

## Approval 是精确授权，不是泛化许可

高风险动作进入 Approval 时，系统冻结具体 invocation。

批准绑定：

- `toolId`；
- `toolCallId`；
- `inputHash`；
- 当前 checkpoint。

恢复后只能继续同一次调用。参数、工作目录、目标资源或环境变化后，必须重新判断。

## Recoverable 与 Terminal 必须分开

Recoverable failure 是一次动作失败，但任务仍可能换路径、补信息或重试。

Terminal failure 表示系统已经无法安全继续，Graph 进入 `failed`，Generate 不运行。

Settled contract 要求 recoverable failure 恢复耗尽后生成 guarded answer 并以 `completed` 收口。当前 `dev` 仍存在直接升级为 terminal error 的实现漂移，修复应在独立运行时任务中完成，而不是通过改文档重新定义合同。

## 当前不是开放式多 Agent

当前明确不做：

- SubAgent 递归委派；
- Agent 间自由通信；
- 多 Agent 投票；
- 无限制并发工具调用；
- 通用 DAG scheduler；
- 让 Child 获得 Main Agent 的全部工具和上下文。

Mira 当前采用的是受控、单层、任务局部的执行委派。

## 当前阶段：稳定而不是扩张

2026 年 8 月起，Agent 侧优先处理：

- recoverable contract 漂移；
- Planner 提前收尾；
- 工具选择与 schema 稳定性；
- approval checkpoint resume；
- Evidence、Artifact 和 trace 可信度；
- 黑盒回归与真实任务验收。

新增节点、更多 Agent 层级或更大的自动化平台，都不应绕过这些基础问题。