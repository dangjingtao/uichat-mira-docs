---
title: 一起学智能体 02｜Plan 是假设，Goal 才是合同
description: 从 Plan-and-Solve 到滚动规划：Planner 到底是在生成计划，还是在控制 Agent 接近目标？顺带谈谈回溯与动态规划为什么完全可以进入 Agent 工作流。
group: 一起学智能体
order: 2
date: 2026年7月19日
readTime: 9 分钟阅读
tags: 一起学智能体 | Planner | Plan-and-Solve | ReAct | Backtracking | Dynamic Planning
author: tomz | mira
writingMode: co-authored
writtenBy: mira
reviewedBy: tomz
---

# 一起学智能体 02｜Plan 是假设，Goal 才是合同

第一课我们拆开了 ReAct：Tool Call 并不会自动产生下一次 Tool Call，真正驱动循环的是 Observation 更新状态以后，模型重新做出决策。

第二课，我们把问题往前推了一步：

> Planner 到底是在“做计划”，还是在“控制循环”？

这个问题看似只是命名，实际上会决定一个 Agent 遇到新证据时，是继续照着旧施工图往前冲，还是能够重新判断：**现在这条路还通不通？**

学习主线仍然参考 Datawhale 的开源项目 [Hello-Agents](https://github.com/datawhalechina/hello-agents)，但我们会继续把教材里的经典范式拉回 UIChat Mira 的真实 Agent Loop。

## Plan-and-Solve：Planner 先画施工图，然后下班

Hello-Agents 第四章里的 Plan-and-Solve 是一种非常纯粹的“先规划、后执行”结构。

可以抽象成：

```text
User Goal
   ↓
Planner
   ↓
[A, B, C, D]
   ↓
Executor
   ↓
A → B → C → D
```

Planner 接收完整问题，将任务拆成一组有逻辑顺序的子步骤；Executor 再拿着原始问题、完整计划、历史步骤结果和当前步骤，逐项执行。

教材里的核心实现甚至就是：

```python
plan = planner.plan(question)
final_answer = executor.execute(question, plan)
```

Executor 内部再通过一个普通的 `for step in plan` 顺序执行。

因此，纯 Plan-and-Solve 里的 Planner 更像一个**计划生成器**，而不是持续参与运行的控制器。

它负责：

```text
“这个任务大概要怎么做？”
```

而不是持续回答：

```text
“新证据已经出现，现在下一步还应该这么做吗？”
```

这也是它最适合结构明确任务的原因：数学应用题、报告结构、模块化代码生成……这些任务的执行路径通常可以在开始时比较稳定地确定。

## ReAct：每走一步，都重新看看路

ReAct 的结构正好相反。

```text
Reason
  ↓
Action
  ↓
Observation
  ↓
Reason again
```

它未必先生成一份完整施工图。

每一轮只要 Observation 发生变化，模型就可以重新判断下一步。

比如用户要求：

> 查一个新模型的社区评价，整理优点、缺点，最后给出判断。

Plan-and-Solve 可能先列：

```text
1. 搜索总体评价
2. 搜索正面观点
3. 搜索负面观点
4. 比较观点
5. 总结
```

如果第一步突然发现用户给的型号名称本身存在歧义，纯顺序执行仍可能继续搜索那个错误型号的“正面评价”和“负面评价”。

ReAct 则更自然地变成：

```text
Search
↓
Observation：型号存在歧义
↓
重新决策
↓
先确认正确对象
```

所以两者最根本的区别不是“有没有 Planner”，而是：

> **计划是在开始时固定下来，还是会随着新状态重新参与决策。**

## 现代 Agent 更像“滚动规划”

真实工程通常不会在 ReAct 和 Plan-and-Solve 之间二选一。

更常见、也更合理的是一种混合结构：

```text
Global Goal
    ↓
形成当前任务结构 / Rough Plan
    ↓
选择当前最值得执行的一步
    ↓
Execute
    ↓
Observation / Evidence
    ↓
Update State
    ↓
重新检查：
- 原计划还成立吗？
- 当前步骤完成了吗？
- Goal Coverage 变化了吗？
- 下一步还应该照旧吗？
```

我们把它称作“滚动规划”会比直接叫“动态规划”更精确一些：

> **我知道大概要往哪里走，但每走一步都会重新看地图。**

它不要求每轮都重新生成完整计划。

更便宜的实现可能只是：

```text
原计划仍有效？
├─ 是 → 执行下一步
└─ 否 → 局部重规划
```

这能避免 Planner 每一步都烧掉大量 Token 重写一遍整张施工图。

## Mira 的 Planner，其实更像 Planner + Controller

UIChat Mira 当前稳定的 Agent Loop 可以简化成：

```text
Planner
→ Normalize
→ Policy
→ ToolNode
→ Evidence
→ Planner
```

这里最关键的箭头是：

```text
Evidence → Planner
```

这意味着 Mira 的 Planner 并不是 Hello-Agents 里那种“规划一次就退出”的 Planner。

它实际上在做：

```text
Planner(State₀)
→ 选择 A

Evidence(A)
→ State₁

Planner(State₁)
→ 选择 B / X / Recover / Answer
```

所以更准确的职责是：

```text
Planner + Controller
```

或者：

> **Goal-aware iterative controller —— 面向全局目标的迭代式控制器。**

它每一轮至少需要回答三个问题：

```text
1. 我现在在哪里？
   State / Evidence

2. 距离用户目标还缺什么？
   Goal Coverage

3. 现在最应该做什么？
   Next Action
```

## Tool Success、Evidence Sufficient、Goal Complete 是三回事

这是这堂课里最重要的责任边界。

假设用户要求完成：

```text
A + B + C
```

Tool 成功完成 A，只能说明：

```text
Tool Success = true
```

Evidence 足够支持关于 A 的判断，只能说明：

```text
Evidence Sufficient for A = true
```

但全局状态仍可能是：

```text
A ✅
B ❌
C ❌

Goal Complete = false
```

因此：

```text
Tool success
≠ Step completion
≠ Global goal completion
```

如果一个 Planner 在 `read_locate` 找到相关文件以后，因为 `answerReadiness = true` 就直接进入 Answer，那么真正出错的责任主体不是 ToolNode，也不是 Generate。

是 Planner / Controller 没有继续比较：

```text
当前证据
vs
原始 Global Goal
```

换句话说：

> **Evidence Answerable ≠ Task Complete。**

## Plan 是假设，Goal 才是合同

这是第二课最值得记住的一句话。

假设：

```text
Goal：完成 A、B、C
```

初始 Planner 认为最佳路线是：

```text
Plan₀：A → B → C
```

执行 A 后，新证据证明：

```text
B 已经没有必要，
真正必须完成的是 X。
```

正确行为应该是：

```text
Goal：不变

Plan₁：A✅ → X → C
```

而不是因为 Planner 之前写过 B，就坚持把 B 的尸体也查完。

因此：

```text
Goal = relatively stable
Plan = mutable
State = continuously updated
Next Action = recomputed
```

Goal 描述“我要到哪里”。

Plan 只是“根据我现在掌握的信息，我认为应该怎么去”。

**地图可以改，目的地不能因为地图画错了就消失。**

## 为什么不能把它直接叫“动态规划”？

这里有一个我们学习过程中的真实插曲。

Tomz 经常把这种 Agent Loop 称作“动态规划”：

```text
当前状态
→ 做一步
→ 得到新证据
→ 更新状态
→ 重新规划
```

这个工程直觉其实完全正确。

但算法课里的 Dynamic Programming 有更严格的含义，通常要求：

```text
明确状态表示
重复子问题
子问题结果可复用
递推关系 / 价值函数
最优子结构
```

普通 ReAct 或滚动 Planner 并不天然具备这些条件。

它通常只是：

```text
nextAction = LLM(currentState)
```

所以更严谨的说法是：

> **它是动态状态驱动的迭代规划，但未必是严格算法意义上的 Dynamic Programming。**

然而，这并不意味着动态规划和经典搜索算法不能融入 Agent。

恰恰相反，它们非常值得融进去。

## Backtracking：错了以后，不只是“换个想法”

很多 Agent 已经会在自然语言上说：

> 这个方向不行，我换一个方法。

这可以称为“语义上的回溯”。

但真正工程化的 Backtracking 应该拥有：

```text
checkpoint
branch
rollback
restore state
```

例如排查 Bug：

```text
             Root Cause
            /    |    \
        Network Auth Native
          /
      dead end
          ↓
      backtrack
          ↓
         Auth
```

如果 Agent 在 Network 分支连续探索十几步仍然没有信息增益，它不应该只是在这条路上继续补丁式搜索。

更合理的是：

```text
当前 branch = low value / dead end
↓
恢复到上一个 checkpoint
↓
尝试尚未探索的 branch
```

这比一句“让我换个思路”要强得多。

因为它真正定义了：

> **错了以后，回到哪里？哪些状态应该恢复？哪条路已经被证明低价值？**

## Dynamic Programming：Agent 也可以记住“这个子问题我做过”

动态规划里一个非常重要的思想是 Memoization。

Agent 同样会遇到大量重复子问题：

```text
定位文件 A
读取文件 A
分析模块 X

十步以后又需要：
定位文件 A
分析模块 X
```

如果每次都重新 `read_locate → read_open → search`，不仅浪费 Token，也容易制造噪声。

完全可以建立：

```text
memo[subgoal] = {
  result,
  evidence,
  confidence,
  timestamp,
  dependencyVersion
}
```

当 Planner 再次遇到语义等价的子目标时：

```text
memo hit
→ 验证是否仍然有效
→ 直接复用已有 Evidence
```

Tool Result Cache、Evidence Store、Subgoal Artifact、Semantic Cache，本质上都带有记忆化搜索的味道。

真正困难的地方在于 Agent 的 State 不像算法题里的 `dp[i][j]` 那么干净。

一个真实 Agent 状态可能包含：

```text
用户目标
几十轮消息
工具结果
代码工作区当前版本
失败历史
假设
权限状态
环境状态
```

因此最大的挑战是：

```text
State A 和 State B 到底什么时候算“同一个子问题”？
```

再加上 Web、代码仓库和外部环境都会变化，缓存结果还有时效性问题。

所以 Agent 更常见的是短期 Memo、Evidence Cache、Checkpoint，而不是无限制的传统 DP 表。

## 搜索、回溯、记忆化，其实可以组合

一个更有算法味的 Agent 控制器完全可以长成：

```text
              State S0
             /       \
           A           B
         /   \
       A1     A2
       ↓
   dead end
```

执行 A1 后：

```text
memo[A1] = dead_end
```

然后：

```text
backtrack → A2
```

下次遇到相似状态：

```text
查 memo
→ A1 已知低价值
→ 不再重复探索
```

这就是：

```text
Search Tree
+ Backtracking
+ Memoization
```

Agent 不但可以借用这些经典算法思想，而且非常适合借用。

## Planner 之外，也许还存在一个 Search Policy

如果未来继续把 Agent 控制工程化，不一定要把所有责任都塞进 Planner。

一种可能的职责拆分是：

```text
Planner
负责：
目标、任务结构、Goal Coverage

Search Policy
负责：
探索哪个分支
当前路径是否值得继续
是否回溯
是否复用已有状态

Evidence
负责：
新信息与验证结果

Memory
负责：
已探索状态、失败路径与可复用结果
```

于是整个系统可能更像：

```text
             Goal
              ↓
           Planner
              ↓
        Search / Control
       ↙      ↓       ↘
   branch   reuse   backtrack
       ↓
      Tool
       ↓
    Evidence
       ↓
  State Update
       ↓
     Memory
       ↓
 Search / Control
```

这已经不是简单的：

```text
Planner → Tool → Planner
```

而开始接近经典搜索算法、状态机、控制理论与 LLM 推理的混合系统。

## 第二课结论

这期真正要记住的是：

```text
ReAct
= 根据 Observation 持续重新决定下一步

Plan-and-Solve
= 先生成整体计划，再按计划顺序执行

滚动规划
= 保留全局目标与任务结构，但随着 State 更新持续调整 Plan
```

而 Mira 当前的 Planner，更适合理解为：

> **一个面向 Global Goal、依据 Goal Coverage 和最新 Evidence 持续调整实施路径的迭代控制器。**

最后再压缩成一句：

> **Plan 是假设，Goal 才是合同。**

以及这堂课最后那个很重要的旁支：

> **回溯、记忆化和价值评估并不与 LLM Agent 冲突。它们反而可能是让 Agent 从“靠模型感觉不断试”走向真正工程化搜索控制的重要下一步。**

下一期，我们进入 Reflection：

> **“看到了新证据再决定下一步”和“停下来评价自己刚才到底做得对不对”，究竟有什么不同？**
