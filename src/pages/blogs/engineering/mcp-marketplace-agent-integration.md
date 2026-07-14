---
title: 让市场里的 MCP 真正成为 Agent 的一部分
description: 从一次外部 MCP 接入工作出发，记录市场、能力、工具和 Agent 之间应该怎样建立一条清楚而可靠的连接。
group: 工程现场
order: 3
date: 2026年7月14日
readTime: 8 分钟阅读
tags: MCP | Agent | Harness | 工程实践 | 能力接入
---

# 让市场里的 MCP 真正成为 Agent 的一部分

MCP 市场最容易让人产生一种错觉：只要把一个应用装进来，再把它暴露给模型，Agent 就多了一项新能力。

真正做过一轮接入之后，会发现事情更像是在一座城市里接入一条新的公共线路。市场负责告诉我们线路在哪里，server 负责提供车辆，Agent 负责理解乘客要去哪里，Harness 则要确保车辆真的能上路、路线可以追踪、出了问题还能停在正确的位置。

这次外部 MCP 接入给我的最大启发是：MCP 的价值不只在协议兼容，而在于它提供了一种把外部能力纳入本地运行时的方法。市场只是入口，Agent 能否可靠使用它，取决于入口之后的整条链路。

## 市场不是工具列表

市场里的一个条目，本质上是一份发现信息。它告诉我们这个 server 的名字、介绍、版本、安装方式和连接地址，但它并不等于一个已经可以执行的工具。

因此我们最后把接入过程拆成了几步：

```text
市场发现
  -> 安装记录
  -> 配置和连接
  -> Discover 远端 tools
  -> 投影为本地 capability
  -> 用户允许 Agent 使用
  -> Agent 选择并执行
```

这条链路的好处是，每一步都有自己的事实。市场只负责发现，连接只负责确认 server 能工作，Discover 负责确认远端实际暴露了什么，Agent Access 负责表达用户是否愿意让 Agent 使用它。这样，系统不会因为“市场里有这个应用”就默认它已经拥有了执行资格。

这也是产品概念逐渐清晰的开始。市场应用、MCP capability、projected capability 和 Agent tool 不是四个叫法相近的东西，而是同一条链路上的四个阶段。

## Agent 需要看到的是能力，而不是安装包

Agent 不需要知道一个 MCP server 是通过 `npx` 启动的，还是通过一个远端 URL 连接的。它也不需要看见 headers、环境变量和 token。

Agent 真正需要的是一个可以理解和选择的能力描述：它叫什么，能够解决什么问题，需要什么输入，可能产生什么影响。

所以外部 tool 进入本地运行时后，会拥有一个稳定的投影 id：

```text
mcp:<server-id>:tool:<tool-name>
```

这个 id 看起来有些技术化，但它非常重要。它把远端 tool 和本地 server 身份、schema、权限、trace 以及 Harness 注册连接起来。模型可以根据标题和描述理解它，却不能凭空编造一个同名能力来调用。

在候选选择阶段，external capability 也不应该另走一条“特殊通道”。它和内部 Tool 一样进入 exposure、topK、语义匹配、rerank 和 Tool Guard。区别只在于它拥有更严格的资格前置条件，而不是拥有一套完全不同的 Agent 逻辑。

这让“接入一个新 MCP”从修改 Agent 主循环，变成了向统一能力池注册一个新的参与者。

## 用户授权是能力生命周期的一部分

实现过程中有一个状态区分很值得保留：`enabled` 和 `agentEnabled` 不是同一个开关。

`enabled` 代表这个 server 是否作为运行时配置存在并保持可用；`agentEnabled` 代表用户是否允许 Agent 使用它。用户可以安装一个 MCP，连接它，Discover 它的 tools，但仍然不让 Agent 自动选择它。

这个区分让设置页面和运行时各自说清楚自己的话：

```text
安装       我把它放进系统
连接       它现在能够工作
Discover   我知道它实际提供什么
Agent Access 用户允许 Agent 使用它
```

当配置变化、server 被禁用、用户撤销授权，或者 Discover 结果不再对应当前配置时，能力就应该离开 Agent 候选集合。它不需要等待下一次模型调用才发现自己已经失效。

这类状态设计看起来不如一个“启用”按钮简单，但它让系统能够表达真实的使用过程。对 Agent 来说，能够使用什么，永远是一个随运行时状态变化的集合。

## 最终执行入口应该保持稳定

外部 MCP 接入 Agent 后，最重要的事情不是让 Agent 知道如何发送 MCP 请求，而是让它继续使用项目已经验证过的执行链：

