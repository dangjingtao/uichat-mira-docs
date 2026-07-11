---
title: Agent V1.5 运行回路
description: 以 Planner 为唯一语义决策中心的稳定闭环。
group: 架构
order: 11
---

# Agent V1.5 运行回路

当前 dev 分支的 Agent 重点是稳定职责边界，而不是继续增加会“猜”的节点。

## 主路径

运行从 prepareContext 进入 nextActionPlanner。Planner 可以选择 Retrieve、Tool、Generate 或错误终止。

- Retrieve 获取知识证据，然后回到 Planner。
- Tool 先进入 toolCallNormalize，再经 policy 与 approval，最后由 ToolNode 执行，并把 evidence 交回 Planner。
- Generate 生成候选答案，随后 evaluate，最后结束。

## Planner 是唯一语义中心

Planner 负责解释目标和决定下一步。Normalize 只冻结已经决定的调用，Policy 只判断风险，ToolNode 只执行，Retrieve 只返回证据。删除 shadow decider 的意义，是避免多个节点暗中重写同一个意图。

## 状态中的关键事实

Agent state 同时携带上下文、计划、规范化调用、审批、工具结果、检索结果、证据与终止原因。每个节点只写它拥有的字段。

## 稳定契约

V1.5 的回路是当前稳定化契约。改进应围绕错误语义、可观测性、回归测试和证据质量展开，而不是随意重画流程图。