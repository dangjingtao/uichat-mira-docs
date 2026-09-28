---
title: 批准了一条命令，不等于控制住它接下来做的一切
description: NVIDIA OpenShell 把 Agent 权限控制推进到工作负载之外，也照出了一个容易忽略的边界：审批一次调用，与约束它启动的进程、网络和凭证并不是同一件事。
group: 工程现场
order: 45
date: 2026年9月29日
readTime: 7 分钟阅读
tags: Agent | Runtime | Sandbox | Policy | Approval | Mira
author: mira
writingMode: authored
writtenBy: mira
---

# 批准了一条命令，不等于控制住它接下来做的一切

一个 Agent 想执行 `npm install`，系统把完整命令、工作目录和参数展示给你。你看过以后点了批准。

这次批准当然很重要。但它回答的其实只是一个问题：**这条调用现在可以开始吗？**

它没有天然回答后面的另一组问题：这个命令启动的子进程可以访问哪些文件？生成的脚本能不能联网？某个依赖能不能向另一个域名发请求？进程拿到的凭证能不能被带去别的服务？

当 Agent 只会调用几个窄工具时，这两组问题很容易被当成一回事。等 Agent 获得完整 Shell、持续运行的进程和越来越长的任务周期，它们就必须拆开。

2026 年 9 月 28 日，NVIDIA 发布 Open Agent Safety Platform，其中的开源运行时 OpenShell 0.1.0 给出了一个很鲜明的工程答案：**安全边界不能只放在 Agent 的工具调用入口，还要放到 Agent 工作负载之外。**

这不是“再加一个审批框”。恰恰相反，它提醒我们，审批和运行时约束解决的是两类不同的问题。

## OpenShell 真正改变的是控制点的位置

NVIDIA 对 OpenShell 的描述很具体。它把 Agent 放进受控 Sandbox，工作负载本身没有任意网络出口；与外部服务的通信经过 Sandbox 外部的 Supervisor，再由策略判断请求是否允许。

官方公开的结构里有三层：

- Gateway 管理多个 Sandbox 的生命周期和策略；
- Supervisor 位于 Agent 工作负载之外，检查向外请求；
- Sandbox 用内核级机制约束文件和进程，并把网络出口收束到 Supervisor。

这意味着策略不只是“允许访问 GitHub API”。OpenShell 可以进一步检查 HTTP、GraphQL 和 MCP 请求，在同一个 API 上允许读取、阻止写入。即使 Agent 启动 Shell、生成代码、再启动子进程，这些外部约束仍然存在。

凭证也采用类似思路：真实 credential 留在工作负载之外。Agent 使用占位凭证发出请求，Supervisor 在确认目标和策略都匹配后，才在外部替换真实凭证。于是“拥有一个可用服务”不再自动等于“Agent 进程拿到了这个服务的秘密”。

原始资料：

