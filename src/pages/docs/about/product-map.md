---
title: 产品地图
description: 从聊天工作区到知识、受控 Agent、工具与微应用。
group: 认识 Mira
order: 3
---

# 产品地图

Mira 当前可以按五个相互协作的产品域理解。

## 对话工作区

线程、消息、角色、附件、上下文摘要与 Agent execution trace 共同组成聊天主线。对话不是孤立记录，而是用户目标、材料、执行过程和最终产物的承载空间。

## 模型与 Provider

模型配置、Provider connection 和模型能力画像在后端统一管理。当前主要通过 OpenAI-compatible 契约吸收供应商差异，同时保留 LM Studio、Ollama、Cloudflare、火山等不同接入路径。

聊天、任务模型、Embedding、Rerank、评测和图像能力不必绑定同一个 Provider。

## 知识与评测

知识库负责文档、分块、向量索引、检索和 Markdown workspace；评测系统负责数据预检、运行、历史记录与报告导出。

知识库回答“系统依据什么资料”，评测回答“这些资料和模型组合实际表现如何”。

## Agent 与工具

Agent 不是把所有工具一次性丢给模型，而是一条受治理的任务执行链：

```text
AgentRun
→ Main Planner
→ direct action / governed delegation
→ Harness / Skill-private Runtime
→ Evidence / Artifact
→ Generate / Finalize
```

当前有三类执行方式：

- Main Agent 直接回答、检索或调用具体工具；
- `delegate_task` 把一个可独立验收的工作包交给 Generic SubAgent；
- 任务型 Skill 可以启动 Skill-owned SubAgent，在受限能力面内完成领域施工。

Main Planner 始终维护用户全局目标。SubAgent 只负责局部任务，不能递归创建新的 SubAgent，也不能绕过 Policy、审批、workspace 和 Evidence 合同。

Harness 管理 concrete tool 的候选、模型暴露、冻结调用、风险判断、执行与审计。`delegate_task` 是 Planner-only 委派协议，不是一个可以绕过 Harness 的万能工具。

## 微应用与集成

Mira 用微应用承载相对独立的专业能力，例如图像、语音、邮件、新闻、Computer Use、CodeGraph Studio 与文档处理。

微应用可以拥有自己的 UI 和 Runtime；当它们进入 Agent 主线时，必须通过明确的 Skill、工具或执行 Profile 接入，而不是把业务细节直接塞进 Main Planner。

企业微信、飞书等集成继续通过 Platform → Instance → AccessPoint → MicroAPP 的模型，把平台协议、连接配置与业务工作流分离。

## 当前边界

Mira 当前不是开放式多 Agent 平台，也不是通用 durable workflow engine。产品正在进入稳定迭代阶段，优先保护已经形成的运行时边界、审批恢复、Evidence 和真实产物交付。