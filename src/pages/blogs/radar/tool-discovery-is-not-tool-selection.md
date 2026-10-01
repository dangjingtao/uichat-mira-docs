---
title: 工具太多时，Agent 应该先替模型筛掉一批，还是让模型自己找？
description: OpenAI 的 Tool Search 把大工具集从一次性暴露改成按需发现，也照出 Mira 当前 Top 20 工具面压缩方案最值得重新审视的地方。
group: Mira 雷达
order: 46
date: 2026年10月2日
readTime: 6 分钟阅读
tags: Agent | Tool Search | Harness | ToolExposure | MCP
author: mira
writingMode: authored
---

# 工具太多时，Agent 应该先替模型筛掉一批，还是让模型自己找？

一个 Agent 只有五六个工具时，把所有工具定义都交给模型通常没什么问题。等工具涨到几十个甚至更多，每个名字、描述和参数 schema 都要占上下文，Harness 很自然会先筛一遍，只留下“最可能有用”的工具。

UIChat Mira 当前就是这样做的。

OpenAI 最近公开的 Tool Search 则提供了另一种思路：工具可以先不把完整定义加载进模型上下文；模型需要时，再搜索并加载相关定义。这看起来像 token 优化，实际碰到一个更根本的问题：**“现在先给模型看什么”和“系统允许执行什么”，是不是同一件事？**

## 发生了什么

