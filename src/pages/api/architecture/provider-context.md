---
title: Provider 与模型运行时
description: Provider Template、Connection、模型目录、角色绑定、请求解析与当前实现边界。
group: 架构
order: 13
---

# Provider 与模型运行时

## 文档范围

本页说明 Mira 如何从模型设置解析出一次真实模型调用。

用户操作步骤见：[模型设置](/docs/configuration/model-settings)。

本页不负责：

- 定义聊天消息和附件的完整协议；
- 说明知识库的文档导入流程；
- 说明 Image Generation 或 TTS Studio 的全部 Runtime；
- 根据模型名称推断 Vision、Tool Calling 或上下文长度。

## 当前对象模型

Mira 的 Provider Runtime 由七层组成：

```text
Provider Template
→ Provider Connection
→ Provider Model Cache
→ Model Role Binding
→ Provider Resolution
→ Protocol Adapter
→ Invocation / Observation
```

| 层 | 职责 |
| --- | --- |
| Provider Template | 定义协议族、默认地址、adapter 和角色资格 |
| Provider Connection | 保存真实 Base URL、API Key 和连接实例 |
| Provider Model Cache | 保存最近一次目录同步获得的模型列表 |
| Model Role Binding | 把模型绑定到 Chat、Agent、Embedding 等具体用途 |
| Provider Resolution | 为本次调用确定 Connection、模型、参数和 adapter |
| Protocol Adapter | 把 Mira 请求转换成上游协议 |
| Invocation / Observation | 记录实际 endpoint、模型、参数、耗时、结果和错误 |

这些层不能互相替代。

```text
有 Template
≠ 有可用 Connection

有模型目录
≠ 已绑定角色

有角色绑定
≠ 当前调用成功
```

## Provider Template 与 Connection

### Template

Template 描述一类连接如何工作，例如：

- Ollama native；
- OpenAI-compatible；
- Cloudflare；
- 火山 Ark Plan。

它包含同步、Chat、Embedding、Rerank 和 Image adapter 的静态声明。

### Connection

Connection 是用户真正配置的实例，包括：

- Connection ID；
- Template；
- 显示名称；
- Base URL；
- API Key；
- enabled 状态；
- 最近一次同步状态和错误。

用户可以创建多个自定义 OpenAI-compatible Connection。它们共享协议 Template，但地址、凭据、模型缓存和角色绑定彼此独立。

## 当前 Provider Template

| Template | Chat | Embedding | Rerank | Image | 说明 |
| --- | --- | --- | --- | --- | --- |
| Ollama | 原生 | 原生 | 无 | 无 | 本地服务；执行前检查模型是否已下载 |
| LM Studio | OpenAI-compatible | OpenAI-compatible | 无 | 无 | 默认本地 `/v1` 服务 |
| OpenAI | OpenAI-compatible | OpenAI-compatible | 无 | OpenAI Images | API Key 必填 |
| Google Gemini | OpenAI-compatible | OpenAI-compatible | 无 | 无 | 使用 Gemini 的兼容 endpoint |
| Cloudflare | OpenAI-compatible Chat | Cloudflare | 无 | 无 | Account ID 和 `@cf/` model id 有额外约束 |
| 火山引擎 | OpenAI-compatible | OpenAI-compatible | OpenAI-compatible | OpenAI Images | 默认指向本地协议适配入口 |
| 火山 Code Plan | OpenAI-compatible | 无 | 无 | 无 | 仅文本角色；专用目录与 endpoint |
| 火山 Agent Plan | OpenAI-compatible | 无 | 无 | 无 | 仅文本角色；专用目录与 endpoint |
| 自定义 OpenAI-compatible | OpenAI-compatible | OpenAI-compatible | OpenAI-compatible | OpenAI Images | 可建立多个连接；当前仍有 provider code 兼容映射 |

Template 声明的是协议资格，不是具体模型的能力证明。

## 模型目录同步

同步过程：

```text
保存 Connection
→ 调用模型目录 adapter
→ 替换该 Connection 的本地模型缓存
→ 更新 connected / error
```

当前同步 adapter 包括：

- Ollama `/api/tags`；
- OpenAI-compatible Models；
- Cloudflare 模型目录；
- Ark Plan 模型发现。

### 状态语义

| 状态 | 当前含义 |
| --- | --- |
| `idle` | 尚未完成本轮同步，或配置刚发生变化 |
| `syncing` | 正在请求模型目录 |
| `connected` | 最近一次模型目录同步成功 |
| `error` | 最近一次模型目录同步失败 |

`connected` 不是持续健康检查，也不是 Chat invocation 结果。

Provider 不提供模型目录时，可以手工填写 model id。手工 ID 只有在真实调用成功后才被验证。

## 模型角色

当前全局角色：

```text
llm
Task
agentTask
evaluation
embedding
rerank
imageGeneration
voice
```

模型设置总览当前主要管理：

```text
llm / task / agentTask / evaluation / embedding / rerank
```

### Text roles

- `llm`：普通聊天和最终文本生成；
- `task`：标题、摘要等轻量任务；
- `agentTask`：Agent 规划和任务生成；
- `evaluation`：评测生成和裁判。

`agentTask` 未显式绑定时，当前 Runtime 会回退使用 `task`。

### Retrieval roles

- `embedding`：远程文本向量化；
- `rerank`：远程候选重排。

Rerank 必须由 Provider Template 显式声明，不能从 Chat adapter 推断。

