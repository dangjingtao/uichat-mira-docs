---
title: 把 AI Code Review 接成一个真正的 Agent Loop
description: 用 GitHub Actions、OpenCode Go 与 DeepSeek V4 Pro，把 Builder → PR → Reviewer → Findings → Builder 接成可重复运行、可校验版本、可被本地 Agent 消费的评审循环。
group: 工程现场
order: 30
date: 2026年8月28日
readTime: 12 分钟阅读
tags: OpenCode Go | DeepSeek V4 Pro | AI Code Review | Agent Loop | GitHub Actions | Agent Handoff
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

这篇只讲工程上怎么把它接成一条可信的 loop。

## 目标不是做一个会评论的机器人

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

所以我们一开始就定了几条边界：

- 不自动 merge；
- 不自动 GitHub `APPROVE`；
- 不自动 `REQUEST_CHANGES`；
- 不自动把任务改成 `PASS`；
- Review Agent 不能修改代码；
- Review Agent 不能执行 shell；
- Review 结果只是建议，本地施工 Agent 必须重新对照代码和合同验证。

这套东西的定位始终是 **第二双眼睛**，不是最终裁判。

## 最终架构：模型只读，发布器单独写 GitHub

真正跑起来以后，最重要的一次架构调整不是 prompt，而是权限。

最终 workflow 被拆成两个 job：

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

1. checkout 当前 PR head；
2. 关闭 persisted Git credentials；
3. 安装 OpenCode CLI；
4. 从 `dev` 读取可信 Reviewer 脚本；
5. 调用模型生成 Review；
6. 写出 `ai-review.md`；
7. 上传短期 artifact。

最关键的是：**这个 job 不拿 GitHub 写权限。**

模型即使“想”去评论、改代码、加 reaction，也没有对应 token 可以用。

OpenCode 的权限同时显式限制为：

```json
{
  "edit": "deny",
  "bash": "deny",
  "task": "deny",
  "webfetch": "deny",
  "websearch": "deny"
}
```

也就是说它只是 Reviewer。

不是披着 Reviewer 名字的第二个 Coding Agent。

### publish job

Publisher 不运行模型。

它只做确定性操作：

```text
下载 ai-review.md
↓
查找带 marker 的 PR comment
↓
不存在：创建
存在：更新
↓
执行本地 handoff 脚本
↓
验证 Head SHA + marker
```

所以 GitHub 写权限和模型执行被物理拆开了。

这是整套设计里我们最想保留的一条原则：

> **需要写权限的是发布器，不是 Reviewer。**

## 为什么没有直接沿用 OpenCode 的 GitHub Action 写法

第一次 smoke test 其实走过一条更直接的路。

我们尝试让 OpenCode 官方 GitHub 模式直接处理 PR。

PR trigger、checkout、`OPENCODE_API_KEY` 检查、OpenCode 安装都正常。

但官方模式本身会尝试在 GitHub 上添加 reaction / comment。

在严格的只读权限下，它遇到了：

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

## Reviewer 脚本必须来自可信 base，而不是 PR branch

还有一个容易忽略的问题。

如果 workflow checkout 的是 PR head，然后直接执行：

```text
scripts/opencode-pr-review.mjs
```

那么提交 PR 的代码本身就可以修改 Reviewer 脚本。

即使是同仓库 PR，这个边界也不够干净。

所以 workflow 实际执行的是：

```bash
git show "origin/${BASE_BRANCH}:scripts/opencode-pr-review.mjs" \
  > "$RUNNER_TEMP/opencode-pr-review.mjs"
```

也就是：

> **Review 的对象来自 PR，Review 的规则来自可信的 `dev`。**

这样 PR 可以改变待评审代码，但不能在同一个 diff 里偷偷改掉“评审自己”的逻辑并让这轮 CI 使用它。

## OpenCode Go 的模型 ID：`opencode-go/deepseek-v4-pro`

这里还踩了一个非常真实的坑。

