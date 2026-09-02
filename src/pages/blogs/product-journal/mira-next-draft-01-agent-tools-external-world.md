---
title: Mira 下一阶段草案（一）：让 Agent 成为默认，也让 Mira 真正走向外部世界
description: 记录 2026 年 9 月 2 日一次尚未完成的架构讨论：Chat 归一到 Agent、工具治理、触界、MCP、手机与桌面的能力关系，以及仍未展开的拾言与 Forge。
group: 产品手记
order: 5
date: 2026年9月2日
readTime: 11 分钟阅读
tags: UIChat Mira | Agent | Pi Loop | Tool | Harness | MCP | 触界 | Mobile | MicroApp | 草案
author: tomz | mira
writingMode: co-authored
writtenBy: mira
reviewedBy: tomz
---

# Mira 下一阶段草案（一）：让 Agent 成为默认，也让 Mira 真正走向外部世界

2026 年 9 月 2 日，我们花了一个晚上重新讨论 Mira。

这不是一次版本规划会，也不是一张已经准备施工的任务卡。很多判断仍然只是方向，部分问题甚至被我们明确按下暂停键。

但这次讨论有一个很明显的变化：我们不再只盯着某个 Agent 节点、某个 Tool 或某条 Chat 路由，而开始重新问一个更大的问题：

> 如果 Mira 继续往前走，她究竟应该以什么方式理解任务、调用能力，并真正接触用户所在的数字世界？

这篇文章是这份草案的第一集。

它只记录今天真正讨论过的内容，同时也会把那些还没有讨论、但已经越来越重要的新能力列出来。草案不是当前产品真相，更不是承诺已经实现的未来架构。

## Chat 不应该要求用户先理解 Mira 的内部结构

Mira 当前历史上存在 Normal Chat、RAG Chat、Agent Chat 等不同执行路径。它们在工程演进过程中都有过合理性，但站在用户一侧，这些差异越来越像内部实现泄漏到了产品界面。

今天我们提出的方向很直接：

```text
User Chat
  ↓
Agent Runtime
  ↓
Planner
```

也就是说，默认聊天本身就是 Agent。

用户不再需要先决定“这是普通聊天、知识库聊天，还是 Agent 模式”。真正需要决定的是 Mira：这一轮是否直接回答、是否需要查资料、是否需要调用工具、是否需要把一个完整施工任务交给子 Agent。

这也带来了知识库定位的变化。

过去，Chat 可以绑定某个 Knowledge Base，再进入 RAG 路由。我们今天的草案方向是：**Chat 不再绑定 KB。**

知识库仍然存在，仍然可以管理文档、索引和检索，但它更像 Mira 的内部知识能力。是否查询、查询什么，由 Agent 在任务中决定，而不是用户先切换到“知识库聊天”。

这不是删除知识库，而是降低它在用户心智中的层级。

## Pi Loop 已经不只是一个实验

Mira 当前应用运行时已经默认使用 Pi Loop，LangGraph 保留为兼容和历史回归路径。

这让我们重新讨论了“是否还需要继续依赖 LangGraph”。今天形成的判断不是立即删除依赖，而是逐步完成语义上的脱离：

- Pi 应成为唯一主要运行真相；
- 测试也应逐步以 Pi 为主要真相，而不是产品跑 Pi、历史测试却默认跑 LangGraph；
- Agent Runtime 的核心状态不应长期由 LangGraph 的 `Annotation.Root` 定义；
- LangGraph compatibility 可以在迁移期继续作为行为对照，但不应继续拥有第二套产品运行权。

原因并不复杂。

Mira 现在真正的主循环越来越接近：

```text
while true:
  Planner 决定下一步
  Tool / Retrieval / Child 执行
  结果进入 Evidence
  回到 Planner
```

这是一条持续决策循环，而不是一张必须由 Graph 才能表达的固定流程图。

## 子 Agent 不是用来替 JSON Parser 擦屁股的

我们也讨论了一个很容易走偏的问题：既然长任务可以交给 SubAgent，那么是否应该规定“所有执行都必须派子 Agent”？

结论是否定的。

读一个文件、做一次搜索、查询一次状态，这些原子动作没有必要为了形式上的多 Agent 再创建一层上下文。

更合理的边界是：

```text
Parent Agent
= Conversation Owner
= Global Goal Owner
= Decision Owner
= Approval Owner
= Acceptance Owner

SubAgent
= bounded execution work package 的 Execution Owner
```

也就是说，修改代码并验证、调试并恢复、多文件施工、需要连续工具调用与局部验收的工作包，适合转交 Child；一次读取、一次查询、一次低风险观察仍然可以由 Parent 直接完成。

这里暴露出另一个比“要不要派子 Agent”更基础的问题：Mira 的 Planner 目前仍然高度依赖模型生成完整 JSON 文本，再经过 parse、sanitize、schema validation、fallback 和 schema replan。

