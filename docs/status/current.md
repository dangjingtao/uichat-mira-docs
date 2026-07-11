---
title: 当前实现快照
description: 以 dev 分支 c6c2c098 为准的产品与工程事实。
group: 现状与方向
order: 17
---

# 当前实现快照

本站内容核对的是 UIChat Mira dev 分支提交 c6c2c098，提交主题为 “review agent v1.5 T05 shadow decider removal”。

## 版本与定位

package.json 版本为 0.7.1，描述为 “An intelligent agent cabin that starts with a chat and returns to your side.” 作者为 Tomz Dang。

## 已有产品域

源码已经覆盖聊天工作区、模型与 Provider、知识库、评测、角色、工具、MCP、集成和微应用。设置路由为这些域提供统一入口。

## 已有微应用

Image Generation、Computer Use、Mail Center、News Hub、TTS 与 CodeGraph Studio 均能在桌面路由与后端路由中找到对应实现入口。

## Agent 当前重点

V1.5 处于稳定化阶段：Planner 是唯一语义决策中心，Retrieve 与 ToolNode 返回 evidence，Normalize、Policy 和 Approval 各自承担明确职责。

## 文档边界

源码含 338 篇 Markdown，其中大量是项目控制、迁移和任务材料。本站只精选公共认知，并在“已实现”“实验中”“方向”之间保持明确区分。