一开始把 DeepSeek V4 Pro 配成了：

```text
opencode/deepseek-v4-pro
```

调用确实到了 DeepSeek V4 Pro，但 OpenCode 返回：

```text
Insufficient balance
```

开始看起来像 Key、余额或模型权限问题。

后来才确认，我们用的是 **OpenCode Go 账户**。

Go 和 Zen 是两个不同 provider。

正确模型 ID 是：

```text
opencode-go/deepseek-v4-pro
```

修正以后，用同一个 repository secret `OPENCODE_API_KEY` 重新触发 smoke PR，Review 正常完成。

日志明确记录：

```text
OPENCODE_REVIEW_MODEL: opencode-go/deepseek-v4-pro
```

最后 Review comment 的 metadata 也记录同一个模型。

这个坑很小，但很值得留下：

> **不要把“模型名字一样”理解成“provider 一样”。账户产品线不同，路由也可能完全不同。**

## Review 输入不只是一段 diff

如果只是把 diff 丢给模型，它很容易退化成语法和局部实现检查。

我们希望 Reviewer 至少理解“这次改动要满足什么”。

所以 Reviewer 输入包括：

```text
PR title / body
base / head metadata
changed filenames
PR diff
AGENTS.md
Product Brief
Work Ledger
matching T### task card
```

其中任务卡会在 PR title、body 或 branch name 里识别 `T###`。

这样 Reviewer 不只知道：

> 这里改了一个函数。

它还可能知道：

> 这张任务卡明确要求不能改变某个合同；当前改动违反了它。

这才开始接近项目 Review，而不是通用静态扫描。

当然，大 diff 仍然会被截断。

当前输入上限是一个明确的工程边界，而不是假装模型看到了全仓。

只要 Evidence 不完整，Reviewer 就应该在 `Review gaps` 里承认。

## 输出必须是合同，而不是一篇自由发挥的作文

Review 最终带固定 marker：

```html
<!-- local-ai-review:v1 -->
```

同时还有 metadata，至少记录：

```text
Head SHA
model
```

正文保持固定顶层结构：

```text
# Experimental OpenCode PR Review

## Verdict
## Findings
## Review gaps
## Local handoff
```

Verdict 只允许三个实验性值：

```text
NO_BLOCKING_FINDINGS
CHANGES_NEEDED
HUMAN_CHECK_NEEDED
```

这三个值都不是 GitHub 的正式审批状态。

Findings 要求把三层东西分开：

```text
Observation
Inference
Judgment
```

并给出 P0-P3 severity。

这是为了避免很常见的一种 AI Review 问题：

模型看到一个现象，下一句话就把猜测写成事实，再下一句话给出一个很重的结论。

把观察、推断和判断拆开以后，本地 Agent 更容易逐条复核。

## 同一个 PR 只保留一条 Review comment

如果每 push 一次就新增一条评论，真实项目很快会变成：

```text
Review #1
Review #2
Review #3
Review #4
Review #5
```

然后人和 Agent 都不知道哪条才对应当前代码。

所以 Publisher 会查找带 marker 的 comment：

```text
<!-- local-ai-review:v1 -->
```

找到就 PATCH。

找不到才 POST。

每次 synchronize 更新的是同一条 Review。

真正判断新旧的依据不是 comment 数量，而是 metadata 里的：

```text
Head SHA
```

这让 Review comment 更像一个“当前状态视图”，而不是聊天记录。

## 本地 Agent 需要一个明确的 Review Inbox

只把 Review 发到 GitHub 仍然不够。

因为最初要解决的问题就是：

> 不要再让我把 Review 从 GitHub 复制回 OpenCode / Codex / 施工线程。

所以项目里增加了：

```bash
npm run review:pull
```

它会读取当前 PR 的 marked review，并写入：

```text
.ai/reviews/pr-<number>.md
.ai/reviews/latest.md
```

本地文件记录：

```text
repository
PR URL
base
head
Head SHA
review source
updated time
完整 Review body
```

