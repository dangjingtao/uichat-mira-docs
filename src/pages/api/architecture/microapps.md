---
title: MicroApps 与独立 Runtime
description: 区分微应用产品中心、Integration MicroAPP、独立 Studio、Tool 与 Skill Runtime。
group: 架构
order: 13
---

# MicroApps 与独立 Runtime

Mira 的「微应用」当前不是一种统一的后端对象，而是两个范围不同的概念。

## 两层含义

### MicroApps Hub

设置页里的 MicroApps Hub 是一个产品能力中心。它汇集：

- 企业集成业务工作流；
- 图像、语音、浏览器、新闻等独立 Studio；
- 文枢这样的领域 Runtime 与 Skill；
- GitHub、问策等连接和授权入口；
- 可以进入 Agent 的 Tool / MCP 能力。

它回答的是：

> 用户从哪里配置、调试或进入一项独立能力？

### Integration MicroAPP

代码中的严格 `MicroAppDefinition` 则窄得多。它属于企业集成域：一个外部 AccessPoint 收到标准化消息以后，通过 binding 选择业务工作流并返回平台可消费结果。

```text
Platform
→ Instance
→ AccessPoint
→ MicroApp Binding
→ MicroAppDefinition.invoke(...)
```

它回答的是：

> 这条外部入口收到请求以后，应该运行哪套业务逻辑？

因此：

```text
MicroApps Hub
≠ MicroAppDefinition Registry
≠ Studio HTTP Routes
≠ Agent Tool Registry
≠ Skill Runtime
```

## 判断一项能力时要看五层

看到一张微应用卡片，不能直接推断它已经完整可用。至少要分别确认：

1. **产品入口**：是否有可进入页面；
2. **共享定义**：是否有稳定 ID、runtime key 和配置 schema；
3. **领域 Runtime**：是否有真实 Service、任务、Artifact 与失败语义；
4. **Integration Invoke**：是否可以被外部 AccessPoint 统一调用；
5. **Agent Access**：是否通过明确 Tool 或 Skill 进入 Agent。

```text
有卡片 ≠ 有 Runtime
有 Definition ≠ Invoke 可用
有 Studio ≠ 已接入 Agent
有 HTTP API ≠ 可被企业入口调用
进入 Agent ≠ 可以绕过审批
```

## 当前严格 Registry

当前共享 Registry 有七种 Definition：

```text
knowledge_query
news_hub
image_generation
computer_use
tts
codegraph
evolving_knowledge
```

但目前只有 `knowledge_query` 完成统一 Integration Invoke，并且只服务企业微信智能机器人。

```text
WeCom Smart Robot
→ AccessPoint Binding
→ knowledge_query
→ Local Knowledge Base / RAG
→ Text Reply
```

另外六种 Definition 主要保留共享注册、桌面入口标识和稳定 Runtime Key。它们的领域能力可能已经真实存在，但还没有接入这条外部调用协议。

## 当前 Studio 与服务

| 能力 | 当前已经存在 | 当前没有自动成立 |
| --- | --- | --- |
| Image Generation | 任务、实时进度、Artifact、OpenAI-compatible Provider、ComfyUI Studio | 外部入口调用、Chat 自动生图、通用 Agent 工具 |
| Computer Use | Managed Browser、持久任务与 Evidence、模型执行器、审批、Browser Tools | 宿主桌面任意遥控、统一外部 MicroAPP Invoke |
| TTS | Windows、Piper、GPT-SoVITS、API Provider、参考音频与合成结果 | 所有语音包兼容、外部入口调用 |
| News Hub | 多来源拉取、TTL、缓存、查询、`news_search` | 实时公网搜索、外部入口调用 |
| CodeGraph | Studio、Managed Runtime、`codebase_explore`、原文核验 | 把原生命令直接交给 Planner、外部 MicroAPP Invoke |
| 智识进化库 | 后端 Service 与桌面 Studio | 已形成稳定生产合同、自动进入 Agent |

这里最重要的区别是：

> Studio Runtime 已经存在，不代表它已经被统一包装成企业集成 MicroAPP。

## 产品中心里的其他能力

### Mail Center

Mail Center 有 SMTP / IMAP 账号、同步、本地缓存、邮件列表和详情。Agent 通过独立的 `mail_query` 使用它。它不属于当前七种严格 Definition。

### 文枢

文枢当前是：

```text
Office Studio
+ Domain Runtime
+ Skill-private Runtime
```

DOCX、XLSX、PDF 与 PPTX 通过 Skill-owned Execution 使用受限 Runtime，而不是把一排 Office 原子操作塞进 Main Planner。

### GitHub

GitHub 页面负责 Device Flow、Installation 和仓库授权范围；实际协作由四个领域工具完成：

```text
github_repository
github_issue
github_pull_request
github_actions
```

### 问策

问策通过 WebBridge 调用用户已经登录的外部网页账号。外部专家只提供建议，Mira 保留是否采纳和继续执行的决定权。页面就绪也不等于已经建立独立 Provider 握手。

### Notion

Notion 当前属于部分实现：连接配置、Token 校验和部分 AccessPoint 能力已经存在，但完整 Agent Tool、Policy / Evidence、知识库同步和完整管理界面仍未全部完成。

## 如何进入 Agent

微应用不会因为注册或出现在页面上就自动进入 Main Planner。

能力进入 Agent 只有几条明确路径：

```text
Domain Service → Harness Tool
Domain Runtime → Skill Execution Profile
External MCP → Connected + Discovered + Agent Access + Approval
```

例如：

- News Hub 通过 `news_search`；
- Mail Center 通过 `mail_query`；
- GitHub 通过四个领域工具；
- Computer Use 通过 Managed Browser Tools；
- CodeGraph 通过 `codebase_explore`；
- 文枢通过 Skill-owned SubAgent 与 Private Runtime。

Integration Binding 不会扩大 Main Planner 的 Tool Exposure，Skill Manifest 也不会凭文字获得 Runtime 权限。

## 当前边界

Mira 当前不是一个所有应用都服从同一 Runtime 的「微应用操作系统」。更准确的状态是：

- 有一个宽产品能力中心；
- 有一套窄的企业集成 MicroAPP 协议；
- 有多项独立成熟度不同的 Studio 与领域 Runtime；
- 有明确 Tool / Skill 接入 Agent 的治理路径。

这不如一个统一概念听起来漂亮，却更符合真实代码，也更容易判断一项能力到底做到了哪里。

相关说明：

- [产品地图](/docs/about/product-map)
- [当前实现快照](/docs/status/current)
- [Harness 与工具边界](/docs/architecture/harness)
- [Mira Agent 当前运行真相](/docs/architecture/agent)
- [Mira 的微应用现在到底是什么](/blogs/engineering/mira-microapps-current-truth)