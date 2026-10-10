---
title: Coding Agent 到底需要多少工具？我们把 Git、LSP、CodeGraph 都摆上桌之后
description: 从 Git Tool、LSP、CodeGraph 到 Repo Map，记录 Mira 如何把 Coding Agent 的能力重新拆回 Tool、Environment、Context 与 Integration。
group: 工程现场
order: 35
date: 2026年10月10日
readTime: 15 分钟阅读
tags: Coding Agent | Git | LSP | CodeGraph | Tool Design | 工程实验
author: tomz | mira
writingMode: co-authored
writtenBy: mira
reviewedBy: tomz
---

# Coding Agent 到底需要多少工具？我们把 Git、LSP、CodeGraph 都摆上桌之后

做 Coding Agent 很容易产生一种冲动：

**代码任务这么复杂，当然应该给它更多专用工具。**

Git 要不要做成 Tool？

LSP 要不要直接接进 Agent？

代码图谱、Repo Map、Semantic Search、Diagnostics，是不是都应该成为 Code Mode 的标配？

如果把今天主流 Coding Agent 的能力表摆在一起，这种冲动会变得更强。

Claude Code 有成熟的 Shell 与权限体系，OpenCode 有自己的代码工具和 LSP 路径，IDE Agent 可以调用符号导航与诊断，Pi Coding Agent 则把一套极薄的基础工具做得很有力量。

看起来答案似乎应该是：

> Coding Agent 就应该有一套 Coding Tools。

我们最开始也差点这么做。

