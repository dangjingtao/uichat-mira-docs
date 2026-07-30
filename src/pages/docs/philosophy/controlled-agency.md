---
title: 可控的自主
description: Main Agent 可以决定下一步并委派局部任务，但执行权始终受治理。
group: 产品哲学
order: 5
---

# 可控的自主

Mira 追求的不是“尽可能自动”，而是让自主能力在清晰、稳定、可以被用户接管的边界里工作。

## 全局决策与具体执行必须分开

Main Planner 维护用户的完整目标，并决定下一步是回答、提问、检索、调用具体工具，还是委派一个局部工作包。

它不直接绕过执行协议。具体工具仍要经过 Normalize、Policy、Approval、ToolResult 和 Evidence。

决策可以由模型完成，执行合同不能靠模型临场发挥。

## 委派不是放弃治理

Mira 允许两种局部执行单元：

- Generic SubAgent：完成一个边界清楚、可独立验收的通用工作包；
- Skill-owned SubAgent：在专业 Skill 的受限工具面和可选私有 Runtime 中完成领域施工。

SubAgent 只获得局部目标，不继承 Parent 的全部上下文和全部能力，也不能继续递归创建新的 SubAgent。

Parent 始终保留：

- 用户对话；
- 全局目标；
- Policy 与审批；
- 恢复和终止治理；
- Evidence 收口；
- 最终回答与产物交付。

真正的自主，不是把责任从系统里抹掉，而是让每一层只拥有它应该拥有的决定权。

## Harness 是 concrete action 的边界

Harness 区分：

- 系统可能拥有的能力；
- 模型本轮可以看见的工具；
- Planner 实际决定的调用；
- 经过冻结和审批的 invocation；
- 工具真实返回的结果。

`delegate_task` 不是一个绕过 Harness 的万能工具。Child 内部每一次 concrete tool 调用仍然受工具绑定、Policy、审批、workspace 和 Evidence 约束。

Skill-private Runtime 也不是自动获得权限的隐藏后门。它只能在 execution profile 的边界内工作，并把结果交回 Parent。

## 高风险动作需要显式停顿

一次批准必须绑定具体的 `toolId`、`toolCallId`、参数哈希和 checkpoint。

系统恢复时继续的是同一项被冻结的调用，而不是重新生成一套“差不多”的参数。这样的停顿不是自动化失败，而是把不可逆选择明确交还给人。

## 给结果，也要给证据

Mira 不把“模型说成功了”当成成功。

工具调用、检索、SubAgent 结果和 Artifact 都需要形成可追踪 Evidence。系统还必须区分：

- 当前事实足以回答什么；
- 用户要求的任务是否完整完成。

这让用户能够看见系统做过什么、失败在哪里、为什么暂停，以及最终结论依据什么。

## 当前不是 Agent 社会

Mira 当前不追求：

- Agent 自由复制；
- Agent 间无限通信；
- 多 Agent 群体投票；
- nested SubAgent；
- 不受约束的长链自主执行。

当前方向是受控、单层、任务局部的执行所有权转移。

## 稳定比显得聪明更重要

当多个节点都能猜测用户意图，当批准可以被泛化，当 Child 可以偷偷扩大目标，系统会在边界处悄悄漂移。

Mira 更看重职责单一、证据可追踪、审批可验证和回路可复现。先让每一步可靠，再让任务变长；先确保用户能够重新拿回主导权，再谈更大的自主能力。