---
title: 可控的自主
description: Planner 可以决定下一步，但执行权始终受 Harness 约束。
group: 产品哲学
order: 5
---

# 可控的自主

Mira 追求的不是“尽可能自动”，而是让自主能力在清晰、稳定的边界里工作。

## 决策与执行必须分开

V1.5 Agent 图把 Planner 设为唯一语义决策中心。Planner 可以选择检索、调用工具、生成答案或继续推理，但 ToolNode 不替它补意图，Policy 也不重新解释任务。

## Harness 是能力边界

一次工具行动会依次经历 CapabilityMatch、ToolExposure 与 Invocation。前两者回答“系统能否提供”和“模型此刻能否看到”，最后一个才是带有具体 toolId 的执行请求。

## 高风险动作需要显式停顿

Normalize 冻结调用参数，Policy 判断风险，必要时进入 Approval。这样的停顿不是失败，而是把不可逆选择交还给人。

## 稳定比聪明更重要

如果多个节点都能猜测用户意图，Agent 会在边界处悄悄漂移。Mira 更看重职责单一、证据可追踪和回路可复现：先让每一步可以解释，再谈更长的自主链路。