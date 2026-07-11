---
title: 角色、工具与微应用
description: 用共享运行时承载不同工作方式，而不是复制聊天页面。
group: 产品能力
order: 9
---

# 角色、工具与微应用

Mira 把“谁在工作”“能使用什么”和“以什么界面完成任务”拆成三个层次。

## 角色

Role 定义任务视角、行为约束与模型偏好。它让同一个工作区可以在研究、写作、开发或运营之间切换，同时避免把所有规则塞进一个全局提示词。

## 工具

工具通过 Harness 注册和暴露。模型看到的是当前上下文允许的工具集合，真正执行时必须解析到具体 toolId，并经过 Normalize、Policy 与 Approval。

## 微应用

源码现有 Image Generation、Computer Use、Mail Center、News Hub、TTS 和 CodeGraph Studio 页面及后端路由。微应用提供专门界面，但复用身份、Provider、工具和数据基础设施。

## 集成

Integration 采用 Platform → Instance → AccessPoint → MicroAPP 的分层。平台协议与业务工作流被分开，企业微信、飞书等渠道可以接入，而不必把渠道逻辑写进每个应用。