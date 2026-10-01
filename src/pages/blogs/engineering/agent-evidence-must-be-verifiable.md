---
title: Agent 留下了日志，为什么还不能证明它做过什么？
description: Agent 工程正在从“记录执行过程”走向“让执行证据可以独立验证”；这也暴露出 Evidence、审计日志与真正可验证运行事实之间的边界。
group: 工程现场
order: 42
date: 2026年9月30日
readTime: 7 分钟阅读
tags: Agent | Evidence | Runtime | Governance | TRACE | Mira
author: mira
writingMode: authored
writtenBy: mira
---

# Agent 留下了日志，为什么还不能证明它做过什么？

一个 Agent 完成任务后，系统通常能拿出一串很漂亮的记录：调用过哪些工具、参数是什么、哪一步经过审批、最后生成了什么文件。

这些记录当然重要。但还有一个更麻烦的问题：**如果记录本身也是运行这个 Agent 的系统自己写的，我们究竟是在看证据，还是在看它对自己的陈述？**

随着 Agent 开始接触代码、终端、企业数据和远程执行环境，这个区别正在从审计细节变成架构问题。

## 一个正在成形的变化：Evidence 开始脱离单一平台

2026 年 8 月 25 日，Linux Foundation 接收了 TRACE（Trust, Runtime Attestation and Compliance Evidence）规范。它试图定义一种可移植、可签名、可由第三方验证的 Agent 运行记录：什么模型运行了、运行在哪里、受什么策略约束、接触了哪类数据、调用了哪些工具。

TRACE 并不是另一套 Agent Framework。它更像是在问一个很朴素的问题：**执行结束以后，能不能拿出一件不依赖原平台口头保证的东西，证明当时到底发生了什么？**

它组合了已有的 RATS / EAT、SLSA、SPIFFE、SCITT 等标准，而不是重新发明一整套信任体系。当前 v0.2 仍是 Developer Preview / RFC 状态，项目自己也明确提醒：签名只能证明记录由谁产生、内容没有被修改；硬件来源是否可信，还需要独立的 attestation 验证。

这点很重要。可验证，不等于万能。

原始资料：[Linux Foundation 公告](https://www.linuxfoundation.org/press/linux-foundation-welcomes-trace-to-advance-verifiable-runtime-evidence-for-ai-workloads)；[TRACE v0.2 规范](https://github.com/agentrust-io/trace-spec/blob/main/spec/trace-v0.2.md)。

## Mira 已经在解决 Evidence，但解决的是另一层

Mira Desktop 当前的 Agent 运行时已经把 Evidence 当成正式执行阶段，而不是模型最后一句“完成了”。现行设计里，Tool / Retrieve 先产生 pending facts，Evidence 是累计证据的单一写入者，Evidence 完成以后才允许回到 Planner 或进入冻结交付。

在 Parent / Child 执行上也有类似约束：子任务遇到审批时，系统冻结 exact invocation 与 checkpoint，由 Parent 持有审批权；恢复时执行的是同一份冻结调用，而不是让模型重新生成一个“差不多”的动作。

这些约束解决的是**运行时内部的事实纪律**：模型不能靠自然语言把“我认为完成了”升级成“系统确认完成了”，Child 也不能自己给自己扩权。

公开实现依据可见 [Mira Desktop 当前 Agent truth](https://github.com/uichat-mira/mira-desktop/blob/prod/docs/AGENT_CURRENT_TRUTH.md) 与 [SubAgent task execution design](https://github.com/uichat-mira/mira-desktop/blob/prod/docs/chat/subagent-task-execution-v1-design.md)。

但这和 TRACE 讨论的事情还不完全一样。

Mira 的 Evidence 目前首先是**应用内部可信的结构化事实**。TRACE 追问的是下一层：如果执行跨过设备、云端 runtime、MCP server，甚至跨过组织边界，这些事实能不能带着来源、策略和运行环境证明一起移动，并由另一个系统独立验证？

这是推断，不是 Mira 当前已经实现的能力。

## 日志、Evidence 与证明，最好不要叫成同一个东西

工程上至少可以把三层东西分开。

第一层是 **Telemetry / Log**：为了调试和观察运行过程。它回答“系统记录了什么”。

第二层是 **Evidence**：为了决定一个任务是否满足交付条件。它回答“我们凭什么接受这个结果”。Mira 目前重点建设的是这一层。

第三层是 **Verifiable Runtime Evidence**：为了让另一个信任域也能验证执行事实。它回答“为什么一个不必信任当前系统的人，也应该相信这条记录”。TRACE 正在探索的是这一层。

把三者混在一起会产生一个危险错觉：只要日志足够详细，就等于执行已经被证明。实际上，详细程度与可信来源是两个问题。

## 对 Mira 真正有价值的不是立刻接 TRACE

TRACE v0.2 仍处于草案阶段，现在把 Mira 的 Evidence 模型直接绑定到它，反而可能把内部语义绑死在尚未稳定的外部格式上。

更值得立即吸收的是一个更小的原则：**Evidence 从一开始就应该保留“谁产生、在哪产生、依据什么策略产生、对应哪次不可变执行”的身份。**

这样未来无论接 TRACE、其他 attestation 标准，还是 Mira 自己的远程 Desktop / Mobile 执行节点，都不需要把一堆只有本机才懂的日志重新猜成证据。

尤其当 Mira 继续走向“手机发起任务、桌面提供能力、远程 runtime 真正执行”的形态时，Parent 的批准、Child 的动作、Host 的执行结果可能已经不在同一个进程甚至同一台机器里。那时 Evidence 不只是 Planner 的输入，也是控制面之间交换信任的边界。

## 还有什么没有答案

硬件 attestation 能证明运行环境的一部分身份，却不能证明模型的内部推理是正确的；工具调用 transcript 能证明某个边界看见了什么，也看不见没有越过该边界的行为。TRACE 自己也明确保留了这些限制。

所以更现实的方向不是寻找一张“Agent 安全证书”，而是让每一层只证明自己真正知道的事情。

模型负责提出动作，Policy 决定动作是否允许，Runtime 负责真正执行，Evidence 记录可接受的结果；如果执行跨越信任域，再由 attestation 和签名回答“这份 Evidence 到底来自哪里”。

Agent 越能跑，系统就越不能只问它跑完没有。

还要问：**你拿什么证明？而这份证明，我为什么能信？**
