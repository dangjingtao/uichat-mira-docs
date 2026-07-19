---
title: 一起学智能体 01｜ReAct 不是“有 Tool 就继续 Call”
description: 从一次真实的工具死循环观察出发，拆开 ReAct 的最小循环、隐式状态与完成判断，并映射到 Mira 的 Planner 与 Evidence。
group: 一起学智能体
order: 1
date: 2026年7月19日
readTime: 7 分钟阅读
tags: 一起学智能体 | ReAct | Agent Loop | Planner | Context
author: tomz | mira
writingMode: co-authored
writtenBy: mira
reviewedBy: tomz
---

# 一起学智能体 01｜ReAct 不是“有 Tool 就继续 Call”

这个专题从一个很实际的问题开始。

我们看着一个代码智能体连续执行了一百多步 `read`。它不断读取文件、继续读取、再继续读取，看起来像一个停不下来的循环。

于是问题来了：

> Agent 是不是只要发现还有 Tool，就会继续 Call？

不是。

至少在经典的 ReAct 范式里，真正驱动循环的从来不是“还有工具可以调用”，而是：**工具返回的新观察改变了上下文状态，模型基于新的状态重新做了一次决策。**

这一点看起来简单，却几乎决定了我们怎样理解今天所有基于大模型的 Agent。

