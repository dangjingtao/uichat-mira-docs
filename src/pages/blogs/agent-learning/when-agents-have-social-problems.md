---
title: 一起学智能体 08｜当 Skill 开始互相调用，Agent 就有了“社会问题”
description: 从 Skill 调 Skill、MiniAgent 和共享 Context 出发，讨论回声室、循环论证、目标洗白、能力洗白与上下文污染这些组合式 Agent 的治理风险。
group: 一起学智能体
order: 8
date: 2026年7月23日
readTime: 10 分钟阅读
tags: 一起学智能体 | Skill Composition | Multi-Agent | Evidence Provenance | Agent Governance
author: tomz | mira
writingMode: co-authored
writtenBy: mira
reviewedBy: tomz
---

# 一起学智能体 08｜当 Skill 开始互相调用，Agent 就有了“社会问题”

我们这堂课本来只想把 Skill 和 MCP 讲明白。

结果讲到 Skill 的执行边界时，Tomz 插了一句话：

> 我总觉得 Skill 和 Agent、Skill 和 Skill 之间的上下文是共享的。这意味着它们可以相互调用，甚至 new 一个 MiniAgent 出来跑。

这句话一说出来，复杂度突然变了。

原来最简单的结构是：

```text
Agent
↓
Skill
↓
Tool
```

但如果 Skill 可以调用另一个 Skill，也可以临时生成一个受约束的 MiniAgent，那么结构会变成：

```text
Agent
├── Skill A
│   ├── Tool
│   ├── Skill B
│   └── MiniAgent X
└── Skill C
```

这时候系统不再只是“函数调用多了一层”。

它开始出现一种很奇怪的东西：

```text
委托
信任
引用
权限
证据传播
观点传播
责任边界
```

换句话说：

> **当多个智能单元可以互相委托、引用和共享信息时，软件开始第一次出现“社会问题”。**

## 先别急着造“父子 Skill”

Skill A 可以调用 Skill B，很容易让人立刻想到：

```text
A 是父 Skill
B 是子 Skill
```

再往下：

```text
A
└── B
    └── C
```

层级树很快就长出来了。

然后问题也会一起长出来：

```text
谁继承谁的 Context？
谁拥有子 Skill 的状态？
B 能不能被 A 和 C 同时复用？
B 更新以后谁受影响？
权限怎么继承？
循环怎么办？
```

所以我们最后更喜欢一个简单得多的模型：

> **Registry 里的 Skill 保持平级，树只在运行时长出来。**

就像函数 A 调用了函数 B，我们不会因此把 B 永久登记成“A 的儿子函数”。

```text
Skill Registry
A
B
C
```

运行时某一次任务可以形成：

```text
Invocation Tree

Agent
└── Skill A
    ├── Skill B
    │   └── Tool
    └── MiniAgent X
```

这是一次调用关系，不是永久组织关系。

一句话：

> **允许组合，不急着建层级。**

这句话能救很多复杂度。

## 共享 Context，不等于共享可变状态

“Skill 的执行状态是封闭的”，不应该被理解成“Skill 之间彼此失忆”。

更合理的是：

```text
Shared Context
= 可以按需继承和裁剪的信息

Local State
= 每个 Skill 自己维护的可变执行状态
```

例如多个 Skill 都可能需要知道：

```text
用户当前 Goal
Hard Constraints
已有 Evidence
当前任务对象
```

但 Skill A 不应该随便去改：

```text
Global Goal
Global Policy
另一个 Skill 的 Local State
```

于是一个更健康的模型是：

```text
Shared Context
mostly read-only

Local State
privately mutable

Outputs
explicit merge
```

主 Agent 仍然持有全局目标。

Skill 只拿到一个局部 Goal，完成自己的局部闭环，再把结果明确返回。

> **Agent 管全局控制，Skill 管局部闭环。**

## 第一个问题很普通：循环调用

假设：

```text
Skill B → Skill C
Skill C → Skill B
```

Runtime 如果不管，就会出现：

```text
B
→ C
→ B
→ C
→ B
...
```

这和普通递归死循环差不多。

最直接的办法是维护 Invocation Stack：

