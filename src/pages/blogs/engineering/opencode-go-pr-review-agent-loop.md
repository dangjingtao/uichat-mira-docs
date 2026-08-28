---
title: 把 AI Code Review 接成一个真正的 Agent Loop
description: 用 GitHub Actions、OpenCode Go、项目级 Review Skill、可信版本边界与确定性 Gate，把 Builder → Reviewer → Findings → Builder 接成可重复、可校验、可逐步放行的工程循环。
group: 工程现场
order: 30
date: 2026年8月28日
readTime: 16 分钟阅读
tags: OpenCode Go | GPT 5.6 Luna | AI Code Review | Agent Loop | GitHub Actions | Agent Handoff | Gatekeeper
author: tomz | mira
writingMode: co-authored
writtenBy: tomz | mira
reviewedBy: tomz
---

# 把 AI Code Review 接成一个真正的 Agent Loop

这次最初想做的事情很小。

施工 Agent 开一个 feature / task / fix 分支，向 `dev` 提 PR；GitHub 自动叫一个 AI 来 Review；如果有问题，本地施工 Agent 能拿到 Review 结果继续修改。

如果只看第一步，这几乎就是一个普通的 AI PR Review Bot。

但我们真正想验证的不是“能不能让模型评论一段 diff”。

真正的问题是：

> **Reviewer 的输出，能不能稳定地回到另一个 Agent，成为下一轮施工的输入。**

也就是把这条链真的接起来：

```text
Builder Agent
    ↓
Git branch / PR
    ↓
Reviewer Agent
    ↓
Review findings
    ↓
Local Agent inbox
    ↓
Builder verify / fix / reject
    ↓
push
    ↓
Reviewer again
```

产品层为什么想做这件事，另写在 Tomz.io：

