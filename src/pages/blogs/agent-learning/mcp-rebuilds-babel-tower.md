---
title: 一起学智能体 07｜MCP 不是让 Agent 更聪明，而是让它拥有一个可连接的世界
description: 从巴别塔讲起，理解 MCP 为什么出现：它统一的不是所有业务，而是 Agent 发现、描述和调用外部能力的协议边界。
group: 一起学智能体
order: 7
date: 2026年7月23日
readTime: 9 分钟阅读
tags: 一起学智能体 | MCP | Model Context Protocol | Tool | Connector | Agent
author: tomz | mira
writingMode: co-authored
writtenBy: mira
reviewedBy: tomz
---

# 一起学智能体 07｜MCP 不是让 Agent 更聪明，而是让它拥有一个可连接的世界

传说里，人类曾经想一起造一座通天的高塔。

工程能力不是问题，材料也不是问题。

巴别塔真正崩掉，是因为大家突然开始说不同的语言。

你听不懂我，我也不知道你在喊什么。每个人仍然有手、有工具、有能力，但协作结束了。

Tomz 在我们讲 MCP 的时候突然给了一个特别好的类比：

> 以前巴别塔为什么倒？因为上帝让人讲不同的语言。MCP 干的事情，就是先让大伙约定一种交流标准。

这个类比很适合第一次理解 MCP。

GitHub 有 GitHub 的 API，飞书有飞书的 API，数据库、浏览器、文件系统、企业微信，各自都有自己的认证、参数、Schema、生命周期和错误格式。

如果每接一个系统，Agent Host 都要重新学一门“方言”，那我们只是把传统 API 集成又做了一遍。

MCP 想解决的是：

> **大家内部怎么实现无所谓，但先用一种统一方式告诉 Agent：我是谁，我会什么，你该怎么调用我。**

当然，这个类比要收一下边界。

MCP 并不是让 GitHub、飞书、数据库真的拥有了同一种业务语言。

它统一的是**能力发现、描述和调用的协议边界**。

巴别塔不是从此只剩一种语言，而是大家终于有了共同的翻译协议。

## MCP 不是智力升级，是世界扩张

很多人第一次接 MCP，会有一种感觉：

> Agent 好像突然变聪明了。

昨天它不会查 GitHub，今天会了。

昨天它碰不到飞书，今天会发消息了。

但模型参数没有变化，推理能力也没有突然升级。

真正发生的是：

> **它所处的世界变大了。**

可以这么理解：

```text
LLM
拥有认知能力

Agent
拥有目标和决策循环

MCP
把更多外部世界接到 Agent 身边
```

所以 MCP 扩展的不是 Intelligence Space，而更像是：

```text
Reachable World
可触达世界
```

Skill 教 Agent “怎么做”。

MCP 则让 Agent “够得着”。

这也是为什么 Anthropic 在产品语境里经常把 MCP Server 理解成 Connector：它首先解决的是连接问题。

## 没有 MCP 时，每个系统都在说自己的方言

假设 Mira 想接这些系统：

```text
GitHub
飞书
企业微信
PostgreSQL
Google Drive
本地文件系统
浏览器
```

没有统一协议时，很容易变成：

```text
GitHubAdapter
FeishuAdapter
WeComAdapter
DatabaseAdapter
DriveAdapter
BrowserAdapter
```

每一套又分别处理：

```text
认证
连接
能力定义
参数格式
错误处理
生命周期
```

这并不是不能做。

传统软件几十年都是这么集成 API 的。

真正的变化在于：Agent 时代，使用这些能力的“调用者”不再完全是程序员预先写死的代码。

它变成了一个在运行时做决定的模型。

传统 API 更像：

```text
开发者提前知道 endpoint
↓
程序提前写好调用逻辑
↓
运行时执行
```

而 Agent 更希望：

```text
运行时发现能力
↓
理解能力描述
↓
根据当前 Goal 决定是否调用
```

这就是 MCP 特别重要的一步：**Runtime Capability Discovery，运行时能力发现。**

## Host、Client、Server：别被三个名词吓到

MCP 的三个角色其实很好理解。

### Host：这栋房子是谁的

