---
title: Mira 的工具现在到底是什么
description: 从六月的固定四域工具表走到今天的动态公共工具面，重新说明 Registry、Tool Exposure、Approval 与 Evidence 的真实边界。
group: 工程现场
order: 9
date: 2026年7月30日
readTime: 8 分钟阅读
tags: Tool | Harness | MCP | Terminal | Approval | 工程真相
author: tomz | mira
writingMode: co-authored
writtenBy: mira
reviewedBy: tomz
---

# Mira 的工具现在到底是什么

六月时，Mira 的工具文档很好理解：Read、Edit、Web Search、Terminal 四个能力域，每个域下面列出几件工具，再讨论它们应该怎样被模型识别。

那套文档并不是凭空想象。它记录了 Harness 从无到有时的真实施工，也帮助我们第一次把文件读取、编辑、搜索和命令执行从聊天代码里抽出来。

但到了 7 月 30 日，它已经不再能解释当前代码。

Read 的公共面变了，Edit 不再只有一个 `edit_file`，Terminal 也不再是只能留在 Workspace 的简化命令盒。Browser、Mail、GitHub、External Expert 和 External MCP 开始动态进入工具系统，CodeGraph 也已经从“接入前方案”变成真实 Runtime。

继续维护一张静态四格表，只会让“代码里注册了什么”“模型能看到什么”“这次到底能不能执行”再次混成一件事。

## 工具首先不是一份清单

Mira 当前的 Tool Runtime 更接近一条逐层收紧的事实链：

```text
Registry
→ Public Surface
→ Availability
→ Tool Exposure
→ Frozen Invocation
→ Policy / Approval
→ Harness Execution
→ Evidence
```

Registry 只回答实现是否已经注册。

其中可以同时存在公共工具、内部 primitive、旧调用兼容层、动态微应用能力和 External MCP 投影。一个 ID 还留在 Registry，不等于 Main Planner 还应该使用它。

Public Surface 决定哪些实现属于当前公共 Agent 合同。Availability 再判断它在当前用户、设备和连接状态下是否真的可用。

只有走到 Tool Exposure，才是在回答：这轮模型究竟看见哪些 concrete tools。

## 当前公共核心工具面

### Read 不再是六个相互重叠的入口

```text
read_discover
grep
read_open
codebase_explore
```

`read_discover` 负责目录、路径和文件名候选；`grep` 搜索正文、符号、引用和配置键；`read_open` 打开已知目标；`codebase_explore` 处理代码架构、关系和影响面，并把候选带回当前 Workspace 核验原文。

过去的 `read_list`、`read_locate`、`read_extract`、`read_slice` 和 `read` 没有被粗暴删除。它们仍可以服务内部 primitive、持久化旧调用或兼容逻辑，但不再占用 Planner 的公共认知面。

这次变化背后的判断很简单：兼容实现可以多，模型面对的动作必须少而清楚。

### Edit 已经是四个直接动作

```text
write_file
replace_block
delete_path
move_path
```

Planner 直接选择创建或覆盖、局部替换、删除、移动，不再先调用一个 `edit_file` 包装器，再在参数里选择真实动作。

这不是为了增加工具数量，而是消除多余的一层语义翻译。模型已经决定“移动文件”时，就应该申请 `move_path`，而不是申请“编辑文件，operation=move”。

四个 Edit 工具都会改变真实文件，因此都要求审批，并受 Workspace 边界约束。

### Search 明确区分公网和本地缓存

`web_search` 搜索公共互联网，`news_search` 查询本地 News Hub 已收集的数据。

两者都叫“搜索”，但证据的新鲜度和来源完全不同。让一个统一入口根据关键词偷偷切换数据源，看似减少工具，实际会让结果失去可解释性。

### Terminal 是完整 Host Runtime

`terminal_session` 支持 shell、Node、Python、Git、包管理器、持久 PTY、watcher、开发服务器和 REPL。

它不再是早期文档里那个严格留在 Workspace 内的 command sandbox。Workspace 仍是默认上下文，但当调用明确展示真实 `cwd` 并获得审批后，Terminal 可以访问工作空间外的目录。

释放执行能力不等于放弃治理。Terminal 始终需要审批，命令、目录、环境变量和超时变化都会形成新的 Invocation。

## 工具面会动态变化

Mira 当前还可以注册或开放：

