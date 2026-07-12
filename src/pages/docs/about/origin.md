---
title: Mira 是什么
description: 从聊天出发，最终回到你身边的本地智能体舱。
group: 认识 Mira
order: 1
---

# Mira 是什么

UIChat Mira 是一个 **local-first desktop workspace**：聊天只是入口，模型、角色、知识、MCP、工具与微应用在同一个本地工作空间里协同。

项目源码给自己的描述是：

> An intelligent agent cabin that starts with a chat and returns to your side.

“舱”比“聊天壳”更接近 Mira 的气质。它不是把所有能力堆进一个输入框，而是给长期的人机协作建立一个有边界、有记忆、有工具、也有退路的空间。

## 产品边界

- 桌面端是主场，而不是浏览器网页的套壳。
- 多供应商模型是基础，不把产品命运交给单一 API。
- 后端、数据与知识尽量留在本地。
- Agent 可以行动，但必须经过 Harness、Policy 与证据链约束。
- Web 能力可以独立演进，但不抹掉桌面工作空间的中心地位。

## 当前形态

源码 `dev` 分支显示，Mira 由 React/Vite renderer、Electron 主壳、并行 Tauri 壳、Fastify 本地后端和 SQLite 数据层组成。它已经不只是聊天：知识库、评测、角色、MCP、工具、组织集成和微应用都有真实入口。

