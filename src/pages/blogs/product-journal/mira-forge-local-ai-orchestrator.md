---
title: OPC 探索（二）：Mira Forge，一间本地 AI 工程调度室
description: 从 Codex 主评审线程、OpenCode 施工、worktree 并行与断流恢复出发，设计一套让多个 AI 工具真正接力而不是靠人搬运的本地工程调度方案。
group: 产品手记
order: 5
date: 2026年8月28日
readTime: 15 分钟阅读
tags: OPC | Mira Forge | Codex | OpenCode | Git worktree | Agent 自动化
author: tomz | mira
writingMode: co-authored
writtenBy: mira
reviewedBy: tomz
---

# OPC 探索（二）：Mira Forge，一间本地 AI 工程调度室

上一篇讨论自动化时，我们从一个很具体的问题出发：Codex 已经可以写很多代码，为什么组织 Codex 工作的人还是那么累？

那时我们讨论了 Skill、Git worktree、App Server、独立 Review 和一个可能存在的 Conductor。那篇文章更像是在铺地图：哪些能力可能拼成一条可信的工程流水线，以及为什么“让 Agent 多干活”并不等于“人就轻松了”。

这一次，问题变得更具体。

因为真实工作已经把答案逼了出来。

我现在比较常见的一种方式是：Codex 主线程负责看需求、拆任务、判断方案和做最终 Review；Trae 或其他 Coding Agent 负责施工；施工结束以后，再回到原来的 Codex 线程评审。

这套方式并不差。真正痛苦的是中间那一段。

任务要搬过去，施工结果要搬回来；施工 Agent 中途会弹确认；几张任务并行以后，要记住谁在干什么；Review 不通过还要重新通知施工者；Codex 长线程偶尔断流以后，又要确认刚才到底审到哪里。

AI 越多，人反而越像一个繁忙的项目助理。

所以这一次，我们不再从“怎样做一个 AI PR Review Bot”开始。

我们想研究的是另一件事：

> **怎样让现有 Agent 组成一条可信、可恢复、尽量少打断人的本地工程流水线。**

暂时给它一个名字：**Mira Forge**。

它不是新的 Coding Agent。

它更像一间运行在本机上的 AI 工程调度室。

## 先承认真实工作流，而不是从理想架构开始

现在最值得保留的一点，是 Codex 主评审线程。

它通常承担这些事情：

```text
Codex 主线程
  → 理解需求
  → 讨论方案
  → 拆任务卡
  → 判断风险与依赖
  → 判断哪些任务可以并行
  → 最终 Review
```

然后施工被交给另一个工具：

```text
OpenCode / Trae / Claude Code / 其他 Builder
  → 读取任务
  → 修改代码
  → build / test
  → 完成施工
```

最后重新回到 Codex：

```text
施工结果
  → Codex 主线程
  → 对照原任务与已有上下文 Review
  → 通过 / 返工
```

这里有一个非常重要的事实。

**真正掌握大量项目上下文的，往往不是施工 Agent，而是前面的长期评审线程。**

它知道需求为什么这样定，哪些产品事实已经确认，哪些地方虽然不漂亮但不能乱改，哪些技术债已经接受，任务卡背后真正想验证什么，以及之前几轮讨论里已经排除了哪些方案。

所以我们没有必要为了“自动 Review”再制造一个完全失忆的新 Reviewer。

更值得自动化的是：

> **怎样让施工结果自动回到原来的长期评审上下文。**

## PR 不应该成为唯一入口

最容易想到的自动化通常是：

```text
Agent 完成
→ 创建 PR
→ GitHub Action
→ AI Review
```

这当然能工作，但对真实施工来说太晚了。

很多时候，我们希望在 PR 之前就完成至少一轮独立 Review：

```text
修改完成
→ 本地 build
→ 本地 test
→ Review
→ 返工
→ 再 Review
→ 最终才 commit / push / PR
```

因此真正的触发点应该是：

> **一次施工阶段完成。**

而不是：

> PR 已经创建。

PR 可以继续存在，但它只是后面的交付出口之一。