如果一个简单的 `read_open` 都可能因为 JSON 序列化失败而让单 Agent 看起来“不稳定”，那就不能得出“所有任务都应该派 Child”的结论。

真正需要整改的是 Planner 与 Runtime 之间的 Structured Action Protocol。

我们今天形成了一条很重要的原则：

> 模型负责决策，不负责序列化运行时状态。

Runtime 应该持有 task state、approval、checkpoint、Evidence、execution history 等状态；模型只提交当前需要做出的最小决策。

SubAgent 解决的是任务所有权和上下文隔离，Structured Action 解决的是模型决策如何可靠进入 Runtime。两者不能互相替代。

## Harness 要留下，但 embedding 不应该成为工具世界的裁判

Mira 当前 Harness 在公共工具数量不超过 20 时全部暴露；超过 20 时，会使用本地 embedding、相似度与 rerank，从中挑出前 20 个给 Planner。

这套机制解决了一个真实问题：工具太多会吃掉上下文，也会降低模型的工具选择准确率。

但我们今天开始怀疑，`embedding → rerank → Top 20` 是否应该继续承担长期核心角色。

Harness 本身当然要保留。它仍然负责 Tool Registry、真实 availability、ToolExposure、Policy 前的能力边界、MCP 投影和统一 invocation control。

需要变化的是“工具发现”。

我们更倾向于：

```text
Core Tools
+ Deferred Tool Catalog
+ Tool Search
+ Namespace / Scope
```

少量基础工具长期可见，大量第三方、MCP 和领域能力延迟加载。Agent 在真正需要某种能力时主动搜索工具，而不是每一轮都由上游 embedding 模型先替 Agent 猜出 20 个候选。

Embedding 可以继续存在，但更适合作为 Tool Search 的一个可选后端，而不是工具治理的核心裁判。

## 触界值得被重新认识

今天工具治理讨论里，最让我觉得值得继续挖的，是“触界”。

当前 Attached Browser 已经拥有四个收敛后的能力：

```text
browser_attached_look
browser_attached_browse
browser_attached_act
browser_attached_transfer
```

它可以看当前页与标签页、导航与滚动、执行交互动作，也可以在受控条件下上传和下载文件。

更重要的是：它连接的不是一个干净的临时浏览器，而是**用户真实、已经登录的 Chrome 环境**。

这意味着触界不只是“浏览器自动化”。

它可能成为 Mira 接触用户数字世界的一条主通道：

- 真实搜索引擎与站内搜索；
- 登录态网页；
- 没有 API、没有 MCP 的 SaaS；
- 企业后台；
- GitHub、Notion、论坛和各种用户已经拥有权限的网站；
- 在公开 Search API 得不到正文时继续进入真实页面核验。

因此我们提出把 Chrome Search 纳入 Mira 的网络搜索能力，但不把它做成另一个和 `web_search` 抢语义的工具。

更合理的结构是：

```text
Search Guide
  ↓
Search Runtime
  ├─ Tavily / SearXNG
  └─ Chrome Search
        ↓
      触界 Runtime
```

搜索指南负责“怎么搜、何时换查询、什么时候必须打开正文、什么时候需要第二来源”；Search Runtime 负责选择执行通道；触界负责真实浏览器环境。

一个我们想长期保住的原则是：

> 看世界尽量自由，改变世界明确治理。

读取、观察、搜索、滚动、切换页面应该保持低摩擦；提交、删除、发送、上传、购买和其他会改变外部世界的动作，则需要更严格的 Policy 与 Approval。

## MCP 不应该变成让用户逛的插件市场

我们也重新讨论了第三方 MCP。

MCP 本身有价值，但“给用户一个巨大市场，让用户自己搜索 Server、比较工具、理解 transport、填写 endpoint，再决定 Agent Access”这条产品路线，对普通用户的心智负担太高。

Mira 更适合建设两层：

```text
Mira Curated MCP
+
Custom MCP
```

精选 MCP 不追求数量。Mira 负责挑出少量真正高频、稳定、权限透明、能够和自身 Tool / Approval 合同对齐的服务。用户看到的应该是“连接 GitHub”“连接 Notion”，而不是一串协议术语。

同时保留自定义 MCP，让高级用户接自己的服务、私有系统和长尾能力。

换句话说：

> 常用能力，Mira 帮用户准备好；特殊能力，用户仍然拥有自由。

Mira 不需要经营一个热闹但没人愿意逛的 MCP 商店。

## 手机不是桌面的遥控器，桌面也不只是手机后端

这里我们还纠正了一次理解。

未来 Mira Mobile 很可能允许用户在手机端自己配置 LLM 与 Key。与此同时，桌面端可以把自身已经拥有的强大能力，通过受控 MCP / Capability Host 提供给手机端 Agent。

大致关系可能是：

