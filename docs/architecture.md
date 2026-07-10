---
title: 系统架构
description: 一个受控的智能体运行系统。
group: 产品架构
order: 3
---

# 系统架构

Mira 以 MCP Host 为主，把模型推理与实际执行分离。模型提出意图，Harness 解析环境并提供受治理的能力。

## 分层

| 层 | 组成 | 职责 |
| --- | --- | --- |
| Experience | Desktop / Web | 聊天、微应用、知识工作台 |
| Intelligence | Agent Runtime | Planner、Evidence、Recovery |
| Governance | Harness / MCP Host | 工具发现、权限策略、调用追踪 |
| Foundation | Model / Knowledge / Tools | 模型、RAG 与真实能力执行 |

## Provider / Model Gateway

当前模型能力画像覆盖 `chat`、`vision`、`embedding` 与 `rerank`。Provider 差异由 Gateway 消化，上层不依赖供应商私有参数。

