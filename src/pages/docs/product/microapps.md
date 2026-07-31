---
title: 微应用中心
description: MicroApps Hub 的入口类型、能力状态、Runtime 关系与 Agent 接入边界。
group: 产品能力
order: 15
---

# 微应用中心

## 文档范围

本页说明设置页“微应用”入口中包含哪些能力、各能力通过什么 Runtime 工作，以及如何判断它是否可以被 Agent 或外部平台调用。

MicroApps Hub 是产品能力中心，不是一套统一后端 Runtime。

```text
MicroApps Hub
!= MicroAppDefinition Registry
!= Studio HTTP Routes
!= Harness Tool Registry
!= Skill Runtime
```

![微应用总览](/images/guide/microapps-overview.svg)

## 五层状态

判断一项微应用能力时，需要分别确认：

| 层级 | 判断问题 |
| --- | --- |
| 产品入口 | 是否有可进入和配置的页面 |
| Shared Definition | 是否有稳定 ID、Runtime Key 和配置 Schema |
| Domain Runtime | 是否有真实 Service、Task、Artifact 和失败语义 |
| Integration Invoke | 是否可被外部 AccessPoint 统一调用 |
| Agent Access | 是否通过明确 Tool 或 Skill 进入 Agent |

```text
有卡片 ≠ Runtime Ready
有 Definition ≠ Invoke 可用
有 Studio ≠ Agent 可调用
连接成功 ≠ 已获得权限
```

## 当前能力矩阵

| 能力 | 产品入口 | 领域 Runtime | Agent / 外部入口 | 当前状态摘要 |
| --- | --- | --- | --- | --- |
| Default Knowledge Query | 企业集成配置 | 本地知识库 / RAG | 企业微信智能机器人 | 当前唯一完成统一 Integration Invoke 的 MicroAPP |
| News Hub | 资讯聚合台 | 来源抓取、TTL、去重、缓存和查询 | `news_search` | 已有真实 Service；不等于实时公网搜索 |
| Image Generation | Image Generation Studio | Provider Task、进度、Artifact、ComfyUI | 当前不自动进入 Chat / Agent | Studio 可用性取决于 Provider 或 ComfyUI 配置 |
| Computer Use | Computer Use Studio | Managed Browser、Task、Evidence、Approval | Managed Browser Tools | 当前控制浏览器，不是宿主桌面万能遥控 |
| TTS | TTS Studio | Windows、Piper、GPT-SoVITS、API Provider | 当前不统一投影为 Agent Tool | Provider 和本地 Runtime 需分别验证 |
| CodeGraph | CodeGraph Studio | Managed CodeGraph Runtime | `codebase_explore` | Planner 只看受控 Wrapper，不看原生命令 |
| 智识进化库 | 独立 Studio | 可选 Service 与本地数据 | 不自动进入 Agent | 实验能力，合同仍在演进 |
| Mail Center | 邮件中心 | SMTP / IMAP、同步与本地缓存 | `mail_query` | 不属于 strict MicroAppDefinition Registry |
| 文枢 | Office Studio | Office Domain Runtime / Skill-private Runtime | Skill-owned Execution | 不把 Office 原子操作暴露给 Main Planner |
| GitHub | GitHub 连接页 | Auth Context / GitHub Adapter | 四个 GitHub 领域工具 | 页面负责连接，Tool Pack 负责协作 |
| 问策 | External Expert 页面 | WebBridge / Provider Adapter | External Expert Tool | 外部专家提供建议，不取得 Mira 执行权 |
| Notion | Notion 页面 | 连接、Token 校验和部分 AccessPoint | 完整 Tool 投影尚未完成 | 部分实现 |

## Studio 运行模式

独立 Studio 通常遵循：

```text
User Configuration
→ Domain Service
→ Task / Job
→ Runtime or Provider
→ Status / Evidence / Artifact
→ Result Presentation
```

Studio 页面负责展示：

- 配置是否完整；
- Runtime 是否 Ready；
- 请求参数；
- 任务状态；
- 结果或 Artifact；
- 失败原因；
- 可执行的恢复动作。

页面不能用静态“已启用”状态代替真实 Runtime 检查。

## Strict MicroAppDefinition

当前严格 Registry 包含：

```text
knowledge_query
news_hub
image_generation
computer_use
tts
codegraph
evolving_knowledge
```

其中只有 `knowledge_query` 完成统一外部调用闭环：

```text
WeCom Smart Robot
→ AccessPoint Binding
→ knowledge_query
→ Local Knowledge Base / RAG
→ Text Reply
```

其他 Definition 主要承担共享注册、桌面入口标识和稳定 Runtime Key。它们的真实能力运行在各自 Domain Service 中，不代表已接入统一 Integration Invoke。

## 与 Agent 的关系

### 通过 Tool

News、Mail、Browser、GitHub、CodeGraph 和 External Expert 等能力通过独立 concrete tools 进入 Harness。

进入 Agent 前需要满足：

```text
Registered
→ Public Surface
→ Available
→ Tool Exposure
→ Concrete Invocation
→ Policy / Approval
```

### 通过 Skill

文枢等领域能力通过 Skill Context、Execution Profile、Skill-owned SubAgent 和可选私有 Runtime 工作。

Skill-private Runtime：

- 不自动进入 Main Planner ToolExposure；
- 不绕过 Parent 审批和 Evidence；
- 只在对应任务边界中使用。

### 不自动进入 Agent

存在 Studio 或 HTTP API，不代表 Main Planner 可以调用。Image Generation 和 TTS 等能力需要独立的 Tool / Skill 产品合同后才能进入 Agent 公共面。

## 当前边界

MicroApps Hub 当前不保证：

- 所有卡片均可用；
- 所有能力共享统一任务模型；
- 所有 Studio 可以被外部平台调用；
- 所有 Runtime 自动安装；
- 所有 Provider 已验证兼容；
- 连接完成后自动获得 Agent Access；
- 实验能力具备生产稳定性。

## 验证清单

使用一项微应用前确认：

1. 页面是否只是入口或占位；
2. 必要 Provider、连接或本地 Runtime 是否 Ready；
3. Task 是否进入真实状态机；
4. 结果和 Artifact 是否可访问；
5. 失败是否提供可诊断信息；
6. Agent 接入来自哪个 Tool 或 Skill；
7. 外部调用是否存在明确 Binding；
8. 高风险动作是否经过审批。

## 相关文档

- [MicroApps 与独立 Runtime](/docs/architecture/microapps)
- [企业集成](/docs/product/enterprise-integrations)
- [Harness 与工具边界](/docs/architecture/harness)
- [工具工作台](/docs/configuration/tools)
- [当前实现快照](/docs/status/current)
