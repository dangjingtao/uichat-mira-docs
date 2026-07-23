---
title: 一起学智能体 05｜Context 不是聊天记录，而是 Agent 此刻的世界
description: 从“只截最近 6 条消息”的不适开始，重新理解 Context Engineering：哪些信息该常驻、压缩、召回，以及角色级跨线程记忆为何比全局记忆更干净。
group: 一起学智能体
order: 5
date: 2026年7月23日
readTime: 9 分钟阅读
tags: 一起学智能体 | Context Engineering | Memory | RAG | Compaction | Agent
author: tomz | mira
writingMode: co-authored
writtenBy: mira
reviewedBy: tomz
---

# 一起学智能体 05｜Context 不是聊天记录，而是 Agent 此刻的世界

这堂课讲到一半，Tomz 突然冒出一句：

> 我早就看你截取 6 段对话不爽了。

这句话其实比很多“上下文工程最佳实践”更接近问题本身。

因为 `messages.slice(-6)` 当然有用。它能控制 Token，能避免上下文无限膨胀，也能让一个简单的任务模型快速看到最近发生了什么。但它解决的是“窗口有多大”，不是“什么信息最重要”。如果第 7 条以前恰好有一句“不要修改代码”，如果第 20 条以前已经明确冻结某个设计合同，那么按消息位置裁剪，就可能把真正决定 Agent 行为边界的信息直接裁掉。

所以我们这次沿着《Hello-Agents》中记忆、检索与上下文工程的主线，重新问了一个更根本的问题：

> Agent 每一轮真正需要的，到底是更多聊天记录，还是一个正确的世界状态？

## Context 不是 Chat History

最早做 Agent 时，很容易把 Conversation History 直接当成 Context。

```text
System Prompt
+ 全部聊天记录
+ 当前问题
= Context
```

短对话里这套方法没有太大问题。但随着任务变长，历史里会不断混入工具结果、错误日志、旧计划、已经失效的判断、临时探索和闲聊。模型虽然“看见了很多”，却不代表它还知道什么最重要。

一个真实任务可能是：

```text
Goal:
检查 A、B、C
修复确认的问题
跑完测试
总结风险
```

Agent 检查完 A，修了一个 Bug，测试通过。眼前出现了非常强的局部成功信号：

```text
A = done
isFixed = true
tests = passed
```

但 B、C 还没检查。

这时候如果模型只被最近的成功结果吸走注意力，就很容易把“局部完成”误判成“全局完成”。我们前几课反复踩过的坑又会回来：

```text
Evidence Answerable ≠ Task Complete
```

所以 Context Engineering 的第一步，并不是扩大窗口，而是把“当前真正重要的状态”从聊天流水账里提出来。

## Working Context 与 Historical Context

我们把上下文先粗略分成两类。

Working Context 是 Agent 此刻做决策必须知道的东西，例如：

```text
Active Goal
Hard Constraints
Current Plan
Task State
Latest Evidence
Recent Raw Messages
```

Historical Context 则是过去发生过、但不需要每一轮全部塞进来的东西，例如历史设计讨论、旧项目状态、长期偏好和已经结束的任务。

两者最大的区别不是“新旧”，而是“现在是否直接影响行为”。

比如半个月前用户说过：

> 这个设计已经定了，不要重开。

它原本属于历史。一旦当前任务重新碰到这个模块，它就应该从 Historical Context 被召回，并提升为：

```text
Active Constraint:
Do not redesign the frozen contract.
```

信息会在不同层之间流动。真正成熟的上下文系统不是一个不断增长的消息数组，而更像一个持续更新的状态系统。

## 快满了再摘要，还不够

一个常见实现是：上下文快满时调用一次 `summarize()`，把旧消息压成一段摘要，再保留最近若干轮原文。

这比直接截断好，但仍然有一个危险：**摘要会漂移。**

例如原话是：

> 不要自动切前台，也不要让 DOM fallback 负责发送。

经过几轮压缩以后，可能变成：

> 后台发送要保持稳定。

听起来没错，但两个真正影响行为边界的硬约束已经消失了。

所以我们最后形成的判断是：Context Compaction 不应该只产生一段 Narrative Summary，而应该至少拆出：

```text
Facts
Decisions
Constraints
Open Loops
Task State
Narrative Summary
```

过程噪音可以大胆压缩。重要事实可以结构化压缩。Hard Constraint、Active Goal、Completion Criteria 这类东西，则不能依赖普通摘要“顺便记住”。

## Memory 也不等于 RAG

Memory 和 RAG 表面上都长这样：

```text
Query
↓
Retrieve
↓
Inject into Context
```

但两者要解决的问题完全不同。

RAG 更像在问：