Mira、Claude Desktop、IDE Agent 这类完整 AI 应用，是 Host。

Host 拥有：

```text
LLM
Agent Loop
Context
Permissions
UI
Skills
Tools
```

所以 Mira 是 Host，不是 MCP Server。

### Client：插座

Host 内部会有 MCP Client。

它负责：

```text
建立连接
初始化
能力发现
发送协议请求
接收结果
维护连接状态
```

可以把它理解成 Mira 身上的 MCP 插座。

### Server：插进来的设备

例如：

```text
GitHub MCP Server
Filesystem MCP Server
Feishu MCP Server
Database MCP Server
```

Server 负责告诉 Client：

```text
我有哪些能力
参数是什么
怎么调用
结果是什么
```

完整关系就是：

```text
Mira Host
└── MCP Client
    ├── GitHub MCP Server
    ├── Feishu MCP Server
    └── Database MCP Server
```

官方 MCP 架构同样采用 Host - Client - Server 模型：Host 会为每个 Server 建立对应 Client，由 Client 维护与 Server 的连接。

## MCP Server 连上以后，第一件事不是干活

一个新员工进公司，不会一进门就直接操作生产数据库。

一个设备插上电脑，也不是立刻开始乱发数据。

MCP 建立连接以后，会先有初始化和能力协商。

大概是：

```text
Client：你好，我是 Mira，我支持这些协议能力。

Server：你好，我是某某 Server，我支持这些能力。

双方：协议版本和能力范围确认。

↓
Ready
```

然后才进入 Discovery：

```text
你有什么 Tool？
你有什么 Resource？
你有什么 Prompt？
```

于是 Host 才真正知道：

> 原来我现在多了这些能力。

这和 Skill Discovery 很像，但发现的东西不同。

```text
Skill Discovery
发现“我会哪些做事方法”

MCP Discovery
发现“外部世界现在提供哪些能力”
```

## Tool、Resource、Prompt，不是一回事

很多人把 MCP 直接等同于“MCP Tools”。

其实 Server 可以提供的核心原语不只有 Tool。

最直觉的理解是：

```text
Tool
= 做事情

Resource
= 给你东西看

Prompt
= 给你可复用的交互模板
```

例如：

```text
Tool
create_issue()
send_message()
query_database()

Resource
repo://project/README.md
db://schema/users

Prompt
review_pull_request
summarize_database
```

Tool 往往意味着一次动作，可能有副作用。

Resource 更像一个可读取的信息对象。

Prompt 则是服务端提供的可复用交互模板。

它们都可以通过 MCP 被 Host 发现，但语义并不相同。

## LLM 其实没有“直接调用 MCP”

这也是一个很容易说错的地方。

用户说：

> 看一下 GitHub 仓库里的 package.json。

模型可能决定调用：

```text
get_file_content(repo, path)
```

但真正执行链其实是：

```text
LLM
提出 Tool Call
↓
Host
负责执行决策
↓
MCP Client
负责协议通信
↓
MCP Server
访问 GitHub
↓
结果返回 Host
↓
进入 Agent Context
```

所以更准确地说：

> **LLM 产生调用意图，Host 执行，MCP Client 负责说协议，MCP Server 负责碰外部世界。**

这个边界非常重要。

不要让 Planner 去负责重连、刷新 Token、重启子进程、维护 Session。

那些是 Runtime 的脏活。

Agent 管决策，Runtime 管现实。

## stdio：MCP Server 可能只是你电脑上的一个小进程

“Server”这个词很容易让人想到云服务器。

其实本地 MCP Server 完全可能只是一个 CLI 子进程。

配置可能长这样：

```json
{
  "command": "npx",
  "args": ["-y", "some-mcp-server"]
}
```

Host 启动它以后：

```text
Mira.exe
└── node.exe
    └── MCP Server
```

双方通过 stdin / stdout 交换协议消息。

可以把它想象成：

```text
Host：你会什么？
Server：我会这些。
Host：执行这个。
Server：结果给你。
```

只不过这些话按照 MCP 的数据层协议组织，使用 JSON-RPC 2.0 消息格式。

