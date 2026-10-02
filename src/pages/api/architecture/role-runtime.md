---
title: Role Runtime 与请求上下文
description: Role 的数据所有权、Thread 绑定、Prompt 编译、三条 Chat 路径、状态漂移与媒体边界。
group: 架构与运行时
order: 11
---

# Role Runtime 与请求上下文

## 文档范围

本页说明 Role 如何从设置页数据进入 Thread 和模型请求，并记录当前实现偏差。

Role 当前对象链：

```text
Role Row
→ Prompt Fields / LLM Profile
→ Welcome draftRoleId | Thread.roleId
→ Role Context Resolver
→ Normal Chat | RAG Generate | Agent Runtime
→ Optional TTS / Image
```

## 状态所有权

| 状态 | 当前真相源 |
| --- | --- |
| Role 内容 | `roles` 表 |
| 欢迎态选择 | Desktop draft state |
| 已有线程绑定 | `threads.role_id` |
| 可见聊天历史 | `messages` 表 |
| 请求中的 Role Prompt | Backend request-context resolver |
| Role 采样参数 | `roles.llm_profile_json` |
| Chat 头像和标签 | Desktop 当前加载的 active Role 列表 |

Role Prompt 不写入 Message。

## Role 数据

Role 持久化：

```text
id
userId
name
summary
avatarId
status
tags
prompt
llmProfile
createdAt
updatedAt
```

真实 Role Prompt 只使用：

```text
name
description
worldview
persona
scenario
exampleDialogues
style
constraints
```

当前不进入 Prompt：

```text
summary
tags
avatarId
status
```

## Thread 绑定

### Welcome 状态

```text
选择 Role
→ draftRoleId
→ 首次发送创建 Thread
→ Thread.roleId
```

### 已有 Thread

```text
选择或移除 Role
→ PATCH Thread metadata.roleId
→ 重新读取 Thread
```

Thread 只保存 Role id，不保存内容快照。

修改 Role 会影响所有绑定 Thread 的后续请求；当前没有版本锁定或 per-thread Role snapshot。

## Request Context 编译

Backend 根据 Thread.roleId 读取 Role，并生成一条 request-only system message。

当前结构近似：

```text
角色遵循说明
角色名
角色描述
世界观
人设
场景
示例对话
表达风格
约束
```

空字段不会生成对应 section。

当前实现不是前端 Prompt Manager，也没有把七个字段编译为多条可独立排序的 Prompt entry。

`{{user}}` 和 `{{char}}` 不做变量替换。

## 上下文顺序

线程 request-only context 当前按顺序装配：

```text
Role
→ Context Summary
→ Memory Slot
→ Agent Execution Context
```

Memory Slot 当前没有稳定的 Thread 持久化来源，不能据此声明长期记忆已经完成。

RAG Generate 之后还会加入知识库回答规则和检索上下文。

## Normal Chat

```text
Role system message
→ visible Thread history
→ Role LLM params
→ global llm role
→ Provider Resolution
```

Normal Chat 中：

- Role Prompt 生效；
- Role LLM Profile 生效；
- Role 不选择实际 Provider 或模型。

## RAG Chat

```text
Role system message
→ requestContextMessages
→ RAG Generate
```

Role 只进入 Generate，不进入：

- Query Rewrite；
- Embedding；
- Vector / Lexical Retrieval；
- Rerank；
- Sources。

当前独立 RAG 路径没有接收 Role LLM Profile。所以同一个 Role 在普通 Chat 与 RAG 中可能使用不同的采样参数。

## Agent Chat

```text
Role system message
→ Agent request context

Role LLM Profile
→ Agent Runtime params
```

Role 不能：

- 扩大 Tool Exposure；
- 绕过 Harness Policy；
- 自动批准 Invocation；
- 选择 Skill Runtime；
- 改变 Agent terminal contract；
- 替代 Workspace boundary。

Role.constraints 是模型 Prompt，不是可执行权限规则。

## LLM Profile

当前字段：

```text
temperature
topP
topK
maxTokens
frequencyPenalty
presencePenalty
```

Role LLM Profile：

```text
!= Provider Connection
!= Remote Model ID
!= Model Capability Profile
!= Context Window
```

### 参数范围

Desktop 和 API 当前只确认值是数字，没有统一的范围和整数约束。

Provider 可能忽略不支持的参数，也可能返回请求错误。

### 参数清除缺陷

当前更新流程是 merge：

