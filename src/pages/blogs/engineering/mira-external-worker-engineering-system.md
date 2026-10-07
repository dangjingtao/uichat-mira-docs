---
title: 把“牛马”做成一个工程系统：Mira External Worker 的设计、边界与证据链
description: 从手机派工到可审查 Draft PR，复盘 Mira External Worker 如何把任务合同、权限边界、可信验证、结构化证据与可替换模型做成一条真实可运行的工程链路。
group: 工程现场
order: 33
date: 2026年10月7日
readTime: 24 分钟阅读
tags: Agent | External Worker | OpenCode | GitHub Actions | Evidence | Provider | Engineering
author: tomz | mira
writingMode: co-authored
writtenBy: mira
reviewedBy: tomz
---

# 把“牛马”做成一个工程系统：Mira External Worker 的设计、边界与证据链

> 从手机上一句话，到 GitHub 上一张可审查的 Draft PR。  
> 中间真正困难的，并不是“让另一个 AI 写代码”，而是如何把一次 AI 编码行为变成一个可约束、可验证、可恢复、可审计的工程工作单元。

过去很长一段时间，我使用 AI 编程工具的工作流其实相当原始。

我在 ChatGPT 里讨论问题，形成工程判断；然后把提示词复制出来，走到电脑前，再粘贴给另一个 Coding Agent；等它改完代码，我再把结果拿回来继续审查。

如果只是偶尔改一个小功能，这没什么问题。

但当工程规模上来以后，这种模式很快暴露出一个根本问题：

> **人变成了 Agent 之间的数据总线。**

尤其当主要决策发生在手机上，而真正的代码执行需要持续几十分钟甚至更久时，“复制提示词—等待—搬运结果—继续追问”本身就成了工作。

Mira External Worker 最初想解决的，其实就是这么一个朴素的问题：

> 我能不能在手机上说一句“让牛马干这张卡”，然后把后续执行交给一个更便宜、更持久、更适合干工程脏活的模型；而整个过程仍然留下可靠的 Git、CI 和审查证据？

最后，我们没有把它做成一个庞大的“多 Agent 平台”。

相反，整个系统被刻意压缩成了一条很薄的工程链路。

::: html
<div style="margin:28px 0;padding:22px;border:1px solid rgba(127,127,127,.24);border-radius:18px;background:rgba(127,127,127,.055);overflow:auto">
  <div style="display:flex;align-items:center;gap:10px;min-width:920px;font-size:13px;line-height:1.35;text-align:center">
    <div style="flex:1;padding:14px 12px;border-radius:12px;border:1px solid rgba(127,127,127,.28)"><strong>Maintainer / ChatGPT</strong><br><span style="opacity:.7">判断与派工</span></div>
    <div style="opacity:.45">→</div>
    <div style="flex:1;padding:14px 12px;border-radius:12px;border:1px solid rgba(127,127,127,.28)"><strong>GitHub Issue</strong><br><span style="opacity:.7">任务合同</span></div>
    <div style="opacity:.45">→</div>
    <div style="flex:1;padding:14px 12px;border-radius:12px;border:1px solid rgba(127,127,127,.28)"><strong>GitHub Actions</strong><br><span style="opacity:.7">可信生命周期</span></div>
    <div style="opacity:.45">→</div>
    <div style="flex:1;padding:14px 12px;border-radius:12px;border:1px solid rgba(127,127,127,.28)"><strong>External Worker</strong><br><span style="opacity:.7">受限执行</span></div>
    <div style="opacity:.45">→</div>
    <div style="flex:1;padding:14px 12px;border-radius:12px;border:1px solid rgba(127,127,127,.28)"><strong>OpenCode</strong><br><span style="opacity:.7">Agent loop</span></div>
    <div style="opacity:.45">→</div>
    <div style="flex:1;padding:14px 12px;border-radius:12px;border:1px solid rgba(127,127,127,.28)"><strong>Provider / Model</strong><br><span style="opacity:.7">可替换执行智能</span></div>
    <div style="opacity:.45">→</div>
    <div style="flex:1;padding:14px 12px;border-radius:12px;border:1px solid rgba(127,127,127,.28)"><strong>Verification</strong><br><span style="opacity:.7">模型外验证</span></div>
    <div style="opacity:.45">→</div>
    <div style="flex:1;padding:14px 12px;border-radius:12px;border:1px solid rgba(127,127,127,.28)"><strong>Draft PR</strong><br><span style="opacity:.7">交回审查</span></div>
  </div>
  <div style="margin-top:14px;font-size:12px;opacity:.62">Mira External Worker 的核心不是“另一个聊天机器人”，而是一条从工作合同到可验证交付的受控执行链。</div>
</div>
:::

它现在已经真实跑通，而且不再绑定某一家模型供应商。

这篇文章记录它是怎么一步步形成的，以及为什么我们故意没有把它做得更“大”。

## 一、第一原则：GitHub 才是工作现场，聊天不是

External Worker 最重要的设计决定，并不是用了 DeepSeek、OpenCode 或 GitHub Actions。

而是：

> **长期工程状态必须落在 GitHub，而不能依赖某个 AI 会话的记忆。**

