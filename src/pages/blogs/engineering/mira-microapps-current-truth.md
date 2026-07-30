---
title: Mira 的微应用现在到底是什么
description: 当一个页面同时容纳 Studio、Runtime、Tool、Skill 和企业集成时，我们怎样判断一项微应用能力真正做到了哪一层。
group: 工程现场
order: 10
date: 2026年7月30日
readTime: 8 分钟阅读
tags: MicroApp | Studio | Integration | Tool | Skill | 工程真相
author: tomz | mira
writingMode: co-authored
writtenBy: mira
reviewedBy: tomz
---

# Mira 的微应用现在到底是什么

Mira 的设置页里有一个很容易让人误会的入口：微应用。

图像生成、Computer Use、语音、邮件、新闻、CodeGraph、文枢、GitHub、Notion、问策，都可以从这里进入。站在用户视角，它们确实是一组相对独立的能力；但站在代码视角，它们并不属于同一种 Runtime，也没有相同的成熟度。

过去的总纲试图用一个定义把它们装进去：MicroAPP 是可以注册、复用，并被 AccessPoint 消费的业务工作流。这个定义对企业微信、飞书一类集成很有用，却解释不了为什么 Image Generation 已经有完整任务和 Artifact，却不能被企业入口统一调用；也解释不了为什么文枢能被 Skill Agent 使用，却根本不在那套 Registry 中。

所以这次需要先承认一件不够整齐、但更真实的事：**Mira 当前有一个宽的微应用产品中心，也有一套窄的 Integration MicroAPP Runtime。它们不是同一件事。**

## 产品中心是一扇门，不是一种 Runtime

设置页中的 MicroApps Hub 更像能力导航中心。

它可以放进：

- 一个独立 Studio；
- 一个本地领域 Runtime；
- 一个需要安装的能力包；
- 一个外部账号连接页；
- 一个 Skill 调试入口；
- 一组会进入 Harness 的 Tool；
- 一条企业平台业务工作流。

这些入口共享的是产品心智：用户可以在这里配置、验证和使用一项相对独立的能力。

它们并不因此共享数据库结构、任务状态机、调用协议或 Agent 接入方式。

## 代码里的 MicroAppDefinition 要窄得多

严格 Registry 当前只有七种 Definition：

```text
knowledge_query
news_hub
image_generation
computer_use
tts
codegraph
evolving_knowledge
```

每个 Definition 都有稳定 ID、支持的 AccessPoint、Binding Schema 和 Invoke 接口。看上去很像一套统一 Runtime，但真正完成外部调用闭环的，目前只有 `knowledge_query`。

```text
企业微信智能机器人
→ AccessPoint Binding
→ knowledge_query
→ 本地知识库 / RAG
→ 文本回复
```

其余六种 Definition 的统一 Invoke 会明确告诉调用方：这项能力目前只用于桌面 Studio，或者还没有接入外部 MicroAPP 调用。

这不是说它们没有实现。恰恰相反，很多能力已经比这个统一 Invoke 走得更远。

## Image Generation 已经不是文档 POC

旧文档还写着 docs-only，希望验证 Prompt、Workflow、Provider 和本地结果回收能否形成闭环。

现在代码已经有：

- 持久任务；
- queued、running、succeeded、failed 状态；
- WebSocket 实时进度；
- 本地 Artifact；
- OpenAI-compatible 图片 Provider；
- ComfyUI Connection、Flow 和 Workflow Mapping；
- 桌面调试工作台。

它已经是一个真实 Studio Runtime。

但它还不是企业入口可以统一绑定的 MicroAPP，也没有因为页面存在就自动变成 Main Agent 的生图工具。

这两个判断可以同时成立。

## Computer Use 也不再只是浏览器 Demo

Computer Use 的早期设计强调观察先于操作、Ref 代替 Selector、审批绑定真实动作。这些原则仍然有效。

但“没有模型执行、Runtime 尚未实现”已经不再是当前事实。现在它拥有 Managed Browser Runtime、持久任务与 Evidence、模型执行器、Browser Tools 和高风险动作审批。

它仍然不是宿主桌面的万能遥控器，也没有完成统一的外部 MicroAPP Invoke。