```text
Existing Profile
+ PATCH Payload
→ Next Profile
```

Desktop 清空输入后会省略该字段，因此旧值不会被删除。

```text
清空已保存参数
→ key 不进入 PATCH
→ Backend 保留 existing value
```

这是当前配置缺陷，不是预期合同。

## `active / draft` 状态漂移

Chat picker 请求：

```text
GET /roles?status=active
```

Backend resolver 请求：

```text
getRoleById(roleId)
```

Resolver 当前不检查 status。

所以一个已绑定 Role 若被改为 draft：

- Chat UI 可能不再显示头像、标签和角色名；
- Backend 仍继续注入 Role Prompt；
- Role LLM Profile 仍可能影响 Normal / Agent。

当前严重度为 Medium，属于 UI 与实际请求状态分叉。

## Preview 边界

Workbench Prompt Preview 是前端手写说明文本；Chat Preview 是固定模板回复。

两者都不调用：

- Backend Role resolver；
- RAG Graph；
- Agent Runtime；
- Provider；
- Model Observation。

Preview 还展示 summary，而真实 Prompt 不使用 summary。

因此 Preview 不能作为 Runtime 验证证据。

## 删除行为

Thread 外键当前使用：

```text
role_id REFERENCES roles(id) ON DELETE SET NULL
```

删除 Role 会：

```text
删除 Role row
→ Thread.roleId = null
→ Thread 与 Messages 保留
```

当前没有专门覆盖此行为的回归测试，仍应防止未来 Migration 把它误改成 Cascade。

Role 删除或解绑不会自动清空 Context Summary。

## 媒体联动

### TTS

TTS 是 Assistant 成功后的独立 Runtime。Role 只影响被合成的文字，不选择声音或 TTS Provider。

### Image

选择 Role 时，Desktop 当前可能自动写入：

```text
imageEnabled = true
```

自动图片任务要求：

```text
imageEnabled
+ roleId
+ no knowledgeBaseId
+ configured Image capability
```

Assistant 文本直接作为图片 Prompt。这是产品集成副作用，不是 Role 数据模型的能力。

## Starter Role 初始化

Backend 只有在整张 roles 表为空时，才为当时存在的 active users 写入三个英文示例 Role。

```text
roles table count > 0
→ 后创建用户不会得到 starter roles
```

Desktop 还有一份可本地化 starter builder，但当前没有实际调用方。

## 当前问题矩阵

| 问题 | 影响 | 严重度 |
| --- | --- | --- |
| draft Role 仍被 Backend 注入 | UI 与请求分叉 | Medium |
| RAG 不使用 Role LLM Profile | 模式间采样不一致 | Medium |
| 已保存参数无法通过清空删除 | 配置无法可靠恢复默认 | Medium |
| 参数没有范围校验 | Provider 拒绝或行为漂移 | Medium |
| Preview 不是真实请求或回复 | 用户误判 Role 已生效 | Medium |
| 选择 Role 隐式启用 Image | 额外任务和成本 | Medium |
| Starter seed 不是 per-user | 新用户体验不一致 | Low–Medium |
| 示例变量不替换 | 示例按字面文本发送 | Low |
| 删除后保留对话缺少专项测试 | Migration 回归风险 | Low |

这些问题目前只记录在文档，尚未在本轮修复。

## 当前没有的能力

- Role Copy / Import / Export；
- Role Version；
- Thread Role Snapshot；
- Role Inheritance；
- Role 专属模型；
- Role 专属 Knowledge Base；
- Role Long-term Memory；
- Role Growth State；
- Role Tool Policy；
- 实际 Request Snapshot Viewer；
- 实际 Model Preview；
- 完整发布与下架工作流。

## 验证依据

当前事实来自：

- Role SQLite schema、Repository、Service 和 Route；
- Personas Workbench 与 `useRoles`；
- Role Preview 与 LLM Profile Drawer；
- Chat Role picker 和 Thread binding；
- Thread request-context Role resolver；
- Normal / RAG / Agent route；
- Chat media lifecycle；
- Thread Role foreign key。

## 相关文档

- [角色工作台](/docs/product/roles-microapps)
- [对话工作区](/docs/product/workspace)
- [Chat 与 UChat Runtime](/docs/architecture/chat-runtime)
- [Provider 与模型运行时](/docs/architecture/provider-context)
- [Knowledge Base 与 RAG Runtime](/docs/architecture/knowledge-rag)
- [Agent 当前运行真相](/docs/architecture/agent)
