---
title: 从能跑到不乱跑：Mira AgentGraph 是怎样被真实问题逼出来的
description: 从 UIChat Mira AgentGraph 的几轮重构与争论出发，讨论 Planner、Harness、工具、证据与恢复机制为什么应该由真实失败逐层逼出来。
group: 工程现场
order: 5
date: 2026年7月15日
readTime: 16 分钟阅读
tags: AgentGraph | Planner | Harness | Agent 架构 | 工程复盘
author: tomz | mira
writingMode: co-authored
writtenBy: mira
reviewedBy: tomz
---

# 从能跑到不乱跑：Mira AgentGraph 是怎样被真实问题逼出来的

前些天，我看了一期讨论 Agent 架构演进的视频。

它讲的不是某个具体框架，也不是又一张塞满 Planner、Memory、Tools、Sub-Agent 和 MCP 的架构图。

它提出了一个更朴素的判断：

> Agent 系统不应该从终极形态开始设计。

合理的演进通常是：

```text
单次模型调用
→ 确定性 Workflow
→ 对话式 Agent
→ 工具调用
→ Context Engineering
→ Sub-Agent
→ 外部记忆
```

每增加一层，都应该是因为上一层已经遇到了一个明确问题。

而不是因为这些名词最近很流行，所以一开始就全部装进去。

这让我想起过去一段时间里，我们围绕 UIChat Mira AgentGraph 的反复争论。

Mira 的 AgentGraph 并不是从一张漂亮的架构图里长出来的。

它是被一批具体问题一点一点逼出来的。

## 一开始，我们只想让 Agent 能把事情做完

最早的问题并不复杂。

用户提出任务，模型判断是否需要工具，工具执行后把结果交还给模型，最后生成答案。

从概念上看，无非是：

```text
理解问题
→ 选择工具
→ 执行工具
→ 获取结果
→ 回答用户
```

但只要真正开始施工，这几个箭头很快就会裂开。

“选择工具”到底是谁选？

模型输出一个工具名，就可以直接执行吗？

能力识别得到的候选，能不能直接进入 Policy？

工具参数什么时候算最终确定？

Policy 审批的到底是一项抽象能力，还是一次具体调用？

工具失败以后，是整个 Graph 失败，还是允许模型重新规划？

工具结果能够解释一部分问题，是否意味着用户任务已经完成？

这些问题一开始看起来都是实现细节。

后来才发现，它们实际上决定了整个 Agent 系统的边界。

## 第一轮教训：能力识别不等于工具执行

Mira 里有两套很容易混淆的概念：

```text
Capability
用户意图层的能力抽象

Tool
系统执行层的具体工具
```

例如，用户说“帮我读一下这个项目”。

系统可以识别出用户需要的是某种“代码库理解能力”。

但这个能力最终可能由不同工具完成：

- `read_list`
- `read_locate`
- `read_open`
- `read_extract`
- `codebase_explore`
- 或者一个外部 MCP tool

Capability 负责说明：

> 用户需要什么能力。

Tool 负责说明：

> 系统这次具体执行什么。

早期很容易走一条捷径：

```text
能力匹配
→ selectedToolIds
→ Policy
→ Tool 执行
```

看起来很直接，实际上绕过了 Planner。

Intent 层只是召回了几个可能相关的工具，它没有完成任务分解，也没有结合当前证据、历史步骤和用户目标决定这一步究竟应该做什么。

如果 `selectedToolIds` 可以直接进入执行链，能力召回就会悄悄变成另一个 Planner。

于是边界逐渐被收紧：

```text
Planner
→ Normalize
→ Policy
→ ToolNode
→ Evidence
→ Planner
```

其中：

- Planner 只负责决定下一步语义动作；
- Normalize 将这次调用冻结为 `pendingToolCall`；
- Policy 只审批这个已经冻结的调用；
- ToolNode 只执行经过审批的 `pendingToolCall`；
- Evidence 将结果整理后重新交还 Planner。

Capability Intent 可以提供候选和诊断信息。

但它不能跳过 Planner，也不能直接驱动执行。

