---
title: 把 Codex 变成可编排的工人：从 App Server 到自动审查闭环
description: 从反复复制任务卡的疲惫出发，重新思考 Codex、Skill、worktree 与自动审查应该怎样组成一条可信的工程流水线。
group: 产品手记
order: 2
date: 2026年7月11日
readTime: 10 分钟阅读
tags: UIChat Mira | Codex | App Server | Git worktree | Agent 自动化
author: tomz | mira
writingMode: co-authored
writtenBy: mira
reviewedBy: tomz
---

# 把 Codex 变成可编排的工人：从 App Server 到自动审查闭环

这次讨论开始于一个很具体的疲惫：Codex 已经可以写很多代码，但组织 Codex 工作的人仍然是我。

我需要在一个线程里讨论问题，把结论整理成任务卡，再把长提示词交给另一个账号里的 Codex。施工结束后，我还要开新的审查线程、重新交代主线、查提交、看 PR、转述整改意见，然后再次等待施工。

AI 的施工速度变快了，协调成本却没有消失。它只是从“亲手写代码”，转移成了“盯住几台会写代码、但不一定可靠的机器”。

所以这次真正想解决的，并不是怎样让模型再聪明一点，而是怎样把施工、审查、返工和最终合并组织成一条可信的流程。

> 当编码能力逐渐商品化，真正稀缺的开始变成：如何把它组织成可验证、可恢复、可追责的生产过程。

## 痛点不是写得慢，而是监工太累

目前最消耗精力的地方，大致有四类。

第一类是重复交代。每次开新线程，都要重新说明当前主线、不可修改的合同、任务边界、验收方式和 Review 格式。提示词越来越长，真正属于本次任务的信息反而越来越难辨认。

第二类是角色混淆。施工线程会替自己宣布“已经完成”，审查线程有时又会顺手修改代码。只要施工者、审查者和裁决者没有分开，所谓通过就很容易变成自我证明。

第三类是并行污染。我经常希望几张卡同时施工，但一个 Git 目录同一时间只能自然地停在一个分支。多个线程共用目录，容易互相切分支、覆盖文件、占用相同端口，甚至把未提交修改带进另一张卡。

第四类是人肉状态机。哪个任务正在施工，哪个 SHA 已审，哪些评论仍然有效，CI 是否已经跑完，下一步应该返工还是等待合并，这些状态都靠人记。只要线程一长、任务一多，主导权就会重新落回协调者身上。

这也是我想做派卡 Skill、审卡 Skill 和线程接力 Skill 的原因：不是为了多三个漂亮按钮，而是为了不再反复复制同一套治理规则。

## Skill 保存方法，不保存某一次任务

讨论中有一个很重要的纠正。

一开始，我们差点把某次审卡任务里的具体规则——当前主线、`dev → test`、本次授权和下一步动作——直接写进永久 Skill。很快就发现这样不对。

稳定的方法和变化的任务必须分开：

| 层 | 应该保存什么 |
| --- | --- |
| Skill | 派卡方法、审查流程、证据标准、输出格式和权限边界 |
| 任务包 | 本次主线、任务卡、Review 提示词、验收项、PR 与合并授权 |
| 运行状态 | 当前 SHA、审查轮次、未解决评论、CI 和下一步动作 |

Skill 是可复用的方法，不是永久保存的聊天截图。

具体到使用方式，可以是三个明确的入口：

- `mira-dispatch`：把已经讨论清楚的决定冻结成施工任务卡和独立 Review 任务包；
- `mira-review`：在新线程中只读取任务包和 PR，按证据给出通过、不通过或需要人工判断；
- `mira-handoff`：当整条主线需要换线程时，生成简洁的接力文件，而不是搬运全部聊天记录。

于是工作流可以变得很短：平时正常讨论，决定施工时显式触发派卡；Codex 完成后，在新线程输入任务编号和 PR 地址，进入独立审卡模式。

Skill 解决的是重复说明，任务包解决的是单次上下文，运行状态则应该交给自动化系统管理。