从调度系统的角度看，不管 Builder 是谁，最终都应该收敛成同一个事件：

```text
Builder Done
```

施工可能来自 Trae，也可能来自 OpenCode、Claude Code、Codex 本身，甚至未来完全不同的 Coding Agent。

Mira Forge 不应该绑死某一个聊天窗口。

## Builder 可以换，Reviewer 不一定要换

如果我们接受“长期 Codex 线程目前仍然是更可靠的项目 Reviewer”，整个系统会简单很多。

```text
Codex Review Thread
        ↓
     Dispatch
        ↓
   Builder Agent
        ↓
    Builder Done
        ↓
Codex Review Thread
```

Builder 可以被抽象成很薄的一层：

```text
startTask()
resumeTask()
sendFeedback()
getStatus()
stopTask()
```

第一版甚至没有必要同时兼容所有工具。

只需要选一个最适合无人值守施工的 Builder，把流程跑通。

目前我们更想先试 OpenCode。

不是因为已经证明它一定比 Trae 或 Claude Code 聪明，而是因为真实工作里，施工工具是否“少来烦我”非常重要。

一个 Coding Agent benchmark 再高，如果每隔几分钟都要回来点一次权限确认，它仍然没有真正接走施工工作。

所以 Builder 的评价指标里应该增加一个很朴素的东西：

> **一张任务派出去以后，人需要回来碰它几次。**

理想状态不是毫无限制地自动执行，而是先划清边界：

```text
工作区内读写       允许
build / test       允许
git diff           允许

workspace 外修改   禁止
git push           禁止
deploy             禁止
高风险操作         拒绝或询问
```

先把笼子画好，然后让 Agent 在笼子里面自己干完。

## 任务卡本身就是派卡协议

在 Com Design Prototype 里，任务卡已经包含一套足够明确的合同：

```text
ID
背景与目标
Scope
Out of scope
Acceptance
风险与依赖
验证方式
Implementation record
Evidence
Review
```

所以 Mira Forge 不应该再复制出一份：

```text
task-final-v2-for-opencode.md
```

那只是把过去的疲惫重新做成一个文件格式。

正确的方式应该是：施工 Agent 直接读取项目里的原任务卡，调度器只保存本次运行需要的元信息：

```text
taskId
batchId
baseSha
worktree
builder
builderSessionId
reviewThreadId
runtimeStatus
```

任务事实依旧只有一份。

调度器不成为第二套需求系统。

## “哪些可以并行”应该继续由懂项目的人判断

我在真实工作里经常会先问 Codex：

> T38 到 T42 哪些可以并行？

这一步其实非常值得保留。

因为是否可以并行，从来不是简单比较“两个任务会不会改同一个文件”。

真正需要看的可能是：

```text
API contract
shared type
route registry
global state
design token
schema / migration
permission model
package config
generated files
```

两个任务甚至可以完全不修改同一行，却仍然存在语义上的施工竞态。

因此，Mira Forge 不应该自己凭任务标题猜并行关系。

更合理的流程是：Codex 主线程先正常讨论并行性，确认之后，通过一个 Dispatch Skill 把结论转成机器可执行的 Batch。

例如：

```text
Wave 1
├── T38
└── T39

Wave 2
└── T40

Wave 3
├── T41
└── T42
```

这里需要一个保守规则：

> **无法证明可以并行，就默认串行。**

并行是优化，不是 KPI。

## Worktree 解决写冲突，但解决不了语义竞态

并行施工最自然的物理边界仍然是 Git worktree。

```text
base
├── worktree/T38
├── worktree/T39
└── worktree/T40
```

这样几个 Agent 不会同时踩在一个 working directory 上。

但 worktree 只解决空间隔离。

它解决不了这种事情：

```text
T38 修改了 UserService 的行为
T39 仍然按照旧 UserService 的假设施工
```

两边各自在自己的 worktree 里都可能：

```text
build ✓
test ✓
```

合起来却失败。

所以并行流水线必须坚持一个很重要的边界：

> **施工可以并行，集成必须串行。**

例如：