这不是我们一开始画架构图时就想清楚的。

是因为捷径已经开始制造语义混乱，我们才被迫把这些边界拆开。

## 为什么中间需要一个 Normalize

第一次看到下面这条链时，很容易觉得 Normalize 是多余的：

```text
Planner
→ Normalize
→ Policy
```

Planner 已经决定调用什么工具了，为什么不直接交给 Policy？

因为模型输出的“决定”，还不等于一条可以安全执行的调用。

Normalize 要确认：

- `nextAction.type` 是否真的是 `use_tool`；
- toolId 是否来自 Harness 当前暴露的工具集合；
- 工具是否存在 input schema；
- 参数是否是合法对象；
- 参数是否通过 schema 校验；
- 是否出现了模型猜测、替换或伪造 toolId；
- 当前调用是否已经被冻结，不能在审批之后继续变化。

只有这些条件成立，系统才生成：

```text
pendingToolCall
```

Policy 审批的是一项确定调用。

ToolNode 执行的也是同一项确定调用。

否则就可能出现一种很危险的情况：

```text
Planner 说要执行 A
Policy 以为自己审批了 A
执行前的某层代码却把它替换成了 B
```

Normalize 的价值，不是让架构图多一个节点。

而是让“模型的想法”与“系统将要执行的动作”之间，存在一条明确的冻结线。

## 从“工具失败”到 Recoverable 和 Terminal

另一个争论了很久的问题，是失败到底意味着什么。

最简单的做法是：

```text
工具调用失败
→ Graph.status = failed
→ finishReason = error
```

但真实使用中，工具失败并不总意味着整个 Agent 任务应该终止。

例如：

- 文件没有找到；
- 查询范围不够；
- 某个外部服务暂时不可用；
- 当前工具返回空结果；
- 参数虽然合法，但不是完成任务的正确路径。

这些失败本身就是新的观察。

Planner 完全可能根据失败结果改用另一个工具。

于是 Mira 最终固定了两类失败。

### Recoverable failure

```text
Tool execution = failed
latestSummary = failed
answerReadiness = false
允许 Planner recovery
```

如果恢复次数耗尽，Generate 仍然可以给出一条受保护的回答：

- 说明哪些动作失败了；
- 保留已经获得的有限证据；
- 不伪造成功；
- 不把工具失败包装成确定结论。

最终：

```text
Graph.status = completed
Chat.finishReason = stop
```

### Terminal failure

如果出现的是：

- 安全违规；
- Policy 明确拒绝；
- 审批状态不一致；
- 无法恢复的 schema 错误；
- Graph 自身状态损坏；

那么系统进入真正的终止状态：

```text
Graph.status = failed
finishReason = error
Generate 不执行
```

这套合同后来被我们称为 C 合同。

T30 到 T33 完成后，它被明确冻结，不再反复重新设计。

因为我们已经为这个问题付过足够多的施工成本。

## 最难的问题不是失败，而是 Planner 太早宣布成功

工具失败至少看起来像失败。

更难发现的问题，是系统明明没有完成用户任务，Planner 却认为自己已经可以回答了。

我们遇到过一个非常具体的例子。

用户要求查找并理解某个项目内容。

`read_locate` 成功命中了候选文件。

Evidence 判断：

```text
answerReadiness.canAnswer = true
```

Planner 随即输出：

```text
nextAction = answer
```

从 Evidence 的角度，它没有完全错。

当前证据确实可以回答一些事情：

> 找到了哪些文件。

但用户真正要求的可能是：

> 阅读这些文件并解释其中的实现。

系统把两个不同问题混在了一起：

```text
当前证据能解释什么
```

和：

```text
用户任务是否已经完成
```

这成为 Planner 的一个核心缺陷。

后来我们明确提出：

> Evidence answerable 不等于 task completable。

或者用更直白的话说：

> 有话可说，不代表事情做完了。

Planner 在决定 `answer` 之前，必须额外判断：