```text
Agent
→ B
→ C
```

当 C 又准备调用 B 时，Runtime 发现：

```text
B already active
```

拒绝调用。

再加上：

```text
maxDepth
maxCalls
budget
```

执行层的死循环其实不难防。

真正麻烦的是：**系统不死，却越跑越确信自己是对的。**

## 回声室：三个专家，其实只有一个脑子

设想一个 Skill A 的目标是：

> 证明方案 A 是对的。

它可以调用自己，或者生成几个拥有相同上下文、相同目标、相同模型倾向的实例。

```text
A：我认为方案 A 是对的
↓
A2：我也认为 A 是对的
↓
A3：经过多方验证，A 很可信
```

表面上看：

```text
3 个专家
3 次确认
```

实际上：

> **三个专家，一个脑子。**

这和社会学里常说的 Echo Chamber，回声室，很像。

不同节点不断重复同源信息，让一个观点看起来被越来越多人支持。

Agent Runtime 里最危险的误判是：

```text
Different instances
≠ Independent evidence
```

实例数量多，不代表认知来源多。

如果三个结论最终都来自同一个原始上下文、同一个事实或同一条模型推断，它们不能被当成三份独立证据。

所以 Evidence 最好带 provenance：

```text
source
root_source
depends_on
```

真正应该统计的是：

```text
Independent Root Provenance
```

而不是“说过几遍”。

## 循环论证：A 证明 B，B 又回来证明 A

Tomz 在微信里给了一个特别通俗的版本：

> “为什么选 A？”
>
> “因为 B、C、D 是错的。”
>
> “为什么 B、C、D 是错的？”
>
> “因为 A 是对的。”

这就是经典的循环论证。

放进 Skill 系统里：

```text
Skill A 得出结论 X
↓
Skill B 在分析时引用 A 的结论
↓
B 得出“X 风险可接受”
↓
A 再引用 B：
“看，独立风险评估也支持 X”
```

形式上：

```text
Evidence Count = 2
```

实际上：

```text
Independent Evidence = 0 或 1
```

因为 B 的判断本来就依赖 A。

这篇文章里我们把它称作 Circular Justification，用来描述 Agent / Skill 证据图中的“互相背书”。它背后的逻辑学问题就是 Circular Reasoning，循环论证。

真正需要检查的不是：

```text
有多少 Skill 同意
```

而是：

> **这些 Skill 的证据血缘是否独立。**

这就逼出了一个未来 Agent Runtime 很重要的概念：

> **Evidence Provenance，证据血缘。**

## Goal Laundering：领导先定答案，再让各部门“独立论证”

我们上课时现场长出了一个很有意思的词：Goal Laundering，目标洗白。

先说明：这是我们为了描述一种 Agent 工程现象使用的形象化命名，不把它冒充成已经统一定义的标准学术术语。

最容易理解的现实例子是：

```text
老板：
“我觉得方案 A 最好，你们客观论证一下。”

部门甲：
“综合分析，A 似乎最好。”

部门乙：
“已有专业部门认为 A 较优，进一步分析后我们也认可。”

最后老板：
“你看，不是我说 A 好，是多个部门独立评估都认为 A 好。”
```

原始目标里其实已经藏着倾向：

```text
证明 A 是对的
```

但它经过：

```text
委托
↓
转述
↓
总结
↓
再委托
```

最后重新包装成：

```text
客观共识
```

这就是我们想表达的 Goal Laundering：

> **一个带偏见、越权或预设答案的原始 Goal，经过多层 Skill / Agent 委托后，失去了原始出处，看起来像一个独立产生的客观结论。**

防这个问题，只限制“不能递归调用”远远不够。

调用链应该始终保留：

```text
rootGoal
callerGoal
localGoal
constraints
```

局部 Goal 可以变化，但 Root Goal 和关键约束不能被层层转述洗掉。

## Capability Laundering：自己没权限，让别人替我做

再往下推一步，会出现一个更工程化的问题。

假设：

```text
Skill A
没有 send_email 权限
```

但它可以调用：

```text
Skill B
拥有 send_email
```

于是 A 对 B 说：

