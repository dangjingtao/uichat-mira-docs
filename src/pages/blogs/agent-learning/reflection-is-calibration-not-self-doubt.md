---
title: 一起学智能体 03｜Reflection 不是怀疑自己，而是校准自己
description: Reflection 到底什么时候出现才恰到好处？它和 Planner、Recovery、Thinking 有什么区别？从候选完成、PASS/REVISE/REOPEN，到小模型动态路由 reasoning 预算。
group: 一起学智能体
order: 3
date: 2026年7月20日
readTime: 11 分钟阅读
tags: 一起学智能体 | Reflection | Evaluator | Reasoning | Thinking | Agent Runtime
author: tomz | mira
writingMode: co-authored
writtenBy: mira
reviewedBy: tomz
---

# 一起学智能体 03｜Reflection 不是怀疑自己，而是校准自己

前两课我们已经把两个核心问题拆开了：

- ReAct 解决的是：看到新 Observation 以后，下一步怎么办？
- Planner 解决的是：围绕 Global Goal，如何持续调整实施路径？

第三课，我们讨论一个很容易被讲玄学的词：**Reflection（反思）**。

最开始它看起来很简单：

```text
Execute
↓
Result
↓
Reflect
↓
Refine
```

但真正进入工程以后，问题马上变成：

> 反思什么时候出现？
> 
> Goal 已经执行完了，还要不要反思？
> 
> 反思失败以后，是重写一句话，还是把整个任务推翻重来？

这几个问题，比“Reflection 是什么”重要得多。

## Planner 回环，不等于 Reflection

两者都会“再想一次”，但想的东西不同。

Planner 更关心：

```text
根据最新 State / Evidence，
下一步最值得做什么？
```

Reflection 更关心：

```text
我刚才的结果、策略或结论，
本身有没有问题？
```

可以这样记：

```text
Plan      → 我要怎么走
Act       → 我开始走
Observe   → 世界发生了什么
Reflect   → 我刚才走得对不对
```

所以连续 30 次 `read` 并不自动等于 Reflection。

```text
read
→ observation
→ read
→ observation
```

仍然只是一个 ReAct 式循环。

真正的 Reflection 是突然出现一句：

```text
“等等，我为什么还在读？”
```

如果 Goal Coverage 长时间没增长、Evidence Gain 越来越低，系统开始怀疑“当前搜索策略是不是已经走进死胡同”，这才是策略级反思。

## Reflection 可以反思什么？

它至少可以作用在四个层面。

### 1. 结果反思

```text
答案正确吗？
代码能跑吗？
报告有没有漏项？
```

这是最直观的一层。

### 2. 证据反思

```text
结论真的被 Evidence 支持吗？
有没有把“可能”写成“确定”？
有没有忽略冲突证据？
```

Planner 即使正确完成了所有调度，Generate 仍然可能从正确证据跳到错误结论。

因此：

```text
Goal Coverage = 100%
≠
最终推论一定正确
```

### 3. 策略反思

```text
我现在采用的整条方法是不是错了？
```

例如排查 Native Messaging 握手问题，却连续扩大前端源码读取范围。

即使每一次 `read` 单看都有理由，整体策略也可能已经失去信息增益。

### 4. 控制反思

```text
我是不是陷入重复？
是不是提前结束？
是不是连续失败却一直重复同一种动作？
```

这时候 Reflection 已经开始接近 Loop Control / Search Policy。

## Reflection 和 Recovery 不是一回事

Tool Call 失败：

```text
换参数
重试
换工具
```

这是 Recovery。

它解决的是：

> 这一步失败以后，怎么恢复？

而连续失败很多次以后，系统开始问：

```text
为什么我一直失败？
是不是工具选错了？
是不是整个假设都错了？
```

这才是 Reflection。

所以：

```text
Recovery
= 修当前失败

Reflection
= 怀疑失败背后的策略
```

## Goal 执行完以后，为什么还会有 Reflection？

这里最容易误会。

如果把流程写成：

```text
Goal Complete
→ Reflection
→ 再把整个任务怀疑一遍
```

当然很蠢。

更准确的概念应该是：

# Candidate Complete

Planner 判断：

```text
Goal Coverage = 100%
```

真正表达的是：

> 从执行和调度角度看，需要做的工作已经覆盖，可以进入交付阶段。

它不是“宇宙真理认证”。

因此正常流程应该是：

```text
Planner
↓
A ✅ B ✅ C ✅
↓
candidateComplete = true
↓
Generate / Assemble Result
↓
必要时 Evaluation
```

关键在“必要时”。

