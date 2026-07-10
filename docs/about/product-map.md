---
title: 产品地图
description: 从聊天工作区到知识、工具与微应用。
group: 认识 Mira
order: 3
---

# 产品地图

Mira 当前可以按五个产品域理解。

## 对话工作区

线程、消息、角色、附件、上下文摘要与 Agent 执行轨迹共同组成聊天主线。对话不是孤立记录，而是工作状态的容器。

## 模型与 Provider

模型配置、Provider connection 和模型能力画像在后端统一管理。当前默认以 OpenAI-compatible 契约吸收供应商差异，同时保留 LM Studio、Ollama、Cloudflare 与火山等适配空间。

## 知识与评测

知识库包含文档、分块、向量索引和 Markdown workspace 模式；评测系统分为 Workbench 与 Center，负责数据预检、运行、历史记录和报告导出。

## Agent 与工具

Planner 决定下一步；Normalize 冻结工具调用；Policy 处理风险；ToolNode 只执行通过 Harness 的调用；Evidence 把执行结果还给 Planner。

## 微应用与集成

源码已有 Image Generation、Computer Use、Mail Center、News Hub、TTS 与 CodeGraph Studio 页面和后端路由。企业微信、飞书等集成则通过 Platform → Instance → AccessPoint → MicroAPP 的模型保持平台协议与业务工作流分离。

