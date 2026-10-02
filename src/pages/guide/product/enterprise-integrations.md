---
title: 企业集成
description: 外部协作平台的 Instance、AccessPoint、MicroApp Binding 和运行边界。
group: 产品能力
order: 16
---

# 企业集成

## 文档范围

本页说明 Mira 如何连接企业协作平台，以及平台实例、接入点和业务工作流之间的关系。

当前已实现的平台重点是企业微信。飞书、钉钉等入口存在于产品规划或占位中，不应被描述为已完整交付。

![企业集成概览](/images/guide/enterprise-overview.svg)

## 核心模型

```text
Platform
→ Instance
→ AccessPoint / Capability
→ MicroApp Binding
→ Business Runtime
→ Reply or Notification
```

| 对象 | 说明 |
| --- | --- |
| Platform | 企业微信、飞书、钉钉等平台类型 |
| Instance | 某个组织或账号的连接实例 |
| AccessPoint / Capability | 智能机器人、Webhook 等具体入口 |
| MicroApp Binding | 入口绑定的业务工作流和配置 |
| Runtime | 实际执行知识问答、通知或其他业务逻辑的 Service |

平台连接和业务能力必须分开。配置企业微信不代表所有 MicroApp、Tool 或 Agent 能力都会自动暴露。

## 当前平台状态

| 平台 | 当前状态 | 说明 |
| --- | --- | --- |
| 企业微信 | Implemented | 支持实例、Capability、智能机器人和相关运行状态 |
| 飞书 | Planned / Placeholder | 不代表完整连接、事件处理和消息回复已实现 |
| 钉钉 | Planned / Placeholder | 不代表完整连接、事件处理和消息回复已实现 |

具体状态以当前 UI、API 和运行验证为准。

## 企业微信入口

### 智能机器人

智能机器人用于接收企业微信消息并返回处理结果。

当前真实链路：

```text
WeCom Message
→ Smart Robot Capability
→ MicroApp Binding
→ knowledge_query
→ Local Knowledge Base / RAG
→ Text Reply
```

当前约束：

- Capability 和 Binding 都需要启用；
- AccessPoint 类型必须被目标 MicroApp 支持；
- Binding 配置保存目标 Knowledge Base 等入口级参数；
- 空问题可以返回 `no_reply`；
- 当前不会自动把 Main Agent、全部 Tool 或 Skill 注入机器人请求。

### Webhook 机器人

Webhook 用于 Mira 主动向企业微信群发送通知。

```text
Mira Task / Notification
→ WeCom Webhook
→ Group Message
```

Webhook 与智能机器人方向不同：

| 入口 | 数据方向 | 主要用途 |
| --- | --- | --- |
| 智能机器人 | 平台 → Mira → 平台 | 接收问题并回复 |
| Webhook | Mira → 平台 | 主动通知和推送 |

二者不应共享模糊的“机器人已配置”状态。

## Instance 管理

一个 Platform 可以存在一个或多个 Instance。Instance 至少需要记录：

- 名称；
- Platform 类型；
- 外部 Tenant 或组织标识；
- 启用状态；
- 默认状态；
- 平台级配置；
- 创建和更新时间；
- 关联 Capability。

Secret 只能由后端凭据边界持有，不进入模型参数、普通 Evidence 或公开日志。

## Capability 管理

Capability 表示 Instance 下的具体接入方式。当前可以包含：

- 类型；
- 名称；
- 启用状态；
- Knowledge Base 引用；
- 配置与 Runtime 状态；
- 默认标记；
- MicroApp Binding。

Capability 存在不等于 Runtime 已启动。页面应分别显示配置、启用、连接和错误状态。

## MicroApp Binding

一个 Capability 当前绑定一个 MicroApp Definition。

绑定时需要验证：

1. Capability 存在；
2. MicroApp Definition 存在并启用；
3. Capability 类型位于 `supportedAccessPoints`；
4. Binding 配置符合 Schema；
5. 对应 Runtime 可用。

Binding 配置属于具体 AccessPoint，不应写回全局 Definition。

## 运行状态

企业微信智能机器人需要提供可查询状态，例如：

- 是否启用；
- 是否已启动；
- Bot ID；
- 是否存在 Secret；
- 最近连接时间；
- 最近错误。

启动失败必须保留错误原因，不能仅把按钮恢复成“未启动”。

## 与 Agent 和 Tool 的边界

企业集成负责平台连接和消息入口，不直接等于 Agent Tool。

```text
Integration Connection
!= Agent Access
!= Tool Exposure
!= Approval
```

外部消息是否进入 Agent，需要独立定义上下文、工具面、审批和输出合同。当前 `knowledge_query` 主要承接知识问答，不自动获得 Main Agent 的全部执行能力。

## 当前边界

- 当前主要落地平台是企业微信；
- 当前统一 Integration MicroAPP Invoke 只覆盖 `knowledge_query`；
- 飞书和钉钉不能作为已实现能力宣传；
- 平台配置成功不等于所有 Capability Ready；
- Capability Ready 不等于任意业务工作流可用；
- 外部入口不自动继承用户桌面会话、ToolExposure 或私有 Skill Runtime；
- Webhook 主动发送属于远端写操作，应保留明确目标和审批边界。

## 验证清单

1. Instance 是否属于正确 Platform；
2. Secret 是否只保存在后端；
3. Capability 类型和配置是否有效；
4. Binding 是否指向兼容 MicroApp；
5. Runtime 状态是否可查询；
6. 入站消息是否得到预期回复或 `no_reply`；
7. 失败是否记录可诊断错误；
8. 主动推送是否显示目标和内容摘要；
9. 连接是否被错误解释为 Agent 权限。

## 相关文档

- [微应用中心](/docs/product/microapps)
- [MicroApps 与独立 Runtime](/docs/architecture/microapps)
- [MCP](/docs/configuration/mcp)
- [可控自主原则](/docs/philosophy/controlled-agency)
