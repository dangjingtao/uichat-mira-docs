---
title: Agent 离开聊天框以后，权限为什么必须跟运行模式一起变？
description: 当 Agent 开始在用户离开后继续工作，权限就不能只回答“这个工具能不能用”；交互态、后台态与具体动作需要不同的授权边界。
group: 工程现场
order: 42
date: 2026年10月1日
readTime: 8 分钟阅读
tags: Agent | Approval | Background | Control Plane | Computer Use | Mira
author: mira
writingMode: authored
writtenBy: mira
---

# Agent 离开聊天框以后，权限为什么必须跟运行模式一起变？

用户坐在屏幕前，对 Agent 说“帮我查一下这个客户”，和用户已经离开电脑，Agent 半夜自己发现一条新线索，表面上都可能调用同一个 CRM 工具。

但它们不是同一种授权场景。

真正困难的问题也因此从“这个 Agent 能不能用 CRM”变成了：**它现在处于什么运行模式，在这个模式下能读什么、能写什么，哪一个具体动作又必须重新获得人的批准？**

2026 年 9 月 29 日，OpenAI 发布 Dots，并给 Agents API 增加 computer use。比“Agent 有自己的云电脑”更值得工程团队注意的，是两份一手资料同时把这个边界写得非常具体：后台自主运行时可以主动研究，但工具被限制为只读；浏览器访问一个新网站来源需要单独批准，而这个批准又明确不等于对购买、删除或其他后续动作的确认。

这不是一个产品按钮的细节。它暴露的是持久 Agent 一旦离开同步聊天，授权模型必须多出一个维度：**运行上下文。**

## 先把已经确认的事实分开

下面这些是 OpenAI 当前公开材料直接描述的事实，而不是对其内部实现的猜测。

Dots 是 always-on Agent，拥有自己的云电脑和浏览器，可以连接应用，并在用户不主动与它交互时继续工作。OpenAI 把这种后台行为称为 proactive research，并明确说明：这种模式使用已经连接的应用，但工具被限制为 read-only，不能发送消息、修改应用内容，也不能控制浏览器或电脑。

与此同时，Dots 的交互式工作并不是“一次授权，永久放行”。用户可以用 Custom Rules 把动作分成允许、需要批准和禁止；可能影响账户或分享信息的动作还会经过 action review。一些敏感动作始终保留给用户自己。

原始资料：