但经过 [Desktop #238](https://github.com/uichat-mira/mira-desktop/issues/238) 这一轮针对 Claude Code、Codex、OpenCode、Pi、Gemini CLI、Copilot、Aider，以及 Git、LSP、CodeGraph、Repo Map 的研究之后，Mira 最后的决定却恰好相反：

**Phase 2 不增加一套 Code 专属 Tool Family。**

这篇文章记录的，就是这次从“还缺什么 Tool”，一路走到“先别造”的过程。

## 我们最开始问错了问题

研究卡最初的问题是：

> Mira Code Mode 还需要哪些 Tools？

这个问题天然会把人带向一个功能清单。

于是候选很快就出现了：

~~~text
git
lsp
code_diagnostics
repo_map
semantic_code_search
codebase_explore
test_results
verify
...
~~~

每一个单独看都很合理。

Git 能提供版本状态。

LSP 能提供 definition / references / hover / diagnostics。

CodeGraph 可以做跨文件依赖分析。

Repo Map 可以压缩代码库结构。

Diagnostics 可以把编译器和类型检查错误结构化返回。

问题是，当我们把它们都叫作 Tool 以后，系统里真正发生的事情开始变得模糊。

一个能力存在，并不意味着它应该直接成为模型调用的 Tool。

一个 Backend 很强，也不意味着模型需要知道它的存在。

一个 IDE 功能很好用，也不意味着 Agent 应该复制同样的交互面。

所以 #238 后来真正研究的问题变成了：

> **什么东西真的值得成为 Agent-facing Tool？**

## 先看 Coding Agent 真正在做什么

把品牌和产品名拿掉以后，大部分代码任务其实没有那么神秘。

一个 Agent 接到代码任务，通常只是在不断重复几类动作：

~~~text
找到项目
↓
找到相关文件
↓
理解真实代码
↓
修改
↓
运行测试 / 构建 / lint
↓
检查最终变化
↓
修复问题
↓
交付证据
~~~

映射到 Mira 当前已经存在的 Universal Tools，大致就是：

~~~text
发现
list / glob / grep

读取
read

修改
write / edit / move / delete
apply_patch

运行
terminal
~~~

这是一个看起来甚至有点寒酸的工具面。

但问题来了：

**这里面到底缺了哪个不可替代的基本动作？**

如果 Agent 想运行 TypeScript typecheck，`terminal` 可以做。

想跑 pytest，`terminal` 可以做。

想查看 Git diff，`terminal` 可以做。

想查一个函数定义，`grep + read` 很多时候已经够。

想修改跨文件代码，`edit / apply_patch` 已经存在。

所以一个新的 Coding Tool 必须证明的不是“这个能力有用”。

而是：

> **这个新 Tool 相比已有 Primitive，是否提供了一个足够独立、稳定、值得模型学习的新意图？**

这是完全不同的门槛。

::: html
<figure style="margin:2.8rem 0 3rem">
  <svg viewBox="0 0 940 390" width="100%" role="img" aria-label="Mira Code mode 的能力光谱，从 Universal Tool 到环境和可选智能" style="display:block">
    <defs>
      <linearGradient id="codeSpectrum" x1="0" x2="1">
        <stop offset="0" stop-color="#cc785c"/>
        <stop offset=".45" stop-color="#f4bb64"/>
        <stop offset=".72" stop-color="#8bd0bf"/>
        <stop offset="1" stop-color="#6b9edf"/>
      </linearGradient>
    </defs>
    <text x="32" y="38" fill="currentColor" opacity=".52" font-size="12" letter-spacing="2.3">CODE MODE · CAPABILITY SPECTRUM</text>
    <line x1="80" y1="186" x2="860" y2="186" stroke="url(#codeSpectrum)" stroke-width="5" stroke-linecap="round"/>
    <circle cx="138" cy="186" r="13" fill="#cc785c"/>
    <circle cx="302" cy="186" r="10" fill="#e49b62"/>
    <circle cx="492" cy="186" r="10" fill="#f4bb64"/>
    <circle cx="666" cy="186" r="10" fill="#8bd0bf"/>
    <circle cx="820" cy="186" r="10" fill="#6b9edf"/>
    <text x="138" y="133" text-anchor="middle" fill="currentColor" font-size="17" font-weight="650">Universal Core</text>
    <text x="138" y="228" text-anchor="middle" fill="currentColor" opacity=".58" font-size="12">read · grep · edit · patch · terminal</text>
    <text x="302" y="117" text-anchor="middle" fill="currentColor" font-size="15" font-weight="620">Code Environment</text>
    <text x="302" y="246" text-anchor="middle" fill="currentColor" opacity=".58" font-size="12">workspace · Git runtime · repo state</text>
    <text x="492" y="133" text-anchor="middle" fill="currentColor" font-size="15" font-weight="620">Remote Integration</text>
    <text x="492" y="228" text-anchor="middle" fill="currentColor" opacity=".58" font-size="12">GitHub · MCP · Actions</text>
    <text x="666" y="117" text-anchor="middle" fill="currentColor" font-size="15" font-weight="620">Optional Intelligence</text>
    <text x="666" y="246" text-anchor="middle" fill="currentColor" opacity=".58" font-size="12">LSP · CodeGraph · semantic index</text>
    <text x="820" y="133" text-anchor="middle" fill="currentColor" font-size="15" font-weight="620">Context Optimization</text>
    <text x="820" y="228" text-anchor="middle" fill="currentColor" opacity=".58" font-size="12">Repo Map · summaries</text>
    <path d="M138 294 C292 336 650 336 820 294" fill="none" stroke="currentColor" stroke-opacity=".12" stroke-dasharray="3 7"/>
    <text x="480" y="342" text-anchor="middle" fill="currentColor" opacity=".48" font-size="13">不是所有有用的东西，都应该成为模型可调用的 Tool</text>
  </svg>
  <figcaption style="margin-top:.65rem;font-size:.86rem;opacity:.58">这次研究最后最重要的分类，不是“有哪些 Coding 能力”，而是“它们应该位于 Tool、Environment、Integration 还是 Context 层”。</figcaption>
</figure>
:::

## Git：我们甚至已经把 Tool 设计出来了

Git 是这次研究里最有意思的一次反转。

中途我们确实认真决定过：

> 给 Code Mode 增加一个独立 `git(operation)` Tool。

而且不是停留在一句“加个 Git”。

我们已经把 operation 设计得相当具体：

~~~text
status
diff
history
blame
branches / worktrees

stage
commit

switch / merge / stash

reset / clean / rebase

fetch / pull / push / clone
~~~

连风险分层都做了。

`status / diff / history` 属于读取。

`stage / commit` 要进入写授权。

`reset / clean / rebase` 是破坏性操作。

`fetch / pull / push / clone` 还涉及网络和 Credential。

我们甚至专门做了 Git 临时仓库实验，确认：

~~~text
git diff
→ 只看 unstaged tracked changes

git diff --cached
→ 只看 staged

git diff HEAD
→ staged + unstaged tracked
→ 仍然看不到 untracked
~~~

这其实已经足够写一个像样的 Git Tool。

然后我们把它取消了。

## 为什么已经设计好的 Git Tool 最后不要了

因为越往下设计，越发现它正在创造第二套系统。

Mira 已经有：

~~~text
Terminal Runtime
  ├─ managed Git binary
  ├─ workspace / cwd
  ├─ approval
  ├─ process execution
  ├─ cancellation
  └─ Evidence
~~~

如果再引入：

~~~text
git Tool
  ├─ Git operation schema
  ├─ Git runtime
  ├─ Git approval
  ├─ Git error model
  ├─ Git workspace policy
  └─ Git evidence
~~~

问题就来了。

到底哪一套是 Git 的真实执行边界？

Agent 可以通过 `terminal("git commit ...")` 执行，又可以通过 `git(operation="commit")` 执行。

如果两条路径权限不同，就产生绕路。

如果两条路径权限完全一样，我们只是重复建了一层。

而且 Git 本身不是一个遥远的外部 API。

对于 Coding Agent，它更像 Node、Python、Compiler 一样，是 **Code Environment 的组成部分**。

于是最后的结论变成：

~~~text
Git executable / version / readiness
→ Environment

repo / branch / HEAD / dirty state
→ bounded context

真正 Git command execution
→ governed terminal
~~~

没有 standalone Git Tool。

::: html
<figure style="margin:2.8rem 0 3rem">
  <svg viewBox="0 0 940 430" width="100%" role="img" aria-label="Git Tool 决策从候选到回归 Code Environment 的轨迹" style="display:block">
    <defs>
      <linearGradient id="gitDecision" x1="0" x2="1">
        <stop offset="0" stop-color="#8bd0bf"/>
        <stop offset=".52" stop-color="#f4bb64"/>
        <stop offset="1" stop-color="#cc785c"/>
      </linearGradient>
    </defs>
    <text x="32" y="38" fill="currentColor" opacity=".52" font-size="12" letter-spacing="2.3">THE GIT TOOL THAT WE CHOSE NOT TO BUILD</text>
    <path d="M92 273 C180 70 370 70 454 204 C530 326 684 343 848 140" fill="none" stroke="url(#gitDecision)" stroke-width="5" stroke-linecap="round"/>
    <circle cx="100" cy="256" r="8" fill="#8bd0bf"/>
    <circle cx="292" cy="103" r="8" fill="#c7c56d"/>
    <circle cx="458" cy="210" r="9" fill="#f4bb64"/>
    <circle cx="650" cy="309" r="8" fill="#df9360"/>
    <circle cx="840" cy="149" r="10" fill="#cc785c"/>
    <text x="100" y="310" text-anchor="middle" fill="currentColor" font-size="14" font-weight="620">候选</text>
    <text x="100" y="331" text-anchor="middle" fill="currentColor" opacity=".55" font-size="11">“Git 应该是 Tool”</text>
    <text x="292" y="72" text-anchor="middle" fill="currentColor" font-size="14" font-weight="620">设计 operation</text>
    <text x="292" y="52" text-anchor="middle" fill="currentColor" opacity=".55" font-size="11">status · diff · commit · worktree</text>
    <text x="458" y="255" text-anchor="middle" fill="currentColor" font-size="14" font-weight="620">发现重复 authority</text>
    <text x="458" y="276" text-anchor="middle" fill="currentColor" opacity=".55" font-size="11">Terminal 已拥有真实 Git 执行路径</text>
    <text x="650" y="355" text-anchor="middle" fill="currentColor" font-size="14" font-weight="620">重新分类</text>
    <text x="650" y="376" text-anchor="middle" fill="currentColor" opacity=".55" font-size="11">Git 是 environment capability</text>
    <text x="840" y="108" text-anchor="middle" fill="currentColor" font-size="15" font-weight="700">最终</text>
    <text x="840" y="87" text-anchor="middle" fill="currentColor" opacity=".55" font-size="11">no standalone git Tool</text>
  </svg>
  <figcaption style="margin-top:.65rem;font-size:.86rem;opacity:.58">研究并不是从“不要 Git Tool”开始。我们真的把它设计到 operation 和 approval 层，最后才因为边界重复主动撤回。</figcaption>
</figure>
:::

这次反转给了我们一个后来反复使用的判断标准：

> **Tool 不应该只是 Backend 的另一种包装。**

模型真正需要的是独立语义，而不是每个 Runtime 都有一个对应按钮。

## GitHub 又是另外一回事

这时候很容易产生另一个混淆：

既然本地 Git 不做 Tool，那 GitHub 呢？

它们其实属于完全不同的层。

~~~text
Git
→ local repository / working tree / index / history

GitHub
→ remote repository / Issue / PR / Actions / platform API
~~~

`git push` 也不等于 GitHub API。

同一个 Git 仓库可以在 GitLab、Gitea、Codeberg 或任意 Git Server 上。

所以 Mira 最后把两者明确分层：

**Git 是 Code Environment。**

**GitHub 是 Remote Integration / MCP 产品类别。**

当前 Mira 的 GitHub 实现仍然是已有的四个内部领域 Tool：

~~~text
github_repository
github_issue
github_pull_request
github_actions
~~~

产品上可以把它归类成 MCP / External Integration。

但不能因为产品分类改了名字，就声称底层已经变成 External MCP Protocol。

这是另一个很小、但很重要的工程纪律：

**产品分类和实现协议不是同一件事。**

## LSP：明明很好，为什么我们还是没加

Git 被放回 Environment 以后，下一个看起来最像 Coding Agent 标配的就是 LSP。

Language Server Protocol 的能力非常诱人：

~~~text
definition
references
hover
symbols
diagnostics
rename
...
~~~

和 `grep` 相比，它显然更“懂代码”。

所以我们甚至继续往下设计了一个 Mira LSP Client / Server Manager。

包括：

- 根据文件类型和 workspace 匹配 Language Server；
- lazy start；
- `initialize / initialized`；
- capabilities negotiation；
- `didOpen / didChange / didClose`；
- document version；
- diagnostics freshness；
- shutdown / process cleanup；
- server executable trust；
- `workspace/applyEdit` 安全边界。

一旦认真做到这里，另一个问题也随之暴露出来：

**LSP 不是免费获得的代码智能。**

它意味着长期存在的 server lifecycle。

意味着内存。

意味着项目初始化成本。

意味着 document sync。

意味着 stale diagnostics。

意味着不同语言服务器完全不同的安装方式与运行稳定性。

意味着 Agent 修改文件以后，还要保证 Language Server 看到的是同一版本。

如果用户项目没有对应 server，还要定义 degraded 行为。

所以真正的问题不再是：

> LSP 有没有价值？

当然有。

真正的问题是：

> **它相对于 grep/read/project CLI 的增益，是否足够大到值得成为 Phase 2 核心能力？**

当时没有足够证据证明这一点。

于是我们没有因为“成熟 IDE 都有 LSP”而把它塞进 Code Mode。

决定是：

**defer。**

以后如果真实任务证明 definition / references / diagnostics 显著提升任务成功率，并且生命周期、资源和 freshness 成本可接受，再晋级。

不是永远不要。

是现在没有资格成为 Core。

## Diagnostics 也不一定需要一个 Tool

类似的还有 `code_diagnostics`。

从 Agent Tool 设计角度看，它非常漂亮：

~~~text
code_diagnostics(path?)
→ [
  {
    file,
    line,
    severity,
    message,
    source
  }
]
~~~

但真实工程任务里，诊断的权威来源可能已经存在：

~~~text
tsc
eslint
cargo check
go test
pytest
npm test
pnpm check
...
~~~

这些命令通过 Terminal 运行，结果绑定真实项目配置。

这时候再做一个“统一 Diagnostics Tool”，首先要回答：

它的数据从哪里来？

如果底层还是跑项目命令，只是为了结构化结果，我们可能只是做了一个执行 facade。

如果来自 LSP，又继承了 LSP lifecycle 和 freshness 问题。

所以最后我们宁愿保留一个很朴素的原则：

> **在没有稳定、可信、可版本化的诊断数据源以前，真实项目命令比一个漂亮的统一 Diagnostics Tool 更值得相信。**

## CodeGraph：有用，不等于核心

CodeGraph 是这次研究里另一个很容易被架构审美绑架的能力。

在复杂项目里，代码图谱听起来几乎天然适合 Agent：

- 谁依赖谁；
- 一个 symbol 被哪些模块调用；
- 改这里会影响什么；
- 跨文件结构是什么。

Mira 本身已经有 `codebase_explore`，背后存在 managed CodeGraph 路径。

这让问题更加现实：

不是“要不要从零做 CodeGraph”。

而是：

> **现有 CodeGraph 值不值得成为 Code Mode 的核心依赖？**

最后答案仍然是否定的。

因为 Code Mode Core 必须能够在 CodeGraph 不存在时依然工作。

一个项目索引失败、Provider unavailable，不能导致 Agent 突然不会写代码。

所以最后我们给它的定位是：

~~~text
codebase_explore
→ conditional enhancement
→ provider ready 时可以使用
→ 不 gate Code Mode readiness
→ 可以独立治理
→ 甚至未来删除也不影响 Code core
~~~

这其实是一种非常重要的降级能力。

Agent 的核心能力不应该被某个“高级智能层”绑架。

## Repo Map：也许值得做，但更像 Context

Repo Map 是一个更微妙的例子。

对于大型仓库，如果每次都靠 `list / glob / grep / read` 一步步探索，Token 和调用次数显然会增加。

所以一份压缩过的仓库结构摘要非常有价值。

但这并不意味着需要新增：

~~~text
repo_map()
~~~

这个 Tool。

因为 Repo Map 很多时候更像：

**模型进入 Code Context 时的一份 bounded context。**

它不是 Agent 主动执行的一项业务能力。

它更像：

~~~text
workspaceRoot
repo identity
important directories
package structure
entrypoints
bounded summary
~~~

所以研究最后给 Repo Map 的结论是：

> 可以继续研究，但优先把它当作 Context Optimization，而不是 Agent-facing Tool。

这和同一阶段的 Progressive Disclosure 研究其实开始汇合了。

很多过去会被包装成 Tool 的东西，其实只是：

**在正确的时候，把正确的 Context 放进来。**

## 我们最后画出了一条 Tool 资格线

研究到后面，我们越来越倾向于用几个问题判断一个候选能力。

### 它是不是模型真正需要表达的独立意图？

`read file` 是。

`run command` 是。

`edit file` 是。

但“使用 Git backend”不是意图。

“通过 LSP backend 找定义”也未必是意图。

模型真正的意图可能只是：

> 找到这个 symbol 的定义。

Backend 可以变化。

### 已有 Tool 能不能足够清楚地完成？

如果 `terminal` 可以可靠完成，而且权限和 Evidence 已经成熟，就不要只是为了结构漂亮再复制一条执行路径。

### 新 Tool 会不会创造第二套 Authority？

这是 Git Tool 最终被撤回的关键原因。

### 它在 unavailable 时会不会摧毁核心能力？

LSP、CodeGraph、Semantic Index 都不应该拥有这种地位。

### 它能不能在不用时消失？

一个只在少数任务里有价值的 Tool，不应该永久占据全部 Prompt。

这也是为什么 Tool Selection 与 Progressive Disclosure 最终变成两张相邻的研究卡。

## 最后的 Code Mode，比我们原本想象得更薄

最终 #238 冻结下来的 Phase 2 Code Core 是：

~~~text
read
list
glob
grep

write
edit
move
delete
apply_patch

terminal
~~~

其中 `apply_patch` 也不是第二套 File Mutation authority。

它只是对 patch-friendly 模型更友好的 facade，底层仍然复用同一个 mutation runtime。

除此之外：

~~~text
Git
→ environment/runtime

Git repo snapshot
→ bounded context

GitHub
→ remote integration

LSP
→ deferred optional intelligence

CodeGraph
→ conditional enhancement

Diagnostics
→ deferred

Repo Map
→ possible context optimization

Web search / fetch
→ conditional external research
~~~

::: html
<figure style="margin:2.8rem 0 3rem">
  <svg viewBox="0 0 940 460" width="100%" role="img" aria-label="Code mode 候选能力的成本收益坐标" style="display:block">
    <text x="32" y="36" fill="currentColor" opacity=".52" font-size="12" letter-spacing="2.2">PROMOTION TEST · VALUE VS SYSTEM COST</text>
    <line x1="110" y1="382" x2="860" y2="382" stroke="currentColor" stroke-opacity=".16"/>
    <line x1="110" y1="382" x2="110" y2="74" stroke="currentColor" stroke-opacity=".16"/>
    <text x="484" y="427" text-anchor="middle" fill="currentColor" opacity=".48" font-size="12">runtime / lifecycle / authority cost →</text>
    <text x="48" y="226" text-anchor="middle" fill="currentColor" opacity=".48" font-size="12" transform="rotate(-90 48 226)">incremental task value →</text>
    <line x1="110" y1="236" x2="860" y2="236" stroke="currentColor" stroke-opacity=".07" stroke-dasharray="3 7"/>
    <line x1="470" y1="74" x2="470" y2="382" stroke="currentColor" stroke-opacity=".07" stroke-dasharray="3 7"/>
    <circle cx="214" cy="112" r="15" fill="#cc785c"/>
    <text x="214" y="82" text-anchor="middle" fill="currentColor" font-size="13" font-weight="650">Universal Tools</text>
    <text x="214" y="142" text-anchor="middle" fill="currentColor" opacity=".5" font-size="11">高价值 · 低附加成本</text>
    <circle cx="332" cy="174" r="12" fill="#f4bb64"/>
    <text x="332" y="153" text-anchor="middle" fill="currentColor" font-size="12">Git context</text>
    <circle cx="620" cy="166" r="13" fill="#8bd0bf"/>
    <text x="620" y="142" text-anchor="middle" fill="currentColor" font-size="12">LSP</text>
    <text x="620" y="196" text-anchor="middle" fill="currentColor" opacity=".5" font-size="10">价值真实 · lifecycle 较重</text>
    <circle cx="708" cy="222" r="13" fill="#6b9edf"/>
    <text x="708" y="198" text-anchor="middle" fill="currentColor" font-size="12">CodeGraph</text>
    <circle cx="522" cy="286" r="10" fill="currentColor" opacity=".35"/>
    <text x="522" y="314" text-anchor="middle" fill="currentColor" font-size="12">Repo Map</text>
    <circle cx="758" cy="322" r="10" fill="currentColor" opacity=".3"/>
    <text x="758" y="348" text-anchor="middle" fill="currentColor" font-size="12">Unified diagnostics</text>
    <text x="128" y="363" fill="currentColor" opacity=".38" font-size="11">CORE ZONE</text>
    <text x="650" y="363" fill="currentColor" opacity=".38" font-size="11">EVIDENCE REQUIRED BEFORE PROMOTION</text>
  </svg>
  <figcaption style="margin-top:.65rem;font-size:.86rem;opacity:.58">图不是在判断这些技术“好不好”，而是在问：相比现有能力，它们的增量价值是否足以抵消新的 Runtime、生命周期、权限和维护成本。</figcaption>
</figure>
:::

## Code Mode 也不是第二个 Agent

研究最后还有一个比 Tool Catalog 更重要的产品结论。

我们越来越不愿意把 Code Mode 理解成：

~~~text
Mira Main Agent
↓
进入 Code
↓
启动 Coding Agent
↓
另一套 Coding Tools
↓
另一套 Runtime
~~~

更合理的模型是：

~~~text
同一个 Main Agent
        ↓
进入一个 Code workspace / context
        ↓
Universal Tools
        +
Code Environment
        +
按需 Intelligence
~~~

Code Mode 改变的是环境、上下文和能力披露。

不是换了一个人格。

也不是启动第二套 Agent 系统。

这意味着 Main Agent 原来的 Harness、Policy、Approval、Workspace、Evidence、SubAgent 与 Recovery 都继续存在。

Code 并不是一个自治特区。

## 成熟的 Coding Agent，也许不是工具最多的那个

研究 Claude Code、Codex、OpenCode、Pi、Gemini CLI 和 IDE Agent 时，我们当然看到了大量很值得学习的实现。

但最终最影响 Mira 的反而不是某一个产品“有多少工具”。

而是另一个现象：

**很多表现很强的 Coding Agent，基础 Tool surface 本身并没有想象中那么庞大。**

真正拉开体验差距的，往往是 Tool 后面的东西：

~~~text
workspace discipline
context quality
tool descriptions
patch quality
shell reliability
permission model
task recovery
state continuity
test discipline
model capability
~~~

这也解释了为什么一个只有 `read / edit / write / bash` 的 Agent，依然可以完成相当复杂的代码任务。

因为 Tool 数量和 Agent 能力不是线性关系。

一个 40 个 Tool 的 Agent，完全可能因为重叠语义和上下文污染，比一个 8 个 Tool 的 Agent 更笨。

## 最后：不要把所有聪明东西都叫 Tool

#238 最后留下来的，其实不只是一份 Tool Catalog。

而是一条更简单的工程原则：

> **Tool 是给模型表达动作意图的，不是用来展示系统拥有多少技术能力的。**

Git 可以存在，但不一定是 Tool。

LSP 可以存在，但不一定是 Core。

CodeGraph 可以很强，但不应该绑架基础 Coding 能力。

Repo Map 可以节省 Token，却更适合成为 Context。

GitHub 可以属于 MCP 产品分类，但本地 Git 仍然只是环境。

当这些层被分开以后，Code Mode 反而变得更容易解释：

~~~text
Universal Tools
负责动作

Environment
负责真实运行条件

Context
负责让模型理解当前项目

Optional Intelligence
负责在值得的时候增强理解

Integration
负责连接外部系统

Harness
负责真正的权限与执行边界
~~~

截至 2026 年 10 月 10 日，#238 已经完成并关闭。最终 maintainer decision 是：Phase 2 不新增 Code 专属 Tool Family；LSP / structured diagnostics 延后；CodeGraph 为非核心增强并单独治理。

所以这篇文章记录的是一次已经结束的研究决策，不是在预告一套尚未存在的“超级 Coding Agent”。

我们研究了一圈 Coding Agent，最后得到的结论不是：

**Mira 还应该增加哪些 Coding Tools？**

而是：

**先证明真的缺，再加。**

对于一个越来越复杂的 Agent 系统来说，这可能比再多一个聪明工具更重要。