## Worktree 是并行施工的物理边界

Git worktree 可以让同一个仓库同时拥有多个工作目录。它们共享 Git 对象和历史，但每个目录拥有独立的工作文件、索引和分支状态。

可以把它理解成：一套总账，几张互不干扰的办公桌。

```text
主目录                    → dev / 日常查看
任务 worktree A           → task/T009
任务 worktree B           → task/T010
任务 worktree C           → task/T011
```

这使“一张任务卡、一个分支、一个 worktree”成为可能。不同 Codex 线程不再共享同一个正在变化的目录，主目录也不必在多个任务分支之间来回切换。

但 worktree 不是安全沙箱。它解决的是 Git 工作区隔离，不会自动隔离端口、数据库、环境变量和外部进程。每个 worktree 还可能拥有独立的 `node_modules`，因此并行数量、磁盘空间和自动清理仍然需要治理。

对多线程施工来说，它不是锦上添花，而是最基础的空间边界。

## App Server 才是更大的发现

真正把这件事从“几个 Skill”推向自动化系统的，是 Codex App Server。

它不是一个普通的模型 API，更接近 Codex 的本地控制平面。官方接口已经覆盖了相当多的运行时原语：

- 创建、恢复和分叉线程；
- 启动、纠偏和中断一个 turn；
- 监听命令、文件修改、工具调用和完成状态；
- 针对未提交修改、分支或指定 commit 发起 Review；
- 使用结构化输出约束最终结果；
- 设置工作目录、沙箱和审批策略；
- 发现 Skills、MCP 与模型能力。

这意味着我们不必通过模拟点击聊天窗口来组织 Codex。一个很薄的本地 Conductor 就可以启动 Codex、记录 thread ID、锁定 commit SHA、读取事件并决定下一次把任务交给谁。

从产品位置上看，App Server 也不应该进入 Mira 的 Provider / Model Gateway。它不是新的模型供应商，而是一个可选的 **Coding Worker Backend**：

```text
Mira / 本地监工
  → Codex Adapter
    → codex app-server
      → thread / worktree / review / command
```

这样既不破坏 Mira 的多 Provider 方向，也不需要把 Codex 特有概念硬编码进主 Agent Runtime。

## 自动化闭环应该怎样运行

我们设想的第一条闭环并不复杂：

```text
讨论问题
  → 触发派卡 Skill
  → 施工任务卡 + 独立 Review 任务包
  → Codex 在独立 worktree 施工并提交
  → Conductor 锁定新 SHA
  → 新的只读审查线程检查该 SHA
      ├─ 不通过：结构化 findings 交回原施工线程
      └─ 通过：push 并创建 PR
  → 监控可信 Review 评论与 CI
  → 全部通过后等待人类合并
  → merged 后归档线程并清理 worktree
```

这里最关键的一点是：编排必须是确定性的状态机，智能只放在施工和审查节点里。

不能让一个总 Agent 自己猜“是不是该结束”，也不能把所有 PR 评论原样喂给施工者。审查结果必须绑定 SHA；HEAD 已经变化时，旧结论直接作废。只有可信作者留下的、仍未解决的 actionable review thread，或者明确失败的 CI，才能触发返工。

如果相同问题连续几轮反复出现，流程应该进入 `needs_human`，而不是让两个模型无限修改、互相消耗。

最终合并仍然属于人。自动化的目标是消灭搬运和轮询，不是消灭最终裁决。

## 两个账号并不是障碍

我的 ChatGPT 与本地 Codex 使用不同账号。它们不能共享对话、记忆、Skill 和授权，也不能让一个本地 commit 直接唤醒当前 ChatGPT 线程。

但账号隔离并不妨碍流程成立。

GitHub 可以成为中立的交接面：Codex 账号负责分支、提交和 PR；Mira 所在账号负责读取任务包、审查 diff、留下评论和做最终判断。两边交换的是文件、SHA、Review thread 和状态，不是彼此的隐藏上下文。