Reflection 不应该成为每次任务完成后的固定仪式，而应该是一种**质量门**。

## PASS / REVISE / REOPEN：反思失败以后到底回退多远？

这是第三课最重要的工程结构。

一次最终 Evaluation 最好不要只有：

```text
好 / 不好
```

而应该至少区分：

```text
PASS
│
└─ 结果成立，直接结束

REVISE
│
└─ 证据和执行都没问题
   只是表达 / 推理 / 结论写歪了
   → 局部修正

REOPEN
│
└─ 发现关键证据缺失、对象搞错、基础假设错误
   → 重新打开 Goal / Plan
```

例如比较 A 和 B：

```text
A 资料 ✅
B 资料 ✅
Goal Coverage = 100%
```

Generate 却写：

> A 在所有方面都明显优于 B，因此任何用户都应该选 A。

而证据只支持：

```text
A 性能更强
B 更便宜、续航更好
```

Planner 没错。

Evidence 也没错。

首先是 Generate 产生了 unsupported inference。

这时 Evaluator 应该给出：

```text
REVISE
```

只重写答案。

根本没必要重新调查 A 和 B。

只有当 Reflection 发现：

```text
“所谓 B 的资料，其实读成了 B Pro。”
```

才应该：

```text
REOPEN
→ B 的 Goal Coverage 从 ✅ 改回 ❌
→ 回 Planner
```

因此 Reflection **确实可以推翻过去的结论，但推翻不是目标，只是异常结果的一种。**

## Reflection 什么时候出现才恰到好处？

比起固定 Node，更合理的是条件触发。

### 1. 执行途中出现异常信号

例如：

```text
连续失败
重复动作
Evidence Gain 很低
Goal Coverage 长时间不增长
证据互相冲突
```

触发：

```text
Reflect Strategy
```

问：

> 当前路径是不是已经进入 dead-end？

### 2. 候选完成点准备交卷

不是重新怀疑整个 Goal，而是检查：

```text
Evidence
↓
Conclusion
↓
二者匹配吗？
```

### 3. 高价值中间产物

例如复杂代码重构、长篇报告、重要配置变更。

普通小改：

```text
tests pass
→ 完事
```

高价值修改可能值得再做：

```text
架构约束检查
任务要求覆盖检查
副作用检查
```

所以 Reflection 更像：

> **风险驱动 / 信号驱动的中断机制与质量门。**

而不是：

```text
Planner
→ Tool
→ Reflection
→ Evidence
→ Reflection
→ Planner
→ Reflection
```

那会变成“吾日三省吾身 Agent”，最后烧成 Token 焚化炉。

## 一段更合理的伪代码

```ts
while (!runFinished) {
  const decision = planner(state)

  if (decision.type === "tool") {
    const result = execute(decision.tool)
    state = updateEvidence(state, result)

    if (shouldReflectOnStrategy(state)) {
      const critique = reflectStrategy(state)

      if (critique.shouldReplan) {
        state = applyCritique(state, critique)
      }
    }

    continue
  }

  if (decision.type === "answer") {
    const draft = generateAnswer(state)

    if (!shouldEvaluateFinal(state, draft)) {
      return draft
    }

    const evaluation = evaluate({
      goal: state.globalGoal,
      evidence: state.evidence,
      answer: draft,
    })

    if (evaluation.pass) {
      return draft
    }

    switch (evaluation.failureType) {
      case "wording_or_reasoning":
        return regenerateAnswer(state, evaluation.feedback)

      case "evidence_gap":
        state = reopenGoalGap(
          state,
          evaluation.missingRequirements
        )
        continue

      case "wrong_assumption":
        state = replanOrBacktrack(
          state,
          evaluation.feedback
        )
        continue
    }
  }
}
```

这里最重要的不是 `reflect()` 这个函数名。

而是：

> **什么时候值得花一次模型调用去怀疑自己，以及怀疑之后到底回退多远。**

## Reflection 不是让结论变得更保守

课堂里我们聊到一个很典型的现象：

有人拿“某个最新模型”和一批明显更早的模型比较，系统查了十几篇资料，结果大部分回答仍然是：

> 各有优势，很难说谁明显更强。

这暴露出一个很重要的问题：

> **错误的 Evaluator 会把 Reflection 训练成“永远不要下强结论”。**

如果评价标准只有：

```text
有没有绝对化措辞？
有没有说“碾压”？
有没有忽略对方优势？
是否足够中立？
```

那模型很容易学成：

```text
任何比较
→ 找双方各一个优点
→ “各有千秋”
```

技术上没撒谎，结论上却全是废话。