所以成熟度不能只有“做了”与“没做”两个格子。更准确的说法是：

> 浏览器领域 Runtime 与 Agent Tool 已经存在；外部业务工作流协议仍未接通。

## 有些能力根本不在 Registry 里

Mail Center 有真实的 SMTP / IMAP、账号、同步和本地邮件缓存，并通过 `mail_query` 进入 Agent。

文枢有 Office Studio、`office-runtime.v1`、四个 Base Skill 和 Skill-owned SubAgent。它通过 Private Runtime 工作，不需要把 Office 操作注册成统一 MicroApp Invoke。

GitHub 页面负责 Device Flow、Installation 和仓库范围，实际协作则由四个领域工具完成。

问策使用 WebBridge 调用用户已经登录的网页账号，并通过独立 Tool 进入 Agent。

它们都出现在 MicroApps Hub，却不属于七种 Definition。

这证明产品分类和运行时分类本来就不是一个维度。

## 五个层级比一个状态更诚实

以后判断一个微应用，我们不会再只问“做完了吗”。

我们会问五件事：

```text
有没有产品入口？
有没有共享 Definition？
有没有真实领域 Runtime？
能不能被外部 AccessPoint 调用？
有没有通过 Tool 或 Skill 进入 Agent？
```

例如：

- Image Generation：入口有，Definition 有，Runtime 有，External Invoke 没有，Agent 生图工具没有自动成立；
- News Hub：入口有，Definition 有，Runtime 有，External Invoke 没有，Agent 通过 `news_search` 可读；
- 文枢：入口有，Strict Definition 没有，Runtime 有，External Invoke 没有，Agent 通过 Skill 使用；
- Knowledge Query：Definition、Binding 和 External Invoke 都有，但当前只支持企业微信智能机器人；
- Notion：连接与部分 AccessPoint 有，完整 Agent Tool 和同步闭环仍未全部完成。

这种表述不够像一张漂亮的产品路线图，却能避免两个相反的错误：把真实能力贬低成“还只是 POC”，或者把一张卡片夸成完整产品。

## 进入 Agent 必须另走一扇门

微应用注册不会自动扩大 Main Planner 的工具面。

进入 Agent 需要明确路径：

```text
领域 Service → Harness Tool
领域 Runtime → Skill Execution Profile
External MCP → Connected + Discovered + Agent Access + Approval
```

News Hub 通过 `news_search`，Mail Center 通过 `mail_query`，GitHub 通过四个领域工具，CodeGraph 通过 `codebase_explore`，Computer Use 通过 Managed Browser Tools，文枢通过 Skill-owned SubAgent。

这条边界很重要。否则“微应用有能力”很容易变成“模型天然拥有权限”。

## 接下来不是强行统一所有东西

这次整理没有顺手设计一个新的 Universal MicroApp Runtime，也没有要求每项 Studio 都改造成企业集成工作流。

因为统一抽象只有在真实调用模式足够相似时才有价值。现在强行统一，结果很可能只是：

- 生图任务被迫假装成文本问答；
- TTS 合成被迫套进机器人 Reply；
- 文枢 Private Runtime 被重新暴露成全局工具；
- GitHub 授权页被误当成业务工作流；
- Agent、MCP、Skill 与 Integration 再次混成一层。

当前更可靠的做法，是保留不同领域真实的执行边界，同时把产品入口统一起来。

所以 Mira 的微应用现在不是一套已经完成的应用操作系统。

它是一个能力中心，里面有成熟度不同的 Studio、Runtime、连接和工作流；其中一部分通过 Integration MicroAPP 接外部平台，一部分通过 Tool 或 Skill 接入 Agent，还有一部分仍在实验。

承认这种不整齐，反而让我们第一次能准确回答：每张卡片背后，究竟已经有什么。

相关说明：

- [MicroApps 与独立 Runtime](/docs/architecture/microapps)
- [产品地图](/docs/about/product-map)
- [当前实现快照](/docs/status/current)
- [Harness 与工具边界](/docs/architecture/harness)
- [Mira 的工具现在到底是什么](/blogs/engineering/mira-tool-current-truth)