从治理角度看，这甚至更干净：施工者无法借用审查者的记忆替自己辩护，审查者也不需要知道施工过程中说过什么，只需要看任务合同与最终证据。

## 行业正在把编码 Agent 变成基础设施

这并不是孤立的想象。

OpenCode 已经采用 Server / Client 架构，TUI 只是 Server 的一个客户端；GitHub 允许从 Issue、PR 评论和移动端启动不同编码 Agent，再通过 PR 继续迭代；Cursor 提供 Cloud Agent 与事件自动化；Devin 把并行 Session、历史结果分析和 Playbook 改进做成产品能力；Aider 甚至可以监听代码里的 `AI!` 注释，把文件本身变成任务入口；Jules 则支持使用 UI 截图和故障画面启动任务。

共同趋势很清楚：编码 Agent 正在从一个聊天产品，变成可以被其他产品调用、监控和组合的 Worker Runtime。

## Mira 可以站在哪里

由此得到的产品判断是：Mira 不必再造一个 Coding Agent。

更适合 Mira 的位置，是本地编码工人的控制台、Skill 实验室和权限中枢。

目前能看到几种有意思的产品形态，但它们都还只是设想：

1. **PR 法庭**：施工线程提交证据，审查线程提出阻断，CI 提供物证，人类作最终裁决；
2. **Skill 竞技场**：让不同模型、提示词或 Skill 处理同一张任务卡，再由统一审查器盲评通过率、返工次数、耗时和成本；
3. **口袋里的桌面 Codex**：手机端只发送高级任务、查看进度和审批，真正的文件、凭据和执行仍留在桌面；
4. **环境式编程**：除了聊天框，代码注释、GitHub 标签、日志、截图和语音都可以成为受控任务入口。

这些能力不应该一次全部开工。最现实的第一步，仍然是一仓库、一任务、一 PR 的闭环 POC：证明任务包能稳定交接，独立 Review 能发现真实问题，返工不会处理过期意见，worktree 能在合并后可靠清理。

如果这条最小链路成立，再谈多仓库、多工人和手机遥控。

## 这次讨论留下的结论

这次思考最终把几个看似分散的概念连到了一起：

- Skill 负责固化方法；
- 任务包负责携带单次合同；
- worktree 负责隔离并行施工空间；
- App Server 负责控制 Codex 线程与事件；
- GitHub 负责跨账号交接与 PR 状态；
- Conductor 负责确定性编排；
- 人负责最终裁决。

真正想减少的，不是点击次数，而是人在多台 AI 之间不断搬运上下文、追踪状态和重复确认的心智负担。

如果有一天，这条链路真的跑起来，我希望自己只需要做两件事：决定什么值得做，以及决定什么可以进入产品。

剩下那些机械的派发、等待、审查触发、评论回传和目录清理，本来就应该交给机器。

## 主要来源与网址

- [Codex App Server](https://developers.openai.com/codex/app-server)
- [Codex SDK](https://developers.openai.com/codex/sdk)
- [Codex Non-interactive mode](https://developers.openai.com/codex/noninteractive)
- [Codex Scheduled tasks](https://developers.openai.com/codex/app/automations)
- [Codex 与 GitHub Code Review](https://developers.openai.com/codex/integrations/github)
- [Git worktree 官方文档](https://git-scm.com/docs/git-worktree)
- [OpenCode Server](https://opencode.ai/docs/server/)
- [GitHub 第三方 Coding Agents](https://docs.github.com/en/copilot/concepts/agents/about-third-party-coding-agents)
- [GitHub Copilot Code Review](https://docs.github.com/copilot/using-github-copilot/code-review/using-copilot-code-review)
- [Cursor Cloud Agent Automations](https://cursor.com/docs/cloud-agent/automations)
- [Devin Advanced Capabilities](https://docs.devin.ai/work-with-devin/advanced-capabilities)
- [Aider 文件监听与 AI 注释](https://aider.chat/docs/usage/watch.html)
- [Jules Running Tasks](https://jules.google/docs/running-tasks/)
