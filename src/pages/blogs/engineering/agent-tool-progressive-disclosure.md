---
title: 当 Agent 有 60 个工具以后：我们为什么重新设计了 Mira 的工具发现
description: 从 Tool Reachability 到 Progressive Resolution，再到一场最终没有给 Pi 打分的对照实验，记录 Mira 如何重新理解 Agent 的工具发现问题。
group: 工程现场
order: 34
date: 2026年10月10日
readTime: 13 分钟阅读
tags: Agent | Tool Discovery | Progressive Disclosure | Pi | Harness | 工程实验
author: tomz | mira
writingMode: co-authored
writtenBy: mira
reviewedBy: tomz
---

# 当 Agent 有 60 个工具以后：我们为什么重新设计了 Mira 的工具发现

给 Agent 增加工具，一开始是一件很愉快的事。

读文件、改文件、跑终端、搜索网页、操作 GitHub、连接 MCP……每增加一种能力，Agent 都像又多长出一只手。

直到手越来越多。

我们开始遇到一个很隐蔽的问题：

**工具明明存在，模型却根本没有机会使用它。**

这不是 Tool Calling 准确率的问题，也不一定是模型“不够聪明”。

问题发生得更早——在模型开始选择工具之前。

正确的工具，可能根本没有进入它这一轮能够看到的上下文。

