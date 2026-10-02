---
title: Chat 与 UChat Runtime
description: Thread、Message、request-only context、Normal / RAG / Agent 路由、持久化、取消和媒体扩展的当前实现边界。
group: 架构
order: 7
---

# Chat 与 UChat Runtime

## 文档范围

本页说明 Mira 当前 Chat 的状态所有权和调用链。重点不是页面长什么样，而是：

- Thread 保存什么；
- Message 何时持久化；
- Normal、RAG 和 Agent 如何分流；
- UChat core、UI 和 desktop integration 如何分层；
- Role、Summary、附件与媒体在哪一层生效；
- Stop、Edit 和 Delete 的真实语义。

主项目最终核验依据是 `docs/CHAT_CURRENT_TRUTH.md`。

## 总体结构

```text
UChat Core / UI
→ Desktop Chat Integration
→ Thread REST + Attachment REST + Chat SSE
→ Request Context Assembly
→ Normal Chat | RAG Pipeline | Agent Runtime
→ Message / AgentRun / ChatMedia Persistence
```

状态所有权：

| 状态 | 真相来源 |
| --- | --- |
| Thread 配置 | SQLite `threads` |
| 可见消息 | SQLite `messages` |
| Agent 运行 | `agent_runs` |
| Knowledge Base / Sources | Knowledge Base 与 RAG Runtime |
| Tool execution | Harness Invocation / Evidence |
| 当前 Composer / Streaming | UChat runtime memory |
| 用户上传附件 | Attachment storage + Message parts |
| 系统生成音频 / 图片 | ChatMedia + 领域 Runtime |

## ChatWorkspace

Chat Workspace 保存：

```text
id
userId
name
rootPath
status
```

Thread 只保存 `workspaceId`。文件系统位置通过 Workspace row 的 `rootPath` 解析。

Agent Thread 必须有 Workspace；普通 Thread 可以没有。

默认 Workspace 名为 `Mira BASE`，指向当前 Harness 默认 workspace root。

## Thread

Thread 当前保存：

```text
title
modelName
workspaceId
knowledgeBaseId
roleId
agentEnabled
ttsEnabled
imageEnabled
contextSummary
status
```

### `modelName`

字段存在并被 desktop 展示，但默认 Chat route 没有根据它选择模型。

真实 Provider Resolution 仍从全局 `llm` role 开始：

```text
llm role
→ Provider Connection
→ model id
→ adapter
```

因此 `Thread.modelName` 不是可靠的 per-thread model binding。

### `knowledgeBaseId`

- 非 Agent：满足文本问题条件时选择独立 RAG route；
- Agent：作为 Agent Runtime 的检索输入；
- 不代表每一轮都一定发生检索。

### `roleId`

Role 有两类作用：

1. 把 Prompt fragments 拼成 request-only system context；
2. 在 persisted Normal / Agent path 合并数值生成参数。

独立 RAG route 会收到 Role Prompt，但当前没有接收 Role LLM profile 的数值参数覆盖。

### `contextSummary`

Summary 持久化在 Thread，每轮临时注入，不创建可见 system Message。

当前没有自动滚动 Summary 机制。

## Message

SQLite Message schema：

```text
id
threadId
role
content
partsJson
metadata
createdAt
```

没有：

```text
parentId
status
updatedAt
version
branchId
error
```

Canonical parts：

- text；
- image；
- file；
- data。

`content` 是兼容文本字段；富消息以 parts 为主要来源。

## Request-only Context

Thread-level context 在每轮请求时装配：

```text
Role
→ Context Summary
→ Memory Slot
→ Agent Execution Context
```

这些 system messages 不进入可见历史。

### Memory Slot

代码已经预留 `memoryContext` resolver，但当前 Thread schema 和桌面 API 没有持久化该值。

所以它只是接入插槽，不是当前长期记忆能力。

## 路由分流

### Normal Chat

```text
agentEnabled = false
+ RAG conditions not satisfied
→ persist User
→ global llm
→ SSE text
→ persist Assistant on stop
```

Normal Chat 当前不经过 Agent Planner。

项目中存在 Default Chat Tool Loop 文件，但当前调用条件使它不可达：

- route 在 Normal branch 传 `agentEnabled=false`；
- Tool Loop 立即返回 null；
- Agent=true 时 route 已转入 Agent Runtime。

不能从代码文件存在推断 Normal Chat 已支持 Harness Tool Calling。

### RAG Chat

```text
knowledgeBaseId exists
+ agentEnabled = false
+ authenticated Thread
+ latest User text exists
→ RAG route
```

RAG route 保存 Answer 和 Sources metadata。

Knowledge Base 为空时返回固定无上下文回答。

只有 File / Image parts、没有文本时，RAG input 可能为 null，route 回退 Normal Chat。

### Agent Chat

```text
agentEnabled = true
→ persist User
→ create AgentRun
→ Agent Runtime
→ Assistant projection
```

AgentRun 持有 approval、checkpoint、Evidence 和 terminal state。Message 不是 Agent 运行真相。

