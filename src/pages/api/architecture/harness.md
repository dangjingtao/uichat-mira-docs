---
title: Harness 与工具边界
description: 从注册、公共工具面、模型暴露、具体调用到受控委派的执行边界。
group: 架构
order: 12
---

# Harness 与工具边界

Harness 是 concrete tool 的治理与执行控制面。

它负责把“系统已经注册的能力”整理成“当前真实可用、可以被模型选择、并能够被审计执行的具体工具”，但它不是 Planner、SubAgent 编排器，也不负责判断用户目标是否完成。

## 五层工具事实

讨论一个工具是否“存在”时，必须拆成五个问题。

### Registry

工具实现是否已经注册到 Harness Runtime。

Registry 中可以同时存在：

- 当前公共工具；
- 内部 primitive；
- 历史兼容实现；
- 由微应用或连接状态动态注册的能力；
- External MCP 投影工具。

注册存在，不等于 Planner 可见。

### Public Surface

这个注册实现是否属于当前 Agent 公共工具面。

例如旧的 `read_list`、`read_locate`、`read_extract`、`read_slice`、`read`、`edit_file` 和 `workspace_mutation` 仍可能保留在 Runtime 中，但已经从 Main Planner 的公共 surface 隐藏。

### Availability

工具在当前用户和当前设备上是否真的可用。

这可能取决于：

- Workspace；
- 微应用 Runtime；
- 邮箱或 GitHub 连接；
- 已连接浏览器；
- 外部专家配置；
- MCP Server 的连接、Discover 和 Agent Access；
- Provider 或本地进程状态。

### ToolExposure

ToolExposure 是 Main Planner 本轮真正看到的 concrete tool 集合。

当前规则是：

```text
公共且可用工具 <= 20
→ 全部暴露
→ 不运行 embedding / rerank

公共且可用工具 > 20
→ embedding recall
→ rerank
→ toolId 去重
→ 暴露前 20
```

排名只解决模型上下文预算，不是权限机制，也不是 Harness 在猜“当前任务阶段只需要哪些工具”。

用户选中的工具包目前只提供排名偏好、可用性状态和 trace，不会直接改变权限或触发执行。

### Invocation

Invocation 是一次具体执行请求。

它必须包含可解析的 `toolId`、参数和调用身份，并在 Normalize 后冻结为 `pendingToolCall`。能力匹配、embedding 命中、rerank 结果、工具包或 UI 选中状态都不能直接充当 Invocation。

## Normalize、Policy 与 Approval

模型输出不会直接执行。

```text
Planner decision
→ Normalize
→ schema validation
→ frozen pendingToolCall
→ Policy / Approval
→ Harness Invocation
→ Tool Result
→ Evidence
```

Normalize 负责校验工具身份、schema 和参数，并生成稳定的输入摘要。Policy 只判断已经冻结的具体调用。

产品的 settled exact-invocation 合同使用：

```text
toolId + toolCallId + inputHash
```

命令、参数、`cwd`、环境变量、超时或目标资源发生变化后，都必须重新判断。批准一次调用，不等于永久授权某项工具。

### 当前实现说明

截至 2026 年 7 月 30 日，`dev` 中 frozen call 和审批请求都会保存 `toolCallId`，但核心 approval grant matcher 实际仍只匹配：

```text
toolId + inputHash
```

这是一处已经公开记录的审批身份漂移，不代表目标合同已经改成二元匹配。

## 风险不等于隐藏工具

工具有风险，不应该通过“假装工具不存在”解决。

- Edit 和 Terminal 的公开定义会要求审批；
- External MCP 投影调用要求审批；
- GitHub 读操作可以直接执行，但远程写 operation 会动态提出审批；
- `mail_query` 默认缓存查询不需要审批，强制同步会要求审批；
- Browser 的观察、导航、交互和传输具有不同风险等级。

因此，Eligibility、Exposure 和 Approval 是三层不同问题。

## `delegate_task` 不是普通 Harness Tool

Main Planner 可以通过 `delegate_task` 启动 Generic SubAgent，但它是 Planner-only 的运行时委派协议：

- 不来自 Harness ranking；
- 不代表一个外部工具实现；
- 不走 Main Agent 的普通 Normalize / Policy / ToolNode 路径；
- 只启动一个受控、单层的局部执行器；
- 不会出现在 Child 的工具面，避免递归委派。

Generic SubAgent 内部真正调用的 `read_open`、`write_file`、`terminal_session` 或其他 concrete tools，仍然必须经过各自的工具绑定、Policy、审批、Workspace 和 Evidence 合同。

## Skill-private Runtime 不是全局工具

任务型 Skill 可以拥有受限的 Skill-owned SubAgent 和私有 Runtime adapter。

这些能力：

- 不会自动进入 Main Planner 的 ToolExposure；
- 不能因为写在 Skill manifest 里就获得权限；
- 仍受 Parent 的审批、恢复、Evidence 和最终交付治理；
- 只能在对应 execution profile 和任务边界内使用。

这让文档、报表、专业解析等领域能力可以保留自己的 Runtime，而不会把 Main Planner 的公共工具面膨胀成一整套业务 API。

## External MCP 的边界

External MCP Tool 只有在以下条件都成立时，才可能进入 Agent 公共能力面：

- Server 已启用并连接；
- Transport 配置有效；
- 用户已接受免责声明；
- Discover 已获得 Tool；
- 用户显式开启 Agent Access；
- 对应 canonical projected implementation 仍在 Registry。

投影工具使用稳定 ID：

```text
mcp:<serverId>:tool:<toolName>
```

每次真实调用仍要形成 concrete Invocation 并经过审批。External MCP 不能通过 Provider 私有命令或旧 ID 绕过 Harness。

## Tool 结果先成为 Evidence

ToolNode 不宣布用户任务已经完成。它只返回真实结果：

- 调用了什么；
- 输入是什么；
- 返回了哪些事实；
- 是否失败、超时、被拒绝或等待审批；
- 是否产生 Artifact；
- 结果能够证明什么。

Evidence 将这些事实累计到 AgentRun，再由 Main Planner 判断全局目标是否完成。

## 设计收益

这套边界把几个问题分开测试：

- 系统是否注册了某项能力；
- 它是否属于公共工具面；
- 当前环境是否真的可用；
- 模型本轮是否能看见；
- Planner 是否决定使用；
- 参数是否已经冻结；
- 这次调用是否允许；
- 实际执行了什么；
- 结果是否足以完成用户目标。

进一步阅读：

- [工具工作台](/docs/configuration/tools)
- [MCP](/docs/configuration/mcp)
- [Mira 的工具现在到底是什么](/blogs/engineering/mira-tool-current-truth)