### Image / Voice roles

`imageGeneration` 和 `voice` 存在于全局角色 schema，但对应 Studio 当前主要使用独立 Provider 配置。

因此：

```text
全局角色已绑定
≠ Image / TTS Studio Ready
```

## Provider Resolution

一次模型调用开始前，Runtime 会：

```text
读取角色默认配置
→ 定位 Provider Connection
→ 检查 enabled、Base URL 和必要凭据
→ 解析可调用 model id
→ 合并角色参数与本次覆盖参数
→ 选择协议 adapter
→ 发出请求
```

解析结果包含：

- runtime provider code；
- connection id；
- template code；
- Base URL；
- model id；
- model config id；
- 参数。

API Key 参与调用，但不应进入公开 Observation。

显式指定 provider 不能绕过角色绑定。当前 Runtime 会检查显式 provider 是否与该角色最终解析结果一致。

## Chat Runtime

### Ollama

```text
<baseUrl>/api/chat
```

使用 Ollama 原生消息与流式响应。图片输入会投影为 Ollama image payload。

### OpenAI-compatible

```text
<baseUrl>/chat/completions
```

文本、图片和文件 part 会转换为兼容消息。Ark Plan Template 会在 adapter 内解析专用 Base URL。

Provider Proxy 会保留最新用户消息中的附件，并从较早历史消息中移除非文本附件，以控制上游 payload。

## Embedding Runtime

远程 Embedding 根据 Template 使用：

- Ollama native；
- Cloudflare；
- OpenAI-compatible。

调用后会验证：

- 输入非空；
- 向量数量与输入数量一致；
- dimensions 大于 0。

实际 dimensions 与当前配置不同，系统会回写真实维度。

## Rerank Runtime

Rerank 调用要求：

```text
已绑定 rerank role
+
Provider Template 显式提供 rerank adapter
```

普通 Chat 成功不能证明 Rerank endpoint 可用。

## 内置本地模型 Runtime

Mira 还有一条不经过 Provider Connection 的本地 ONNX / WASM 路径：

| 用途 | 模型 | 当前说明 |
| --- | --- | --- |
| Embedding | `multilingual-e5-small` | 384 维内置本地能力 |
| Rerank | `ms-marco-MiniLM-L-6-v2` | 可选内置本地能力 |

本地调用在 Observation 中使用：

```text
providerCode: local
endpoint: local:model-runtime
```

它与远程角色绑定不是同一个状态源。

## 参数与 Provider 特判

Text role 参数包括：

- Temperature；
- Top P / Top K；
- Max Tokens；
- Frequency / Presence Penalty。

当前特判：

- Ollama 的 Task / AgentTask 关闭 thinking；
- 火山的 Task / AgentTask 关闭 thinking。

并非所有 OpenAI-compatible 服务都接受完全相同的参数。Adapter 兼容不等于上游行为完全相同。

## Invocation 与 Observation

当前模型调用可以记录：

```text
role
provider code / label
protocol
operation
endpoint
model / modelConfigId
params
request summary
startedAt / finishedAt / durationMs
result / error
```

这些信息用于说明“实际调用了什么”，而不是仅展示设置页选择。

### Token 与成本

Provider Proxy 当前没有为所有 adapter 统一归一化：

- Input Tokens；
- Output Tokens；
- Reasoning Tokens；
- Cache Tokens；
- Cost / Currency。

因此公开文档不承诺所有调用都有准确成本数据。耗时可观测不等于用量和账单已统一。

## 凭据与备份

API Key 在本地数据库中加密保存。

模型设置导出时，为了支持完整恢复，当前 JSON 会包含明文 API Key。导出文件必须按敏感凭据处理，不应提交 Git 或公开分享。

## 当前已知实现边界

### 配置状态不是运行健康

模型卡“已配置”只检查是否保存了 Connection 和 model id；Provider `connected` 只表示最近一次模型目录同步成功。

实际可用性必须由真实 Chat、Embedding 或 Rerank 请求证明。

### Seed 绑定可能形成假就绪感

系统会预置部分 Ollama 模型名称。若本地服务未启动或模型未下载，页面仍可能显示已有绑定，运行时才会失败。

### 自定义 Connection 的 runtime code

当前 `openai-compatible-custom` 在内部 Resolution 中仍映射为火山 runtime provider code。

这是历史兼容实现，可能影响调试标签和 Task 参数特判；它不代表目标上所有自定义连接都属于火山引擎。

### Image / Voice 双配置源

全局模型角色与 Studio Provider 配置尚未统一，不能用其中一处状态替代另一处。

### Capability 不是 per-model 探测

当前 Template 可以声明 adapter 和角色资格，但不会自动证明具体模型支持 Vision、Tool Calling、JSON Schema 或某个上下文长度。

## 当前非目标

Mira 当前没有承诺：

- 所有 OpenAI-compatible Provider 行为完全一致；
- 模型目录同步等于完整健康检查；
- 一个模型自动承担全部角色；
- 供应商名称可以替代具体模型能力验证；
- Chat、Image 与 TTS 已经共享同一个完整统一 Provider Gateway；
- 所有模型调用都能提供统一 Token 和成本；
- 保存角色绑定后自动启动服务或下载模型。

## 相关文档

- [模型设置](/docs/configuration/model-settings)
- [产品地图](/docs/about/product-map)
- [当前实现快照](/docs/status/current)
- [MicroApps 与独立 Runtime](/docs/architecture/microapps)
