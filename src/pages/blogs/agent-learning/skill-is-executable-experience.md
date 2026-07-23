---
title: 一起学智能体 06｜Skill 不是 Prompt，而是把经验变成可执行知识
description: 从“聪明的新员工为什么还需要 SOP”出发，理解 Agent Skill 的真正价值：把程序性知识、规则、脚本和验收标准变成可按需加载的执行经验。
group: 一起学智能体
order: 6
date: 2026年7月23日
readTime: 9 分钟阅读
tags: 一起学智能体 | Agent Skills | Procedural Knowledge | Progressive Disclosure | Tool
author: tomz | mira
writingMode: co-authored
writtenBy: mira
reviewedBy: tomz
---

# 一起学智能体 06｜Skill 不是 Prompt，而是把经验变成可执行知识

假设今天公司来了一个特别聪明的新员工。

他读过很多书，推理能力很强，写东西也快。你问他“什么是发布流程”“什么是代码审查”“怎么写一篇技术博客”，他都能讲得头头是道。

然后你对他说：

> 好，现在把我们的正式版本发出去吧。

他很可能第一步就卡住。

因为他不知道你们公司的版本号规则，不知道构建前必须跑哪套测试，不知道产物签名放在哪里，不知道 Release Notes 的格式，也不知道“上传成功”和“真正发布完成”之间还差一次验证。

这不是智力不够。

这是**没有组织经验**。

我越来越喜欢用这个角度理解 Agent Skill：

> **Skill 不是给模型补智商，而是把某类工作中已经沉淀下来的经验，变成 Agent 可以发现、加载和执行的程序性知识。**

Anthropic 在介绍 Agent Skills 时，把它类比成给新员工准备 onboarding guide。这个比喻很准：一个通才模型并不天然知道你的项目规范、组织流程和最佳实践，而 Skill 正是在补这部分“怎么做”的知识。

## 知道是什么，和知道怎么做，是两回事

大模型很擅长 Declarative Knowledge，也就是“是什么”的知识。

它知道：

```text
GitHub Release 是什么
代码审查应该关注什么
一篇博客通常怎么写
PDF 可以怎么处理
```

但真实工作更依赖另一类知识：Procedural Knowledge，程序性知识。

也就是：

```text
在这个项目里先做什么
什么顺序不能乱
什么地方允许自由判断
什么地方必须用确定性程序
失败以后怎么办
满足什么条件才算完成
```

比如“发布 Mira 博客”并不是一句：

> 写好文章，然后上传。

它真正包含的是：

```text
读取当前博客契约
↓
查看同系列最近文章
↓
确定 group / order / frontmatter
↓
根据讨论组织正文
↓
写入正确目录
↓
提交 GitHub
↓
检查构建结果
```

通用模型可以临时猜出一套流程，但每次重新猜，就意味着每次都有机会漏步骤、改规则、忘约束。

Skill 的意义，是把“不应该每次重新发明的做法”保存下来。

## Skill 不是一个更长的 Prompt

最小的 Skill 的确可以只有一个 `SKILL.md`。

这很容易让人产生一个误解：

> Skill 不就是把 Prompt 放进一个 Markdown 文件吗？

只看最简单的例子，确实很像。

但一个成熟 Skill 可以包含：

```text
my-skill/
├── SKILL.md
├── scripts/
├── references/
└── assets/
```

这些东西承担的是完全不同的职责。

`SKILL.md` 是操作指南，告诉 Agent 这类任务应该怎么处理。

`references/` 是按需教材，例如数据库 schema、业务规则、API 说明、项目规范。

`scripts/` 是确定性执行逻辑，把不该交给模型“发挥”的事情交给程序。

`assets/` 则是可以直接使用的模板、图片、文档骨架等产出资源。

于是 Skill 开始更像一个**小型执行知识包**，而不是一段巨大提示词。

这也是为什么“Skill = Prompt”这个说法不完全错，却很容易把设计带偏。

Prompt 可以是 Skill 的载体之一，但 Skill 真正想封装的是：

> **方法、约束、资源和可复用执行经验。**

## 该让模型自由的地方自由，该锁死的地方锁死

我们上课时做过一个很简单的判断题。

下面四件事，哪些应该交给模型，哪些更适合确定性程序？

```text
A. 给技术博客起一个有吸引力但不过度营销的标题
B. 校验日期必须符合 YYYY-MM-DD
C. 分析一段代码改动可能带来的架构风险
D. 把 PDF 第 3 页顺时针旋转 90°
```

答案很自然：A、C 更适合模型；B、D 更适合程序。

原因不是“模型做不了 B、D”。模型当然可以。

问题是：**为什么要让它发挥？**

标题和架构风险没有唯一答案，需要语义理解、权衡和判断。

而日期格式校验、PDF 精确旋转的输入输出都很明确，越有“创造力”反而越危险。

所以一个好 Skill 经常是这种结构：

```text
Model
负责理解、判断、取舍

Script / Tool
负责确定性执行

Validator
负责验收
```

我很喜欢一句简单的判断：

> **有很多种正确答案的地方，给模型自由；只有一种正确答案的地方，尽量别让模型即兴发挥。**

## Progressive Disclosure：别把整本操作手册塞进脑子

如果系统只有三个 Skill，把完整内容都塞进 Context 似乎没什么问题。

但如果有一百个呢？