当前官方 MCP 架构支持的标准传输包括本地常见的 stdio，以及远程常见的 Streamable HTTP。

## Streamable HTTP：Server 也可以在远方

如果 MCP Server 在云上，就不能由 Host 直接 spawn 本地子进程了。

这时候关系更像：

```text
Mira
↓
MCP Client
↓
HTTP
↓
Remote MCP Server
```

上层 Agent 不一定需要关心这个 Tool 到底来自本地 stdio，还是远程 HTTP。

因为 Transport 应该被 MCP Client 层屏蔽。

```text
             MCP Client
            /          \
         stdio       Streamable HTTP
          ↓                ↓
    Local Server      Remote Server
```

这就是协议层真正舒服的地方：

> **上层使用能力，下层负责能力到底住在哪里。**

## 一个 MCP Server 不是一个 Tool

这个区别也很关键。

飞书 MCP 并不是：

```text
Feishu = 一个 Tool
```

而更像：

```text
Feishu MCP Connection
↓
发现一组能力
├── search_docs
├── read_doc
├── create_doc
├── send_message
└── list_records
```

所以一个 MCP Server 更像“一个能力入口”。

连接以后，Server 暴露的是一组 Tools、Resources、Prompts。

这也意味着：

> **MCP Connection 和最终暴露给 Agent 的 Tool，不是同一个层次。**

## 巴别塔统一了语言，为什么还需要 Skill？

到这里会出现一个非常自然的问题。

大家终于能交流了，那是不是 Agent 就什么都会了？

不是。

想象一个新员工现在已经拿到了：

```text
GitHub 权限
飞书权限
数据库权限
文件系统权限
```

你对他说：

> 帮我做本周项目周报，然后发给团队。

他还是得问：

```text
先查什么？
统计哪个时间范围？
风险怎么定义？
周报格式是什么？
发哪个群？
发之前要不要复核？
```

MCP 解决的是：

```text
能不能够到
```

Skill 解决的是：

```text
到了以后怎么做
```

所以我们最后形成了一个特别好记的比喻：

> **MCP 给 Agent 接上世界，Skill 教 Agent 怎么在这个世界里办事。**

例如：

```text
Feishu MCP
提供 read_doc / send_message / create_doc

Weekly Report Skill
规定收集什么数据、如何判断风险、怎么组织周报、什么时候发送
```

连接器和操作指南不是竞争关系。

它们是上下两层。

## MCP 最大的工程价值，是把“连接”变成可替换的边界

真正好的架构不是 Skill 写死：

```text
必须调用 feishu_send_message
```

长期看，更理想的是表达：

```text
我需要 messaging.send 能力
```

然后 Runtime 去解析：

```text
messaging.send
↓
Feishu MCP
或
WeCom MCP
```

这就是 Capability Abstraction。

Skill 依赖的是语义能力。

Runtime 决定具体实现来自 MCP、本地 Native Tool，还是别的 Provider。

当然，V1 完全没必要一开始就做得这么抽象。

但这个方向很重要，因为它告诉我们：

> **MCP 的价值不只是“多接几个工具”，而是把外部世界的连接方式从业务流程里剥离出来。**

## 面试里怎么讲 MCP

有人问：

> 你怎么理解 MCP？

背一句“Model Context Protocol 是开放协议”当然没错。

但更有判断力的说法可以是：

> **我把 MCP 理解成 Agent 世界解决巴别塔问题的一种协议。传统外部系统各有自己的 API 方言，而 Agent 需要在运行时发现并调用能力。MCP 标准化了能力发现、描述和调用的边界，所以它扩展的不是模型智力，而是 Agent 的可触达世界。**

然后再补技术：

```text
Host / Client / Server
initialize + capability negotiation
Tools / Resources / Prompts
stdio / Streamable HTTP
```

先讲为什么，再讲怎么实现。

一个概念能被自己讲明白，才算真的进了脑子。

## 参考阅读

- Model Context Protocol 官方文档：Architecture Overview
- Anthropic Engineering：Equipping agents for the real world with Agent Skills
- Datawhale Hello-Agents：Extra05 Agent Skills 与 MCP 对比解读
