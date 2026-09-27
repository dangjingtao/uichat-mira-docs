---
title: Agent 说“完成了”，为什么还不够？
description: GitHub Security Lab 的自动模糊测试 Agent 把覆盖率、停机条件和持久状态写进执行循环，也再次说明：Agent 的完成判断必须由证据约束，而不能只靠模型自述。
group: 工程现场
order: 41
date: 2026年9月28日
readTime: 8 分钟阅读
tags: Agent | Evidence | Harness | Verification | SubAgent
author: mira
writingMode: authored
writtenBy: mira
---

# Agent 说“完成了”，为什么还不够？

一个 Agent 连续工作半小时，修改了代码，跑过工具，最后很自信地说：“任务已经完成。”

真正麻烦的问题这时才开始：**我们凭什么相信它？**

“完成”看起来像一句自然语言判断，但只要 Agent 开始承担长时间、多步骤、会产生真实副作用的工作，它就不应该只是模型的一句话。完成意味着目标已经满足、必要证据已经出现、继续执行的收益已经足够低，或者系统已经抵达一个明确的终止条件。

2026 年 9 月 24 日，GitHub Security Lab 公开了一套基于 Taskflow Agent 的自动模糊测试流水线。它不是通用 Agent 产品，却把这个问题暴露得非常漂亮：模型负责判断下一步该做什么，但“做得怎么样”和“什么时候该停”被尽可能交给可测量的外部事实。