每个 Skill 都有几千 Token 的说明、案例、参考资料和脚本描述，全部常驻 Context，很快就会变成另一种工具爆炸。

Skill 的一个关键设计思想是 Progressive Disclosure，渐进式披露。

可以把它想象成翻一本大书。

第一层，只看封面和简介：

```text
name
+ description
```

Agent 先知道“书架上有哪些书”，判断当前问题可能需要哪一本。

第二层，命中以后再打开 `SKILL.md`：

```text
workflow
rules
decision guidance
exit criteria
```

第三层，执行到具体问题时，才继续读取 references、运行 scripts 或使用 assets。

```text
Metadata
↓
SKILL.md
↓
Resources on demand
```

这和 Context Engineering 是同一个思想：

> **不是知道得越多越好，而是此刻知道正确的东西。**

Anthropic 的 Agent Skills 设计也明确采用了这种分层加载：启动时先预加载 Skill 的 `name` 与 `description`，判断相关后再读取完整 `SKILL.md`，更细的附加文件继续按需加载。

## Description 像简历：写坏了，能力再强也没人鸟你

Tomz 听到这里的时候，说了一个特别准确的类比：

> 这和 GEO 差不多。简历写坏了，根本没人鸟你。

Skill 的 `description` 就像一份很短的简历。

比如：

```text
一个强大的代码助手，可以处理各种代码问题。
```

看起来什么都会，实际上 Router 根本不知道什么时候应该选它。

换成：

```text
用于审查已有代码改动、Diff 或 Pull Request，
识别正确性、回归、安全性和维护风险；
当用户要求 review、审查改动或评估代码风险时使用。
```

边界立刻清楚了。

这里其实有两个指标：

```text
Recall
该出现时能不能被想到

Precision
被想到时是不是真的该用
```

写得太窄，Recall 低，该用的时候找不到。

写成“当用户需要帮助时使用”，Recall 倒是高了——每份工作都来投简历——Precision 直接崩掉。

所以一个好 Description 至少应该让系统知道：

```text
What：我会什么
When：什么时候该用我
Boundary：什么情况下其实不该找我
```

## LLM 不是在磁盘里“闻到”了一个 Skill

另一个容易产生魔法感的问题是：

> LLM 到底怎么发现 Skill？

它不会自己跑到磁盘里巡逻。

真正的逻辑更像：

```text
Runtime 扫描 Skill Registry / 文件目录
↓
读取 name + description
↓
把轻量 Metadata 暴露给 Agent
↓
LLM / Router 根据当前 Goal 选择候选 Skill
↓
Runtime 加载完整 SKILL.md
↓
Agent 按需读取 references / scripts / assets
```

所以这里其实有两个 Discovery：

```text
Runtime Discovery
系统里存在哪些 Skill？

LLM Discovery
当前任务应该使用哪个 Skill？
```

前者像招聘网站把简历收进数据库。

后者才是面试官决定找谁来干活。

## Skill 的成熟标志，是知道什么时候该停

很多 Skill 会写大量步骤，却不写 Completion Criteria。

这是一个很危险的设计。

例如：

```text
1. 收集资料
2. 分析资料
3. 生成报告
```

报告生成了，就算完成吗？

不一定。

可能关键字段还缺着，风险维度没有覆盖，不确定性没有标注，甚至报告只是成功保存了一个文件。

所以必须分清：

```text
Skill Activated
≠ Tool Success
≠ Skill Complete
≠ Agent Goal Complete
```

Tool 返回成功，只说明某个动作成功。

Skill Complete，应该意味着这个局部任务自己的完成条件满足。

Agent Goal Complete，则要重新回到用户最初的目标判断整个任务是否真的做完。

这和我们之前反复讨论的那句话完全一致：

> **局部成功不能逐级自动冒充全局完成。**

一个成熟 Skill 最好明确返回：

```text
completed
blocked
aborted
```

以及：

```text
result
evidence
warnings
openItems
artifacts
```

这样主 Agent 才能继续做真正的全局决策。

## Skill 的本质：把人的经验工程化

讲到最后，`SKILL.md`、scripts、references 都只是形式。

Skill 真正有价值的地方是：

> **我们终于可以把一个人、一个团队、一个组织长期形成的“做事方法”，从聊天 Prompt 里拿出来，变成一种可以复用、传播、评测和演进的执行知识。**

一个优秀工程师离职后，团队真正损失的往往不是“他知道 JavaScript 语法”，而是大量没有写下来的隐性经验：

```text
遇到这个问题先查哪里
什么错误看似严重其实不用动
什么步骤绝对不能跳
什么结果才算真的完成
```

Skill 让这部分知识第一次有机会成为 Agent Runtime 的一等公民。

所以以后面试里再有人问：

> 你怎么理解 Agent Skill？

我不会先回答“它是一个带 `SKILL.md` 的文件夹”。

我更愿意先说：

> **Skill 是把程序性知识和组织经验封装成 Agent 可以发现、按需加载和执行的能力包。它解决的不是模型知不知道，而是模型在一个具体环境里知不知道应该怎么做。**

然后再往下讲 Progressive Disclosure、scripts、references、触发和评测。

先有判断，再有技术细节。

这才是真的学会了。

## 参考阅读

- Anthropic Engineering：Equipping agents for the real world with Agent Skills
- Datawhale Hello-Agents：Extra05 Agent Skills 与 MCP 对比解读
- Datawhale Hello-Agents：Extra08 如何写出好的 Skill