本文是「一起学智能体」专题第一期。学习主线参考 Datawhale 的开源项目 [Hello-Agents](https://github.com/datawhalechina/hello-agents)，但不会照着教材逐章复述。我们会把概念不断拉回真实工程，尤其是 UIChat Mira 正在经历的 Planner、Tool、Evidence、Context 与完成判断问题。

## 最小 ReAct 到底是什么

Hello-Agents 在第四章把 ReAct 概括为一个不断循环的过程：

```text
Thought → Action → Observation → Thought → ...
```

其中：

- `Thought`：模型根据当前任务和已有信息判断下一步；
- `Action`：决定执行一个动作，通常是调用工具；
- `Observation`：工具执行后返回的新信息；
- 然后再次进入新的 `Thought`。

所以真正的控制流更像这样：

```text
用户任务
   ↓
LLM 决策
   ↓
调用工具
   ↓
工具返回 Observation
   ↓
Observation 进入上下文
   ↓
再次调用 LLM
   ↓
重新判断
   ├── 还缺信息 → 再调用工具
   └── 已经完成 → 输出答案
```

关键在最后那次“重新判断”。

Tool Call 本身不会自动生成下一次 Tool Call。

是新的 Observation 改变了当前状态，模型重新看了一遍“我要做什么、我已经知道什么、下一步还能做什么”，然后才决定继续还是停止。

## “回看证据”不一定是一个独立节点

我们很容易带着工程框架的视角去想：一个成熟 Agent 应该有 Planner、Evidence Review、Completion Checker，甚至还应该有专门的 Reflection Node。

但最原始的 ReAct 并不需要这些名字。

它可能只是不断增长的一段对话历史：

```text
user: 查清楚 A、B、C
assistant: call read(A)
tool: A 的结果
assistant: call read(B)
tool: B 的结果
assistant: ...
```

然后再次调用：

```text
LLM(messages, tools)
```

这次新的 LLM 调用，本身就是一次“回看”。

模型重新读到了原始目标，也读到了前面所有 Action 与 Observation，于是它可以从自然语言上下文中推断：A 已经完成了，B 有结果了，C 还没做。

因此，ReAct 可以没有显式的状态字段，却仍然表现得像一个状态机。

## 状态可以是隐式的

如果我们用工程化的数据结构表达，一个 Agent 的状态可能长这样：

```text
State(t) = {
  globalGoal,
  history,
  observations,
  evidence,
  goalCoverage,
  failures,
  availableTools
}
```

但最小 ReAct 并不一定真的维护这些字段。

它可能只有上下文：

```text
用户要 A、B、C。
A 已经查到了。
B 已经查到了。
C 还没有查。
```

模型自己从文本里“读出”当前状态。

于是每一轮实际上都在做：

```text
Decision = LLM(Current Context + Tools)
```

工具列表甚至可以几乎不变。

比如一个 CLI Agent 每轮都只有：

```text
read
write
search
terminal
```

真正不断变化的是上下文状态，而不是工具数量。

这就解释了为什么今天很多看起来能力惊人的 Coding Agent，底层暴露给模型的工具其实非常少。

**少量稳定工具 + 动态上下文 + 每轮重新决策，就足以形成复杂行为。**

## 为什么它又会陷入一百多次 read

问题也恰恰出在这里。

如果所有控制责任都交给模型隐式完成，那么模型每轮不只是在“选择工具”。它实际上还同时承担：

```text
理解刚才得到了什么
判断当前进度
判断证据是否充分
决定下一步动作
判断整个任务是否完成
```

这些责任全部藏在一次 Thought 里。

于是一个 Agent 可以非常灵活，也可以非常失控。

它可能不断觉得：

> 再读一个文件，我就更确定了。

然后：

```text
read A
→ 得到一些信息
→ read B
→ 得到一些信息
→ read C
→ 得到一些信息
→ 还是不确定
→ read D
→ ...
```

只要模型每轮都判断“还有潜在信息增益”，循环就会继续。

所以看到一个 Agent 连续执行一百多次工具调用，不能立刻得出“它没有回看证据”的结论。

它可能每轮都在回看。

真正缺失的，往往是更可靠的**完成判断**与**停止条件**。

## 有证据，不等于任务完成

假设用户要求：

```text
查清楚 A、B、C，并给出结论。
```

Agent 已经获得：

```text
A ✅
B ✅
C ❌
```

这时它可能已经拥有很多高质量证据，甚至足以写出一段看起来不错的回答。

于是会出现一个非常危险的判断：

```text
canAnswer = true
```

然后直接结束。

但正确的状态其实可能是：

```text
canAnswer = true
taskComplete = false
```

这两个状态完全可以同时成立。

“已经有东西可以回答”和“用户交给我的全部目标已经完成”，不是一回事。

更完整的 Agent 需要知道：

```text
Goal:
- A
- B
- C

Coverage:
- A ✅
- B ✅
- C ❌
```

这就是 Goal 与 Goal Coverage 的区别。

只记住原始目标还不够。系统还需要动态知道：**目标的哪些部分已经被覆盖，哪些部分仍然悬空。**

## 停止，也不等于完成

再往前一步。

假设 C 连续调用工具失败，恢复次数已经耗尽，或者上下文已经接近容量上限。

此时：

```text
A ✅
B ✅
C ❌
canAnswer = true
canContinue = false
```

Agent 应该停止继续执行。

但这仍然不意味着：

```text
taskComplete = true
```

它可以诚实地结束本轮运行：

> A、B 已完成；C 因为工具失败或当前资源限制尚未完成。本轮无法继续可靠执行。

所以至少要区分三个概念：

```text
Goal Complete
用户目标是否真的全部完成？

Loop Terminated
当前循环是否应该停止？

Run Completed
这次运行是否正常收尾？
```

完全可能出现：

```text
GoalComplete = false
LoopTerminated = true
RunCompleted = true
```

事情没办完，但这一轮已经没有条件可靠继续，而且系统正常、诚实地完成了收尾。

这比一个粗暴的 `status = completed` 精确得多。

## 回到 Mira：显式化 ReAct 的隐式控制

UIChat Mira 当前的 Agent Loop 大致可以抽象为：

```text
Planner
→ Normalize
→ Policy
→ ToolNode
→ Evidence
→ Planner
```

如果把名字拿掉，它和 ReAct 有非常明显的同构关系：

```text
ReAct:
Reason → Action → Observation → Reason

Mira:
Planner → Tool → Evidence → Planner
```

区别不在于 Mira “不是 ReAct”。

更准确地说，Mira 正在尝试把 ReAct 里原本藏在模型 Thought 中的一部分责任显式化。

比如：

```text
answerReadiness
recoverable
terminal
latestSummary
goalCoverage
completion
```

原始 ReAct 可能只需要模型说一句：

> 我觉得已经够了。

工程化 Agent 则希望知道：

```text
globalGoal = A + B + C
coverage = A✅ B✅ C❌
canAnswer = true
taskComplete = false
retryCount = 3
evidenceGain = low
```

然后再做下一步判断。

所以一个很有用的理解是：

> **Mira 不是在抛弃 ReAct，而是在给 ReAct 补仪表盘。**

## 这一期真正要记住的四句话

第一，**Tool Call 不会自动产生下一次 Tool Call。**

真正产生循环的是：Observation 更新状态以后，控制权重新回到决策。

第二，**ReAct 的“回看证据”通常就是下一轮 LLM 调用本身。**

不一定需要一个名字叫 Evidence Review 的节点。

第三，**最小 ReAct 没有独立 Planner。**

规划、进度判断、工具选择和完成判断，都可以隐式藏在每一轮 Thought 里。

第四，**显式 Planner / Evidence / Goal Coverage 的价值，是把隐式控制逻辑工程化。**

这样它才更容易被观察、测试、约束和修复。

下一期，我们继续一个和 Mira 更直接的问题：

> **Plan-and-Solve 和 ReAct 到底差在哪？Planner 应该先规划整条路，还是每一步根据新证据重新规划？**

这会把“静态计划”和“动态规划式 Agent Loop”真正拆开。