---
title: 产品地图
description: 从聊天工作区到知识、受控 Agent、动态工具面、MicroApps Hub 与独立 Runtime。
group: 认识 Mira
order: 3
---

# 产品地图

Mira 当前可以按五个相互协作的产品域理解。

## 对话工作区

线程、消息、角色、附件、上下文摘要与 Agent execution trace 共同组成聊天主线。对话不是孤立记录，而是用户目标、材料、执行过程和最终产物的承载空间。

## 模型与 Provider

模型配置、Provider connection 和模型能力画像在后端统一管理。当前主要通过 OpenAI-compatible 契约吸收供应商差异，同时保留 LM Studio、Ollama、Cloudflare、火山等不同接入路径。

聊天、任务模型、Embedding、Rerank、评测、语音和图像能力不必绑定同一个 Provider。

## 知识与评测

知识库负责文档、分块、向量索引、检索和 Markdown workspace；评测系统负责数据预检、运行、历史记录与报告导出。

知识库回答“系统依据什么资料”，评测回答“这些资料和模型组合实际表现如何”。

## Agent 与工具

Agent 通过受治理的任务执行链使用工具：

```text
AgentRun
→ Main Planner
→ direct action / governed delegation
→ concrete Tool / Skill-private Runtime
→ Evidence / Artifact
→ Generate / Finalize
```

当前有三类执行方式：

- Main Agent 直接回答、检索或调用具体工具；
- `delegate_task` 把一个可独立验收的工作包交给 Generic SubAgent；
- 任务型 Skill 可以启动 Skill-owned SubAgent，在受限能力面内完成领域施工。

Main Planner 始终维护用户全局目标。SubAgent 只负责局部任务，不能递归创建新的 SubAgent，也不能绕过 Policy、审批、Workspace 和 Evidence 合同。

工具系统不是固定清单。Harness 会分别处理：

```text
Registry
→ Public Surface
→ Availability
→ Tool Exposure
→ Invocation / Approval
```

当前核心公共工具覆盖文件发现、正文搜索、打开、代码关系探索、写入、替换、删除、移动、公网搜索、本地新闻搜索和完整 Terminal Runtime。Browser、Mail、GitHub、External Expert 与 External MCP 则根据真实连接和运行时动态加入。

公共且可用工具不超过 20 个时，Planner 会看到全部工具；超过 20 个才通过 embedding / rerank 压缩到前 20。排名只控制上下文，不代替审批，也不替 Planner 决定下一步。

`delegate_task` 是 Planner-only 委派协议，不是普通 Harness Tool。Skill-private Runtime 也不会自动进入 Main Planner 的公共工具面。

## MicroApps Hub 与集成

设置页中的 MicroApps Hub 是一个宽产品能力中心，而不是一套统一 Runtime。它同时容纳：

- Image Generation、Computer Use、TTS、News Hub、CodeGraph 等独立 Studio；
- 文枢这样的 Domain Runtime 与 Skill；
- Mail Center、GitHub、问策等领域服务和连接入口；
- 企业集成 MicroAPP；
- Notion、智识进化库等部分实现或实验能力。

判断一项能力时需要分别确认：

```text
产品入口
共享 Definition
领域 Runtime
Integration Invoke
Agent Tool / Skill Access
```

这几层不能互相代替。

代码中的严格 Integration MicroAPP 目前只有 `knowledge_query` 完成外部调用闭环，并且只支持企业微信智能机器人。Image Generation、Computer Use、TTS、News Hub、CodeGraph 与智识进化库虽然有共享 Definition 和真实 Studio / Service，但统一 External Invoke 尚未完成。

Mail Center、文枢、GitHub 与问策并不属于当前严格 Registry：

- Mail Center 通过 `mail_query`；
- 文枢通过 Skill-owned SubAgent 与 Private Runtime；
- GitHub 通过四个领域工具；
- 问策通过 External Expert Bridge 与独立 Tool。

企业集成继续通过 Platform → Instance → AccessPoint → MicroAPP，把平台协议、连接配置与业务工作流分离；这只是集成子模型，不是整个 MicroApps Hub 的统一架构。

## 当前边界

Mira 当前不是开放式多 Agent 平台，也不是所有应用共享一种 Runtime 的微应用操作系统，更不是通用 durable workflow engine。

产品正在进入稳定迭代阶段，优先保护已经形成的运行时边界、Tool Exposure、审批恢复、Evidence 和真实产物交付。

延伸阅读：

- [MicroApps 与独立 Runtime](/docs/architecture/microapps)
- [当前实现快照](/docs/status/current)
- [Mira 的微应用现在到底是什么](/blogs/engineering/mira-microapps-current-truth)