- Managed Computer Use Browser；
- 用户已经连接的 Attached Browser；
- Mail；
- GitHub 的 Repository、Issue、Pull Request 与 Actions；
- 问策的 External Expert；
- 用户安装并允许 Agent 使用的 External MCP Tools。

它们不是“装了功能就永远存在”的静态卡片。

邮箱查询需要用户身份和账号；GitHub 需要有效连接与仓库授权；Attached Browser 需要用户已经连接浏览器；External Expert 需要问策连接；External MCP 则要经过启用、连接、免责声明、Discover 和 Agent Access。

所以，一个能力至少有四种常见状态：

```text
没有注册
已经注册但当前不可用
当前可用但本轮未暴露
已经暴露但具体调用尚未获批
```

把它们都叫成“工具不可用”，诊断会非常痛苦。

## Harness 不再用相关性决定工具是否存在

当前公共且可用的工具不超过 20 个时，Harness 会把它们全部暴露给 Planner，不运行 embedding 或 rerank。

只有超过 20 个时，才会根据当前任务做 ranking，并保留前 20 个工具。

```text
publicToolCount <= 20
→ expose all

publicToolCount > 20
→ rank
→ expose top 20
```

这是上下文预算机制，不是授权机制。

风险不能通过隐藏工具解决。一个 Terminal 调用有风险，就让它在具体 Invocation 上等待审批；不能因为 Harness 猜测“当前可能用不到 Terminal”，就先让模型以为系统没有 Terminal。

Planner 负责判断下一步，Harness 负责让这个动作可验证、可审批、可执行、可追踪。

## Approval 是一次具体调用，不是一张长期通行证

Mira 的 settled exact-invocation 合同是：

```text
toolId + toolCallId + inputHash
```

这意味着命令、参数、`cwd`、环境变量、超时或目标资源变化后，都应该重新判断。

但这次代码审计也发现了一处没有假装正确的地方：当前 `dev` 的 frozen call 和审批请求虽然保存了 `toolCallId`，核心 approval grant matcher 实际仍只匹配 `toolId + inputHash`。

这是一处审批身份漂移，不是目标合同已经改变。公开记录它，是为了避免将来有人看着当前代码反向修改文档，把一个尚未收紧的实现写成设计初衷。

## MCP 不是“连接后全部注入”

External MCP Tool 只有在 Server 已启用、连接、免责声明已接受、Discover 获得 Tool、Agent Access 打开，而且 canonical projected implementation 仍存在时，才会进入公共可用工具面。

投影 ID 使用：

```text
mcp:<serverId>:tool:<toolName>
```

即便已经进入 Tool Exposure，每次真实调用仍需要审批。

安装、连接、Discover、Agent Access、Tool Exposure 和 Approval 是六个不同阶段。MCP 页面真正重要的价值，不是列出更多服务，而是让用户知道某个能力到底卡在哪一层。

## 工具成功不等于任务完成

Harness 能证明一次具体调用发生了什么，却不能替 Planner 宣布用户目标已经完成。

```text
Invocation completed
→ Tool Result
→ Evidence
→ Planner acceptance
→ continue / answer
```

文件写入成功，不等于文件内容正确；CodeGraph 返回候选，不等于原文已经核验；External MCP 返回一段文字，也不等于它足以支持最终结论。

工具的职责是行动和返回事实。Evidence 负责保存可被引用的事实。Planner 才负责把这些事实和用户全局目标放在一起判断。

## 接下来不是继续制造工具

这轮文档整理没有得出“工具还不够多”的结论，反而再次确认：

- 公共动作应该少而清楚；
- 内部 primitive 可以隐藏；
- 动态能力必须有真实 Availability；
- ranking 只处理上下文；
- 风险交给具体 Approval；
- Tool Result 必须进入 Evidence；
- Skill-private Runtime 不应污染 Main Tool Exposure。

所以 Mira 的工具系统现在不是四个分类卡片，也不是一个无限扩张的 Tool Marketplace。

它是一层让 Agent 真正触碰文件、进程、网络和外部系统时，仍然能够知道“有什么、能不能用、模型看见了什么、批准的是哪一次、实际做了什么”的控制面。

工具终于开始像工具了：不替 Agent 思考，也不偷偷替用户做主。

相关说明：

- [工具工作台](/docs/configuration/tools)
- [Harness 与工具边界](/docs/architecture/harness)
- [MCP](/docs/configuration/mcp)
- [当前实现快照](/docs/status/current)
- [Mira Agent 现在到底是什么](/blogs/engineering/mira-agent-current-truth)