```text
Planner
  -> Normalize
  -> Policy
  -> Approval
  -> ToolNode
  -> Harness
  -> External MCP
  -> Evidence
```

Planner 选择的是 projected capability 和参数。Normalize 负责确认 tool id 和输入，Policy 判断这次调用的规则，Approval 冻结用户批准的具体调用，ToolNode 执行一次 Harness invocation，最后把结果变成 Evidence。

这样做以后，外部 MCP 和内部 Tool 可以共享同一套执行观察方式：有 invocation id，有状态，有事件，有结果，有错误，也有最终能够回到 Agent 上下文的证据。

审批也不再是一个笼统的“允许这个 server”。它绑定的是一次冻结后的调用，包含 tool id、输入和 input hash。调用结束后，这次批准会被消费。之后 Agent 即使重新规划，也需要面对新的调用和新的授权边界。

我越来越觉得，Agent 的可靠性并不主要来自模型“记得小心一点”，而是来自这些运行时对象被设计成了有边界、可验证、可结束的东西。

## Transport 可以不同，运行时语言应该相同

目前外部 MCP 主要有两种连接方式：`streamable-http` 和 `stdio`。

HTTP server 的重点是 endpoint、session、timeout 和 JSON-RPC；stdio server 的重点是子进程、args、env、协议初始化和进程清理。它们在 backend 内部的实现差异很大，但到了 Agent 面前，应该被翻译成相同的运行时语言：

```text
queued
running
awaiting_approval
completed
failed
```

一个进程成功启动，不代表 stdio MCP 已经可用；一次 HTTP 请求返回，也不代表结果一定符合远端 tool 的合同。真正有意义的验证，是 initialize、tools/list、schema、result 和错误状态都能被统一记录。

这使我们在排查问题时有了更好的落点：先看 Agent 选择是否正确，再看 Harness 是否执行，再看 transport 是否完成协议交互，而不是把所有问题都归结为“模型没选对工具”。

## 失败也应该回到 Agent 的语言里

外部服务会超时，会断开，会返回 JSON-RPC error，也会返回不符合预期的结果。这些情况不应该让 Agent 继续编造一个成功结论。

当前的处理方式是把普通网络、session 和协议失败纳入 recoverable failure 合同。连接失效时可以尝试一次恢复；如果恢复仍然失败，Graph 停止额外的工具执行，并把已经确认的失败事实交给 Agent。

这条规则的重点不是“永远重试”，而是让恢复有上限，让失败有结论。Agent 可以据此继续询问用户、结束本轮，或者说明当前没有足够证据完成任务。

当 Evidence 记录了 server、projected capability、调用状态和恢复信息之后，用户看到的就不再是一句孤立的错误文字，而是一条可以回看的执行记录。这对调试很有帮助，也让 Agent 的最终回答更接近事实，而不是接近语气。

## MCP 接入改变了我们对 Agent 的理解

以前看 Agent，容易把注意力放在模型能不能理解意图、能不能生成正确的 tool call 上。接入外部 MCP 后，视线会自然向两端扩展：

```text
模型理解
  <-> 能力选择
  <-> 运行时执行
  <-> 外部系统
```

模型负责理解当前问题，但能力属于运行时，工具属于明确的执行入口，外部系统拥有自己的状态和失败方式。一个好的 Agent 不是把这些边界藏起来，而是把它们连接得足够顺畅，让用户感觉事情自然地完成了。

因此，MCP 市场接入 Agent 的核心成果，不是“Agent 现在能调用更多服务”，而是形成了一种可复用的能力接入方式：

```text
发现一个能力
  -> 验证它真实存在
  -> 将它翻译成本地身份
  -> 让用户决定是否交给 Agent
  -> 用统一运行时执行
  -> 把结果和证据带回来
```

这条路径同样适用于未来的浏览器能力、资讯能力、邮件能力，甚至是用户自己的业务系统。每一种能力都可以有自己的实现方式，但不必重新发明一套 Agent 生命周期。

## 最后留下一个简单判断

以后再看一个 MCP 应用是否已经“接入 Agent”，我会先问四个问题：

1. 它是否拥有稳定、明确的本地 capability 身份？
2. 用户是否能够单独允许或撤销 Agent 使用？
3. 它是否走统一的 Policy、Approval、Harness 和 Evidence 链？
4. 它失败之后，Agent 是否还能准确知道发生了什么？

如果答案都是肯定的，那么这个应用才算真正进入了 Agent 的运行时。否则，它可能只是出现在市场里，或者只是完成了一次手动连接。

MCP 让外部能力更容易被接入，而工程的任务，是让这些能力进入系统之后仍然有自己的名字、边界、记录和回家的路。