```text
T38 DONE
T39 DONE
        ↓
先 Review T38
        ↓
集成 T38
        ↓
T39 rebase / replay 到新的 HEAD
        ↓
重新 build / test
        ↓
再确认 T39 在新基线上仍然成立
```

这一步不是浪费并行收益，而是在真正发生危险的地方收紧控制。

## Review 必须变成控制信号

Codex Review 可以写得很详细。

它可以区分：

```text
观察
推断
判断
问题
建议
```

但调度系统最终不能靠解析一篇自然语言评审，来猜下一步是继续施工还是结束任务。

所以 Review 最后应该额外落成一个很小的机器决定：

```json
{
  "task": "T038",
  "reviewedSha": "abc123",
  "decision": "RETURN",
  "findings": [
    {
      "id": "R1",
      "severity": "major",
      "requirement": "修复这里的合同不一致"
    }
  ]
}
```

或者：

```json
{
  "task": "T038",
  "reviewedSha": "abc123",
  "decision": "PASS"
}
```

第一版甚至只需要两个核心决定：

```text
RETURN
PASS
```

RETURN：恢复原 Builder session，把 findings 交回去继续整改。

PASS：停止施工，等待集成。

Builder 不需要重新理解“Codex 到底算不算让我改”。

它只执行决定。

## PASS 必须绑定一份具体代码

自动 Review 里有一个特别容易忽略的竞态。

假设 Codex Review 的是：

```text
SHA A
```

并给出了 PASS。

结果 Builder 在之后又顺手改了两行，当前代码已经变成：

```text
SHA B
```

如果任务还显示“评审通过”，这个 PASS 已经没有意义。

因此 Review 必须绑定：

```text
reviewedSha
```

集成之前检查：

```text
currentSha == reviewedSha
```

如果代码变化，则原结论自动变成 STALE，需要重新 Review。

换句话说：

> **Review 通过的是一份具体代码，不是一个任务名字。**

## Codex 会断流，所以它不能成为状态数据库

现实里还有一个非常具体的问题：Codex 长线程会断流。

这不意味着长期线程没有价值。

恰恰相反，长期线程仍然是项目认知最有价值的地方。

但我们不能让工程流水线依赖：

> Codex 还记得我们刚才做到哪了。

因此两类信息必须分开。

Codex Thread 保存：

```text
项目背景
历史讨论
设计理由
评审尺度
隐性上下文
```

这些是认知资产。

而机器状态应该由另外一个持久化账本保存：

```text
哪个 task 正在施工
哪个 worktree
哪个 builder session
哪个 review thread
哪个 SHA
当前处于哪一轮 Review
谁已经 PASS
谁正在 RETURN
谁在等集成
```

这些是工程事实。

可以把它理解成：

```text
Codex Thread = 脑子
Batch Ledger = 账本
```

脑子可以暂时断片。

账不能丢。

一旦流断了，调度器应该知道“这是一轮未完成的 Review”，而不是把屏幕上已经流出来的半截文字当成正式结论。

只有完整 Review 完成以后，状态才能推进。

## 为什么最后倾向一个全局本地服务

最初我们还考虑过：能不能直接借 Com Design Prototype 现成的 Vite dev server，把施工进度和调度都塞进去。

很快就出现一个问题。

真实的并行施工可能变成：

```text
T38
├── Mobile Vite
└── PC Vite

T39
├── Mobile Vite
└── PC Vite
```

再加上 Mira Mobile、Mira Desktop 或其他项目，机器上同时运行多个 Vite 是正常情况。

如果每个 Vite 都成为调度器，就会立即产生新的麻烦：

```text
哪个服务才是真相源？
哪个先启动？
一个 Vite 关闭以后任务是不是也没了？
几个服务同时更新状态怎么办？
```

因此现在更倾向一个全局的本地服务：

```text
Mira Forge
Local AI Engineering Orchestrator
```

它是机器上唯一的工程调度事实源。

大致管理：

```text
Projects
Batches
Tasks
Worktrees
Builder Sessions
Codex Review Threads
Review Queue
Runtime Processes
Preview URLs
```

Vite 只是 Preview。

OpenCode 只是 Builder。