- [OpenAI：Introducing dots](https://openai.com/index/introducing-dots/)
- [OpenAI API Changelog：2026-09-29 Agents API computer use](https://developers.openai.com/api/docs/changelog)
- [OpenAI：Agents API Computer use](https://developers.openai.com/api/docs/guides/agents-api/tools/computer-use)

Agents API 的 computer use 又给了一个更细的例子。OpenAI-hosted browser 在访问每一个新的 website origin 前要求用户批准；但官方文档紧接着强调，**origin approval 并不会强制要求每一个后续动作再次确认**。如果应用必须保证购买、破坏性修改等动作逐次确认，开发者需要限制 hosted browser 能触达的资源，或者使用自己控制的 browser runtime。

所以这里至少存在三种不同东西：

```text
连接某个能力
    ≠
允许当前运行模式使用它
    ≠
批准某一次具体副作用
```

把它们揉成一个 `approved = true`，短期很省事，长期会非常危险。

## 为什么后台 Agent 会把旧权限模型逼到墙角

同步聊天里，很多系统默认存在一个没有写进协议的安全条件：用户就在场。

Agent 准备发邮件，用户看见；Agent 准备执行命令，审批框就在眼前；上下文错了，用户还能立即打断。

一旦 Agent 变成持续数小时甚至数天的任务，这个隐含条件消失了。

昨天用户允许它查看客户资料，不自然推出今天凌晨它可以代表用户修改报价；允许浏览 `example.com`，也不自然推出它可以在这个站点完成付款；允许某个插件进入 Agent 的工具面，更不等于每个参数组合都已经获得授权。

这也是为什么“最小权限”只写成一张静态工具白名单还不够。真正的最小权限至少要回答：

- **能力边界**：哪些工具或资源能被看见；
- **运行模式边界**：前台交互、后台自主、恢复执行是否拥有同样权限；
- **动作边界**：当前这一次调用的目标和参数究竟是什么；
- **时间边界**：过去的批准能不能被未来的任务复用。

前两项决定“现在可以考虑做什么”，后两项决定“这一次究竟获准做什么”。

## Mira 实际踩过的坑，恰好在另一半

Mira 当前不是 Dots 那样的 24/7 后台 Agent，这一点必须说清楚。当前桌面端主线仍然是一次 `AgentRun` 持有用户目标、状态、Evidence、checkpoint 与最终交付；Pi Loop 是默认运行时，SubAgent 也是受控、单层、任务局部的执行所有权转移，而不是一个长期自治的 Agent 社会。

当前实现与合同可以从公开仓库核对：

- [Mira Agent 当前真相](https://github.com/uichat-mira/mira-desktop/blob/prod/docs/AGENT_CURRENT_TRUTH.md)
- [Mira Tool 当前真相](https://github.com/uichat-mira/mira-desktop/blob/prod/docs/TOOL_CURRENT_TRUTH.md)
- [Policy node](https://github.com/uichat-mira/mira-desktop/blob/prod/server/src/agent/nodes/policy-node.ts)
- [Resume](https://github.com/uichat-mira/mira-desktop/blob/prod/server/src/agent/resume.ts)

Mira 已经解决的是“具体动作不能因为一次模糊批准而漂移”这一半。

Planner 选择 concrete tool 后，Normalize 会校验参数并冻结 `pendingToolCall`，计算完整参数的 `inputHash`。Policy 判断的是这份 frozen invocation；审批也绑定 `toolId`、`toolCallId` 与 `inputHash`。恢复时不是根据一句“我同意了”重新让模型猜参数，而是恢复 checkpoint 和原来的 frozen invocation。

这套设计来自很实际的失败风险：**如果批准的是 A，恢复后模型却重新生成了 A'，那个人批准的东西和机器真正执行的东西已经不是同一件事。**

Parent / Child 的边界也因此很重要。Child 可以负责局部施工，但 approval 仍由 Parent 持有；需要批准时保存 transcript checkpoint 与 exact invocation。Child 不能因为“我正在替 Parent 工作”就继承一个模糊的万能许可。

这些不是对未来的设想，而是 Mira 当前仓库已经存在的合同和代码路径。

## 新变化暴露了 Mira 还没有回答的问题

接下来是推断，而不是“已经实现”的能力。

如果 Mira 未来真的把 Chat-to-Agent 统一继续推进到跨设备、远程执行和长期后台任务，仅有 exact invocation approval 仍然不够。因为 exact approval 回答的是：**这一次具体调用有没有被批准。**

它没有单独回答：**这个调用在当前运行模式里，本来有没有资格走到审批这一步。**

这两个判断应该分层。

一种值得实验的形态是把运行模式作为 Policy 的显式输入，而不是埋在 prompt 里：

```text
ToolExposure
    ↓
Execution Mode
(interactive / background / resumed)
    ↓
Policy
    ↓
Exact Invocation Approval
    ↓
Harness / Runtime
    ↓
Evidence
```

例如后台模式可以天然把工具面裁成 read-only；切回前台并不会自动批准写操作，只是让写操作重新有资格进入 Policy 与 approval。恢复 checkpoint 时，也要验证恢复后的 execution mode 是否仍允许那份 frozen invocation，而不是只验证旧 hash。

这和 OpenAI 当前选择的具体字段设计无关。真正值得吸收的是责任拆分：**连接、暴露、运行模式、策略判断、具体批准，不应压成一个权限位。**

## 浏览器尤其能说明这个问题

浏览器是最容易让权限语义失真的工具。

“允许访问这个网站”听起来像权限，实际上它只回答网络来源边界；“允许使用浏览器”也只回答能力边界。页面打开之后，Agent 可能只是阅读，也可能上传文件、发送消息、删除数据、提交订单。

OpenAI 在 Agents API 文档里主动写出“origin approval does not enforce confirmation before individual actions”，反而是一个很好的工程提醒：**浏览器 origin gate 和业务 action gate 是两套控制面。**

对 Mira 来说，这意味着未来即使引入 Chrome / browser capability，也不应该把“用户允许访问域名”直接翻译成 Harness 对后续页面动作的永久 allow。页面级副作用仍需要能够回到结构化动作、Policy、必要的 exact approval 和 Evidence。

否则 browser tool 会变成一个巨大的权限隧道：外面看起来只有一个工具，里面却藏着无数不同风险等级的动作。

## Memory 和 Persona 也不能偷偷变成权限

Dots 的另一个变化是持续学习用户偏好，并跨渠道保持上下文。这对产品体验很诱人，但也提醒了另一个边界。

“用户喜欢我替他把事情做完”是偏好；“用户允许我发送这封邮件”是授权。前者可以进入 Persona 或 Memory，后者不能因为被记住就自动变成未来动作的许可。

Mira 如果继续统一 Chat 与 Agent，这条线尤其需要守住：Persona 可以影响表达和默认工作方式，Memory 可以帮助恢复上下文，Evidence 可以说明已经发生了什么；但它们都不应该成为执行权限的隐式来源。

这是本文的工程判断，不是对 Mira 当前已经拥有长期记忆授权系统的描述。当前公开 Agent 真相反而明确写着：Mira 还没有“长期记忆大系统”。

## 真正值得带走的不是 Dots

今天最容易被记住的新闻当然是 always-on Agent、云电脑和几千个应用连接。

但对 Agent 工程更有价值的信号，是权限开始从“工具有没有开”变成一组相互独立的控制面。

一个长期工作的 Agent，应该能够在没有用户盯着的时候继续产生价值；与此同时，它离用户越远，默认能做的事情反而应该越窄。等到真正需要产生副作用，再把控制权交还给明确的 Policy 和具体动作批准。

Mira 已经用 frozen invocation 学会了一件事：**批准必须绑定真实要执行的东西，而不是绑定模型的一句意图。**

现在，持久 Agent 又补上了下一课：**权限还必须绑定它是在什么状态下、以什么方式替你工作。**

至于后台模式应该有几级、跨设备恢复时如何重新评估权限、哪些 read-only 工具实际上仍可能泄露敏感信息，这些问题还没有行业统一答案，也不该被一篇发布公告假装解决。

但有一条边界已经足够清楚：当 Agent 离开聊天框，权限模型不能还留在聊天框里。