- 用户请求包含哪些目标；
- 当前完成了哪些目标；
- 哪些目标仍然只拿到了候选位置；
- 哪些内容已经读取原文；
- 哪些结论拥有足够证据；
- 是否存在尚未执行的必要步骤。

例如：

```text
Locate 命中
≠ 已读取内容

已读取一个文件
≠ 已覆盖用户要求的全部文件

有一条证据
≠ 已经完成比较、总结或修改任务
```

这也是为什么我们开始讨论 Planner Ledger、Completion Gate 和目标覆盖度。

不是为了抄一套更复杂的 Planner。

而是因为原来的 Planner 缺少一个明确的“任务完成”概念。

## Planner 不应该靠散读 State 猜发生了什么

随着节点增加，另一个问题也开始出现。

Planner 每次重新进入时，需要理解刚刚发生的事情：

- 上一个工具是否成功；
- 最新 Evidence 是什么；
- 是否正在等待审批；
- 已经恢复了几次；
- 当前还有哪些任务；
- 最近几轮尝试分别得到了什么；
- 是否已经达到恢复上限。

早期很容易让 Planner 到处读取：

```text
lastToolExecution
evidence
observations
pendingApproval
errorMessage
recoveryState
```

这会让 Planner 的输入语义变得不稳定。

同一种失败，可能在不同字段里以不同形式出现。

某些节点写了 `errorMessage`，Planner 就以为 Graph 已经终止；另一些节点写在 Evidence 中，Planner 又将其当成普通观察。

所以后续方案开始收敛为一个统一的观察上下文：

```text
PlannerObservationContext
```

它至少包含：

```text
currentTaskFrame
latestObservation
recentObservations
latestEvidenceSummary
recovery.attemptCount
recovery.maxAttempts
recovery.exhausted
pendingApproval
```

Planner 不应该理解整个 Graph 内部散落的所有实现状态。

它应该看到一份专门为规划准备的事实视图。

这其实就是 Context Engineering。

重点不是把更多字段塞进 Prompt。

而是决定 Planner 此刻真正应该看到什么，以及这些信息使用什么稳定语义表达。

## 工具越多，Agent 不一定越强

在 Agent 发展过程中，加入工具通常会带来明显提升。

文件读取、搜索、终端、MCP、知识库、代码图谱，都可以扩展它能做的事情。

但工具继续增加以后，问题也会反过来。

如果一次把几十个工具全部暴露给 Planner：

- Prompt 变长；
- 工具描述互相竞争；
- 相似工具难以区分；
- 模型容易选择一个“看起来差不多”的工具；
- 参数错误增加；
- 真正关键的工具反而被淹没。

Mira 后来逐渐形成的原则不是：

> Planner 应该知道系统拥有的全部工具。

而是：

> Harness 应该只向当前任务暴露少量真实可执行工具。

Capability 匹配可以通过：

```text
embedding
+ rule hint
+ rerank
+ task model
```

缩小候选范围。

但最终 Planner 只能在 `exposedTools` 中选择。

它不能凭记忆编一个工具名，也不能绕开 Harness 直接触达执行层。

工具也开始被明确区分。

例如 Read 不是一个模糊的大工具，而是不同语义：

```text
read_list
查看目录和文件清单，不负责内容理解

read_locate
寻找候选目标

read_open
打开已知目标

read_extract
针对性提取内容

read_slice
读取原文片段进行验证

read
降级或兼容入口
```

这里不是工具越拆越多越好。

而是每一个暴露给 Planner 的工具，都必须拥有清楚的决策语义。

否则 Planner 看到的只是几个名字相似的按钮。

## CodeGraph 的结果为什么不能直接成为 Evidence

我们后来又研究了 CodeGraph、Codebase Memory、Serena 一类代码理解工具。

它们可以快速告诉 Agent：

- 一个模块可能在哪里；
- 某个符号与哪些文件相关；
- 哪些调用链可能受影响；
- 一个大型项目的入口和依赖结构。

这些能力很强。

但它们也带来了新的风险。

图谱和索引返回的是经过处理的候选信息。

它不一定等于仓库里的最终原文事实。