Codex 是 Planner / Reviewer。

Git 是工程事实来源之一。

Mira Forge 负责把这些东西接起来。

## 全局施工图应该非常简单

一旦允许并行，状态可视化就不再是锦上添花。

因为否则人很快又会开始在脑子里记：哪个小弟干到哪了。

理想中的全局页面不应该像 Jira。

它只需要一张工地图：

```text
ComDesign Prototype
  T038  ● Reviewing      Codex
  T039  ● Fixing         OpenCode
  T040  ○ Waiting

Mira Mobile
  T009  ● Building       OpenCode

Mira Desktop
  T034  ✓ Passed
```

点进一个任务才显示细节：

```text
T038

Builder       OpenCode
Worktree      .../T038
Build         PASS
Test          PASS
Review        Round 2
Codex         connected / interrupted
Mobile        localhost:5187
PC            localhost:5188
```

这个页面不是新的项目管理系统。

它只回答一个问题：

> **现在我的这些 AI 工人到底在干什么？**

## 项目状态和运行状态必须分开

Com Design Prototype 已经有一套稳定的项目任务状态：

```text
TODO
DOING
REVIEW
PASS
BLOCKED
CANCELLED
```

Mira Forge 不应该再创造另一套业务真相。

它内部当然需要更细的运行态，例如：

```text
waiting
building
reviewing
fixing
waiting_integration
interrupted
stale
```

但这些状态只属于调度运行时。

最终仍然映射回项目自己的任务合同：

```text
building / fixing
→ DOING

reviewing
→ REVIEW

review pass + integration accepted
→ PASS
```

运行时数据可以被清理。

项目事实不能消失。

## V1 应该小到什么程度

这一次最重要的约束，是不要再把一个真实痛点写成一套漂亮但始终没开工的大系统。

Mira Forge 的第一版只需要验证这些事情：

1. 注册一个本地项目；
2. 读取项目已有任务卡；
3. Codex 主线程判断哪些任务可以并行；
4. Dispatch Skill 把这个判断转成 Batch；
5. 自动创建 worktree；
6. 启动一个 Builder，例如 OpenCode；
7. 收到施工结束；
8. 自动把结果送回原 Codex Review Thread；
9. Codex 输出 RETURN / PASS；
10. RETURN 时恢复原 Builder session；
11. PASS 绑定 reviewed SHA；
12. 任务逐个串行进入集成；
13. 提供一张极简的全局施工进度图。

暂时不做：

```text
自动 merge
自动 production
多人账号
云端调度
复杂权限平台
插件市场
Agent marketplace
全模型 benchmark
自动产品决策
```

先证明一件最朴素的事情：

> **我把几张任务交出去，然后去做别的。回来的时候，它们已经施工、评审、返工，并明确告诉我哪些真的通过了。**

如果这一点成立，OPC 才真正少了一个必须由人维持的环节。

## 真正想减少的不是代码量

这轮讨论以后，我越来越觉得 AI Coding 的瓶颈未必是：

> 模型还能不能再多写 20% 的代码。

真正不断消耗人的，是这些不起眼的动作：

```text
等待
确认
搬运
切线程
重新解释
记状态
催施工
收结果
再派返工
```

每一件都不难。

但一天重复几十次以后，人就变成了整个 AI 团队里最忙的调度器。

如果 OPC 最终只是一个人同时打开十个 AI，那并没有真正减少组织成本。

只是把十个人变成了十个窗口。

真正有意思的方向也许是：

> **让 Agent 之间开始具备可追踪的交接、独立审查、返工、恢复和集成能力，而人只保留真正需要判断的节点。**

[上一篇 OPC 探索](/blogs/product-journal/codex-app-server-automation-notes)里，我们还在讨论 Codex、Skill、worktree 与自动审查怎样拼成一条可信流水线。

这一篇，我们终于把它收敛成了一个更具体的对象：

> **Mira Forge，一间运行在本机上的 AI 工程调度室。**

它不会替代 Codex。

不会替代 OpenCode。

也不会替代 Git。

它只是想让这些已经足够强的工具，终于开始像一个团队那样工作。