这篇文章来自两张连续的研究卡：[Desktop #243](https://github.com/uichat-mira/mira-desktop/issues/243) 和 [Desktop #300](https://github.com/uichat-mira/mira-desktop/issues/300)。前者研究 Progressive Disclosure / Tool Search，后者试图把 Current Mira、Mira Progressive 与 Pi-native Progressive 放进同一套真实模型矩阵。

最后我们得到的答案，比“哪个 Tool Search 算法更强”更基础。

## 从「选错工具」到「工具不可达」

Mira 原来的 Tool Exposure 机制很直接。

公共工具数量较小时，把满足条件的工具全部暴露给模型；超过阈值后，再通过 embedding recall 与 rerank 选出一部分候选进入 Planner 上下文。

在工具较少时，这很自然。

问题出现在动态 MCP、大量外部集成和越来越丰富的本地能力加入之后。

当候选工具超过 20 个，一个工具可能同时满足：

- 已经注册；
- Runtime 正常；
- 用户有权限；
- 当前任务确实需要；

但因为没有进入 Top 20，它依然不会出现在模型眼前。

更麻烦的是，当 embedding / reranker 不可用时，旧路径会退化到按注册顺序取 first 20。这个行为是确定性的，却不理解任务。

这时候讨论“模型为什么没有选 GitHub Pull Request Tool”已经没有意义。

因为模型从来没有看见过它。

::: html
<figure style="margin:2.5rem 0 2.75rem">
  <svg viewBox="0 0 920 300" width="100%" role="img" aria-label="Current Mira 与 Progressive Resolution 的 Tool Reachability 对照" style="display:block;overflow:visible">
    <defs>
      <linearGradient id="reachAccent" x1="0" x2="1">
        <stop offset="0" stop-color="#f4bb64"/>
        <stop offset="0.55" stop-color="#cc785c"/>
        <stop offset="1" stop-color="#8bd0bf"/>
      </linearGradient>
    </defs>

    <text x="28" y="34" fill="currentColor" opacity=".55" font-size="12" letter-spacing="2.4">TOOL REACHABILITY · GOLD CASES</text>

    <text x="28" y="105" fill="currentColor" font-size="16" font-weight="600">Current Mira</text>
    <text x="28" y="139" fill="currentColor" font-size="34" font-weight="650">5 / 13</text>
    <text x="28" y="162" fill="currentColor" opacity=".52" font-size="13">正确工具曾经存在，但 8 个 case 不可达</text>

    <line x1="255" y1="126" x2="870" y2="126" stroke="currentColor" opacity=".08"/>
    <g>
      <circle cx="270" cy="126" r="8" fill="#cc785c"/><circle cx="316" cy="126" r="8" fill="#cc785c"/>
      <circle cx="362" cy="126" r="8" fill="#cc785c"/><circle cx="408" cy="126" r="8" fill="#cc785c"/>
      <circle cx="454" cy="126" r="8" fill="#cc785c"/>
      <circle cx="500" cy="126" r="8" fill="currentColor" opacity=".10"/><circle cx="546" cy="126" r="8" fill="currentColor" opacity=".10"/>
      <circle cx="592" cy="126" r="8" fill="currentColor" opacity=".10"/><circle cx="638" cy="126" r="8" fill="currentColor" opacity=".10"/>
      <circle cx="684" cy="126" r="8" fill="currentColor" opacity=".10"/><circle cx="730" cy="126" r="8" fill="currentColor" opacity=".10"/>
      <circle cx="776" cy="126" r="8" fill="currentColor" opacity=".10"/><circle cx="822" cy="126" r="8" fill="currentColor" opacity=".10"/>
    </g>

    <text x="28" y="225" fill="currentColor" font-size="16" font-weight="600">Mira Progressive</text>
    <text x="28" y="259" fill="currentColor" font-size="34" font-weight="650">13 / 13</text>
    <text x="255" y="244" fill="currentColor" opacity=".52" font-size="13">先让正确能力可达，再讨论模型是否选对</text>

    <line x1="255" y1="225" x2="870" y2="225" stroke="url(#reachAccent)" opacity=".24"/>
    <g fill="url(#reachAccent)">
      <circle cx="270" cy="225" r="8"/><circle cx="316" cy="225" r="8"/><circle cx="362" cy="225" r="8"/>
      <circle cx="408" cy="225" r="8"/><circle cx="454" cy="225" r="8"/><circle cx="500" cy="225" r="8"/>
      <circle cx="546" cy="225" r="8"/><circle cx="592" cy="225" r="8"/><circle cx="638" cy="225" r="8"/>
      <circle cx="684" cy="225" r="8"/><circle cx="730" cy="225" r="8"/><circle cx="776" cy="225" r="8"/>
      <circle cx="822" cy="225" r="8"/>
    </g>
  </svg>
  <figcaption style="margin-top:.65rem;font-size:.86rem;opacity:.58">最终真实模型 closeout 中，能定义 gold Tool 的 13 个 case：Current Mira 可达 5 个，Progressive 路线可达 13 个。</figcaption>
</figure>
:::

于是我们开始把几个过去很容易混在一起的状态拆开：

~~~text
registered
≠ ready
≠ authorized
≠ discoverable
≠ disclosed
≠ executable
~~~

这后来也与另一条工程线汇合：Runtime Readiness 必须回答“能力现在是否真的可用”，而 Progressive Resolution 只回答“模型现在需要看见多少”。

两者不能互相冒充。

## 第一次实验：不要一开始就把所有 Schema 塞给模型

#243 最开始做的事情并不复杂。

我们没有立刻重写生产 Planner，也没有重新造 Harness。

只是问：

**模型真的需要在任务开始前看到所有 Tool 的完整 Schema 吗？**

一个典型任务其实可以逐层获得信息。

例如用户说：

> 把刚改完的东西提上去给他们审一下。

模型一开始并不需要 GitHub 所有 Tool 的完整参数定义。

它先知道这里存在一个远端协作能力就够了；确定是 Pull Request 场景以后，再知道对应 Tool；真正准备调用时，才需要 repository、base、head、title、body 等完整 Schema。

于是原来的：

~~~text
所有候选工具
→ 一批完整 Schema
→ 模型选择
~~~

可以改成：

~~~text
紧凑能力目录
→ 找到相关领域
→ 披露 Tool metadata
→ 披露具体 Tool Schema
→ 正常执行
~~~

我们把这条过程叫作 **Progressive Resolution**。

::: html
<figure style="margin:2.8rem 0">
  <svg viewBox="0 0 920 455" width="100%" role="img" aria-label="渐进披露与执行权限是两条不同的轴" style="display:block">
    <defs>
      <radialGradient id="capGlow">
        <stop offset="0" stop-color="#cc785c" stop-opacity=".25"/>
        <stop offset="1" stop-color="#cc785c" stop-opacity="0"/>
      </radialGradient>
    </defs>

    <text x="30" y="35" fill="currentColor" opacity=".55" font-size="12" letter-spacing="2.2">PROGRESSIVE VISIBILITY</text>

    <circle cx="420" cy="212" r="178" fill="none" stroke="currentColor" stroke-opacity=".08" stroke-width="1.5"/>
    <circle cx="420" cy="212" r="132" fill="none" stroke="#8bd0bf" stroke-opacity=".35" stroke-width="1.5"/>
    <circle cx="420" cy="212" r="87" fill="none" stroke="#f4bb64" stroke-opacity=".55" stroke-width="1.8"/>
    <circle cx="420" cy="212" r="44" fill="url(#capGlow)" stroke="#cc785c" stroke-width="2"/>

    <text x="420" y="71" text-anchor="middle" fill="currentColor" opacity=".56" font-size="13">Capability catalog</text>
    <text x="420" y="112" text-anchor="middle" fill="#8bd0bf" font-size="13">Tool metadata</text>
    <text x="420" y="156" text-anchor="middle" fill="#f4bb64" font-size="13">full schema</text>
    <text x="420" y="218" text-anchor="middle" fill="currentColor" font-size="16" font-weight="700">TOOL</text>

    <path d="M635 94 C724 118 755 159 775 214" fill="none" stroke="currentColor" stroke-opacity=".18" stroke-dasharray="3 6"/>
    <text x="646" y="82" fill="currentColor" opacity=".55" font-size="12">视野逐步收窄</text>

    <line x1="82" y1="390" x2="838" y2="390" stroke="currentColor" stroke-opacity=".16"/>
    <circle cx="214" cy="390" r="5" fill="#cc785c"/>
    <circle cx="418" cy="390" r="5" fill="#cc785c"/>
    <circle cx="622" cy="390" r="5" fill="#cc785c"/>
    <text x="214" y="420" text-anchor="middle" fill="currentColor" opacity=".72" font-size="12">Policy</text>
    <text x="418" y="420" text-anchor="middle" fill="currentColor" opacity=".72" font-size="12">Approval</text>
    <text x="622" y="420" text-anchor="middle" fill="currentColor" opacity=".72" font-size="12">Harness</text>
    <text x="838" y="395" text-anchor="end" fill="currentColor" opacity=".45" font-size="12">AUTHORITY PLANE</text>

    <text x="30" y="212" fill="currentColor" font-size="18" font-weight="620">披露改变视野</text>
    <text x="30" y="239" fill="currentColor" opacity=".55" font-size="13">不改变执行权限</text>
  </svg>
  <figcaption style="margin-top:.65rem;font-size:.86rem;opacity:.58">Capability View 可以隐藏或展开信息；真正的执行仍然经过原有 Policy / Approval / Harness。Disclosure 不是授权系统。</figcaption>
</figure>
:::

这个区别非常重要。

Tool Search 也因此不再是每次任务开始前必须运行的一道检索程序。

如果 Tool 已知，直接展开。

如果领域已经非常明确，做结构化匹配。

只有在巨大、动态、模糊的目录里，才真正 Search。

## 真模型结果：最大的提升不是「选得更准」，而是「重新变得可达」

最后的真实模型 closeout 使用相同任务与 Tool Catalog，对比 Current Mira 与 Mira Progressive。

结果是：

| 路线 | 成功 case | gold Tool reachability |
| --- | ---: | ---: |
| Current Mira | 8 / 16 | 5 / 13 |
| Mira Progressive | 14 / 16 | 13 / 13 |

完整 closeout run 记录在 [Control Room run #38049572401](https://github.com/uichat-mira/control-room/actions/runs/38049572401)。

8 → 14 已经足够显眼，但我们更在意 5 / 13 → 13 / 13。

因为这改变了我们对 Tool Discovery 的理解。

过去我们习惯只问：

> 模型有没有选中正确 Tool？

但这里其实混合了两个完全不同的问题：

~~~text
A. 正确 Tool 有没有进入模型的可达空间？

B. 当正确 Tool 可达以后，模型有没有选对？
~~~

如果 A 已经失败，再拿 B 去责怪模型，没有意义。

所以在后来的 Mira 设计里，**Reachability 被提升成了一等指标。**

## Tool Search 没有想象中那么重要

另一个很有意思的结果是：

Progressive Resolution 表现更好，并不意味着每个任务都应该先跑 Tool Search。

16 个 closeout case 里，Tool Search 只在 **2 个 case** 中被使用，而且记录到的 unnecessary search 是 **0**。

绝大多数任务更适合先走：

~~~text
exact canonical match
→ capability / domain structural match
→ deterministic lexical resolution
→ genuine ambiguity 时才进入 semantic Resolver
~~~

这也让我们放弃了一个很诱人的方向：

> 给 Agent 再加一个特别聪明的 Tool Search 模型，每一步都问它下一步该加载什么。

研究 POC 曾经出现明显的 model-call amplification。

它证明 Progressive Disclosure 这个方向有效，却同时提醒我们：

**渐进披露是一个上下文机制，不应该变成一个新的“每一步都问模型”的工作流引擎。**

生产方案因此反而更朴素：deterministic first，semantic fallback。

## 然后我们把 Pi 拉进了同一场实验

研究走到这里，一个很自然的问题出现了：

既然 Pi Coding Agent 已经有成熟的 deferred tools、active loadout 与 tool_search，我们为什么还要自己做？

于是有了 #300。

我们原本设计了三条严格控制变量的路线：

~~~text
A. Current Mira
B. Mira Progressive
C. Pi-native Progressive
~~~

保持相同：

- Main model；
- Tool Catalog；
- gold target；
- authority ceiling；
- evaluation contract；
- Mira Harness / Policy / Evidence。

唯一允许替换的是：

~~~text
Visibility / Disclosure Backend
~~~

看起来应该是一张非常漂亮的 A/B/C 成绩表。

但最终 Pi 那一列没有分数。

不是它跑输了。

而是我们发现：**Pi 成熟的渐进式工具机制，并不是一个可以从系统里轻易拔出来的独立 Tool Search 库。**

## Pi 为什么没有进入成绩表

Pi 的成熟机制更接近一个完整的 AgentSession 生命周期：

- active tool loadout；
- deferred tools；
- tool search；
- session state；
- subsequent-turn tool declaration；
- progressive visibility lifecycle。

而 Mira 当前使用的是更底层、更薄的 Pi Agent Core，并没有采用完整的 pi-coding-agent AgentSession。

如果强行给 Pi 做出一个分数，只有两个办法。

第一个办法是自己写一层 shim，模拟 Pi 的 deferred/loadout/search。

但那测到的是：

> Mira 模仿 Pi 的效果。

不是 Pi-native。

第二个办法是把 Pi AgentSession 一起接进来。

这样变化的就不再只有 Visibility Backend，Agent session、状态管理、工具生命周期甚至 Agent loop 的边界都会一起变化，对照实验失去公平性。

所以最终研究记录里写得很克制：

> **no comparable score was fabricated**

没有给 Pi 一个 0 分，也没有拿一个自制 shim 冒充 Pi。

它根本没有进入同一张排行榜。

::: html
<figure style="margin:2.8rem 0 3rem">
  <svg viewBox="0 0 920 420" width="100%" role="img" aria-label="Pi 的成熟渐进披露机制与 Mira 采用的设计边界" style="display:block">
    <defs>
      <linearGradient id="piFlow" x1="0" x2="1">
        <stop offset="0" stop-color="#8bd0bf"/>
        <stop offset="1" stop-color="#6b9edf"/>
      </linearGradient>
      <linearGradient id="miraFlow" x1="0" x2="1">
        <stop offset="0" stop-color="#f4bb64"/>
        <stop offset="1" stop-color="#cc785c"/>
      </linearGradient>
    </defs>

    <text x="28" y="35" fill="currentColor" opacity=".55" font-size="12" letter-spacing="2.2">BORROW THE IDEA · KEEP THE BOUNDARY</text>

    <path d="M80 122 C180 58 270 66 365 122 S545 182 650 112 S785 66 850 102" fill="none" stroke="url(#piFlow)" stroke-width="7" stroke-linecap="round" opacity=".82"/>
    <path d="M80 284 C190 344 290 330 380 278 S565 218 660 284 S788 342 850 302" fill="none" stroke="url(#miraFlow)" stroke-width="4" stroke-linecap="round"/>

    <text x="80" y="88" fill="currentColor" font-size="18" font-weight="650">Pi AgentSession</text>
    <text x="80" y="315" fill="currentColor" font-size="18" font-weight="650">Mira-owned runtime</text>

    <g fill="currentColor" font-size="12" opacity=".66">
      <text x="224" y="85">loadout</text>
      <text x="360" y="146">deferred</text>
      <text x="514" y="145">tool_search</text>
      <text x="682" y="87">session lifecycle</text>
    </g>

    <g fill="currentColor" font-size="12" opacity=".72">
      <text x="210" y="346">Capability View</text>
      <text x="382" y="265">Progressive Resolution</text>
      <text x="578" y="263">deterministic first</text>
      <text x="720" y="344">Mira Harness</text>
    </g>

    <line x1="458" y1="54" x2="458" y2="368" stroke="currentColor" stroke-opacity=".12" stroke-dasharray="2 7"/>
    <text x="476" y="205" fill="currentColor" opacity=".45" font-size="11" letter-spacing="1.7">INTEGRATION BOUNDARY</text>

    <circle cx="458" cy="122" r="6" fill="#6b9edf"/>
    <circle cx="458" cy="278" r="6" fill="#cc785c"/>
    <path d="M458 143 C430 174 430 220 458 257" fill="none" stroke="currentColor" stroke-opacity=".28" stroke-width="1.5"/>
    <text x="356" y="205" text-anchor="end" fill="currentColor" opacity=".58" font-size="12">复用思想</text>
    <text x="356" y="225" text-anchor="end" fill="currentColor" opacity=".58" font-size="12">不搬整个 AgentSession</text>
  </svg>
  <figcaption style="margin-top:.65rem;font-size:.86rem;opacity:.58">Pi 最终成为实现参考，而不是 Phase 2 的直接 Runtime 依赖。这个结论来自集成边界，不是框架审美。</figcaption>
</figure>
:::

## 不复用代码，不代表没有复用设计

恰恰是在这次对照里，Pi 给了我们很多重要启发：

- Tool 不需要始终 direct exposure；
- Tool Catalog 与完整 Tool Schema 可以分离；
- active tool loadout 本身应该是一种 Agent state；
- Skill 可以 summary-first / body-later；
- Tool Search 是 capability discovery 的组成部分，不是执行权限；
- progressive state 必须能够跨 Agent turn 延续。

我们最后没有复制 Pi AgentSession。

但 Mira 的生产方向明显吸收了这些思想。

最终的结构被收敛为：

~~~text
Authority / Readiness Envelope
            ↓
     Agent Capability View
            ↓
     Progressive Resolution
       /       |       \
    Tool     Skill    Resource
 metadata   summary   metadata
    ↓          ↓         ↓
 schema      body      content
            ↓
     Mira Planner / Harness
~~~

Main Agent、Generic Child、Skill Child 各自拥有自己的 scoped Capability View。

这里还有一个重要修正：

~~~text
Parent 当前看见的 Tool
≠
Child 能够发现的能力上限
~~~

Child 应该继承 authority / eligibility envelope，再在自己的局部任务里逐步发现与披露。

不能因为 Parent 这一轮恰好没有看见某个工具，就让 Child 永远失去它。

## Disclosure 永远不等于 Authority

整轮研究最后还有一个我们非常坚持的边界。

渐进披露只解决：

> 模型现在知道什么。

它绝不能变成：

> 模型现在被允许做什么。

所以无论一个 Tool 是 Search 找出来的、metadata 展开的、schema 动态加载的，还是 Skill 推荐出来的，最终执行仍然必须回到原来的治理链：

~~~text
Normalize
→ Policy
→ Approval
→ Harness
→ Evidence
~~~

Capability View 不发许可证。

Tool Search 也不发许可证。

它们只是改变模型的视野。

## 少一点「智能」，反而可能更像智能

这次研究最后让我们重新确认了一条越来越稳定的 Mira 工程原则：

**不要因为 Agent 看起来应该更聪明，就在每一层都再塞一个模型。**

真正成熟的系统，需要把不同问题拆开。

Runtime Readiness 回答：

> 这个能力现在到底能不能用？

Authority 回答：

> 当前用户与任务到底允许不允许？

Progressive Resolution 回答：

> 模型现在需要知道多少？

Tool Search 回答：

> 在真的不知道具体 Tool 时，怎么找到它？

Planner 回答：

> 下一步做什么？

Harness 回答：

> 怎么执行，并留下可信证据？

这些东西如果全部揉进一个“聪明 Agent”里面，看起来很智能，实际上会越来越难解释，也越来越难治理。

我们最后选择的生产方向反而很薄：

~~~text
先暴露少量信息
需要时再展开
能确定就不用 Search
能确定性解决就不用模型
权限永远由原来的权限系统决定
~~~

截至 2026 年 10 月 10 日，研究决策已经完成，生产实现由 [Desktop #301](https://github.com/uichat-mira/mira-desktop/issues/301) 承接，并拆成独立的小步实施与最终验收。

所以这篇文章记录的是一次**已经完成的研究与架构决策**，不是在宣称 Progressive Resolution 的完整生产链已经全部上线。

有时候，Agent 系统真正需要的不是再多一点智能。

而是让正确的信息，在正确的时候，出现在正确的位置。
