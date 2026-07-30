---
title: Mira Agent 现在到底是什么
description: 在几轮 AgentGraph、Harness、Skill Agent 与 SubAgent 施工之后，重新说明 Mira 当前真实的运行时、委派边界和已知偏差。
group: 工程现场
order: 8
date: 2026年7月30日
readTime: 9 分钟阅读
tags: Agent | Pi Loop | SubAgent | Harness | Evidence | 工程真相
author: tomz | mira
writingMode: co-authored
writtenBy: mira
reviewedBy: tomz
---

# Mira Agent 现在到底是什么

过去一段时间，Mira 的 Agent 文档里同时存在几种叙事：早期的 LangGraph-first 设计、Agent V1.5 的稳定回路、文枢接入时的 Pi Skill Agent，以及后来加入的通用 SubAgent。每一种说法都曾经对应过真实施工，但把它们同时当作“当前架构”，结果只会是同一个系统拥有好几份互相争夺解释权的真相。

所以这次没有继续画一张更大的图，而是先回答一个朴素问题：截至 2026 年 7 月 30 日，Mira Agent 实际是怎样运行的？

## 它首先是一条 AgentRun

用户发起任务以后，系统首先创建的不是一段临时 prompt，也不是一张只能存在于内存里的流程图，而是一条 `AgentRun`。

它保存用户目标、当前状态、Evidence、审批、checkpoint、SubAgent 结果和最终交付。任务是在运行、等待用户、等待审批、已经完成，还是彻底失败，都应该由这条运行记录回答。

这件事听起来不如“多智能体协作”刺激，却决定了系统能不能真正暂停、恢复、审计和复现。没有持久化运行真相，所谓恢复通常只是重新问模型一次；所谓审批，也可能只是用户点了同意以后，系统又生成了一套不同参数。

## AgentGraph 不再等于 LangGraph

`AgentGraph` 这个名字仍然存在，但它现在更准确的含义是稳定门面：统一输入、输出、节点语义、状态和 execution trace。

应用默认运行时已经是 Pi Loop。LangGraph 仍然保留，用于显式兼容、历史测试和回归对照，但它不是当前产品默认主链。

```text
Conversation / Skill preparation
→ AgentRun
→ AgentGraph stable facade
→ Pi Loop
→ Main Planner
→ action / delegation
→ Evidence
→ Generate / Finalize
```

这也意味着，讨论 Mira Agent 时不能再用“图里有几个节点”代替真实运行时。节点只是职责的表达，真正重要的是谁拥有目标、谁能决定下一步、谁可以执行副作用，以及结果如何进入 Evidence。

## 当前有三条执行路径

第一条是 Main Agent 直接路径。简单回答、检索，或者一个具体工具就能完成的动作，没有必要为了显得更像 Agent 而启动新的 Child。

第二条是通用工作包委派。Main Planner 可以通过 `delegate_task`，把一个目标清楚、可以独立验收、通常需要多次顺序工具调用的局部任务交给 Generic SubAgent。

第三条是 Skill-owned SubAgent。像文枢这样的任务型 Skill，可以通过 execution profile 启动受限的领域执行器，在自己的工具面和可选私有 Runtime 中完成文档、报表或其他专业施工。

```text
Main Agent direct action

Main Planner
→ delegate_task
→ Generic SubAgent
→ Evidence
→ Main Planner acceptance

Skill match
→ Skill-owned SubAgent
→ Evidence / Artifact / Requirement
→ Parent delivery
```

这三条路径不是三个互相竞争的 Agent。它们只是不同复杂度和不同领域所有权下的执行方式。

## SubAgent 得到的是局部工作，不是一个新世界

Generic SubAgent 只拿到一个局部目标和验收条件。Skill-owned SubAgent 只拿到对应 Skill 声明的能力。它们都不会继承 Parent 的全部上下文、全部工具和全部权限。

