---
title: 可控自主原则
description: Main Agent、SubAgent、Harness、审批与用户控制权的责任边界。
group: 产品哲学
order: 5
---

# 可控自主原则

## 原则定义

可控自主表示：模型可以根据目标决定下一步，但具体执行权必须受到明确的 Runtime、Policy、审批、Workspace 和 Evidence 合同约束。

```text
自主决策
!= 无条件执行
```

## 责任分配

| 组件 | 负责 | 不负责 |
| --- | --- | --- |
| Main Planner | 维护全局目标、选择下一步、判断整体完成 | 直接绕过 Tool Runtime 执行动作 |
| Normalize | 校验 concrete tool 与参数、冻结调用 | 判断业务目标是否完成 |
| Policy / Approval | 判断一次具体调用是否允许 | 生成新的调用参数 |
| Harness | 管理工具注册、可用性、暴露、执行和审计 | 用户目标分解和最终回答 |
| Generic SubAgent | 完成一个受限、可验收的局部工作包 | 修改全局目标或递归委派 |
| Skill-owned SubAgent | 在 Skill 约束内完成领域任务 | 自动获得全部公共工具和权限 |
| Parent Agent | 保留用户对话、审批、恢复、Evidence 和最终交付 | 把治理责任永久移交给 Child |
| User | 批准、拒绝、补充信息或终止高风险动作 | 为系统的模糊调用承担默认授权 |

## 具体调用合同

普通工具执行遵循：

```text
Planner Decision
→ Normalize
→ Frozen Invocation
→ Policy / Approval
→ Tool Runtime
→ Tool Result
→ Evidence
→ Planner
```

一次批准必须针对明确的调用身份和参数。Settled contract 使用：

```text
toolId + toolCallId + inputHash
```

命令、参数、`cwd`、环境变量、超时或目标资源变化后，需要重新判断。

## 委派边界

### Generic SubAgent

适用于：

- 目标边界明确；
- 可以独立验收；
- 通常需要多步顺序工具调用；
- 返回结构化 Evidence 后由 Main Planner 继续判断。

限制：

- 只接收局部目标；
- 只看见受限 concrete tools；
- 不允许 nested SubAgent；
- 不允许再次调用 `delegate_task`；
- completed 不等于用户全局目标完成。

### Skill-owned SubAgent

适用于具有领域 Skill、Execution Profile 和可选私有 Runtime 的任务。

限制：

- SkillContext 不扩大 Main Planner ToolExposure；
- 私有 Runtime 不能因为 Manifest 声明而自动获得可用性；
- Parent 保留审批、恢复、终止和最终交付；
- Child 完成后返回 Evidence、Artifact 或 Requirement。

## 高风险操作

需要显式审批的操作包括但不限于：

- 文件写入、删除和移动；
- Terminal 命令；
- GitHub 远程写操作；
- 邮件强制同步或发送；
- Browser 输入、提交或外部传输；
- External MCP Tool 调用；
- 其他具有网络、副作用或不可逆影响的动作。

风险处理不能通过“把工具隐藏起来”替代。Eligibility、Exposure 和 Approval 是不同层级。

## 等待与恢复

系统需要区分：

| 状态 | 含义 |
| --- | --- |
| `waiting_user` | 缺少完成任务所需的信息 |
| `waiting_approval` | 已冻结具体调用，等待用户决定 |
| `running` | Runtime 正在处理 |
| `completed` | 已形成可交付结果 |
| `failed` | Terminal failure，不能继续 Generate |

恢复必须使用同一 frozen invocation 和 checkpoint，不重新根据“同意”生成一套相似参数。

## 禁止的隐式扩张

当前设计禁止：

- Child 修改 Parent 的全局目标；
- Child 递归创建 SubAgent；
- Skill 私有 Runtime 进入 Main Planner 公共工具面；
- 旧批准跨参数、跨任务或跨 fork 复用；
- Tool Result 直接宣布用户任务完成；
- UI 选中状态、ranking 结果或 capability match 直接成为 Invocation；
- 连接成功自动等于 Agent Access。

## 当前非目标

Mira 当前不实现：

- 开放式 Agent 社会；
- Agent 间自由通信与群体投票；
- 无限长自主循环；
- 通用 DAG Scheduler；
- 不受用户治理的后台执行；
- 自动授予全部本地和远端权限。

## 验证问题

评审自主执行功能时，应回答：

1. 谁维护全局目标？
2. 谁生成参数，谁冻结参数？
3. 审批绑定哪一次具体调用？
4. Child 获得哪些上下文和工具？
5. 失败如何进入 Evidence？
6. 谁判断最终完成？
7. 用户如何暂停、拒绝或终止？

## 相关文档

- [Agent 当前运行真相](/docs/architecture/agent)
- [Harness 与工具边界](/docs/architecture/harness)
- [Agent 策略](/docs/architecture/agent-strategy)
- [证据优先原则](/docs/philosophy/evidence)