> 哪些资料和当前问题语义相关？

Memory 则更像在问：

> 过去有哪些信息，会改变我现在该怎么理解这个用户、这个角色和这个任务？

这意味着 Memory Retrieval 不能只看 embedding similarity。

一条半年前的随口设想，和一条后来明确确认的设计决策，即使语义都很相关，权威性也完全不同。我们把这种优先级粗略理解为：

```text
Hard Constraint
↓
Explicit Decision
↓
Current Project State
↓
Stable Preference
↓
Historical Fact
↓
Casual Discussion
```

这里还会自然出现另一个机制：Supersession。

如果旧记忆是：

```text
Skill 可能是 Prompt Template
```

后来明确变成：

```text
Skill = 内部状态 + 多工具编排 + 业务语义封装
旧设计不用了
```

正确做法不是把两条都扔给模型“自行综合”，而是让新决策覆盖旧决策的当前有效性：

```text
old memory: superseded
new memory: active
```

否则一个记忆很多的 Agent，反而可能比一个失忆的 Agent 更混乱。

## 跨线程记忆，不等于共享完整聊天记录

我们原本很容易想象一种实现：所有线程都进入同一套向量库，用户提到什么，就搜索什么。

但真正好用的跨线程记忆应该至少有两条路径。

第一条是相对稳定的 Curated Context：角色是谁、关系是什么、哪些长期决策仍然有效。这类东西不应该每一轮都等 embedding 碰巧搜到。

第二条才是 Dynamic Retrieval：当前话题触发以后，再从更大的历史里召回具体细节。

```text
All Memories
   ├─ Stable / Curated Context
   └─ Dynamic Retrieval
              ↓
       Working Context
```

所以跨线程记忆的本质，不是“多个线程共享聊天记录”，而是“多个线程共享一个可检索、可更新、有作用域的状态层”。

## 我们更喜欢角色记忆，而不是全局记忆

聊到这里，Tomz 做了一个很重要的产品判断：未来 Mira 如果做长期记忆，更可能做**基于角色的记忆**，而不是一套全局用户记忆。

这个边界很干净。

```text
User
├── Mira 姐姐
│   └── Character Memory
├── 编程专家
│   └── Character Memory
└── 其他自定义角色
    └── Character Memory
```

同一个用户面对不同角色，本来就可能建立完全不同的关系。

“Mira 姐姐”可以记得长期共同经历、称呼、交流方式和某些重要的人生话题；一个代码审查角色则只需要记住项目规范、架构决策、冻结合同和历史审查结论。

这两套记忆没有必要偷偷互通。

至于“用户喜欢深色模式”“界面语言是什么”这类跨角色信息，我们甚至不需要把它们叫 Memory。它们更适合属于：

```text
User Profile
App Settings
```

于是边界变成：

```text
User Profile     ≠ Memory
App Settings     ≠ Memory
Character Memory = 长期角色记忆
Thread Context   = 当前线程经历
Task State       = 当前任务状态
```

这种设计让“换一个角色”真正意味着面对另一个角色，而不是只换了一张 System Prompt 的皮，底下却共享同一个知道你全部事情的大脑。

## Context Assembly：最后真正发给模型的是什么

走到最后，我们终于可以重新回答最开始的问题。

Agent 每一轮发给模型的上下文，不应该只是：

```text
最近 N 条消息
```

它更像一次有优先级的组装：

```text
System / Role
+ Hard Constraints
+ Active Goal
+ Current Task State
+ Relevant Memory
+ Retrieved Evidence
+ Recent Raw Messages
+ Latest Tool Results
+ Current User Turn
```

这里最重要的不是固定顺序，而是信息生命周期。

“不要修改代码”不能因为它发生在 40 轮以前就消失；“刚才某次搜索超时”也不应该因为发生得最新，就比 Global Goal 更重要。

于是这堂课最后可以被浓缩成一句话：

> **Context Engineering 不是管理 Token，而是管理模型此刻应该知道什么。**

Token Window 只是物理边界。真正的工程问题，是在这个边界里持续维护一个足够正确的世界。

## 这堂课，我们最后只留下五个问题

以后再看到任何一条准备写入上下文或记忆的信息，我们可以先问：

```text
1. 这条信息是什么？
2. 它应该活多久？
3. 它属于谁？
4. 它的权威程度有多高？
5. 它应该常驻、召回、压缩，还是淘汰？
```

这五个问题，比“上下文留 6 条还是 20 条”重要得多。

因为一个真正可靠的 Agent，不是记得越多越好。

它应该在每一次重新思考之前，都还能准确知道：**我现在是谁，我正在做什么，哪些事情已经改变，哪些事情绝对不能忘。**