当前 V1 也不允许 Child 再次委派。没有 nested SubAgent，没有 Agent 间自由通信，没有群体投票，也没有为了“多 Agent”这个名字自动创建更多线程。

Parent 始终保留用户对话、全局目标、Policy、审批、恢复、终止状态、Evidence 收口和最终回答。Child completed 只说明局部工作完成；用户真正要求的事情有没有全部完成，仍由 Main Planner 判断。

文枢路径还有一个更严格的边界：当 Skill-owned SubAgent 已经提交真实 Evidence 和 Artifact，Parent 会冻结 finalization packet 并进入 Generate，而不是让 Main Planner 把已经做完的文件再做一遍。

## `delegate_task` 不是一件万能工具

这是当前公开说明里最容易写错的一点。

`delegate_task` 不是普通 Harness Invocation，也不是一个可以绕过 Policy 的超级工具。它是 Main Planner 可见的委派协议，用来启动受控 Child execution。

Child 真正调用的 `read_open`、`write_file`、`replace_block`、`terminal_session` 或其他 concrete tools，仍然受到工具注册、公共工具面、schema、Policy、审批、Workspace 和 Evidence 约束。

Skill-private Runtime 也不是隐藏后门。它不会因为写在 Skill manifest 里就自动获得权限，更不会进入 Main Planner 的全局工具面。它只能在对应 execution profile 中工作，并把结果交回 Parent。

## Evidence 仍然比“成功”重要

工具说执行成功，只能证明一次调用结束。模型说文件已经生成，也不能证明文件真的存在、内容正确、结构可用。

Mira 仍然坚持区分两件事：

- Evidence answerable：已有证据支持我们说什么；
- Task completable：用户要求的全部事情是否真正完成。

定位到文件不等于读完文件，生成文件不等于验证文件，Child completed 也不等于用户全局目标 completed。

这条区分曾经是为了修复 Planner 太早收尾，如今也是 Main Agent 与 SubAgent 能够共存而不互相抢功的基础。

## 当前代码仍有一处没有假装正确

Settled recoverable contract 是：某次工具失败可以进入 Planner recovery；恢复预算耗尽后，系统生成 guarded answer，明确说明失败、有限证据和未完成项，Graph 最终以 `completed` 收口。

但截至 2026 年 7 月 30 日，`dev` 当前实现仍会在恢复耗尽时直接进入 `error`，使 Graph `failed` 并跳过 Generate。

这是一处高优先级实现漂移，不是合同已经改变。我们把它写进公开现状，不是为了展示一个缺陷，而是避免两种更糟的做法：用目标合同假装代码已经正确，或者为了迁就回归，把错误行为重新包装成新设计。

## 接下来不是继续扩张 Agent 社会

2026 年 8 月起，Mira 会进入功能稳定迭代。Agent 的优先事项不是继续增加节点、Agent 层级和自治口号，而是把已经存在的能力真正变稳：

- 修复 recoverable contract 漂移；
- 减少 Planner 提前收尾；
- 稳定工具选择与 schema；
- 保护 exact approval 和 checkpoint resume；
- 提高 Evidence、Artifact 与 execution trace 的可信度；
- 用真实任务和黑盒回归保护边界。

所以，Mira Agent 现在不是一张 LangGraph 图，也不是一个热闹的 Agent 社会。

它是一条由 Main Agent 维护全局目标、由 Harness 约束具体动作、允许局部执行所有权受控转移，并最终把真实证据和产物交还给用户的任务运行时。

这听起来没有“无限自治”那么浪漫，却更接近一个真的可以被长期使用和维护的产品。

相关说明：

- [Agent 当前运行真相](/docs/architecture/agent)
- [Agent 策略](/docs/architecture/agent-strategy)
- [Harness 与工具边界](/docs/architecture/harness)
- [工具工作台](/docs/configuration/tools)
- [Mira 的工具现在到底是什么](/blogs/engineering/mira-tool-current-truth)
- [可控的自主](/docs/philosophy/controlled-agency)
