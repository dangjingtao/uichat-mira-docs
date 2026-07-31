---
title: 对话工作区
description: 正确使用 Thread、普通对话、知识库问答、Agent、附件、编辑重跑与媒体扩展，并了解当前数据边界。
group: 产品能力
order: 7
---

# 对话工作区

## 文档范围

Mira 的对话工作区不只是一段消息列表。一个 Thread 会保存当前对话的角色、知识库、Agent 模式、工作空间、上下文摘要和媒体设置，并根据这些配置选择不同的后端执行路径。

当前完整对象链：

```text
Workspace
→ Thread
→ Message / Attachment
→ Role / Summary Context
→ Normal Chat | RAG Chat | Agent Chat
→ Assistant Message
→ Optional TTS / Image
```

## 新建对话

点击新建对话后，Mira 先进入 Welcome Draft。

此时：

```text
可以输入内容和选择附件
但数据库里还没有空 Thread
```

只有第一次真实发送时，Mira 才创建 Thread。这避免只打开欢迎页就产生空历史记录。

## Thread 保存什么

一个 Thread 当前可以保存：

| 配置 | 当前作用 |
| --- | --- |
| 标题 | 历史列表显示；首轮成功后可自动生成 |
| Workspace | Agent 和 Tool 的默认文件执行环境 |
| Knowledge Base | 普通模式下进入 RAG；Agent 模式下提供检索能力 |
| Role | 注入角色设定和部分生成参数 |
| Agent | 切换到 AgentRun 执行 |
| Context Summary | 作为本轮不可见的上下文摘要 |
| TTS | 回答成功后生成音频 |
| Image | 符合条件时回答成功后生成图片 |

Thread 中还存在 `modelName` 字段，但当前默认 Chat 仍按全局主模型 `llm` 角色解析 Provider 和模型。不要把 Thread 中显示的模型名理解为可靠的独立模型绑定。

## 三种对话路径

### 普通对话

条件：未启用 Agent，也没有进入知识库问答。

```text
User Message
→ Role / Summary Context
→ 全局主模型
→ Assistant Message
```

普通对话当前不会自动调用 Harness Tool，也不经过 Main Planner。

适合：

- 普通知识问答；
- 写作和改写；
- 不需要工具或知识库的对话。

### 知识库问答

条件：

- Thread 已绑定 Knowledge Base；
- Agent 未启用；
- 当前输入中可以提取文本问题。

```text
User Question
→ 当前 Knowledge Base
→ Retrieval / Rerank / Generate
→ Answer + Sources
```

知识库为空时，Mira 返回固定拒答，不会假装已经检索到资料。

只有图片或文件、没有文本问题时，当前请求可能无法进入 RAG，而退回普通对话。需要知识库检索时，请同时写出明确的问题。

### Agent 对话

启用 Agent 后：

```text
User Goal
→ AgentRun
→ Planner / Retrieval / Tool / SubAgent
→ Evidence / Approval / Finalization
→ Assistant Delivery
```

Agent Thread 必须绑定 Workspace。没有手工选择时，Mira 会使用默认 `Mira BASE` 工作空间。

Knowledge Base 在 Agent 模式下不再走独立 RAG 页面路径，而作为 Agent 可使用的检索输入。

Agent 的审批和恢复语义见：[Agent 当前运行真相](/docs/architecture/agent)。

## Role 与上下文摘要

### Role

绑定 Role 后，Mira 会把角色描述、人设、世界观、场景、示例、表达风格和约束作为不可见 system context 注入。

Role 不等于单独绑定一套 Provider 或模型。

当前还有一处路径差异：Role 的 Prompt 会进入普通、RAG 和 Agent 三条路径；但 Role 的 Temperature、Top P、Max Tokens 等数值参数当前只明确传入普通和 Agent 的持久化路径，独立 RAG 路径没有接收这组覆盖参数。

### Context Summary

Thread 菜单可以：

- 自动生成当前摘要；
- 手工编辑；
- 保存；
- 清空。

摘要每轮作为不可见上下文注入，不会显示成聊天消息。

当前不会按 Token 阈值自动持续更新。旧摘要可能落后于后续对话，重要线程需要人工重新生成或修订。

## Message 与时间线

Message 当前包含：

```text
text
image
file
data
metadata
```

`data` 用于 Execution Node 等结构化运行信息。

### 编辑消息

编辑一条旧 User Message 后，Mira 会删除它后面的旧消息，再生成新的回答。

### 重新生成

重新生成某条 Assistant Message 时，Mira 会保留对应 User Message，删除旧 Assistant 及其后续内容，再运行一次。