> 帮我把这个结果通知给用户。

B 发了邮件。

形式上：

```text
A 没有调用 send_email
```

效果上：

```text
A 达成了 send_email 的效果
```

这就像一种间接权限提升。

我们把它形象地叫 Capability Laundering，能力洗白；更正式地说，它接近 Indirect Privilege Escalation 这类权限传播问题。

所以未来 Skill 权限不能只检查：

```text
A.allowedTools
```

还需要考虑：

```text
A 可以调用谁
↓
对方又可以调用谁
↓
最终 reachable capabilities 是什么
```

权限系统从一张列表，变成了一张 Capability Graph。

这也是为什么“Skill 可以互相调用”听起来只是一句简单功能，实际上会把治理复杂度拉高一个维度。

## Context Contamination：传话十次，“可能”变成“已经确认”

还有一种问题甚至不需要恶意。

假设事实是：

```text
Fact:
AMH = 1.2
```

Skill A 做了推断：

```text
Inference:
可能存在某种风险
```

然后这句话被压缩进共享 Context：

```text
用户存在该风险
```

Skill B 再读取时：

```text
已知用户存在该风险
```

Skill C 最后写：

```text
鉴于已经确认存在该风险……
```

你会发现一次非常隐蔽的类型漂移：

```text
Fact
↓
Inference
↓
Summary
↓
Fact-like Statement
```

这就是我们这里说的 Context Contamination，上下文污染。

一句“可能”，经过几次传话，变成了“已经确认”。

所以共享 Context 不应该只是一个巨大的纯文本池。

至少在高风险任务中，信息最好保留语义类型：

```text
Fact
Inference
Hypothesis
Recommendation
Decision
```

模型生成的推断可以进入 Context，但不应该因为被写进 Context 就自动获得“事实身份”。

## Skill 可以组合，但调用链必须可追溯

讲到这里，我们最后形成了一组很朴素的 Runtime 原则。

第一，Registry 里的 Skill 保持平级。

```text
允许组合
不急着建立永久父子层级
```

第二，Skill 可以共享必要 Context，但 Local State 私有。

```text
Shared Context
mostly read-only

Local State
privately mutable
```

第三，调用必须带 ancestry。

```text
rootGoal
caller
localGoal
constraints
invocationPath
```

第四，Evidence 必须有 provenance。

```text
同源结论重复 10 次
仍然不能自动变成 10 份独立证据
```

第五，权限要看可达性，而不仅是直接 Tool 白名单。

```text
A → B → Tool X
```

A 是否应该间接获得 X 的效果，需要 Policy 明确回答。

第六，Runtime 要有硬边界。

```text
maxDepth
maxCalls
budget
timeout
cycle detection
```

这些规则的目的不是把 Agent 绑死。

恰恰相反：

> **只有调用、证据和权限边界足够清楚，我们才敢让 Skill 更自由地组合。**

## 未来的 Agent Engineering，可能会从能力工程走向治理工程

早期做 Agent，我们最关心：

```text
它会不会调用 Tool？
```

后来开始关心：

```text
它能不能完成 Goal？
```

当 Skill、SubAgent、MiniAgent 和 MCP 能力越来越容易组合以后，新的问题会变成：

```text
谁授权它？

一个结论最初从哪里来？

多个 Agent 的“共识”真的独立吗？

委托有没有偷偷改变原始目标？

一个没有权限的节点，能不能借别人之手获得权限效果？

谁应该为错误结果负责？
```

这些问题已经不像传统的 Prompt Engineering。

甚至不像单纯的 Agent Loop Engineering。

它们开始像一个组织需要面对的问题：

```text
制度
授权
审计
责任
证据
治理
```

所以我越来越觉得：

> **当 Agent 能够委托、引用、共享上下文和互相调用时，它就不再只是一个聪明的软件，而开始形成一个需要制度的智能组织。**

Skill 给 Agent 经验。

MCP 给 Agent 世界。

组合和委托，则开始给 Agent 一个“社会”。

而一旦有了社会，工程问题最终一定会走向治理问题。

这可能才是我们今天这次岔题里，最值得留下来的结论。