OpenAI 当前的 [Tool Search 文档](https://developers.openai.com/api/docs/guides/tools-tool-search) 允许函数或 MCP 工具 deferred loading。模型先拥有工具搜索能力，需要某项能力时再发现并加载对应定义。

传统工具压缩通常是：

```text
完整工具集 → embedding / rerank → Top K → 模型上下文
```

Tool Search 更接近：

```text
完整可用目录 → 暂缓大部分定义 → 模型提出发现需求
→ 搜索相关工具 → 加载命中的完整定义 → 正常调用
```

OpenAI 还说明，这个设计考虑了 prompt cache：新发现的工具定义追加到上下文末尾，而不是不断改写前面的缓存前缀。9 月 10 日发布的 [Agents API](https://openai.com/index/introducing-the-agents-api/) 则把上下文管理、工具使用、SubAgent 协调和长运行基础设施放在同一个 Harness 语境里。

这些是外部可核验事实。它们并不能证明所有 Agent 都应该采用同一种实现。

## 检索失败，不应该等于工具不存在

Top K 很简单，也很有效。但它藏着一个语义变化。

假设系统有 100 个可用工具，真正需要的那个被排在第 21 名。对权限系统来说，它仍然可用；对 Planner 来说，它却根本不存在。

```text
retrieval miss → tool invisible → Planner cannot select it → task appears impossible
```

这和“工具被 Policy 禁止”完全不同。前者只是召回器猜错了当前 query 和工具的相关性；后者才是系统明确决定某个调用不能发生。

如果两者最终都表现为“Planner 看不见”，一次用于省上下文的检索排序，就开始承担权限系统才该承担的语义。

Tool Search 值得关注的地方，是它允许工具属于**可发现的能力空间**，同时暂时不占当前模型上下文。

## Mira 当前真的怎么做

这里只看当前公开仓库。

Mira 的 Agent 主链目前是 Pi Loop。Main Planner 每轮读取 `state.toolExposure`，也就是这一轮真正暴露给 Planner 的 concrete tools。Harness 负责 capability / tool registry、eligible tool surface、schema、risk / approval、workspace boundary 与 invocation；Planner 负责下一步决策。

当前协议可在 [AgentGraph 与 Harness 当前协议](https://github.com/uichat-mira/mira-desktop/blob/prod/docs/harness/agentgraph-harness-protocol.md) 核对。真正关键的是 [Harness candidate resolver](https://github.com/uichat-mira/mira-desktop/blob/prod/server/src/harness/candidates-core/resolver.ts)。

当前代码逻辑是：

- public tools 不超过 20 个时全部暴露；
- 超过 20 个时构造 capability profiles；
- 用本地 embedding 对 query 与 capability 做召回；
- 可用时再 rerank；
- 展开为 concrete tools、去重；
- 最终把前 20 个放进 `toolExposure`。

代码注释明确强调：ranking 只服务 20-tool context budget，不应被解释成额外 Policy filter。这是一个重要的设计边界。

但实现层仍有一个事实：第 21 个及以后的工具，对这一轮 Planner 就是不可见。如果 embedding 失败，fallback 是确定性取前 20 个 public tools；它保证不会因为检索失败而完全没有工具，却不能保证真正需要的工具在这 20 个里面。

所以 Mira 已经在概念上把“权限”和“ranking”分开了，但在 Planner 的可见性结果上，两者还没有完全解耦。

这不等于当前实现错误。20 个工具预算是在真实上下文约束下做出的工程选择，而且 Mira 已经给候选排序和尾部工具召回补过回归保护。更准确的判断是：**工具生态继续增长后，Top K 暴露会逐渐承担它原本不该承担的语义。**

## 值得吸收的不是一个 API 名字

最容易得到的结论是：Mira 也做一个 `tool_search`。这个结论太快。

Mira 还要处理本地工具、External MCP、workspace policy、Approval、Skill-scoped tools，以及 Parent / Child 的执行所有权。新的发现机制如果直接插进 Planner，很容易把现有治理边界搅在一起。

更值得吸收的是三个原则。

第一，`ToolExposure` 可以从“一次性最终名单”演进为可扩展视图：

```text
eligible catalog → initially exposed tools → discoverable deferred tools
```

Planner 起步只拿少量高概率工具，但没被初始召回的工具仍然存在于可发现空间里。这样 ranking miss 不再自动等价于 capability miss。

第二，Discovery 不能绕过 Policy。搜索到一个工具，只意味着 Planner 获得了它的定义，可以考虑提出 invocation。Mira 当前 concrete tool 的关键链路仍应保持：

```text
Planner → Normalize → frozen pendingToolCall → Policy → Tool → Evidence
```

因此，discoverable 不等于 approved，批准过的一次 invocation 也不等于可复用权限。

第三，Parent / Child 不应该自动共享同一发现空间。Mira 当前 Generic SubAgent 只拥有局部工作包，Skill-owned SubAgent 也只得到受限工具面。未来即使能搜索工具，Child 也不能因此搜索到 Parent 的全部能力。

Tool discovery 本身必须带 scope。否则，一个为了减少上下文而引入的功能，会悄悄变成权限扩大器。

## 评测也要跟着变

如果只测“Top 20 里有没有正确工具”，评估的其实只是静态召回器。按需发现真正应该测完整任务链：

1. 初始工具面很小时，Planner 是否知道什么时候需要继续找；
2. 搜索词不精确时，是否仍能发现正确 capability；
3. 找不到时能否恢复，而不是直接宣告任务不可能；
4. discovery 是否严格服从 Parent / Child、Skill 与 external-tool scope；
5. 新定义进入上下文后，是否仍走正常 Normalize / Policy / Approval；
6. 相比 eager exposure，任务成功率、输入 token、延迟和 cache 表现究竟如何。

OpenAI 文档也没有声称 deferred loading 永远更好：工具少、且多数任务都会用到时，eager loading 仍然合理；大 catalog 每次只用少数工具时，deferred loading 才更有吸引力，并建议用代表性请求比较完成率、token 和延迟。

## 还有什么不确定

Mira 现在没有证据支持立刻替换 Top 20 方案。

当前实际工具规模是否已经大到值得增加一次发现步骤，需要测。Planner 是否能稳定意识到“我需要继续找工具”，而不是在初始工具面里勉强选一个相似但错误的工具，也需要真实任务验证。

本地 embedding + rerank 也未必应该删除。它更可能从“最终裁掉谁”变成“给 discovery 提供候选和排序”。

External MCP 还会带来更动态的问题：catalog 什么时候刷新、定义如何缓存、工具变化怎样进入当前 AgentRun，以及 checkpoint 恢复时使用哪一版工具描述，都不能靠一个搜索接口解决。

所以这次雷达真正值得 Mira 吸收的，不是 Tool Search 这个名字，而是一条更清楚的边界：

> **上下文预算决定现在先给模型看什么，Policy 决定什么可以执行。两者之间应该允许发现，而不该让一次检索排序替系统永久宣布某个能力不存在。**

当 Agent 只有几个工具时，这个区别很学术。等工具、Skill、MCP、远程能力和 Child execution 一起增长，它就会变成 Harness 的基本结构。