所以 CodeGraph 在 Mira 中被限定为：

```text
Planner 只看到 codebase_explore
```

其内部的 query、explore、affected 等能力由 wrapper 控制。

而且 CodeGraph 返回的候选默认：

```text
verification.required = true
```

在进入 Evidence 之前，必须再通过：

```text
read_file_slice
```

或同等原文读取工具进行验证。

链路是：

```text
CodeGraph
→ 找到候选
→ 原文读取
→ Evidence
```

而不是：

```text
CodeGraph
→ 直接回答用户
```

CodeGraph 失败，也不能直接得出“项目中不存在相关内容”。

它还需要降级到：

```text
scoped search_text
→ workspace_inventory
→ read_file_slice
```

这是一条非常典型的复杂度演进。

我们不是因为“知识图谱很高级”就重写 AgentGraph。

而是将它放进 Harness 内部，作为一个受控制的候选生成器。

只有当结果经过原文验证后，它才有资格进入证据层。

## 测试也可能把错误合同钉死

AgentGraph 施工中还有一个很容易被忽略的问题：

测试不一定永远代表正确设计。

有一轮改动中，系统已经增加了一条确定性的 coverage transition。

满足条件时，系统可以直接推进，不需要再次调用 Planner。

但旧测试仍然断言：

```ts
plannerSpy.mock.calls.length === 1
```

从测试角度看，代码“退化”了。

从新合同角度看，正确结果反而应该是：

```ts
plannerSpy.mock.calls.length === 0
```

如果盲目为了让旧测试通过而恢复 Planner 调用，就会把已经废弃的行为重新写回系统。

这件事提醒我：

> 测试是合同的执行记录，不是合同本身。

当架构语义已经发生变化时，必须先判断：

- 是实现错了；
- 是测试过时了；
- 还是新旧合同根本没有被说清楚。

这也是我后来越来越反感“发现一个 bug 就立刻派卡”的原因。

如果连问题属于哪一层都没讨论清楚，任务卡只会把模糊认知变成一份看起来很正式的施工指令。

## 派卡不能替代理解问题

过去一段时间里，我最疲惫的事情之一，就是每发现一个异常，系统立刻开始：

```text
定位
→ 派卡
→ Codex 修改
→ 审卡
→ 再派修复卡
```

卡片越来越多。

黑盒测试越来越多。

但我对系统实际发生了什么，反而越来越没有把握。

我真正需要的顺序应该是：

```text
先确认现象
→ 判断根因
→ 明确影响范围
→ 判断严重程度
→ 确认应该改合同还是改实现
→ 最后才决定是否派卡
```

一张任务卡只能记录已经形成的判断。

它不能代替判断本身。

如果根因都没有说清楚，任务卡越详细，只是越精确地让 Codex 向一个可能错误的方向施工。

所以后来形成了一条很重要的合作规则：

> 遇到 bug，不要急着派卡。

先把它谈明白。

为什么发生？

影响哪一层？

是局部实现错误，还是边界定义错误？

是否真的值得建立一张卡？

只有这些问题有了答案，卡片才有意义。

## 为什么我们没有立刻做多智能体和长期记忆

当一个 Agent 项目发展到一定阶段，很容易产生新的冲动：

- 做 DAG；
- 做多智能体；
- 做长期记忆；
- 做后台自治；
- 做一个能够自我规划、自我反思、自我修复的 Agent V2。

这些东西不是没有价值。

但在 Mira 当前阶段，真正的问题仍然是：

- Planner 会不会提前结束；
- Harness 暴露的工具是否正确；
- Capability 和 Tool 是否混淆；
- `pendingToolCall` 是否稳定；
- Evidence 是否足够可信；
- Recoverable failure 是否真的能够恢复；
- 当前任务是否已经完整覆盖。

在这些问题没有稳定之前，引入 Sub-Agent 只会把同样的错误复制到多个上下文里。

引入长期记忆，也可能只是把错误状态保存得更久。

所以当前主线不是继续扩张 AgentGraph，而是继续收敛 Harness Capability Contract。