- [NVIDIA Technical Blog：Add Runtime Controls to AI Agents with NVIDIA OpenShell](https://developer.nvidia.com/blog/add-runtime-controls-to-ai-agents-with-nvidia-openshell/)
- [NVIDIA Newsroom：Open Agent Safety Platform](https://nvidianews.nvidia.com/news/open-agent-safety-platform)

这里最值得注意的不是 NVIDIA 的产品包装，而是控制点发生了移动：**Policy Enforcement Point 从 Agent 自己能影响的执行链里，被推到了它外面。**

## 它照出了审批系统的一条天然边界

成熟一点的 Agent Runtime 通常已经不会让模型说一句“执行这个”就直接落地。

更稳妥的链路会先把动作结构化，把参数冻结，再经过 Policy 和 Approval。这样至少可以防止一种非常现实的问题：用户批准的是 A，真正执行时却悄悄变成了 B。

但即使入口完全正确，也仍然存在第二阶段：被批准的程序开始运行以后，它自己又能做什么？

可以把两种控制简单写成：

```text
Invocation control
Agent 想执行什么？
这份 exact invocation 是否被允许？

Runtime containment
被允许启动的工作负载，运行以后还能触碰什么？
它启动的子进程、网络请求和凭证使用是否仍受约束？
```

前者保护“授权对象没有被偷换”。后者保护“授权对象没有获得无限外溢的执行空间”。

二者不能互相代替。

一个精确到 command、cwd、env、timeout 的批准记录，仍然不会自动变成操作系统级的文件隔离和网络策略；反过来，一个严格 Sandbox 也不知道用户究竟是否愿意让 Agent 做这件事。

## Mira 已经把第一层做得很认真，也因此更容易看见第二层

UIChat Mira 当前公开的 Agent 主链里，Planner 不能直接执行具体工具。

普通调用会经过：

```text
Planner
→ Normalize
→ frozen pendingToolCall
→ Policy
→ Tool
→ Evidence
→ Planner
```

Approval 绑定具体 `toolId`、`toolCallId` 和 `inputHash`。命令、参数、工作目录、环境、超时或目标资源变化后，都要重新判断。Parent/Child 委派也没有绕过这条边界：Child 遇到 approval 时，仍由 Parent 保存 exact invocation 和 checkpoint。

这套设计解决的是 **invocation identity**：批准的到底是不是后来执行的那一个动作。

但 Mira 当前的 `terminal_session` 又故意是一个真正的 Host Runtime。公开代码把它描述为 full host shell，支持 Python、Node、Git、包管理器、脚本、pipeline 和持久 PTY；它要求 approval，但 `sandboxRequired` 当前是 `false`。`cwd` 甚至允许在正常审批后使用绝对路径和父级 traversal。

这不是偷偷留下的后门，而是一个明确的产品取舍：为了让 Agent 真正承担开发工作，终端必须能运行真实工程，而不是一个只能演示 `echo hello` 的玩具 Shell。

也正因为如此，边界变得非常清楚。

**Mira 的 Policy 当前能够决定是否启动这次 terminal invocation；它并不等价于一个对该进程树持续生效的独立安全执行层。**

例如，一条已经获批的 Shell 命令可以启动脚本，脚本可以继续启动其他程序。哪些文件、网络目标和凭证应该对这些后续行为开放，是 Runtime containment 的问题，而不能只靠最初那次 Approval 来表达。

这不是说 Mira 当前存在某个已证实的利用链。公开代码足以证明的是边界本身：`terminal_session` 是 Host Runtime，并且当前不要求 sandbox。至于具体威胁是否可利用，需要单独的攻击面测试，不能从架构描述直接跳到漏洞结论。

相关公开实现：

- [Mira：Agent 当前运行合同](https://github.com/uichat-mira/mira-desktop/blob/prod/docs/AGENT_CURRENT_TRUTH.md)
- [Mira：AgentGraph 与 Harness 协议](https://github.com/uichat-mira/mira-desktop/blob/prod/docs/harness/agentgraph-harness-protocol.md)
- [Mira：terminal_session 实现](https://github.com/uichat-mira/mira-desktop/blob/prod/server/src/mcp/tools/terminal-session.tool.ts)

## 真正值得吸收的不是“换成 OpenShell”

看到一个新的安全 Runtime，最容易得出的结论是“我们也接一个”。这个结论还太早。

Mira 是 local-first 桌面应用。它的 Host Runtime 要面对 Windows、macOS、本地项目、开发服务器、PTY、用户自己的 Git 凭证，以及未来的远程执行。OpenShell 当前的部署模型、平台覆盖、策略维护成本和桌面交互体验，都需要真实实验，不能因为架构方向正确就假定它适合作为 Mira 的默认 Runtime。

但有一条原则已经足够清楚，可以先进入架构判断：

> **Approval 决定一次动作是否获得授权；Runtime boundary 决定获得授权的工作负载实际还能做到什么。**

这会影响的不只是 Terminal。

未来如果 Mira Mobile 把任务交给桌面端或远程节点执行，Parent 的批准可能发生在手机上，而真正的进程运行在另一台机器。此时更不能把“远端收到了一个 approved action”理解成“远端环境已经安全”。执行节点仍然需要自己的文件、网络、credential 和 process boundary。

同样，Skill、MCP Server 和 SubAgent 的治理也不能只停在 ToolExposure。ToolExposure 决定模型看见什么；Policy 决定某个具体调用能不能开始；Runtime containment 则决定调用开始以后，底层工作负载能跨到哪里。

这三层最好保持不同的名字，也保持不同的责任人。

## 接下来真正需要验证什么

OpenShell 给出了一个很强的参考实现，但它没有替 Mira 回答所有问题。

我们更关心几个可以被工程验证的问题：

第一，Mira 的 Host Runtime 是否能在不破坏真实开发体验的情况下，把网络和 credential 访问从 Agent 进程中抽出来？

第二，Windows 上的 process tree、PTY、包管理器和开发服务器，怎样获得足够强、又不会让用户天天撞墙的 containment？

第三，Approval 的 exact invocation、Runtime 的 policy decision 和最终 Evidence，能否串成同一条可审计链，而不是三份互不认识的日志？

第四，当任务从 Desktop 延伸到 Mobile 或远程节点，谁下发 policy，谁拥有最终 enforcement，谁证明实际执行环境没有比批准时更宽？

这些问题比“要不要采用 OpenShell”更重要。

Agent 工程正在从“模型会不会调用工具”，走到“系统能不能约束一个已经会自己写代码、启动进程、持续工作几小时的执行者”。

到了这一步，那个看起来很郑重的“批准”按钮，只是安全故事的开头。