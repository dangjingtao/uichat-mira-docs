---
title: Mira 是什么
description: 从聊天出发，让模型、知识、角色与工具在本地优先的个人 AI 工作台中协作。
group: 认识 Mira
order: 1
---

# Mira 是什么

> 从聊天出发，最终回到「接住你」。

UIChat Mira 是一个以桌面端为核心、强调本地优先与用户控制权的个人 AI 工作台。

它把模型、对话、角色、知识库、MCP 与工具放进同一个工作环境中。用户不必把自己的工作方式锁定在某一家模型服务里，也不必在多个互不相通的应用之间反复搬运上下文。

Mira 的入口仍然是最自然的聊天，但它想承接的不只是一次问答，而是人与 AI 长期协作时产生的知识、角色、工具、任务和关系上下文。


## 它解决什么问题

普通 AI 聊天工具往往把每次对话当成一个相对孤立的窗口。随着使用深入，用户会逐渐遇到几类问题：

- 模型分散在不同平台，本地模型与云端模型难以统一管理；
- 资料上传过很多次，但无法沉淀为可管理、可评测的知识库；
- 提示词、角色设定和工作习惯散落在各个聊天线程里；
- 工具越来越多，却缺少清晰的权限、审批和调用边界；
- AI 可以生成答案，却不一定能说明它用了什么资料、执行了什么操作；
- 用户与 AI 已经积累了大量上下文，产品却仍然把双方当作第一次见面。

UIChat Mira 试图把这些能力重新放回一个连续、可管理的个人工作空间中。

## 产品定位

::: html
<div style="margin: 28px 0; padding: 22px; border: 1px solid var(--hairline, #e6dfd8); border-radius: 16px; background: var(--surface-soft, #f5f0e8);">
  <div style="font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: var(--primary-active, #a9583e); margin-bottom: 14px;">
    UIChat Mira · Personal AI Workspace
  </div>
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
    <div style="padding: 16px; border-radius: 12px; background: var(--canvas, #faf9f5); border: 1px solid var(--hairline, #e6dfd8);">
      <strong style="display:block; margin-bottom:6px;">模型</strong>
      <span style="font-size:13px; color:var(--body-c,#3d3d3a);">本地与云端 Provider</span>
    </div>
    <div style="padding: 16px; border-radius: 12px; background: var(--canvas, #faf9f5); border: 1px solid var(--hairline, #e6dfd8);">
      <strong style="display:block; margin-bottom:6px;">知识</strong>
      <span style="font-size:13px; color:var(--body-c,#3d3d3a);">入库、检索与评测</span>
    </div>
    <div style="padding: 16px; border-radius: 12px; background: var(--canvas, #faf9f5); border: 1px solid var(--hairline, #e6dfd8);">
      <strong style="display:block; margin-bottom:6px;">角色</strong>
      <span style="font-size:13px; color:var(--body-c,#3d3d3a);">可复用提示词原型</span>
    </div>
    <div style="padding: 16px; border-radius: 12px; background: var(--canvas, #faf9f5); border: 1px solid var(--hairline, #e6dfd8);">
      <strong style="display:block; margin-bottom:6px;">工具</strong>
      <span style="font-size:13px; color:var(--body-c,#3d3d3a);">MCP、审批与证据</span>
    </div>
  </div>
  <div style="margin-top: 14px; padding: 18px; text-align:center; border-radius: 12px; background: var(--surface-card, #efe9de);">
    <strong style="font-size:18px;">聊天是入口，工作空间是承载</strong>
    <div style="margin-top:6px; font-size:13px; color:var(--body-c,#3d3d3a);">从一次问答出发，让模型、资料、角色和能力在同一个上下文中协作。</div>
  </div>
</div>
:::
Mira 当前首先是一个 **个人 AI 工作台**，而不是单纯的聊天壳。