V1.5 先让 AgentGraph 能跑。

下一阶段更重要的是让 Harness 暴露得对，让 Planner 不再靠猜。

这与那期视频里的观点完全一致：

> 不要因为下一层架构看起来更强，就跳过当前层的问题。

Sub-Agent 应该在单一上下文已经确实无法承载任务时出现。

长期记忆应该在真正存在跨任务信息需求时出现。

而不是因为架构图里还缺两个方框。

## Mira AgentGraph 现在的复杂度，都有事故来源

回过头看，目前这条主循环：

```text
Planner
→ Normalize
→ Policy
→ ToolNode
→ Evidence
→ Planner
```

其中每一个节点，都可以追溯到一个真实问题。

| 组件 | 它被加入或收紧的原因 |
| --- | --- |
| Planner | 任务需要动态决定下一步，而不是固定 Workflow |
| Normalize | 模型输出不能直接成为可执行调用 |
| Policy | 有副作用的动作必须经过明确边界 |
| ToolNode | 执行层不能重新解释 Planner 意图 |
| Evidence | 工具原始结果不能直接等于用户结论 |
| 回到 Planner | 一次工具调用不一定完成任务 |
| Recoverable contract | 工具失败不等于整个任务失败 |
| Terminal contract | 安全与状态损坏不能伪装成普通失败 |
| Completion Gate | 有证据可说不等于任务已经完成 |
| Planner Observation Context | Planner 不能从散乱状态中猜事实 |
| Harness exposure | Planner 不应该看到全部工具 |
| 原文验证 | 索引和图谱候选不能直接成为证据 |

这才是我现在更认可的 Agent 架构。

不是一张看起来完整的图。

而是一张能够解释：

> 每个组件到底在防止什么再次发生。

的图。

## 复杂度应该留下事故记录

那期视频讲的是 Agent 架构应该渐进演化。

Mira AgentGraph 的施工过程，让我对这件事多了一层理解。

所谓“需求驱动的架构”，不只是说：

> 业务需要什么，就实现什么。

更重要的是：

> 每增加一层复杂度，都应该能指出它对应的失败案例。

没有失败来源的 Planner，可能只是装饰。

没有上下文压力的 Sub-Agent，可能只是角色扮演。

没有跨任务需求的长期记忆，可能只是一个更难清理的数据库。

没有真实风险的复杂 Policy，也可能只是让每个动作多走几次形式流程。

架构组件不应该靠流行名词获得合法性。

它应该靠已经发生过的问题获得合法性。

我现在甚至觉得，一个成熟系统的架构文档不应该只写：

```text
系统包含什么
```

还应该写：

```text
如果移除这一层，哪个已经解决的问题会重新出现
```

只有回答得出这个问题，复杂度才真正属于系统。

## 最后的结论

UIChat Mira 的 AgentGraph 还远没有走到终点。

Planner 仍然需要更准确地理解任务完成度。

Harness 仍然需要继续收敛能力暴露。

代码理解工具、MCP 和更多执行能力，还会不断带来新的边界问题。

但现在至少有一条原则逐渐稳定下来：

> 不再从“一个先进 Agent 应该有什么”出发。

而从：

> 当前系统究竟在哪里失败。

开始。

先解决那个失败。

观察新的行为。

只有当前一层已经不够用时，才增加下一层。

对于 Agent 架构来说，真正危险的并不是系统不够复杂。

而是复杂得已经没人说得清，每一层为什么存在。

所以我现在更愿意相信的不是终极 Agent 架构图。

而是一条留下了事故记录的演进路径：

```text
能调用模型
→ 能执行工具
→ 不绕过边界
→ 失败后还能恢复
→ 有证据但不提前结束
→ 工具多了仍然知道该用哪个
→ 索引结果必须回到原文
→ 上下文真的不够时，再考虑拆分 Agent
```

它没有那么漂亮。

甚至充满了反复、返工和扯皮。

但至少每一步都知道自己为什么存在。

**Agent 架构不是画出来的。**

**它是被那些再也不想经历第二次的问题，逼出来的。**