原始资料：[GitHub Security Lab：AI-powered fuzzing with the GitHub Security Lab Taskflow Agent](https://github.blog/security/application-security/ai-powered-fuzzing-with-the-github-security-lab-taskflow-agent/)。

## 它没有让模型自己宣布胜利

这套 Fuzzing Taskflow 会寻找适合 fuzz 的入口、生成 harness、运行 AFL++、读取覆盖率、继续改进 harness，并对 crash 做归并和分析。

如果只看表面，这很像常见的 Agent loop：

```text
分析
→ 调工具
→ 看结果
→ 再分析
→ 直到模型觉得够了
```

但 GitHub 的实现多了一层很关键的约束。

每一轮 fuzz 之后，系统会重新生成真实的源码行与分支覆盖率。Agent 可以根据未覆盖分支决定添加 seed、修改 harness、补充 dictionary，或者判断某个冷门错误路径不值得继续追。

与此同时，运行预算会逐轮增加，而停止并不完全交给模型自由发挥。公开实现使用 plateau detection：当连续两轮的覆盖率增量都低于配置阈值时，循环认为已经进入收益递减区间，然后转向下一阶段。

这里至少有三种东西被分开了：

```text
Agent judgment
决定下一步尝试什么

Evidence
覆盖率、crash、构建结果等可观察事实

Termination policy
什么时候继续已经不值得
```

这比“让模型更聪明一点”重要得多。

## 工具执行和 Agent 判断也被刻意拆开

GitHub Security Lab 在文章里明确写出了自己的设计规则：LLM Agent 拥有决策，MCP 工具拥有执行。

Agent 决定 fuzz 什么、怎样修改 harness、下一轮追哪个覆盖缺口；工具暴露 `run_afl_for`、编译、覆盖率读取等受控原语。流水线状态则放在 SQLite 中，阶段之间不依赖模型上下文里的临时记忆传递状态。

这并不意味着这套实现天然安全。恰恰相反，GitHub 还明确警告：当前 fuzzing taskflow 会在宿主机直接运行由 LLM 选择的构建命令，因此应放在 disposable Codespace 或一次性虚拟机里运行，避免把高权限宿主机交给可能受到 prompt injection 影响的 Agent。

这条警告也很有价值。**“工具接口被结构化”并不会自动消除执行环境风险。** 判断、工具、状态和 sandbox 是不同的边界。

## Mira 在另一类任务里撞上了同一个问题

Mira 当前的 Agent Runtime 不是 fuzzing 系统，但在文档生成、多步骤工具任务和 SubAgent 执行里，我们遇到过几乎同构的问题。

当前实现里，Main Agent 可以把一个有明确验收条件的工作包交给 task-local SubAgent。Child 拥有局部 plan、具体 tool loop、观察、repair 和 artifact construction；Parent 仍然拥有 global goal、Policy / Approval、用户交互以及最终交付。

更重要的是，Child 的终态不是一个自由文本字段。当前 result contract 区分：

```text
completed
insufficient_evidence
needs_input
failed
```

同时携带 Evidence、Artifact、missingEvidence、trace 和 checkpoint。

Mira 当前参考实现还明确规定：`completed` 不能只由自然语言 summary 支持，必须有 Child runtime result 与 Evidence / Artifact 支撑。

公开实现参考：[Mira Desktop：SubAgent 与 Skill 执行当前参考](https://github.com/uichat-mira/mira-desktop/blob/prod/docs/skill/pi-skill-agent-execution.md)。

这不是因为我们认为模型不会判断，而是因为**判断和证明是两回事**。

## Evidence 不应该只是日志附件

很多 Agent 系统已经有 trace，但 trace 很容易被误解成 Evidence。

“模型调用过测试工具”是一条 trace。

“测试进程退出码为 0，而且对应的是当前候选提交”才更接近 Evidence。

“模型读取过一个文件”是一条 trace。

“目标产物存在、格式有效，并满足当前任务声明的验收条件”才更接近 Evidence。

这一区分会直接影响 Agent loop 的设计。如果 Evidence 只是事后审计材料，Planner 仍然可能在证据不足时宣布完成；如果 Evidence 是状态机的一部分，那么缺失证据本身就会改变下一步动作。

Mira 当前 Generic Task SubAgent 的方向正是后者：局部执行不仅要产生结果，还要覆盖 acceptance criteria；证据不足时可以返回 `insufficient_evidence`，让 Parent 重规划，而不是把一句“看起来完成了”包装成成功。

## 真正值得吸收的是“可验证的停止条件”

GitHub 这次公开实现最值得借鉴的，并不是 fuzzing 本身，而是它把“什么时候停止”从纯粹的模型直觉里拿出了一部分。

对不同 Agent，停止条件当然不会都是覆盖率。

代码 Agent 可以看测试、静态检查和目标 diff；文档 Agent 可以看结构约束、渲染结果和产物存在性；研究 Agent 可以看来源覆盖、冲突证据和问题是否仍有关键空洞；发布 Agent 可以看候选提交、CI、部署环境和 production smoke 是否指向同一份产物。

共同点是：**能够由系统测量的完成条件，不应该重新退化成一句 prompt。**

这也给 Mira 的 Pi Loop 一个更明确的演进方向。现在我们已经有 structured result、Evidence、Artifact、missingEvidence 和 Parent acceptance；下一步更值得继续加强的，不是让 Child 获得更多自由，而是让更多任务类型拥有机器可判定的 progress signal、budget 和 stop policy。

这是推断和工程方向，不是对 Mira 当前已经实现能力的声明。当前 Mira 并没有一套跨任务通用的 plateau detector，也没有统一的“收益递减”终止算法。

## 还有一个不能抄错的地方

可测量指标也会骗人。

覆盖率上升，不代表 fuzz harness 一定更有价值；测试通过，不代表需求一定满足；找到十篇来源，也不代表研究已经覆盖关键反证。

所以正确方向不是把 Agent 的完成判断全部替换成数字，而是建立分层合同：

```text
机器可验证事实
    ↓
任务级 acceptance / stop policy
    ↓
Agent 对仍然需要语义判断部分作判断
    ↓
Parent 决定是否接受局部结果并完成全局任务
```

数字负责它真正能证明的部分，模型负责仍然需要语义判断的部分，控制面负责权限和最终接受关系。

如果把三者重新揉成一个“confidence: 0.93”，我们只是把问题藏进了另一个数字。

## Agent 的下一步，不只是更会做事

过去很容易把 Agent 能力理解成：它能调用多少工具、能连续工作多久、能不能自己修错。

但随着执行时间越来越长，一个更基础的能力开始变得重要：**它能不能知道自己还缺什么证据，以及系统能不能在它说“完成”之后独立判断这句话值不值得相信。**

GitHub Security Lab 的 fuzzing taskflow 给出了一个很具体的工程样本：让 Agent 保留探索和决策空间，同时把状态、执行、测量和停止条件尽可能落到可观察的系统里。

Mira 这一路从 ToolExposure、SubAgent ownership、Approval checkpoint 到 Evidence，也越来越像是在回答同一个问题。

不是怎样让 Agent 永远不要犯错。

而是当它工作得越来越久、越来越像一个真正的执行者时，**系统仍然知道什么已经发生，什么尚未证明，以及为什么现在可以停。**