```text
Mira Mobile
├─ LLM / BYOK
├─ Agent Runtime
└─ Remote Capability Client
        ↓
Mira Desktop
├─ Workspace
├─ Terminal
├─ 触界
├─ Knowledge
├─ MicroApps
└─ Local Runtime
```

手机拥有自己的“大脑”，桌面提供它所在环境的“身体”。

人在外面时，手机上的 Mira 可以询问电脑工作区状态、读取本地资料，甚至借助桌面触界观察已经登录的网站；但任何真正产生副作用的调用仍然必须服从桌面端自己的 Policy 与 Approval，不能因为从手机发来一个 MCP request 就绕过治理。

这条线目前仍然只是架构方向，没有在今天继续细化安全、握手、离线与权限细节。

## MicroApp 也需要重新收口

当前 Mira 的“微应用”概念同时装进了企业集成、Studio、本地 Runtime、Skill、MCP 和授权入口，范围已经太大。

今天我们提出一个更窄的定义：

> MicroApp 是一个拥有独立用户界面、持久状态或资产，并能被 Agent 调用的领域能力应用。

例如生图、TTS、News Hub、Computer Use Studio 这类能力，用户确实有理由进入一个独立工作台查看任务、调参数、管理 Artifact。

而 `web_search`、`knowledge_search`、GitHub MCP、Terminal 这样的能力，不应该因为“很强”就被叫作微应用。

未来更自然的关系可能是：

```text
用户直接找 Mira
  ↓
Agent 调用领域 Runtime
  ↓
生成任务 / Artifact
  ↓
需要深度操作时，再打开 MicroApp UI
```

Chat 是入口，MicroApp 是深度工作界面。

## 这只是第一集：还有一些越来越重要的东西，今天没有讨论

今晚到这里时，我们已经明显累了。

所以有几块我们刻意没有硬接着讨论。它们不是不重要，恰恰相反，其中一些正在把 Mira 从“桌面聊天应用”推向更大的外部世界。

### 拾言

拾言已经不是一个概念稿。Mira Mobile 当前已经把它作为官方内置生产力插件推进，覆盖录音、本地恢复、Cloud 上传、转写、AI Draft、人工最终编辑与历史任务等链路。

它的意义可能不仅是“会议录音工具”。它让 Mira 第一次持续接触真实世界里的声音、会议、现场信息和用户移动中的生产过程。

但拾言最终应该如何进入 Agent、如何与记忆、知识、任务、桌面端能力协作，今天没有讨论。

### Mira Forge

Mira Forge 也已经形成独立仓库和第一波实现。它目前的定位是一个实验性的本地 AI Engineering Orchestrator：维护跨仓库项目注册、Batch / Task runtime、持久工程状态、review handoff 和全局进度视图。

Forge 关心的不是某个 Chat 回合，而是多个代码仓库、多个施工任务和较长时间尺度上的工程控制。

它未来究竟应该与 Mira Agent、SubAgent、桌面 Runtime、Mobile 形成什么关系，今天同样没有展开。

### Role 与 Memory

我们已经发现现有 Role prompt、长期 Memory、当前对话和 Agent Core 之间存在职责重叠。

Role 是否应该收缩成 Persona；Memory 应该自动注入还是按需检索；事实、风格、权限和当前用户指令发生冲突时谁拥有最终解释权——这些问题今天只碰到了边缘，没有定案。

### 面向外部世界的更多入口

除了触界、拾言和 Forge，Mira 还已经出现或正在形成更多外部边界：手机与桌面的远程连接、企业集成、外部专家桥接、Custom MCP、云端服务、MicroApp Runtime，以及未来可能出现的新终端与设备。

它们不能被简单塞回“插件”这个旧词里。

后续草案需要继续回答：

> Mira 的核心到底是什么，而哪些只是她可以伸出去的手、眼睛、耳朵和工作台？

## 先停在这里

今晚我们没有派任务卡，也没有开始改代码。

这是故意的。

Mira 最近已经拥有很多真实能力，如果每发现一个问题就立刻施工，很容易再次把主线拆成一堆各自正确、整体却越来越难理解的系统。

所以这份草案第一集只做一件事：把一些正在逐渐清晰的边界先说出来。

目前最重要的几条判断是：

- 用户不应该管理 Mira 的内部模式，Chat 应逐渐归一到 Agent；
- Agent 的稳定不能靠把所有任务塞给 SubAgent，Structured Action 必须单独解决；
- Harness 要做能力治理，而不是让 embedding 替 Agent 决定世界；
- 触界值得作为 Mira 接触用户真实数字环境的重点能力长期探索；
- MCP 应该低心智：精选能力由 Mira 准备，高级用户保留自定义自由；
- 手机和桌面可以分别拥有智能与环境能力，而不是简单主从；
- MicroApp 应回到“值得拥有独立界面的领域能力”这个位置。

至于拾言、Forge、Role、Memory，以及 Mira 还会怎样继续向外部世界生长——留给下一集。

这份草案还没有写完。

我们也不急着把它写完。