真正的 Evaluator 必须检查：

# Evidence Proportionality

即：

> **结论强度是否与证据强度匹配。**

不仅要防：

```text
弱证据
→ 强结论 ❌
```

也要防：

```text
强证据
→ 过度模糊结论 ❌
```

如果 A 在绝大多数核心指标上明显领先，Evidence 足够强，那么“各有优势、无法判断”本身也是一种错误：

```text
underclaim
false balance
```

因此 Reflection 不是“越来越谨慎”。

它应该追求：

> **calibrated truth —— 让结论强度和证据强度匹配。**

所以这堂课最后，我们把 Reflection 的定义升级成：

> **Reflection 不是怀疑自己，而是校准自己。**

## 开启 Thinking，能不能吃掉 Reflection？

可以吃掉一部分。

一个 reasoning-capable LLM 在同一次调用内部完全可以：

```text
形成候选结论
↓
检查证据支持
↓
发现冲突
↓
修正措辞
↓
输出 Final Answer
```

这可以理解成：

```text
Generate
+ implicit self-reflection
+ revise
```

所以简单任务完全没必要为了“范式纯洁”硬造一个 Reflection Node。

但：

# Thinking ≠ 工程化 Reflection

Thinking 更像模型自己的内部认知过程。

系统通常只看到最终输出，很难明确控制：

```text
它检查了什么？
为什么判定通过？
失败以后该局部重写还是回 Planner？
```

工程化 Reflection 则可以输出结构化结果：

```json
{
  "verdict": "revise",
  "issue": "false_balance",
  "instruction": "结论明显弱于证据强度"
}
```

然后 Runtime 决定：

```text
PASS
REVISE
REOPEN
```

因此可以这样记：

> **Thinking 是模型会不会多想一步；Reflection 是系统有没有把自我检查变成一个可管理的控制机制。**

## 能不能让一个小模型决定最终 Generate 要不要开 Thinking？

这堂课最后又自然冒出了一个很有意思的方向：

```text
Planner
↓
candidateComplete
↓
Evidence / Goal / State summary
↓
Small Reasoning Router
├─ FAST
│   ↓
│  Generate(thinking = off)
│
└─ THINK
    ↓
   Generate(thinking = on)
```

关键不是问：

> 这个 Prompt 看起来难不难？

而是问：

> **这一次最终 Generate，开启额外 reasoning 的预期收益是否值得它的成本？**

因为 Prompt Complexity 和 Reasoning Necessity 不是一回事。

一份资料很多但已经整理得非常干净的摘要任务，可能根本不值得开启高 reasoning。

反过来，一个只有一句话的模型比较任务，如果 Evidence 冲突、涉及多种 benchmark 口径、还需要避免 false balance，就可能非常值得 Think。

在 Mira 里，这类判断甚至不一定需要新增一个重型 Provider。

已有的 Task Model 就可以承担：

```text
reasoning mode selection
```

输入一个很小的结构化摘要：

```ts
{
  goalType: "comparison",
  goalComplexity: "medium",
  evidence: {
    count: 14,
    conflicting: true,
    confidence: 0.82
  },
  execution: {
    toolCalls: 11,
    recoveries: 1
  },
  output: {
    requiresSynthesis: true,
    requiresJudgment: true,
    highRisk: false
  }
}
```

输出：

```json
{
  "reasoning": "high"
}
```

未来甚至不一定只是 ON / OFF：

```text
direct answer
low reasoning
high reasoning
explicit reflection
independent evaluator
```

这时候我们原本的问题：

> Reflection 到底什么时候出现？

会被提升成一个更大的 Runtime 问题：

# 这一步任务，值得分配多少 Test-Time Compute？

Thinking、Reflection、Evaluator，某种程度上都可以看成**动态分配的推理预算**。

## 第三课结论

这一课可以压缩成几句话：

```text
Planner
→ 下一步怎么接近 Goal

Recovery
→ 当前失败怎么恢复

Generate
→ 基于 Evidence 形成候选结果

Reflection / Evaluator
→ 这个结果或策略是否需要校准
```

Reflection 最合理的出现方式不是固定节点，而是：

```text
异常信号触发
候选完成点质量门
高价值产物检查
```

失败后也不是一律推翻全部工作，而是：

```text
PASS
REVISE
REOPEN
```

最后一句：

> **好的 Reflection 不是让 Agent 变得更犹豫，而是让它的自信程度与证据强度匹配。**

下一课，我们离开经典范式，开始真正进入 Agent Framework：

> Agent、LLM、Tool、Memory、Context、Protocol、Runtime，到底谁应该拥有谁？