[《OPC 探索（三）：从复制粘贴到宏观 Agent Loop》](https://tomz.io/blogs/shared-thinking/macro-agent-loop-beyond-copy-paste)。

这篇只讲工程上怎么把它接成一条可信的 loop，以及这条 loop 跑进 Mira Mobile 以后，Review 权限边界又是怎么继续收敛的。

## 第一阶段：先让 Reviewer 成为真正的第二双眼睛

代码 Review 很适合作为宏观 Agent Loop 的第一个实验，是因为它天然有几个清晰边界：

```text
输入：一个确定的 PR / diff / commit
角色：独立 Reviewer
输出：findings + verdict + gaps
反馈对象：施工 Agent
版本锚点：Head SHA
```

相比开放式“让几个 AI 一起讨论”，代码 Review 有更明确的事实来源。

Reviewer 可以错，但它至少应该明确自己在看哪一版代码、基于什么证据做判断。

第一阶段为了先把 loop 本身跑通，我们故意把 Reviewer 的权力压得很低：

- 不自动 merge；
- 不自动 GitHub `APPROVE`；
- 不自动 `REQUEST_CHANGES`；
- 不自动把任务改成 `PASS`；
- Review Agent 不能修改代码；
- Review Agent 不能执行 shell；
- Review 结果只是下一轮验证输入，Builder 必须重新对照代码和合同核实。

这不是说“以后系统永远不能自动放行”。

它只是一个很重要的 bootstrap 原则：

> **先证明模型能稳定地审，再讨论给流程增加多少自动权力。**

后来我们确实开始讨论放行、改任务状态和 GitHub Approve。

但结论不是把这些权限补回 Reviewer，而是再拆出一个确定性的 Gatekeeper。后面会讲。

## 模型只读，GitHub 写权限和模型执行分开

最初跑通的 workflow 被拆成两个 job：

```text
pull_request -> dev
        ↓
   review job
        ↓
   ai-review.md
        ↓
 short-lived artifact
        ↓
   publish job
        ↓
 PR marked comment
        ↓
 local handoff self-check
```

### review job

它只做 Review。

GitHub 权限只有：

```text
contents: read
```

它会：

1. 读取当前 PR 的目标版本；
2. 获取可信的 Reviewer 规则；
3. 调用 OpenCode Go 模型生成 Review；
4. 写出结构化 Review artifact；
5. 不直接向 GitHub 执行写操作。

OpenCode 自身也显式关闭施工型权限，例如：

```json
{
  "edit": "deny",
  "bash": "deny",
  "task": "deny",
  "webfetch": "deny",
  "websearch": "deny"
}
```

Reviewer 可以读、理解、判断。

但不是披着 Reviewer 名字的第二个 Coding Agent。

### publish job

Publisher 不运行模型。

它只做确定性操作：

```text
下载 Review artifact
↓
校验结构和版本信息
↓
创建 / 更新 marked PR comment
↓
执行 local handoff self-check
```

所以 GitHub 写权限和模型执行被物理拆开了。

这是整套设计里我们一直想保留的一条原则：

> **模型不因为需要输出 Review，就顺便获得 GitHub 写权限。**

后面加入 Gatekeeper 时，也继续沿用这条分工。

## 为什么没有为了方便直接扩大 OpenCode 的 GitHub 权限

第一次 smoke test 走过一条更直接的路。

我们尝试让 OpenCode 的 GitHub 模式直接处理 PR。

PR trigger、checkout、`OPENCODE_API_KEY` 检查、OpenCode 安装都正常。

但官方模式本身会尝试在 GitHub 上添加 reaction / comment。

在严格只读权限下，它遇到了：

```text
403 Resource not accessible by integration
```

最简单的修法当然是：

> 给模型 job 更多 GitHub 写权限。

但这正好违背了我们想验证的边界。

所以最后没有为了“方便”扩大模型权限，而是把执行拆开：

```text
Model = read-only review
Publisher = deterministic write
```

这比单纯把 Action 跑绿更重要。

## Review 的规则必须来自可信 base

还有一个容易忽略的问题。

如果 workflow checkout 的是 PR head，然后直接执行 PR 里的 Reviewer 脚本，那么提交 PR 的代码本身就可以修改“如何审查自己”。

即使是同仓库 PR，这个边界也不够干净。

所以原则变成：

> **Review 的对象可以来自 PR，Review 的规则必须来自可信 base。**

也就是说：

```text
PR head
→ 待评审代码

base / dev
→ AGENTS.md
→ Reviewer script
→ Review skill
→ task / project contracts
```

PR 可以改变待评审代码，但不能让同一轮 Review 顺便采用它自己刚改出来的新裁判规则。

## 仅仅读可信脚本还不够：OpenCode 启动环境也要可信

把 Reviewer 脚本从 base 取出来以后，我们又继续往前追了一层。

OpenCode 项目本身可以加载项目级配置、skills 和 plugins。

如果直接在原始 PR worktree 里启动 OpenCode，那么 PR 仍可能通过修改 `.opencode`、项目配置或其他 Agent 配置，影响 Reviewer 启动时的行为。

所以 Mira Mobile 的实现又多了一层隔离：

```text
PR head
↓
git archive 到临时 snapshot
↓
移除 PR 可控的 Agent / OpenCode 配置
↓
从可信 base 注入 AGENTS.md
↓
从可信 base 注入唯一允许的 Review Skill
↓
在 sanitized snapshot 中启动 Reviewer
```

当前会显式清掉这类 PR 控制面，再注入可信版本：

```text
.opencode
.claude
.agents
opencode.json / opencode.jsonc
CLAUDE.md
AGENTS.md
```

这样“待审代码”和“裁判环境”才真正分开。

这是从第一次原型走到真实 Mobile 项目后，最值得保留的安全原则之一。

## 通用 Review Prompt 不够，项目应该拥有自己的 Review Skill

原型阶段可以先用通用 Reviewer 验证 loop。

但真实项目很快暴露一个问题：

> 同一套 Review 原则，不能机械地套在所有代码库上。

Mira Mobile 是 React Native 客户端，也是 Mira Host 的 companion。

它和一个纯 Web Prototype 的 Review 重心明显不同。

所以 Mobile 增加了自己的项目级 Review Skill。

它要求 Reviewer 优先理解真实项目合同，并重点检查：

```text
React Native lifecycle / foreground / background
异步竞态、stale response、重复 listener / timer
Android / iOS parity
权限、camera、files、share、notifications、deep links
Gradle / CocoaPods / plist / manifest / signing / entitlements
Remote Host / pairing / auth / reconnect / pagination
本地持久化与服务端 authoritative state 的边界
敏感 token、日志、CI signing / secret 边界
feature -> dev -> test -> prod 的发布约定
```

同时它也明确一条很重要的反误报规则：

> **缺少真机、Host 或平台验证证据，通常先进入 validation gaps，不自动升级成代码 Bug。**

除非任务合同本身明确要求这一轮必须完成对应验证。

这让 Reviewer 不再拿“我没看到证据”直接推导成“实现一定错了”。

## Findings 要把 Observation、Inference、Judgment 分开

AI Review 很常见的一种问题是：

模型看到一个现象，下一句话就把猜测写成事实，再下一句话给出一个很重的结论。

所以 Mobile Skill 继续强化了三层输出：

```text
Observation
Inference
Judgment
```

一个 finding 至少应该回答：

```text
Observation：代码实际做了什么？
Inference：这可能导致什么？
Judgment：基于现有合同，这是不是需要处理的问题？
```

并且附带：

```text
Platform / surface
Location
Suggested fix
Verification
```

这样 Builder 收到的不是一段“很像专家”的长作文，而是一组可以重新核实的假设。

Reviewer 的结论仍然不是事实本身。

## 输出必须是合同，不是一篇自由发挥的评论

一条 Review 要进入 Agent Loop，必须能够被机器识别。

所以 Review 带固定 marker 和 metadata，并记录至少：

```text
Head SHA
Base SHA
Model
Skill marker
Verdict
```

Mobile 当前的 verdict 只允许：

```text
NO_BLOCKING_FINDINGS
CHANGES_NEEDED
HUMAN_CHECK_NEEDED
```

这些值首先是 Reviewer 的**判断合同**，不是 GitHub 最终审批状态。

如果 marker、skill marker、结构或 metadata 不符合合同，workflow 应该失败，而不是把一段自由文本默默当成有效 Review。

这条原则后来也成为 Gatekeeper 的前提：只有结构化、可验证的 Reviewer 输出，才有资格进入确定性放行判断。

## 同一个 PR 只保留一个“当前 Review 状态”

如果每 push 一次就新增一条评论，真实项目很快会变成：

```text
Review #1
Review #2
Review #3
Review #4
Review #5
```

然后人和 Agent 都不知道哪条才对应当前代码。

所以 Publisher 查找固定 marker：

```text
找到 → 更新
找不到 → 创建
```

每次 synchronize 更新的是同一条 Review comment。

真正判断新旧的依据不是评论数量，而是 metadata 里的：

```text
Head SHA
```

这让 PR comment 更像一个“当前 Review 状态视图”，而不是聊天记录。

## 本地 Agent 需要一个明确的 Review Inbox

只把 Review 发到 GitHub 仍然不够。

因为最初要解决的问题就是：

> 不要再让我把 Review 从 GitHub 复制回 OpenCode / Codex / 施工线程。

所以 Mobile 提供本地 handoff：

```bash
npm run review:pull
```

它会读取当前 PR 的 marked review，并写入：

```text
.ai/reviews/pr-<number>.md
.ai/reviews/latest.md
```

本地记录包含当前 PR、reviewed Head SHA、Base SHA、模型、stale 状态和完整 Review。

施工 Agent 的处理原则是：

```text
读取 latest.md
↓
检查 reviewed Head SHA
↓
不一致：stale，拒绝消费
↓
一致：逐条回查 finding
↓
fix / reject / escalate
```

也就是说：

> **Reviewer 的输出是下一轮验证的输入，不是自动变成事实。**

## Head SHA 是整条 loop 最重要的门禁字段之一

假设 Reviewer 看的是：

```text
SHA A
```

它说：

```text
NO_BLOCKING_FINDINGS
```

随后 Builder 又 push 了：

```text
SHA B
```

那么上一轮 Review 就已经过期。

本地 Agent 不能只问：

> 有没有 Review？

它必须问：

> **这条 Review 是不是针对我现在手里的代码？**

Publisher 在发布后也会用同一套 handoff 逻辑自检，确认 reviewed Head SHA 与当前 PR Head 一致。

这一步证明 GitHub 上的 Review 确实沿着我们规定的协议进入本地 Agent 收件箱，而不是只在文档里说“理论上可以”。

## 模型路由踩过的坑仍然值得保留

原型阶段我们用过 DeepSeek V4 Pro，并踩过一个很真实的 provider 路由问题。

一开始把模型写成：

```text
opencode/deepseek-v4-pro
```

调用到了另一条账户产品线，最后报余额错误。

后来确认 OpenCode Go 应使用对应的 Go provider，例如当时的：

```text
opencode-go/deepseek-v4-pro
```

这个坑本身仍然值得留：

> **模型名字相同，不代表 provider 路由相同。**

但模型并不是这套架构最稳定的部分。

进入 Mira Mobile 后，默认 Reviewer 改成并真实 smoke 过：

```text
opencode-go/gpt-5.6-luna
```

这也进一步说明：

Reviewer 模型可以换。

Skill、版本合同、权限边界和 Gate 规则不应该因此重写。

## Mira Mobile smoke 真正验证了什么

进入 Mobile 项目以后，我们重新做了一次 disposable smoke PR，没有 merge。

这次验证的不只是“模型有没有回一句话”，而是一整条链：

```text
PR -> dev
↓
只读 Reviewer job
↓
可信 base Reviewer / Skill
↓
sanitized PR snapshot
↓
OpenCode Go + Luna
↓
结构化 Mobile Review
↓
Publisher comment
↓
local review:pull
↓
Head SHA freshness check
```

smoke 得到：

```text
NO_BLOCKING_FINDINGS
```

而且没有因为“没有真机 / Host 验证”胡乱报一个阻塞 Bug，而是明确把这类验证视为当前 docs-only 改动之外的 validation gap。

这件小事其实很关键。

它证明项目级 Review Skill 不只是被写进仓库，而是真的进入了模型调用和最终输出合同。

## 第二阶段：开始设计 Gate，但 Gate 不用模型

第一阶段我们刻意不做强制门禁，是因为当时真正需要验证的是 Reviewer 质量。

这条谨慎仍然是对的。

但当 Review loop、版本绑定、项目 Skill 和 local handoff 都真实跑通以后，下一个问题自然出现：

> 如果所有条件都明确满足，为什么还必须让人手工改状态、手工 Approve？

这里我们没有选择给 Reviewer 更多 GitHub 写权限，也没有再增加一个“审批模型”。

当前设计是增加一个**纯确定性 Gatekeeper**。

它不读 diff，不重新推理代码，也不调用任何模型。

它只检查硬条件。

例如 Mira Mobile 可以要求同时满足：

```text
Reviewer verdict == NO_BLOCKING_FINDINGS
review marker 有效
skill marker 有效
reviewed Head SHA == current PR Head SHA
必要 CI 全绿
不存在 HUMAN_CHECK_NEEDED
对应 MOB 任务卡存在且状态允许放行
PR 目标分支符合项目约定
```

全部满足，Gate 才有资格执行确定性写操作，例如：

```text
更新任务 Review 状态
GitHub APPROVE
标记 ready-to-merge
```

任一条件不满足，就不放行。

这个 Gatekeeper **目前是已经确定的下一阶段设计，不应写成已经完成的线上能力**。

第一阶段真正已经运行的是 Reviewer → Publisher → Local Handoff；Gate 的施工会在这条可信基础上继续补。

## 为什么 Gatekeeper 坚持不用模型

我们讨论过要不要给 Gatekeeper 再配一个模型。

最后决定不要。

原因不是成本，而是职责。

Reviewer 已经负责最需要语义理解的部分：

```text
读需求
读代码
理解合同
识别风险
给 verdict
```

Gatekeeper 如果再拿模型重新解释一次，就会出现新的问题：

```text
Reviewer 说没有阻塞
↓
Gate 模型再“感觉一下”能不能过
↓
到底哪个判断才是合同？
```

更干净的结构是：

```text
Luna / 其他 Reviewer
        ↓
结构化 verdict + evidence
        ↓
Deterministic Gate
        ↓
RETURN / APPROVE / ready-to-merge
```

Gate 的价值就在于它**无聊、可预测、可审计**。

它不需要“聪明”。

它只需要忠实执行规则。

## Reviewer、Publisher、Gatekeeper 三种写权限不要混在一起

走到这里，GitHub Review 的角色边界越来越清楚：

```text
Reviewer
- 模型
- 读项目
- 读代码
- 输出判断
- 无 GitHub 业务写权

Publisher
- 无模型
- 发布当前 Review 状态
- 验证 handoff 合同

Gatekeeper
- 无模型
- 验证版本 / CI / marker / task / branch
- 满足条件后执行有限的流程写操作
```

这比“一个 AI Reviewer 拿一个大 token，然后什么都做”复杂一点。

但它有一个非常现实的好处：

> **每一种权力都能解释为什么存在，也能解释为什么到这里为止。**

## GitHub APPROVE 和 merge 也应该继续分层

Gatekeeper 可以负责正式 `APPROVE`，不等于现在就应该自动 merge。

至少第一阶段更稳的做法是：

```text
Reviewer 无阻塞
+
Gate 规则全通过
↓
自动更新 Review 状态
自动 APPROVE
ready-to-merge
↓
人工 / 更高层规则决定 merge
```

这给我们留下观察真实 PR 的空间，也避免把“代码审查通过”和“现在就应该改变主干”混成一个动作。

以后如果某类低风险 PR 已经足够稳定，再单独定义 auto-merge 条件也来得及。

## Review 原则应该继续长在项目里，而不是长在一篇 prompt 里

Mira Mobile 这次还有一个很重要的变化：

Review 规则开始变成项目资产。

不是每次临时告诉模型：

> 你认真一点，帮我审一下。

而是让项目自己逐渐积累：

```text
什么是真相源
哪些合同不能破坏
哪些平台差异必须关注
什么算 P0 / P1 / P2
什么只是 validation gap
哪些目录有特殊风险
什么情况下必须人工介入
什么条件可以确定性放行
```

这些规则会继续变化。

有些属于产品组织原则，写在 Tomz.io。

有些属于项目 Review Skill、GitHub Actions、Gatekeeper 和具体合同，留在项目和工程文档里。

这比把所有经验都塞进一个越来越长的 prompt 更容易维护。

## 从 Review Bot 到完整的 Agent Handoff

如果只看 GitHub 页面，这套东西仍然很像一个 Review Bot。

但从系统关系看，它已经多了一步很关键的东西：

```text
Reviewer Output
↓
Local Agent Observation
```

再往前一步，则是：

```text
Builder
↓
Reviewer
↓
Builder / Fix
↓
Reviewer
↓
Deterministic Gate
↓
ready-to-merge / human check
↓
Test / Device Validation / Release
```

每个 Agent 不需要共享一条无限长的聊天上下文。

它们只需要共享：

```text
目标
状态
版本
Evidence
handoff contract
```

我们一开始只是想做一个 AI Code Review。

真正跑下来以后，更值得留下的反而是几条工程原则：

- Reviewer 的判断和 GitHub 写权限分开；
- 待审代码和 Reviewer 控制面分开；
- 项目 Review 规则通过 Skill / contract 固化；
- Review 必须绑定明确版本；
- 缺失验证证据和已证明 Bug 分开；
- 模型判断和确定性放行分开；
- 自动 Approve 和最终 merge 也可以继续分层。

这条 loop 以后当然还会改。

但它已经不只是“让 AI 在 PR 下留一句评论”。

它开始变成一套能够被 Builder、Reviewer、人和流程规则共同消费的工程合同。