## UChat 分层

### Core

负责：

- canonical types；
- Thread list / hydration；
- Composer Draft；
- Attachment upload state；
- optimistic messages；
- send / edit / regenerate / stop；
- run event state transition。

Core 不认识 Mira REST、Provider 或 Agent backend。

### UI

负责：

- Thread、Message、Composer；
- Markdown 与 streaming text；
- Execution Trace；
- Agent status / approval；
- extension slots。

### Desktop Integration

负责：

- Thread REST adapter；
- Attachment adapter；
- SSE protocol mapping；
- Agent submission options；
- TTS / Image post-send lifecycle。

## 应用级生命周期

同一登录会话内 UChat runtime 不随普通页面切换重建。

它保存：

- Thread summaries；
- hydrated histories；
- per-thread Composer Draft；
- active Run ownership；
- optimistic / streaming Message state。

同一 runtime 当前只允许一个进行中发送。

Welcome 状态不会立即创建数据库 Thread；第一次发送才创建。

## 持久化时序

### 发送开始

```text
UChat append optimistic User
+ optimistic Assistant
→ POST Chat
→ backend persist latest User
→ execute
```

### Assistant 成功

只有：

```text
finishReason = stop
+ non-empty answer
```

才写入 Message 表。

发送后 UChat refresh Thread 和列表，与 backend truth 对账。

### Error

普通 Chat / RAG error 通常不会持久化 Assistant Message。

UChat 当前可以显示 error bubble，但刷新后可能只剩 User。

### Stop

Desktop AbortController 取消 Fetch 和本地流读取。

Server 没有统一 cancellation token 传给 Provider、RAG、Agent 或 Tool。因此：

```text
client stopped reading
!= backend work stopped
```

## Edit 与 Regenerate

Backend 会根据请求携带的 parent / lineage 找到锚点，并删除后续 Message、File attachment 和 ChatMedia。

Message 表没有 parentId 或版本表。Desktop hydration 又按返回顺序重建线性 parentId。

所以当前行为是：

```text
replace linear tail
```

不是持久化 Branch Tree。

## Attachment Runtime

上传 endpoint 限制：

- 单文件；
- 最大 8 MB；
- 常见图片和文档白名单；
- 非图片先经过本地 Structured Document Reader。

File attachment 在生成前转换为最新 User Message 的文本 context。

历史 File 不会每轮重新解析。

当前清理缺口：

- uploaded-but-unsent file；
- Composer 移除后的 uploaded file；
- 普通 Image attachment 删除；
- 没有 asset reference count 或周期 GC。

## ChatMedia

ChatMedia 是系统生成媒体，与用户上传 Attachment 分开。

### TTS

成功 Assistant 后调用 TTS Runtime，绑定 audio media。

### Image

当前自动条件：

```text
imageEnabled
+ roleId
+ no knowledgeBaseId
```

Assistant text 作为 prompt。媒体失败只更新 metadata，不回滚文本回答。

## 删除语义

### Thread

删除 Thread 清理 ChatMedia 和 File attachment，再通过外键级联 Messages。

### Workspace

删除非默认 Workspace 当前硬删除其 active Threads。Archived Threads 通过 `SET NULL` 解绑。

### Knowledge Base：High 缺陷

当前外键：

```text
threads.knowledge_base_id
ON DELETE CASCADE
```

Knowledge Base service 直接删除 row，SQLite foreign keys 开启。

所以删除 KB 会删除绑定 Thread 和 Messages。

目标语义不应如此。合理修复需要：

```text
migration: ON DELETE SET NULL
+ service explicit detach
+ regression tests
+ destructive UI warning
```

在修复前，产品层必须明确警告用户。

## 已知漂移

- Normal Chat Tool Loop 不可达；
- Thread modelName 不驱动模型；
- Role 数值参数未统一进入 RAG；
- Edit / Regenerate 不保存分支；
- Stop 不保证 backend cancellation；
- Error Assistant 不完整持久化；
- Attachment storage 缺少完整 GC；
- Memory resolver 没有 persistence source；
- Workspace 删除活动 Thread 是破坏性行为；
- Knowledge Base 删除级联 Thread 是 High 数据缺陷。

## 当前非目标

Chat Runtime 当前没有承诺：

- Normal Chat 自主 Tool Calling；
- per-thread model selection；
- 三条路径完全一致的 Role 参数；
- durable Message Branch；
- backend cooperative cancellation；
- persistent error timeline；
- attachment reference counting；
- automatic rolling summary；
- integrated long-term memory；
- Workspace 作为强隔离 Sandbox。

## 相关文档

- [对话工作区](/docs/product/workspace)
- [Provider 与模型运行时](/docs/architecture/provider-context)
- [Knowledge Base 与 RAG Runtime](/docs/architecture/knowledge-rag)
- [Agent 当前运行真相](/docs/architecture/agent)
- [Harness 与工具边界](/docs/architecture/harness)
- [MicroApps 与独立 Runtime](/docs/architecture/microapps)
