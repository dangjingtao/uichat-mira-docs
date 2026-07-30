---
title: Harness 与工具边界
description: 从能力匹配、模型暴露、具体调用到受控委派的执行边界。
group: 架构
order: 12
---

# Harness 与工具边界

Harness 负责把“系统拥有的能力”转换成“本轮允许模型使用并可以被审计的具体工具”。它是 concrete tool 的治理与执行控制面，不是所有 Agent 行为的总称。

## 三层工具契约

### CapabilityMatch

CapabilityMatch 是内部候选结果。它回答某项需求可能由哪些能力满足，用于召回、压缩、策略与诊断。

它不是执行入口，也不能直接越过 Planner 触发工具。

### ToolExposure

ToolExposure 是 Main Planner 本轮真正可见的 concrete tool 集合。

系统会综合：

- 当前任务与会话上下文；
- Provider 的 tool schema 能力；
- workspace 与连接状态；
- Policy、权限和产品配置；
- 候选能力的匹配结果。

候选匹配只帮助缩小工具面，不替 Planner 决定下一步。

### Invocation

Invocation 是一次具体执行请求。它必须包含可解析的 `toolId`、参数和调用身份，并在 Normalize 后冻结为 `pendingToolCall`。

能力 ID、embedding 命中、rerank 结果或 UI 选中状态都不能直接充当 Invocation，否则语义匹配会绕过注册表、Policy 和审批边界。

## Normalize、Policy 与 Approval

模型输出不会直接执行。

```text
Planner decision
→ Normalize
→ frozen pendingToolCall
→ Policy
→ allow / deny / waiting_approval
→ Tool
```

Normalize 负责校验 schema、参数和工具身份；Policy 只判断已经冻结的调用。

审批绑定：

- `toolId`；
- `toolCallId`；
- `inputHash`。

命令、参数、cwd、env、timeout 或目标资源发生变化后，必须重新判断。批准某一次调用，不等于永久授权该工具。

## `delegate_task` 不是普通 Harness Tool

Main Planner 可以通过 `delegate_task` 启动 Generic SubAgent，但它是 Planner-only 的运行时委派协议：

- 不来自 Harness capability ranking；
- 不代表一个外部工具实现；
- 不走 Main Agent 的普通 Normalize / Policy / ToolNode 路径；
- 只启动一个受控、单层的局部执行器；
- 不能出现在 Child 的工具面里，避免递归委派。

Generic SubAgent 内部真正调用的 concrete tools，仍然必须经过各自的工具绑定、Policy、审批、workspace 和 Evidence 合同。

因此，委派没有绕开 Harness；它只是把局部施工的控制权暂时交给 Child，而 concrete action 仍受治理。

## Skill-private Runtime 不是全局工具

任务型 Skill 可以拥有受限的 Skill-owned SubAgent 和私有 Runtime adapter。

这些能力：

- 不会自动进入 Main Planner 的 ToolExposure；
- 不能因为写在 Skill manifest 里就获得权限；
- 仍受 Parent 的审批、恢复、Evidence 和最终交付治理；
- 只能在对应 execution profile 和任务边界内使用。

这让文档、报表、专业解析等领域能力可以保留自己的运行时，而不会把 Main Planner 的工具面膨胀成一整套业务 API。

## Tool 结果先成为 Evidence

ToolNode 不宣布用户任务已经完成。它只返回真实结果：

- 调用了什么；
- 输入是什么；
- 返回了哪些原始事实；
- 是否失败、超时、被拒绝或等待审批；
- 是否产生 Artifact；
- 结果能够证明什么。

Evidence 将这些事实累计到 AgentRun，再由 Main Planner 判断全局目标是否完成。

## 设计收益

这套边界把几个问题分开测试：

- 系统是否拥有某项能力；
- 模型本轮能否看见某个具体工具；
- Planner 是否决定使用它；
- 参数是否已经冻结；
- 这次调用是否允许；
- 实际执行了什么；
- 结果是否足以完成用户目标。

内置工具、MCP、企业集成、Generic SubAgent 和 Skill-owned SubAgent 因此可以共享治理原则，但不会被错误地压成同一种执行路径。