当前真实语义是：

```text
改写当前时间线
```

不是保存多个可切换的对话分支。旧版本删除后不能从当前 UI 恢复。

## 附件

当前限制：

```text
一次一个文件
最大 8 MB
```

支持：

- PNG、JPG、WebP、GIF；
- TXT、Markdown、CSV、JSON、YAML；
- 常见代码、配置和日志；
- PDF、DOCX、PPTX、XLSX。

非图片文件会在上传时先验证能否被本地文档 Reader 解析。

发送时，Mira 只会重新读取本轮最新 User Message 中的文件全文。历史消息中的旧文件不会在每一轮自动重新注入全部内容。

图片能否被模型理解，仍取决于当前具体模型是否支持图片输入。上传成功不能证明模型具备视觉能力。

## 发送、失败与停止

### 发送开始

界面会先显示乐观的 User Message 和流式 Assistant 占位；backend 随后先保存 User Message，再调用模型、RAG 或 Agent。

### 成功

只有收到正常完成且非空的回答时，Assistant Message 才写入历史。

### 失败

普通对话或 RAG 流式失败时，错误 Assistant 可能只存在当前界面内存中。刷新后可能只剩已经保存的 User Message。

Agent 的详细错误还可能保存在 AgentRun 和 Execution Trace 中。

### 停止

点击停止会：

- 中断桌面端当前 HTTP 流；
- 移除本地流式 Assistant；
- 重新读取已保存的 Thread。

它不保证远端模型、RAG、Agent 或 Tool 已经真正停止。当前没有统一的 backend cancellation contract。

User Message 通常已经先保存，因此停止后仍会留在历史中。

## TTS 与图片生成

TTS 和 Image 开关不是主模型的多模态能力开关，而是回答成功后的额外媒体任务。

### TTS

```text
Assistant Text
→ TTS Runtime
→ Audio Media
```

### Image

自动图片生成当前要求：

```text
Image Enabled
+ 已绑定 Role
+ 未绑定 Knowledge Base
```

Assistant 文本会作为图片 Prompt。图片失败不会撤销已经成功的文字回答。

## Thread 管理

### Archive

归档会把 Thread 从活动列表移入 Archived 状态，不删除消息。

### Delete Thread

永久删除 Thread 会删除消息和系统生成的 ChatMedia。部分附件文件当前仍可能残留，见下方边界。

### Delete Workspace

默认 `Mira BASE` 不能删除。

删除其他 Workspace 时，当前实现会硬删除所有绑定该 Workspace 的活动 Thread。它不是单纯解除项目目录绑定，操作前必须确认历史对话是否需要保留。

## 重要数据风险

> **当前不要在仍有重要绑定对话时删除非默认 Knowledge Base。**

当前数据库外键使用：

```text
Thread.knowledgeBaseId
ON DELETE CASCADE
```

因此删除 Knowledge Base 会：

```text
删除 Knowledge Base
→ 删除所有绑定 Thread
→ 删除这些 Thread 的 Messages
```

这是已确认的高严重度实现缺陷，不是目标产品合同。在 Runtime 修复为解除绑定并保留历史之前，应先手工把重要 Thread 切换到无知识库或其他知识库，并备份关键内容。

## 当前附件清理边界

附件 storage 当前还不是完整的自动垃圾回收系统：

- 上传成功但没有发送，或在 Composer 中移除，文件可能残留；
- 普通图片附件删除时可能没有走文件清理；
- 当前没有统一引用计数和周期 GC。

不要把聊天附件目录当作长期文件库。

## 验证清单

- [ ] 当前 Thread 绑定了正确 Role、Knowledge Base 和 Workspace；
- [ ] 普通、RAG 或 Agent 模式与当前目标一致；
- [ ] RAG 回答显示了真实 Sources；
- [ ] Agent 的 waiting 状态来自 AgentRun；
- [ ] 编辑或重新生成前接受后续历史会被删除；
- [ ] Stop 后检查 Thread 中实际留下了什么；
- [ ] 删除 Workspace 或 Knowledge Base 前已备份重要对话；
- [ ] 图片和文件能力已通过具体模型真实验证。

## 相关文档

- [Chat 与 UChat Runtime](/docs/architecture/chat-runtime)
- [模型设置](/docs/configuration/model-settings)
- [知识库与 RAG](/docs/product/knowledge)
- [Agent 当前运行真相](/docs/architecture/agent)
- [Harness 与工具边界](/docs/architecture/harness)
- [MicroApps 与独立 Runtime](/docs/architecture/microapps)