这个判断来自最早的设计 POC [#36](https://github.com/uichat-mira/.github/issues/36)。

ChatGPT 很适合做需求讨论、架构判断、任务拆解、调度、Review 和最终决策，但它不适合承担长期执行状态。一次 Agent 会话可能被中断，模型额度可能耗尽，线程可能变得过长，执行端甚至可能被整个替换。

如果一个任务只有在“刚才那个聊天窗口”里才知道做到哪里，那么它实际上没有工程上的可恢复性。

所以我们最终把职责拆得很明确：

| 层 | 职责 |
|---|---|
| GitHub Issue | 当前工作项合同 |
| Issue trusted comments | 对合同的正式修订 |
| Git branch / commit | 实际代码变化 |
| Pull Request | Review 与交付边界 |
| GitHub Actions | 执行和 trusted verification |
| Actions artifact | 单次 Worker 运行证据 |
| OpenCode | Coding Agent 执行循环 |
| Provider / Model | 本次执行使用的智能 |
| ChatGPT / Maintainer | 调度、判断、验收与决策 |

换句话说：

> **聊天负责思考，GitHub 负责记账。**

这是后面所有设计的基础。

## 二、我们先试过更“先进”的东西，然后主动退了一步

最早 POC 并不是直接 GitHub Actions + OpenCode。

我们研究和测试过 GitHub Agentic Workflows，也就是 `gh-aw`。

它有很多很吸引人的方向：hardened execution、safe output、custom engine，以及未来可能更成熟的 queue / ledger 能力。从长期看，它仍然值得关注。

但 POC 很快发现一个现实问题：**它在我们当前的 OpenCode 路径上增加了额外的网络、防火墙、证书和运行时耦合。**

一次真实实验已经让 OpenCode 启动起来了，但后台依赖安装被沙箱/TLS 链路卡住。

这不是说 `gh-aw` 不好。

它说明的是：

> 我们当时真正需要验证的，只是“GitHub 能不能可靠地派一个 Coding Worker 去干活”。

为了验证这个问题，引入一整层 Agent orchestration 反而增加了变量。

所以 #36 做了一个非常重要的收缩：

> 第一版生产设计不要求 `gh-aw`。  
> GitHub Actions 负责生命周期，OpenCode 负责 Agent loop。

随后我们做了一条最直接的 read-only smoke：

::: html
<div style="margin:24px 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px">
  <div style="padding:14px;border-radius:12px;background:rgba(127,127,127,.06);border:1px solid rgba(127,127,127,.22)"><strong>GitHub Actions</strong><br><span style="font-size:12px;opacity:.65">trusted runtime</span></div>
  <div style="padding:14px;border-radius:12px;background:rgba(127,127,127,.06);border:1px solid rgba(127,127,127,.22)"><strong>OpenCode 1.18.34</strong><br><span style="font-size:12px;opacity:.65">coding harness</span></div>
  <div style="padding:14px;border-radius:12px;background:rgba(127,127,127,.06);border:1px solid rgba(127,127,127,.22)"><strong>OpenCode Go</strong><br><span style="font-size:12px;opacity:.65">provider route</span></div>
  <div style="padding:14px;border-radius:12px;background:rgba(127,127,127,.06);border:1px solid rgba(127,127,127,.22)"><strong>DeepSeek V4.1 Flash</strong><br><span style="font-size:12px;opacity:.65">execution model</span></div>
  <div style="padding:14px;border-radius:12px;background:rgba(127,127,127,.06);border:1px solid rgba(127,127,127,.22)"><strong>Mira Skill + AGENTS</strong><br><span style="font-size:12px;opacity:.65">current policy</span></div>
</div>
:::

run `37521904707` 成功。

接着又从手机端发出一句非常朴素的测试指令：

> 把测试分支 README.md 内容改为“牛马，起来干活了”。

然后完整走过：

::: html
<div style="margin:24px 0;padding:18px 20px;border-left:3px solid rgba(204,120,92,.8);background:rgba(204,120,92,.06);border-radius:0 14px 14px 0">
  <div style="font-size:13px;line-height:2">
    <strong>手机指令</strong> → ChatGPT dispatch → GitHub Actions → OpenCode → DeepSeek → 修改 README → deterministic verification → bot commit → push
  </div>
</div>
:::

Worker 最终产生 commit `5f7d28820f0073000d10ce0094d937462880d286`。

这件小事其实非常关键。

因为它第一次证明：

> **维护者不需要坐在电脑前，也不需要手动把提示词搬给另一个 Agent。**

## 三、为什么没有直接采用 OpenCode 官方 GitHub Action

POC 期间还有一个很容易忽略、但对真实工程非常致命的问题。

OpenCode 官方 GitHub Action 很适合作为参考实现，但当时我们确认，它的 `workflow_dispatch` 路径会把生成的 PR 指向仓库默认分支。

这在很多普通项目里没问题。

但 Mira Desktop 的默认分支是 `prod`，正常开发交付却是 `feature → dev`。

如果 Agent 默认把 PR 指向 `prod`，这不是“有点不方便”。

这是**交付语义错误**。

因此 External Worker 从第一天起就要求一个显式输入：

`base_branch`

Worker 必须：

1. checkout 指定 base；
2. 记录 base SHA；
3. 从该 SHA 创建自己的 Worker branch；
4. 最终把 Draft PR 指回同一个显式 base。

绝不能把 repository default branch 偷偷解释成 engineering delivery branch。

这也是为什么 GitHub 生命周期由 Mira 自己持有，而不是完全交给某个第三方 Action。

## 四、生产第一刀：一张 Issue，只派一个 Worker

POC 结束之后，我们没有继续扩平台。

而是开了实施卡 [#37](https://github.com/uichat-mira/.github/issues/37)：

> Implement reusable single-Issue external Worker to Draft PR

标题基本概括了第一版生产目标。

**一次执行只服务一张明确的 GitHub Issue。**

不是一个长期常驻 Agent，不是一张聊天 session，也不是“看着仓库自己找活干”。

它的输入非常有限：

- Issue number；
- explicit base branch；
- verification command；
- provider credential。

执行过程则被压缩成：

::: html
<div style="margin:26px 0;padding:20px;border:1px solid rgba(127,127,127,.24);border-radius:16px">
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;font-size:13px">
    <div style="padding:13px;border-radius:10px;background:rgba(127,127,127,.055)"><strong>1. Contract</strong><br><span style="opacity:.68">fetch exact open Issue</span></div>
    <div style="padding:13px;border-radius:10px;background:rgba(127,127,127,.055)"><strong>2. Identity</strong><br><span style="opacity:.68">freeze base branch + SHA</span></div>
    <div style="padding:13px;border-radius:10px;background:rgba(127,127,127,.055)"><strong>3. Isolation</strong><br><span style="opacity:.68">create worker branch</span></div>
    <div style="padding:13px;border-radius:10px;background:rgba(127,127,127,.055)"><strong>4. Policy</strong><br><span style="opacity:.68">AGENTS + pinned Skill</span></div>
    <div style="padding:13px;border-radius:10px;background:rgba(127,127,127,.055)"><strong>5. Execution</strong><br><span style="opacity:.68">OpenCode bounded edits</span></div>
    <div style="padding:13px;border-radius:10px;background:rgba(127,127,127,.055)"><strong>6. Verification</strong><br><span style="opacity:.68">trusted command</span></div>
    <div style="padding:13px;border-radius:10px;background:rgba(127,127,127,.055)"><strong>7. Git</strong><br><span style="opacity:.68">commit + isolated push</span></div>
    <div style="padding:13px;border-radius:10px;background:rgba(127,127,127,.055)"><strong>8. Handoff</strong><br><span style="opacity:.68">Draft PR to explicit base</span></div>
  </div>
</div>
:::

这个“小”非常重要。

因为它给 Worker 建立了一个清晰的语义边界：

> **Worker 是某一张工作卡的执行者，不是仓库主人。**

组织级实现最终通过 PR [#38](https://github.com/uichat-mira/.github/pull/38) 进入 `uichat-mira/.github`。

## 五、Issue 不只是描述，而是一份执行合同

生产化之后，很快出现一个真实问题。

最开始，Worker 只读 Issue title/body。

但真实工程并不是这样工作的。一张卡发出去以后，维护者经常会说：

> 这个方案不要。  
> 保留 A，改掉 B。  
> 不要扩大权限。  
> 这部分已经验收，不要重新做。  
> 后续只修这两个点。

如果 Worker 每次都只读原始 Issue body，它会不断回到旧合同。

所以 Mira 最终把 Issue 语义定义成：

::: html
<div style="margin:24px 0;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:16px;align-items:center">
  <div style="padding:18px;border-radius:14px;border:1px solid rgba(127,127,127,.24);background:rgba(127,127,127,.05)"><strong>Issue title / body</strong><br><span style="opacity:.68">base work-item contract</span></div>
  <div style="font-size:22px;opacity:.42">+</div>
  <div style="padding:18px;border-radius:14px;border:1px solid rgba(127,127,127,.24);background:rgba(127,127,127,.05)"><strong>trusted maintainer amendments</strong><br><span style="opacity:.68">contract revisions</span></div>
</div>
:::

但并不是“评论越新权重越高”。

只有满足两个条件的评论才可能成为合同修订。

第一，作者必须是当前仓库拥有 `write / maintain / admin` 权限的人类账号。Bot 评论和普通用户评论不参与合同修改。

第二，内容必须明确是在 clarify、revise、return、narrow 或 change 工作项。

类似“CI 绿了”“收到”“继续”“看”这种状态型或对话型评论，不改变任务合同。

如果不同修订之间冲突，则后来的 trusted amendment 覆盖前面冲突的部分。

从工程模型上看，这已经很接近一种轻量级的 **event-sourced work contract**。

但我们没有为此再做数据库。

GitHub Issue 本身就是 ledger。

## 六、最关键的安全边界：模型不拥有 GitHub

External Worker 从第一版开始就有一个明确原则：

> **模型可以改工作区，但它不直接拥有 GitHub 的最终权限。**

当前 Worker 的 OpenCode 工具权限大致是：

~~~text
allow
  read
  glob
  grep
  list
  skill
  edit
  write

deny
  bash
  task
  webfetch
  websearch
  question
  external_directory
~~~

模型可以阅读代码、搜索、修改普通文件、创建文件。

但 Git mutation 是 trusted workflow 的责任。

::: html
<div style="margin:30px 0;padding:22px;border:1px solid rgba(127,127,127,.25);border-radius:18px">
  <div style="margin-bottom:14px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.58">Trust boundary</div>
  <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px">
    <div style="padding:18px;border-radius:14px;background:rgba(96,165,250,.07);border:1px solid rgba(96,165,250,.22)">
      <strong>Model / OpenCode</strong>
      <div style="margin-top:10px;font-size:13px;line-height:1.75;opacity:.78">读代码<br>搜索<br>编辑 / 写文件<br>加载 Skill</div>
      <div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(127,127,127,.16);font-size:12px;opacity:.62">没有 merge / close / release / deploy authority</div>
    </div>
    <div style="padding:18px;border-radius:14px;background:rgba(250,204,21,.07);border:1px solid rgba(250,204,21,.22)">
      <strong>Trusted Workflow</strong>
      <div style="margin-top:10px;font-size:13px;line-height:1.75;opacity:.78">验证 bounded diff<br>运行 verification<br>commit / push<br>创建 Draft PR<br>生成 evidence</div>
      <div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(127,127,127,.16);font-size:12px;opacity:.62">只执行 caller 明确提供的可信生命周期动作</div>
    </div>
    <div style="padding:18px;border-radius:14px;background:rgba(74,222,128,.07);border:1px solid rgba(74,222,128,.22)">
      <strong>Maintainer</strong>
      <div style="margin-top:10px;font-size:13px;line-height:1.75;opacity:.78">修改工作合同<br>Review / acceptance<br>Merge<br>关闭 Issue<br>Release / promotion</div>
      <div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(127,127,127,.16);font-size:12px;opacity:.62">结果权和高权限动作保持显式授权</div>
    </div>
  </div>
</div>
:::

这个分层不是为了让 Agent “不够强”。

它是为了让每一种权力都能解释。

## 七、那个“故意不修”的 workflow 权限失败

这套边界后来遇到了一次非常有价值的现实测试。

Worker 在实现后续卡片时修改到了：

`.github/workflows/**`

模型本身正确完成了修改，verification 也通过了，但到了 commit/push 阶段，GitHub 拒绝了它。

原因是当前 Worker token 没有 workflow write 权限。

正常的第一反应很容易是：

> 那给它加权限不就好了？

我们最终明确拒绝了这个方向。

因为一旦 Worker 可以“修改自己的 workflow + push 自己修改后的 workflow”，它实际上开始拥有修改自己安全边界的能力。

所以这个失败被正式认定为：

> **正确的安全失败，而不是需要绕过的 bug。**

这条判断后来变成了整个 Worker 治理里非常核心的一条原则：

> 不为了“全绿”去削弱权限边界。

涉及 workflow 的改动可以由 Worker 分析、修改 workspace、验证，并留下精确 handoff；但最终进入受保护 workflow surface，要经过 trusted maintainer integration。

## 八、为什么 verification 必须在模型之外

另一条同样重要的原则是：

> **模型不能自己宣告自己做对了。**

所以 Worker 要求 `verification_command` 由 trusted caller 提供，并作为独立 GitHub Actions step 执行。

例如：

~~~bash
git diff --check
~~~

或者仓库自己的：

~~~bash
pnpm check
pnpm test ...
~~~

它不是 Issue 里的一段自由文本，也不会由模型自己决定然后当作事实。

这样做有两个好处。

第一，它避免模型通过“我认为测试应该通过”来代替真正执行。

第二，verification 命令运行在 trusted workflow 层，而不是模型工具层，因此不会顺手把各种 workflow secrets 暴露给任意 bash。

第一版 External Worker 甚至因此故意不给模型 shell。

这是能力上的保守，但安全模型非常容易理解。

## 九、能执行还不够：我们需要知道它到底发生了什么

Worker 跑通以后，很快出现第二个问题。

GitHub Actions console log 可以告诉我们“成功了”或“失败了”，但如果一个 Worker 在中间失败，新会话想接手，就还缺很多东西：

- 它在哪一步停了？
- OpenCode 有没有真正启动？
- 模型执行过哪些工具？
- verification 有没有执行？
- 哪些文件发生变化？
- commit 有没有产生？
- PR 有没有产生？
- 失败是在模型阶段，还是 Git 阶段？

于是有了 [#39](https://github.com/uichat-mira/.github/issues/39)：structured external Worker observability and evidence logging。

它刻意没有被做成“监控平台”，而是定义了一包有限、机器可读的证据：

~~~text
worker-run.json
trajectory.jsonl
session-summary.json

worker-output.txt
worker-output-meta.json

verification.log
verification-meta.json

changed-files.txt
committed-files.txt
diff-stat.txt
~~~

Actions artifact retention 目前是 **14 天**。

## 十、trajectory 不是 Chain of Thought

这里有一个非常重要的边界。

所谓“Agent 可观察性”，并不意味着把模型的内部思考全部保存下来。

External Worker 的 trajectory 是 **metadata-only**。

我们利用 OpenCode 支持的 session/export surface，提取类似：

~~~text
kind
session_id
message_id
role
tool
call_id
status
started_at
ended_at
~~~

但明确不落：

~~~text
prompt text
private reasoning
tool arguments
tool outputs
raw environment
~~~

所以它更接近 execution trace，而不是 model brain dump。

这既减少敏感信息暴露，也让证据包更稳定、更适合机器分析。

## 十一、证据必须同时覆盖“成功”和“失败”

Evidence system 最有价值的一点，是没有只拿成功案例验收。

真实 failure run `37547267946` 中：

::: html
<div style="margin:24px 0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;text-align:center;font-size:13px">
  <div style="padding:14px 8px;border-radius:10px;background:rgba(74,222,128,.07);border:1px solid rgba(74,222,128,.2)"><strong>Model</strong><br>PASS</div>
  <div style="padding:14px 8px;border-radius:10px;background:rgba(74,222,128,.07);border:1px solid rgba(74,222,128,.2)"><strong>Bounded change</strong><br>PASS</div>
  <div style="padding:14px 8px;border-radius:10px;background:rgba(74,222,128,.07);border:1px solid rgba(74,222,128,.2)"><strong>Verification</strong><br>PASS</div>
  <div style="padding:14px 8px;border-radius:10px;background:rgba(248,113,113,.07);border:1px solid rgba(248,113,113,.22)"><strong>Commit / Push</strong><br>FAIL</div>
</div>
:::

失败原因正是前面提到的 workflow mutation 权限边界。

但 evidence finalizer 和 artifact upload 都成功。最终 `worker-run.json` 明确记录：

~~~text
terminal_status: failure
failure_stage: commit_push
~~~

并且没有伪造 commit / PR pointer。

另一次 run `37548103523` 中，Worker 没有产生真实 implementation diff，证据则记录：

~~~text
failure_stage: bounded_change
~~~

这两个失败比一次成功更重要。

它们证明：

> **证据系统不是“成功时写一份漂亮报告”，而是真正覆盖失败路径。**

## 十二、输出必须有界

Agent 输出还有一个非常现实的问题：它可能无限大。

所以 Worker 和 verification 输出都设了持久化上限：

`120 KB`

trajectory 也有限定事件数量和总量。

一旦发生截断，artifact 不是偷偷砍掉，而是额外记录：

~~~text
truncated: true
original bytes
persisted bytes
~~~

这样，“证据不完整”本身也成为可观察状态。

后续 reviewer 不会误以为自己看到的是全部内容。

结构化证据实现最终通过 PR [#45](https://github.com/uichat-mira/.github/pull/45) 落地；成功路径则由后续真实 Worker run `37551657707` 补齐。

## 十三、默认 DeepSeek 跑通后，我们故意把它拆掉

External Worker 最初写死的是：

`OpenCode Go + deepseek-v4.1-flash`

这是有意为之。POC 阶段最重要的是减少变量。

但如果一直保持这样，就会产生一个错误抽象：

> Mira External Worker = DeepSeek Worker

所以后续的关键改造 [#40](https://github.com/uichat-mira/.github/issues/40)，是把 Worker、Provider、Model 三者拆开。

::: html
<div style="margin:26px 0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px">
  <div style="padding:18px;border-radius:14px;border:1px solid rgba(127,127,127,.24);background:rgba(127,127,127,.05)"><strong>Worker</strong><br><span style="font-size:13px;opacity:.7">任务合同、权限、Skill、验证、Git 与 Evidence</span></div>
  <div style="padding:18px;border-radius:14px;border:1px solid rgba(127,127,127,.24);background:rgba(127,127,127,.05)"><strong>Provider</strong><br><span style="font-size:13px;opacity:.7">认证、endpoint、adapter 与运行配置</span></div>
  <div style="padding:18px;border-radius:14px;border:1px solid rgba(127,127,127,.24);background:rgba(127,127,127,.05)"><strong>Model</strong><br><span style="font-size:13px;opacity:.7">本次执行使用的具体智能能力</span></div>
</div>
:::

Worker 定义的是稳定执行角色；Provider/model 只是：

> **这一次 run 用谁来执行。**

## 十四、Provider 配置必须是 run-scoped

Provider abstraction 的第一原则是：

> 换模型不能污染其它 Agent 的 OpenCode 配置。

所以 Worker 不会为了使用某个供应商去修改：

- `~/.config/opencode`；
- repository `opencode.json`；
- maintainer local settings；
- other agent defaults。

而是只在当前 OpenCode 进程里注入：

~~~text
OPENCODE_AUTH_CONTENT
OPENCODE_CONFIG_CONTENT
~~~

run 结束以后，配置自然消失。

这让 provider/model 真正成为 execution input，而不是 machine state。

## 十五、我们没有做“统一模型网关”

做 provider abstraction 很容易一路滑向：

~~~text
智能路由
fallback
自动比价
自动选模型
多模型辩论
retry policy
gateway
~~~

我们把这些全部列为 Non-goal。

因为现在真正需要的是：

> **Maintainer explicitly chooses provider + model.**

而不是让另一个路由系统替维护者做决策。

所以今天 External Worker 没有任何“自动选择最强 / 最便宜模型”的逻辑。

它只是允许 `provider`、`model`、`provider_profile`、`provider_registry_ref` 成为运行参数。

简单，而且可审计。

## 十六、自定义 Provider 为什么要有 Registry

有些 provider 只需要 API key 和 model，但很多自定义或 OpenAI-compatible provider 还需要 base URL、adapter/package、provider name、model mapping 和 provider-specific options。

我们没有把这些全部展开成几十个 workflow input。

而是增加了一个很小的 Organization registry：

`.github/mira-external-worker-providers.json`

当前有两条自定义 profile。

OpenRouter：

~~~text
profile: openrouter
provider: mira-openrouter
adapter: @ai-sdk/openai-compatible
model: deepseek/deepseek-chat-v3.1
~~~

以及已经真实验证的 Volcengine Coding Plan：

~~~text
profile: volcengine-coding-plan
provider: volcengine-plan
adapter: @ai-sdk/openai
baseURL: https://ark.cn-beijing.volces.com/api/coding/v3
model: deepseek-v4.1-flash
~~~

Credential 永远不进 registry。

它仍然来自 GitHub Secret。

## 十七、一个后来才发现的关键问题：Registry 也必须冻结

Provider abstraction 第一版实现里出现过一个非常微妙的问题。

Worker 本身可以固定到一个 immutable revision，但 provider registry 如果从 floating `main` 读取，就意味着同一个 Worker commit 今天执行和明天执行，有可能得到不同 provider config。

这会破坏 reproducibility。

因此正式实现要求：

`provider_registry_ref`

必须是 **40 位 immutable commit SHA**。

Worker 会：

1. 解析这个 commit；
2. 确认 resolved SHA 完全一致；
3. 从这个 revision 读取 registry；
4. 把 revision 写进 run evidence。

因此一次执行最终有一个更完整的 execution identity：

::: html
<div style="margin:24px 0;padding:18px;border-radius:14px;border:1px solid rgba(127,127,127,.24);background:rgba(127,127,127,.04)">
  <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:12px">
    <span style="padding:7px 10px;border-radius:999px;background:rgba(127,127,127,.1)">Worker revision</span>
    <span style="padding:7px 10px;border-radius:999px;background:rgba(127,127,127,.1)">Skill revision</span>
    <span style="padding:7px 10px;border-radius:999px;background:rgba(127,127,127,.1)">Base SHA</span>
    <span style="padding:7px 10px;border-radius:999px;background:rgba(127,127,127,.1)">Provider</span>
    <span style="padding:7px 10px;border-radius:999px;background:rgba(127,127,127,.1)">Provider profile</span>
    <span style="padding:7px 10px;border-radius:999px;background:rgba(127,127,127,.1)">Model</span>
    <span style="padding:7px 10px;border-radius:999px;background:rgba(127,127,127,.1)">Registry revision</span>
  </div>
</div>
:::

这个细节不显眼，但它决定了以后是否真的能回答：

> “那一次运行，到底用了什么配置？”

## 十八、Backward Compatibility 也不能变成两个系统

Provider 抽象第一次实现时还踩了另一个坑。

新 provider contract 一度会破坏已经存在的 caller。

于是我们明确要求兼容：旧 caller 不传任何新参数时，仍然使用：

~~~text
opencode-go
deepseek-v4.1-flash
opencode_go_api_key
~~~

但这个 compatibility layer 不能发展成“legacy routing system + new routing system”。

内部最终仍然汇合到一条 canonical path：

::: html
<div style="margin:22px 0;padding:16px 18px;border-radius:12px;background:rgba(127,127,127,.055);border:1px solid rgba(127,127,127,.2);font-size:13px;line-height:1.9">
  resolve provider → resolve credential → build run-scoped config → <strong>opencode run --model provider/model</strong>
</div>
:::

可以有兼容入口，但不能有两套核心。

## 十九、Invalid Provider 必须在模型启动之前失败

Provider abstraction 带来的另一个风险是 silent fallback。

例如请求 Volcengine，配置错了，却偷偷落回默认模型。

这种行为在 Agent 工程里非常危险。

它看起来“任务成功了”，但实际执行身份已经变了。

因此 Mira Worker 对以下情况一律 fail closed：

- provider id 非法；
- profile 不存在；
- provider 和 profile 不匹配；
- registry ref 不是 immutable SHA；
- config schema 非法；
- baseURL 不合要求；
- requested model 不在 profile allowlist；
- credential 缺失。

并且这些失败必须发生在 model execution、commit、PR 之前。

我们实际跑过 invalid route 验收，它确实停在 provider resolution。

没有模型执行，也没有制造 implementation commit 或 Draft PR。

## 二十、最终不是纸面支持：第二家 Provider 真的跑通了

真正让 #40 可以关闭的，不是代码 Review。

而是第二条真实 provider run。

我们利用组织已经存在的 Secret，注册并运行：

~~~text
provider: volcengine-plan
profile: volcengine-coding-plan
model: deepseek-v4.1-flash
~~~

registry revision 固定到：

`1829a72d16a60d65f5982ff77c41140ec4d9261f`

实际 Worker run：

`37555710474`

完整走完：

::: html
<div style="margin:28px 0;padding:20px;border-radius:16px;border:1px solid rgba(74,222,128,.2);background:rgba(74,222,128,.035)">
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:8px;text-align:center;font-size:12px">
    <div style="padding:12px 8px;border-radius:9px;background:rgba(74,222,128,.08)">Provider resolve<br><strong>✓</strong></div>
    <div style="padding:12px 8px;border-radius:9px;background:rgba(74,222,128,.08)">OpenCode<br><strong>✓</strong></div>
    <div style="padding:12px 8px;border-radius:9px;background:rgba(74,222,128,.08)">Bounded change<br><strong>✓</strong></div>
    <div style="padding:12px 8px;border-radius:9px;background:rgba(74,222,128,.08)">Verification<br><strong>✓</strong></div>
    <div style="padding:12px 8px;border-radius:9px;background:rgba(74,222,128,.08)">Commit / Push<br><strong>✓</strong></div>
    <div style="padding:12px 8px;border-radius:9px;background:rgba(74,222,128,.08)">Draft PR<br><strong>✓</strong></div>
    <div style="padding:12px 8px;border-radius:9px;background:rgba(74,222,128,.08)">PR boundary<br><strong>✓</strong></div>
    <div style="padding:12px 8px;border-radius:9px;background:rgba(74,222,128,.08)">Evidence<br><strong>✓</strong></div>
  </div>
</div>
:::

Worker commit：

`4ffa591e02d36b9408075dde3c2ab54f6a44d7a1`

Draft PR：

[#50](https://github.com/uichat-mira/.github/pull/50)

最终 evidence 明确记录：

~~~text
provider: volcengine-plan
provider_profile: volcengine-coding-plan
model: deepseek-v4.1-flash
model_route: volcengine-plan/deepseek-v4.1-flash
provider_config_run_scoped: true
provider_credentials_persisted: false
~~~

requested route 和 effective route 完全一致。

OpenCode trajectory 正常生成，共 47 条 metadata-only event，没有截断。

artifact 中也没有出现 Volcengine API key、GH token 或 private-key material。

这时候，“Worker 可以换供应商”才从一项架构能力，变成了一项**已经被真实运行证明的能力**。

## 二十一、今天的 Mira External Worker 到底是什么

现在可以给它一个相对准确的定义：

> **Mira External Worker 是一个由 GitHub 托管的、有任务合同、有权限边界、有独立验证、有结构化证据、执行模型可替换的短生命周期 Coding Worker。**

当前固定工程边界包括：

| 维度 | 当前合同 |
|---|---|
| OpenCode CLI | `1.18.34` |
| Skill | immutable pinned `execute-work-item` |
| Execution | one Issue per run |
| Base | explicit branch + frozen SHA |
| Worker branch | `agent/issue-<issue>-run-<run-id>` |
| Model tools | read/search/edit/write，无 general shell |
| Git mutation | trusted workflow only |
| Verification | trusted caller-owned command |
| Output | Draft PR |
| Evidence | bounded structured artifact |
| Authority | no merge / no Issue acceptance or closure / no release / no deploy / no promotion |

Provider/model 则是 run-scoped：

~~~text
default
  opencode-go / deepseek-v4.1-flash

custom
  frozen provider profile
  + trusted secret
  + explicit model
~~~

## 二十二、它故意还不是什么

这个部分反而非常重要。

External Worker 目前**不是**：

~~~text
Autonomous software company
Multi-agent swarm
Agent operating system
Model gateway
Job scheduler
Auto-retry engine
Automatic reviewer
Automatic release robot
~~~

它没有自动抢 Issue、自动排队、自动并发治理、自动模型 fallback、自动选择最优模型、自动 merge、自动关闭卡、自动发版。

这些能力以后并非永远不能有。

但现在没有足够证据证明它们值得增加心智复杂度。

我们更愿意先让：

> **Issue → Worker → verified Draft PR**

这条链足够可靠。

## 二十三、一个有意思的结果：模型变得没那么重要了

项目刚开始的时候，我们讨论的是：

> DeepSeek 能不能当牛马？

做到最后，我反而觉得这个问题已经不再是重点。

因为一旦 Worker contract 稳定下来：

- Issue semantics；
- permissions；
- Skill；
- verification；
- Git boundaries；
- evidence；

这些才定义了“牛马是什么”。

模型只是这个执行槽里的一个可替换部件。

今天可以是 OpenCode Go / DeepSeek，也可以是 Volcengine Coding Plan / DeepSeek，明天还可能是其他 provider。

如果换一个模型，整个组织的工程治理就必须重新设计，那说明 abstraction 做错了。

现在至少从第二 provider 的真实 run 看，这个边界已经开始成立。

## 二十四、External Worker 真正解决的不是“便宜模型写代码”

如果只把它理解成：

> 用便宜 DeepSeek 帮 ChatGPT 干活

其实低估了这条线。

它真正解决的是：

> **如何把一次 AI 编码行为变成一个可以被工程系统接受的工作单元。**

这个工作单元需要：

::: html
<div style="margin:24px 0;display:flex;flex-wrap:wrap;gap:9px">
  <span style="padding:8px 11px;border-radius:999px;border:1px solid rgba(127,127,127,.22)">明确任务</span>
  <span style="padding:8px 11px;border-radius:999px;border:1px solid rgba(127,127,127,.22)">冻结起点</span>
  <span style="padding:8px 11px;border-radius:999px;border:1px solid rgba(127,127,127,.22)">权限上限</span>
  <span style="padding:8px 11px;border-radius:999px;border:1px solid rgba(127,127,127,.22)">真实验证</span>
  <span style="padding:8px 11px;border-radius:999px;border:1px solid rgba(127,127,127,.22)">失败语义</span>
  <span style="padding:8px 11px;border-radius:999px;border:1px solid rgba(127,127,127,.22)">可恢复证据</span>
  <span style="padding:8px 11px;border-radius:999px;border:1px solid rgba(127,127,127,.22)">Git 历史</span>
  <span style="padding:8px 11px;border-radius:999px;border:1px solid rgba(127,127,127,.22)">Review 边界</span>
  <span style="padding:8px 11px;border-radius:999px;border:1px solid rgba(127,127,127,.22)">明确责任</span>
</div>
:::

模型是否聪明当然重要。

但当 Agent 真正进入一个长期软件项目以后，更难的问题往往不是“它能不能写出这段代码”，而是：

> 我怎么知道它做了什么？  
> 失败后谁能继续？  
> 它到底根据哪版需求做的？  
> 它用了什么模型和配置？  
> 谁给了它这个权限？  
> 它为什么有资格 push？  
> 它能不能偷偷改自己的权限？  
> 测试是谁跑的？  
> 这个成功结果我能不能复现？

External Worker 这条工程线，本质上是在回答这些问题。

## 二十五、下一步

现在这条线已经跨过了 POC 阶段。

它已经证明：

::: html
<div style="margin:28px 0;padding:22px;border-radius:18px;background:rgba(127,127,127,.05);border:1px solid rgba(127,127,127,.22);font-size:14px;line-height:2">
  <strong>手机 / ChatGPT</strong>
  <span style="opacity:.45"> → </span>
  GitHub work item
  <span style="opacity:.45"> → </span>
  External Worker
  <span style="opacity:.45"> → </span>
  replaceable provider/model
  <span style="opacity:.45"> → </span>
  bounded coding
  <span style="opacity:.45"> → </span>
  trusted verification
  <span style="opacity:.45"> → </span>
  Git
  <span style="opacity:.45"> → </span>
  Draft PR
  <span style="opacity:.45"> → </span>
  structured evidence
</div>
:::

可以真实工作。

下一阶段如果继续演进，我更关心的反而不是马上再增加十个功能，而是观察真实使用中的瓶颈：

- 什么时候真的需要 shell-capable Worker？
- shell 权限怎样和 provider credentials 隔离？
- 多张卡同时派发以后，GitHub 原生 concurrency 是否足够？
- review return 是否值得形成显式 retry/session lease？
- stronger model escalation 应该由谁决定？
- 什么情况下 `gh-aw` 的 queue/ledger 已经比 Mira 自己维护这层薄胶更划算？
- Worker evidence 是否能直接服务 Mira Agent Core Benchmark？
- 手机端能否最终把“派牛马”变成一个自然的产品能力，而不是 GitHub 工程师专属操作？

这些问题现在可以慢慢回答。

因为最重要的地基已经不是草图了。

它已经真的干过活。

## 后记：为什么我们一直叫它“牛马”

这是一个玩笑，但也不完全是。

External Worker 在 Mira 体系里并不是“更高贵的智能”。

它被设计成一个职责非常具体的执行角色：

> 给它一张卡，给它明确边界，让它踏踏实实把活干完，然后把结果和证据交回来。

它不能自己宣布任务完成。

不能自己扩大任务。

不能自己给自己加权限。

不能因为 CI 绿了就把 Issue 关掉。

不能偷偷换模型。

也不能因为自己改不了 workflow，就要求获得更大的 token 权限。

从某种意义上说，这不是在限制 Agent。

而是在第一次认真把 Agent 当成一个真正的工程参与者：

> **能力可以很强，但权力必须明确；执行可以自动，但结果必须可验证。**

这大概也是 Mira 最近这条工程线里，最值得留下来的东西。

## 工程记录

这篇文章不是事后凭记忆整理。External Worker 的设计、实现和验收记录仍然保留在 GitHub：

- [#36 · mobile-first external Worker dispatch POC](https://github.com/uichat-mira/.github/issues/36)
- [#37 · reusable single-Issue external Worker](https://github.com/uichat-mira/.github/issues/37)
- [PR #38 · Organization reusable Worker implementation](https://github.com/uichat-mira/.github/pull/38)
- [#39 · structured observability and evidence](https://github.com/uichat-mira/.github/issues/39)
- [PR #45 · structured evidence package](https://github.com/uichat-mira/.github/pull/45)
- [#40 · run-scoped provider and model](https://github.com/uichat-mira/.github/issues/40)
- [PR #46 · provider/model implementation](https://github.com/uichat-mira/.github/pull/46)
- [PR #50 · Volcengine second-provider acceptance run](https://github.com/uichat-mira/.github/pull/50)

真正有价值的不是这些编号本身，而是它们共同留下了一条可以复查的演化路径：**POC 没有被当成生产事实，设计没有替代真实运行，成功没有替代失败证据，模型能力也没有替代权限边界。**
