---
title: Agent 当前运行真相
description: AgentRun、稳定门面、Pi Loop、受控委派与当前边界。
group: 架构
order: 11
---

# Agent 当前运行真相

> 本页核对 UIChat Mira `dev` 分支截至 2026 年 7 月 30 日的真实运行方式。它不是 Agent V2 设计稿，也不把历史 LangGraph 方案当作当前默认实现。

## 一句话结论

Mira 当前的 Agent 是一个由 Main Agent 负责全局治理、允许受控局部委派的任务运行时。

它不是一张固定 LangGraph 流程图，也不是 Agent 可以自由复制、互相讨论和无限扩张的多智能体社会。

## 当前主线

```text
Conversation / Skill preparation
→ AgentRun
→ AgentGraph stable facade
→ Pi Loop（应用默认）
→ Main Planner
→ direct action / governed delegation
→ Harness / Skill-private Runtime
→ Evidence / Artifact
→ Planner acceptance 或冻结交付
→ Generate
→ Finalize
```

## AgentRun 是产品运行真相

一次 Agent 请求首先创建 `AgentRun`。它保存：

- 用户目标与运行时输入；
- `running / waiting_user / waiting_approval / completed / failed` 状态；
- observations 与 Evidence；
- frozen `pendingToolCall`；
- exact approval 与 checkpoint；
- SubAgent 局部执行结果；
- finalization packet；
- execution trace 与最终回答状态。

因此，产品里“这一项任务现在走到哪里”由 AgentRun 回答，而不是由某一个 UI 节点或某一段模型文本回答。

## AgentGraph 是稳定门面

`AgentGraph` 表示稳定输入、输出、节点语义和 trace 契约，不意味着底层必须由 LangGraph `StateGraph` 驱动。

当前运行时选择是：

| 场景 | 实际运行时 |
| --- | --- |
| 正常应用启动 | `Pi Loop` |
| 显式选择 `pi_loop` | `Pi Loop` |
| 显式选择 `langgraph` | LangGraph 兼容运行时 |
| 部分历史测试与回归对照 | LangGraph |

Pi Loop 是产品默认主链；LangGraph 继续承担兼容、历史测试和对照价值。

## Main Planner 管全局目标

Main Planner 是下一步语义决策中心。它负责：

- 理解用户真正想完成什么；
- 维护当前任务框架和轻量计划；
- 区分“已有证据可以说什么”和“用户任务是否真正完成”；
- 选择回答、提问、检索、具体工具或局部委派；
- 接受 SubAgent 返回的结构化结果；
- 判断全局目标是否完成；
- 冻结最终交付所需的 Evidence。

`planList` 只表示任务方向与完成状态，不保存事实、工具结果或内部推理。

## 三类执行路径

### 1. Main Agent 直接路径

简单回答、检索或一个具体工具调用由 Main Agent 直接推进：

```text
answer → Generate → Finalize

retrieve → Evidence → Planner

concrete tool
→ Normalize
→ Policy / Approval
→ Tool
→ Evidence
→ Planner
```

### 2. Generic SubAgent：局部工作包

当任务包含一个边界清楚、可以独立验收、通常需要多次顺序工具调用的工作包时，Main Planner 可以使用 `delegate_task`：

```text
Main Planner
→ delegate_task
→ Generic SubAgent
→ local plan / act / observe / recover
→ structured Evidence
→ Main Planner acceptance
```

这里有几条硬边界：

- `delegate_task` 是 Planner-only 委派协议，不是普通 Harness Tool；
- Child 只拥有被委派的局部目标和验收条件；
- Child 只看见当前允许的 concrete tools；
- V1 不允许 Child 再次委派，避免递归扩张；
- Child 的真实工具调用仍受 Policy、审批、workspace 和运行环境约束；
- Child completed 只表示局部工作包完成，用户全局目标仍由 Main Planner 判断。

### 3. Skill-owned SubAgent：领域施工

任务型 Skill 可以声明 execution profile，把领域施工交给隔离的 Skill-owned SubAgent：

```text
Skill match / continuation
→ Skill Context + Execution Profile
→ Skill-owned SubAgent
→ Skill-scoped Harness tools
→ optional Skill-private Runtime
→ Evidence / Artifact / Requirement
→ Parent governance and delivery
```

Parent 保留：

- 用户对话；
- 全局目标；
- Policy 与审批；
- 恢复和终止治理；
- Evidence 接收；
- 最终 Generate 与交付。

Skill-owned SubAgent 负责局部规划、工具循环、领域 Runtime、结果验证和 Artifact 构造。

当它返回 `completed` 时，Parent 会提交 Evidence 与 Artifact、冻结 finalization packet，并进入 Generate。Main Planner 不再把已经完成的领域施工重做一遍。

## Concrete tool 的不可破坏边界

普通工具调用必须遵守：

1. Planner 只输出使用哪个具体工具以及参数意图；
2. Normalize 校验 schema 并冻结 `pendingToolCall`；
3. Policy 只判断这次被冻结的调用；
4. 审批绑定 `toolId + toolCallId + inputHash`；
5. Tool 只执行与审批一致的 invocation；
6. Tool 或 Retrieve 先产生原始事实；
7. Evidence 累计事实并交还 Planner；
8. Generate 只能使用 finalization packet 引用到的真实 Evidence。

能力匹配、embedding、rerank 或 UI 选中状态都不能直接成为执行请求。

## Evidence answerable 不等于 task completable

找到候选文件，不等于已经读完文件；得到一个工具结果，不等于完成了用户要求的比较、修改或验证。

Mira 把这两个问题分开：

- **Evidence answerable**：现有证据能够支持哪些表述；
- **Task completable**：用户要求的全部目标是否已经覆盖。

只有 Main Planner 可以根据全局目标宣布任务完成。

## 审批与恢复

高风险调用会进入 `waiting_approval`。恢复时使用原 frozen invocation 和 checkpoint，而不是根据用户的“同意”重新猜一次参数。

SubAgent 审批还会保存局部 transcript checkpoint。旧批准不能跨任务、跨 fork 或跨参数变化复用。

## 终止语义

目标合同如下：

| 情况 | 目标状态 |
| --- | --- |
| 正常交付 | `completed` |
| 需要补充信息 | `waiting_user` |
| 等待审批 | `waiting_approval` |
| terminal failure | `failed`，Generate 不运行 |
| recoverable failure 仍可恢复 | Evidence 记录失败，回 Planner |
| recoverable failure 恢复耗尽 | guarded answer，`completed` |

### 当前已知实现漂移

截至 2026 年 7 月 30 日，`dev` 在“recoverable failure 恢复耗尽”场景仍会直接进入 `error`，使 Graph `failed` 并跳过 Generate。

这是高优先级实现漂移，不是目标合同改变。公开文档同时保留目标合同和当前真实行为，避免一边用理想掩盖代码，另一边又把回归误写成新设计。

## 当前明确没有

Mira 当前不是：

- 开放式多 Agent 自治平台；
- nested SubAgent 系统；
- Agent 间自由通信或群体投票；
- 并发工具 fan-out 与通用 DAG scheduler；
- 通用 durable workflow engine；
- 自动 sandbox 快照与回滚系统；
- 已完成的长期记忆大系统。

当前 SubAgent 是受控、单层、任务局部的执行所有权转移。

## 当前阶段

2026 年 8 月起，Agent 进入功能稳定迭代。重点是修复合同漂移、稳定审批恢复、减少提前完成、提高 Evidence 与 Artifact 可信度，并用回归测试保护已经形成的边界，而不是重新设计一套更大的 Agent Graph。