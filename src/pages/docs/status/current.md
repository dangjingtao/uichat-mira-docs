---
title: 当前实现快照
description: 以 2026-07-30 的 dev 分支为准，说明产品能力、Agent、Tool Runtime、MicroApps Hub 与已知边界。
group: 现状与方向
order: 17
---

# 当前实现快照

> 本页核对日期为 2026 年 7 月 30 日。它描述当前可验证实现，不把设计方向、历史方案或待修复合同写成已经交付的能力。

## 版本与定位

当前根包版本为 `0.99.6`，项目描述仍是：

> An intelligent agent cabin that starts with a chat and returns to your side.

Mira 仍以桌面端、本地优先、多 Provider 的个人 AI 工作台为核心定位。聊天是入口，模型、知识、角色、工具、任务与产物在同一个工作环境里协作。

## 已有产品域

当前源码已经覆盖：

- 对话工作区；
- Provider 与模型管理；
- 知识库、检索与评测；
- 角色与提示词原型；
- MCP、内置工具与 Harness；
- Agent 任务执行与 execution trace；
- MicroApps Hub、独立 Studio 与专用 Runtime；
- 桌面端构建、调试与发布链路。

不同页面或后端入口已经存在，不等于每项能力都达到同样成熟度。公开说明会继续区分稳定、部分可用、实验中与方向性能力。

## Agent 当前运行时

当前 Agent 不能再简单描述成一张 LangGraph 流程图。

更准确的口径是：

- `AgentRun` 保存一次任务的状态、Evidence、审批、checkpoint 与最终交付；
- `AgentGraph` 是稳定运行时门面；
- `Pi Loop` 是应用默认 Main Agent 运行时；
- `LangGraph` 保留为显式兼容、历史测试与回归对照运行时；
- Main Planner 维护用户全局目标，并决定下一步与最终完成；
- Harness 负责具体工具的公共工具面、暴露、冻结调用、Policy、审批、执行与审计。

## 三类执行路径

当前存在三类受控路径：

1. **Main Agent 直接执行**：回答、检索或调用一个具体工具；
2. **通用工作包委派**：Main Planner 通过 `delegate_task` 把边界清楚的局部任务交给 Generic SubAgent；
3. **Skill-owned SubAgent**：命中执行 Profile 的任务型 Skill 在受限工具面和可选私有 Runtime 中完成领域施工。

SubAgent 只拥有局部任务。Parent 仍保留用户对话、全局目标、审批、恢复、Evidence 收口和最终交付。当前不是开放式多 Agent 自治平台，也不支持递归委派或 Agent 群体自由协作。

## Tool Runtime 当前快照

当前核心公共工具面是：

```text
Read
├─ read_discover
├─ grep
├─ read_open
└─ codebase_explore

Edit
├─ write_file
├─ replace_block
├─ delete_path
└─ move_path

Search
├─ web_search
└─ news_search

Terminal
└─ terminal_session
```

旧的六个 `read_*` primitive、`edit_file` 和 `workspace_mutation` 仍可能保留在 Runtime 中，但已经不是 Main Planner 的公共工具合同。

工具面也不是固定四格。Managed Browser、Attached Browser、Mail、GitHub、External Expert 和 External MCP 会根据真实连接、用户身份、运行时与产品配置动态进入可用能力面。

Tool Exposure 当前规则：

- 公共且可用工具不超过 20 个时，全部暴露，不运行 embedding / rerank；
- 超过 20 个时，只为控制模型上下文而排名并暴露前 20；
- 排名不是授权；风险由具体 Invocation 的 Policy / Approval 处理；
- 工具包选择只提供偏好，不直接改变权限或触发调用。

`terminal_session` 当前是完整 Host shell / PTY Runtime。Workspace 是默认执行上下文，但不是不可突破的假沙箱；工作空间外的 `cwd` 必须在显示真实目标后获得具体审批。

## MicroApps 当前快照

设置页中的 MicroApps Hub 是宽产品能力中心，不等于代码中的严格 Integration MicroAPP Registry。

当前判断需要拆成五层：

```text
产品入口
共享 Definition
领域 Runtime
Integration Invoke
Agent Tool / Skill Access
```

严格 Registry 当前有七种 Definition：

```text
knowledge_query
news_hub
image_generation
computer_use
tts
codegraph
evolving_knowledge
```

其中只有 `knowledge_query` 完成统一 External AccessPoint Invoke，并且当前只支持企业微信智能机器人。

其他能力的当前状态：

- Image Generation：有任务、实时进度、Artifact、Provider / ComfyUI Studio；没有统一 External Invoke；
- Computer Use：有 Managed Browser、持久任务与 Evidence、模型执行器、审批和 Browser Tools；不是宿主桌面万能遥控；
- TTS：有 Windows、Piper、GPT-SoVITS 与 API Provider；并非所有 Voice Pack 或 Provider 都已验证；
- News Hub：有多来源拉取、缓存和 `news_search`；不等于实时公网搜索；
- CodeGraph：有 Studio 与 `codebase_explore`；原生命令不直接暴露给 Planner；
- 智识进化库：有真实 Service / Studio，但仍属实验能力。

MicroApps Hub 中还有不属于严格 Registry 的真实入口：

- Mail Center 通过 `mail_query` 进入 Agent；
- 文枢通过 Skill-owned Execution 与 Private Runtime；
- GitHub 通过连接入口和四个领域工具；
- 问策通过 External Expert Bridge；
- Notion 当前是连接与部分 AccessPoint 已实现，完整 Agent / Sync 仍未全部完成。

页面卡片、Definition、Runtime、External Invoke 和 Agent Access 不能互相代替。

## 已知实现偏差

### Recoverable 终止漂移

Settled recoverable contract 是：恢复预算耗尽后生成 guarded answer，Graph 以 `completed` 收口，并明确说明未完成项和失败影响。

截至本次核对，`dev` 当前实现仍会在该场景直接进入 `error`，使 Graph `failed` 并跳过 Generate。这个行为被记录为高优先级实现漂移，不是新的目标合同。

### Approval 身份漂移

Settled exact-invocation 合同使用：

```text
toolId + toolCallId + inputHash
```

当前 `dev` 的 frozen call 和审批请求会保存 `toolCallId`，但核心 approval grant matcher 实际仍只匹配：

```text
toolId + inputHash
```

这意味着当前实现尚未把 `toolCallId` 纳入 grant 身份判断。该问题已经被记录，但本轮公开文档更新没有修改 Runtime。

## 当前阶段

2026 年 8 月起，Mira 进入功能稳定迭代阶段。当前优先级是：

- 修复已经确认的合同漂移；
- 减少提前收尾和错误工具选择；
- 稳定审批与 checkpoint resume；
- 提高 Evidence、Artifact 与 execution trace 的可信度；
- 用回归测试保护已经形成的工具公共面和暴露规则；
- 逐项验证 Studio、Integration Invoke 与 Agent 接入，不用新卡片掩盖能力未收稳；
- 控制新增能力范围，不重开 Agent Graph、Harness 或 Universal MicroApp Runtime。

## 文档边界

公开站负责解释产品和架构；主仓库 `dev` 分支中的当前真相、协议、测试与代码仍是最终核验依据。历史文章可以解释为什么曾经这样设计，但不能覆盖当前实现。

延伸阅读：

- [MicroApps 与独立 Runtime](/docs/architecture/microapps)
- [Mira 的微应用现在到底是什么](/blogs/engineering/mira-microapps-current-truth)