![image-20260715024102723](https://assets.tomz.io/images/1784054462969-image-20260715024102723.webp)

*Mira 的入口仍然是聊天，但工作区同时承载模型、历史线程与 Agent 工作目录。*


这里的「工作台」包含四层含义：

### 一个统一的模型入口

用户可以在同一个应用中管理不同 Provider 与模型，并为聊天、Embedding、Rerank、评测、Agent 任务等用途配置合适的模型。

Mira 不要求所有能力都来自同一家厂商，也不把产品能力绑定在单一 API 协议上。

### 一个可以沉淀的知识空间

文件不只是临时附件。它们可以进入知识库，被分段、索引、检索，并通过评测工具检查实际效果。

知识库与角色保持分离：角色定义「AI 应该以什么方式回应」，知识库提供「回答时可以依据什么资料」。

### 一个可复用的角色工作台

角色不是聊天框里临时写下的一段系统提示词，而是可以持续编辑、预览、复制和复用的提示词原型。

用户可以分别定义角色的世界观、核心身份、适用场景、表达风格、示例对话与约束规则，而不是把所有内容塞进一段难以维护的长提示词。

### 一个受控的能力入口

Mira 可以通过 MCP、内置工具和 Harness 能力层连接外部能力。

但「能调用」不等于「可以随意调用」。工具是否暴露、是否需要审批、执行产生什么证据，应该由系统边界和用户授权共同决定。

## Mira 不是什么

### 它不是只换了界面的 ChatGPT 客户端

聊天是入口，但不是产品的全部。模型配置、知识库、角色、工具、评测与调试能力都属于同一个工作环境。

### 它不是替用户做完一切的黑盒智能体

Mira 重视自动化，也重视人工介入。

当 AI 需要读取资料、调用工具或执行可能产生副作用的操作时，用户应当能够看见、暂停、批准、拒绝或纠正。

### 它不是要求用户迁移全部数据的云端平台

Mira 以本地运行与本地数据为重要基础。云端模型和第三方能力可以被接入，但不应因此夺走用户对个人数据和工作环境的控制权。

### 它不是一套只服务开发者的 Agent 框架

底层架构可以很复杂，但产品界面最终要服务真实使用者。用户不需要理解 Planner、Harness 或向量索引的内部实现，才能完成一次对话、建立一个角色或使用自己的资料。

## 适合谁

Mira 更适合这些用户：

- 同时使用本地模型和多个云端模型；
- 希望长期整理个人资料、项目文档或专业知识；
- 需要反复使用不同角色、助手或工作方式；
- 希望 AI 能连接工具，但不愿把权限全部交给黑盒自动化；
- 在意数据位置、调用过程和系统可解释性；
- 希望把 AI 从一次性问答工具逐渐变成稳定的个人工作环境。

它未必适合只想偶尔打开网页问一个问题、并且不需要任何配置和长期沉淀的用户。

## 核心原则

### 本地优先，而不是本地限定

能在本地保存和运行的内容，优先留在用户自己的环境中；需要云端模型时，也允许用户自行选择 Provider。

### 多模型，而不是押注单一模型

不同任务需要不同模型。聊天、检索、重排、评测、Agent 任务和图像生成不必共享同一个默认模型。

### 能力可组合，权限不可含糊

角色、知识、工具和模型可以组合，但它们的职责不能混在一起。工具调用和副作用操作需要明确边界。

### 给结果，也给证据

当系统使用知识库或工具时，用户应该有机会看到引用、检索结果、调用链路和失败原因，而不是只得到一个看似肯定的答案。

### 从聊天出发，最终回到「接住你」

「接住你」不是让 AI 取代现实中的人，也不是让产品假装无所不能。

它意味着：当用户带着资料、问题、习惯和未完成的事情回来时，系统不应总让他从零开始；当自动化出现偏差时，用户能够重新拿回主导权；当一次任务结束后，有价值的内容可以留下来，成为下一次协作的起点。

## 当前能力地图

![image-20260715030126537](https://assets.tomz.io/images/1784055686785-image-20260715030126537.webp)

*设置页将模型、知识库、角色、评测、MCP 与工具组织在同一个产品中。*


| 能力 | 用户可以做什么 |
| --- | --- |
| 对话 | 创建和管理对话，选择模型完成日常问答与内容协作 |
| Provider 与模型 | 接入不同模型服务，为不同用途绑定默认模型 |
| 知识库 | 管理资料、查看分段、测试检索，并使用评测工具检查效果 |
| 角色 | 创建可复用角色，分别维护提示词字段并预览拼装结果 |
| Agent | 让系统围绕任务规划、调用工具、收集证据并生成结果 |
| MCP 与工具 | 接入外部能力，并通过权限与审批控制调用 |
| 微应用 | 在主工作台中承载相对独立的专用能力 |
| 调试与评测 | 查看知识检索、模型调用和任务执行的实际表现 |

具体能力会随着版本演进。本文描述产品方向，不等同于对所有规划功能的交付承诺。