`.ai/reviews/` 被 gitignore。

这不是新的任务真相源，只是一个本地 Agent inbox。

施工 Agent 的处理原则是：

```text
读取 latest.md
↓
检查 Head SHA 是否等于当前 PR
↓
不一致：视为 stale
↓
一致：逐条回查 finding
↓
fix / reject / escalate
```

也就是说：

> **Reviewer 的结论不是事实；Reviewer 的输出是下一轮验证的输入。**

## Head SHA 是这条 loop 里最重要的小字段之一

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

所以本地 Agent 不能只问：

> 有没有 Review？

它必须问：

> **这条 Review 是不是针对我现在手里的代码？**

这也是为什么 Publisher 在发布后还会自己运行一次：

```text
scripts/pull-ai-review.mjs
```

并验证 `.ai/reviews/latest.md` 里的 Head SHA 和 marker。

这一步看起来有点重复，但它证明了：

> GitHub 上生成的 Review，确实可以沿着我们规定的协议进入本地 Agent 收件箱。

不是只在文档里说“理论上可以”。

## smoke test 里真正验证了什么

我们用了 disposable PR 做真实 smoke，没有 merge。

第一轮暴露 GitHub write 权限问题。

第二轮证明 OpenCode Key 能真实进入模型调用，但错误走到了 Zen provider。

切到免费模型以后，先把完整 Review + Publisher + comment update + local handoff 链路跑通。

最后再用 OpenCode Go + DeepSeek V4 Pro 做独立 smoke。

最终验证的不是一句“CI 绿了”，而是这些具体事实：

- `pull_request -> dev` 确实触发；
- Review job 只有 `contents: read`；
- OpenCode 实际运行 `opencode-go/deepseek-v4-pro`；
- `ai-review.md` artifact 正常生成；
- Publisher 正常创建 / 更新 marked comment；
- 新 push 后更新的是同一条 comment；
- metadata Head SHA 跟随 PR head 更新；
- `review:pull` 能生成本地 Review inbox；
- CI 能验证 inbox 中 Head SHA 与 marker；
- 普通 `Verify Prototype` 仍然独立工作；
- smoke PR 最终关闭，没有 merge。

这才算一条最小 loop 真正接通。

## 为什么现在仍然不把它做成强制门禁

跑通基础链路以后，最容易做的下一步是：

```text
CHANGES_NEEDED -> block merge
NO_BLOCKING_FINDINGS -> allow merge
```

我们没有这么做。

因为现在最需要验证的不是自动化强度，而是 Reviewer 质量。

接下来更值得观察 3 到 5 个真实业务 PR：

```text
它发现了什么真问题？
误报了什么？
漏掉了什么？
施工 Agent 对 findings 的处理是否合理？
返工以后第二轮 Review 有没有真正收敛？
耗时是否值得？
```

只有真实数据积累起来以后，才值得决定：

- prompt 要不要继续收紧；
- severity 哪一级应该阻塞；
- DeepSeek V4 Pro 是否保持默认；
- 哪些目录需要不同 Review 策略；
- 是否需要正式接进 Mira Forge 的调度状态机。

否则很容易把一个刚跑通的实验，过早升级成新的 CI 官僚主义。

## 从 Review Bot 到 Agent Handoff

如果只看 GitHub 页面，这套东西仍然很像一个 Review Bot。

但从系统关系看，它已经多了一步很关键的东西：

```text
Reviewer Output
↓
Local Agent Observation
```

这一步一旦稳定，后面可以继续接：

```text
Builder
↓
Reviewer
↓
Builder
↓
Test Agent
↓
Browser / Device Validation
↓
Release Reviewer
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

这也是这次实验最值得留下的地方。

我们没有做出一个“更会说话的 AI Reviewer”。

我们只是第一次把 Reviewer 放进了一条可以回到施工方的循环里。

而对 Macro Agent Loop 来说，这可能比多增加十个“专家角色”更重要。
