---
title: 模型设置
description: 从 Provider Connection 到主模型绑定与真实聊天验证，完成 Mira 的第一次模型配置。
group: 产品能力
order: 12
---

# 模型设置

## 文档范围

本页说明如何在全新安装中配置第一个可用模型，并解释 Provider Connection、模型目录、模型角色和运行状态的区别。

第一次使用的完成标准是：

```text
保存 Provider Connection
→ 绑定主模型
→ 回到 Chat 发送测试消息
→ 收到真实模型回复
```

模型卡显示“已配置”或 Provider 显示 `connected`，都不能单独替代最后一步。

## 完成第一次聊天

### 1. 准备模型服务

选择本地或云端路径。

#### 本地模型

常见选择：

- Ollama；
- LM Studio；
- 其他提供 OpenAI-compatible API 的本地服务。

配置前需要：

1. 启动模型服务；
2. 下载或加载一个聊天模型；
3. 记录服务地址；
4. 记录准确的模型 ID。

常用默认地址：

| Provider | 默认 Base URL |
| --- | --- |
| Ollama | `http://localhost:11434` |
| LM Studio | `http://127.0.0.1:1234/v1` |

保存 Mira 配置不会自动启动本地模型服务，也不会自动下载模型。

#### 云端模型

准备：

- 有效 API Key；
- 正确 Base URL；
- 对目标模型的访问权限；
- 可用网络连接。

API Key 只应填写在 Mira 中，不要粘贴到公开日志、截图或聊天记录。

### 2. 打开主模型选择器

进入：

```text
设置
→ 模型设置
→ 主模型
→ 右上角更多菜单
→ 选择模型
```

第一次只配置“主模型”。Task、Agent、Embedding、Rerank 和评测模型可以稍后处理。

### 3. 选择 Provider Connection

左侧选择一个内置连接：

- Ollama；
- LM Studio；
- OpenAI；
- Google Gemini；
- Cloudflare；
- 火山引擎；
- 火山引擎 Code Plan；
- 火山引擎 Agent Plan。

也可以创建多个自定义 OpenAI-compatible 连接。

内置 Connection 可以修改配置，但不能删除；自定义 Connection 可以删除。

### 4. 填写 Base URL 与 API Key

Base URL 应填写 API 根地址，不要填写模型名称或完整 Chat endpoint。

| 常见错误 | 错误示例 | 正确处理 |
| --- | --- | --- |
| 缺少兼容 API 路径 | LM Studio 只填 `http://127.0.0.1:1234` | 使用服务实际提供的 `/v1` 根地址 |
| 填了完整聊天路由 | `.../v1/chat/completions` | 改回 API 根地址 |
| Cloudflare 保留占位符 | URL 中仍有 `<ACCOUNT_ID>` | 替换为真实 Account ID |
| 本地端口错误 | 服务监听 1234，配置写 9997 | 使用服务实际监听端口 |

OpenAI 和 Cloudflare 当前要求非空 API Key。本地服务是否需要 Key，取决于服务自身配置。

### 5. 同步模型目录

点击模型下拉框右侧的圆形箭头。

同步会：

```text
保存连接字段
→ 请求 Provider 模型目录
→ 把结果缓存到 Mira 本地
→ 更新 connected 或 error 状态
```

同步成功只证明模型目录接口可访问，不能证明：

- Chat endpoint 可用；
- 账号仍有额度；
- 所选模型支持聊天；
- 模型支持图片或工具调用；
- 本地模型已经加载完成。

### 6. 选择或手工填写模型 ID

模型出现在同步列表中时，直接选择。

目录为空或没有目标模型时，可以在 Model Name 中手工填写准确的远端模型 ID。

手工填写不会提前验证模型是否存在，最终仍要通过真实 Chat 请求确认。

### 7. 绑定为主模型

确认 Provider、Base URL 和 Model Name 后，点击确认。

主模型卡会显示当前连接和模型名称。

此时“已配置”只表示：

```text
Provider Connection 已保存
+
remote model id 已绑定到 llm role
```

它不是实时健康检查。

### 8. 执行真实测试

返回 Chat，新建普通对话，发送：

```text
仅回复：OK
```

首次配置通过标准：

- 请求没有立即报错；
- 收到非空 Assistant 回复；
- 回复来自当前绑定模型；
- 不依赖旧线程缓存。

只有这一步通过，主模型才算真正可用。

## 三种状态不要混淆

| 状态 | 实际含义 | 不能证明 |
| --- | --- | --- |
| 模型卡“已配置” | 已保存 Connection 和 model id | Provider 当前在线 |
| Provider `connected` | 最近一次模型目录同步成功 | Chat 当前成功 |
| 真实聊天回复 | 本次 Chat invocation 成功 | 其他模型角色也可用 |

数据库可能预置 Ollama 的模型名称。即使卡片已有内容，只要 Ollama 没启动或模型未下载，运行仍会失败。

## Provider 与模型的对象关系

模型设置不是一张模型名称表。

```text
Provider Template
→ Provider Connection
→ 同步模型目录
→ 模型角色绑定
→ 实际调用解析
```

| 对象 | 说明 |
| --- | --- |
| Provider Template | 定义协议族、默认地址和可绑定角色 |
| Provider Connection | 保存真实地址、凭据和连接实例 |
| 模型目录 | 最近一次同步后缓存的远端模型列表 |
| 模型角色 | 说明一个模型在 Mira 中承担什么用途 |
| 实际调用 | 本轮最终解析到的 Connection、模型、参数和 endpoint |

同一个 Provider 可以有多个模型；同一个模型也可以绑定多个角色，但不表示它适合所有用途。

## 当前模型角色

模型设置总览当前显示六张卡：

| 卡片 | role | 用途 | 当前界面行为 |
| --- | --- | --- | --- |
| 主模型 | `llm` | 普通聊天和最终文本生成 | 可选模型、可编辑参数 |
| 小任务模型 | `task` | 标题、摘要等轻量任务 | 可选模型；参数详情只读 |
| Agent 任务模型 | `agentTask` | Agent 规划和任务生成 | 可选模型；参数详情只读 |
| 评测模型 | `evaluation` | 从 Knowledge Base Chunk 生成评测包样本 | 可选模型、可编辑参数；当前不承担 Run Judge |
| 向量模型 | `embedding` | 远程文本向量化 | 可选模型、可编辑参数 |
| 排序模型 | `rerank` | 远程候选重排 | 可选模型、可编辑参数 |

全局数据结构还存在 `imageGeneration` 和 `voice` 两个角色，但当前图像和语音主要由各自 Studio 单独配置，不在这六张总览卡中统一管理。

## 推荐配置顺序

主模型验证成功后，再按需要配置：

1. Agent 任务模型；
2. 小任务模型；
3. 评测模型；
4. 向量模型；
5. 排序模型。

### Agent 任务模型

当前 `agentTask` 未绑定时，会回退使用 `task`。

这是兼容路径，不表示两类任务应永久共用一个模型。复杂 Agent 任务通常需要更稳定的指令遵循、工具决策和更长输出预算。

### 小任务模型

适合标题、摘要、分类等高频轻量工作。优先考虑速度、稳定性和成本，不必与主模型相同。

### 评测模型

当前评测模型只用于评测包生成器：

```text
Knowledge Base Chunk
→ question
→ expectedAnswer
→ tags
```

它不会参与 Evaluation Run 的指标裁判。当前 Faithfulness、Answer Relevance 和 Answer Completeness 使用本地词项重合启发式，而不是 LLM Judge。

因此：

```text
evaluation role 已配置
!= 已配置 Judge Model
```

详细说明见：[评测工作台](/docs/product/evaluation)和[Evaluation Runtime 与指标语义](/docs/architecture/evaluation-runtime)。

### 向量模型

远程 Embedding 必须使用对应协议，不能用普通 Chat 模型名称替代。

Mira 同时存在一个独立的内置本地 Embedding Runtime：

```text
multilingual-e5-small
384 dimensions
ONNX / WASM
```

“内置本地能力可用”和“远程 Embedding 已绑定”是两种不同状态。

### 排序模型

Rerank 是独立协议能力，不能从 Chat 兼容性推断。

Mira 也有一个可选内置本地 Rerank Runtime：

```text
ms-marco-MiniLM-L-6-v2
ONNX / WASM
```

## Image Generation 与 TTS

第一次聊天不需要配置图像或语音模型。

当前主要入口：

- Image Generation Studio；
- TTS Studio。

它们拥有独立 Provider 配置和领域 Runtime。模型设置中的全局角色绑定与 Studio 配置尚未成为完全统一的来源，因此不能从其中一处“已配置”推断另一处 ready。

## Provider 能力的真实含义

Provider Template 可以声明：

- Chat adapter；
- Embedding adapter；
- Rerank adapter；
- Image adapter；
- 可绑定角色。

这些是协议级资格，不是某个具体模型的自动能力探测。

当前不能仅凭 Provider 名称或模型目录推断：

- Vision；
- Tool Calling；
- JSON Schema；
- 上下文长度；
- 全部采样参数；
- 图片输入和文件输入兼容性。

这些能力需要以具体模型和真实请求验证。

## 参数编辑

主模型、评测、Embedding 与 Rerank 可以在详情中编辑角色参数。

文本参数可能包括：

- Temperature；
- Top P；
- Top K；
- Max Tokens；
- Frequency Penalty；
- Presence Penalty。

首次连接测试时建议保留默认参数。先证明地址、凭据和 model id 正确，再调整生成行为。

Task 与 AgentTask 当前由系统维护稳定参数，详情页只读；模型绑定仍可更换。

## 导入与导出

模型设置支持导出和导入：

```text
Provider Connection
Base URL
API Key
模型角色绑定
角色参数
```

当前导出 JSON 包含可用于恢复连接的**明文 API Key**。

它必须按敏感凭据文件处理：

- 不提交到 Git；
- 不上传公开 Issue；
- 不发送到不可信聊天；
- 不放在公开网盘链接；
- 导入前确认来源可信。

## 重置默认模型

“重置默认模型”会恢复系统 seed 的角色绑定和参数。

这不等于下载模型、启动本地服务或验证云端凭据。重置后仍需重新执行真实请求。

执行前建议先安全备份当前设置，并确认备份文件的凭据风险。

## 常见错误

### Connection refused

检查：

1. 本地服务是否启动；
2. Base URL 和端口是否正确；
3. 容器或虚拟机端口是否暴露；
4. 防火墙和代理是否阻断。

### 401 / 403

检查 API Key、账号权限、模型权限和服务端认证要求。

### 404

通常表示 Base URL 路径或协议不匹配。不要把完整 `/chat/completions` 写入 Base URL。

### 模型目录为空

Provider 可能不提供目录接口，或当前 Key 没有权限。可以手工填写准确 model id，再进行 Chat 验证。

### Ollama 模型不可用

当前运行时会检查本地模型目录。确认模型已经 pull，并且名称与 tag 完全一致。

### Cloudflare 地址无效

把默认 URL 中的 `<ACCOUNT_ID>` 替换成真实 Account ID，并使用以 `@cf/` 开头的 callable model id。

### 自定义 OpenAI-compatible 行为异常

OpenAI-compatible 只表示协议形态接近，不保证所有服务的模型目录、参数、Rerank、Image、Tool Calling 和流式响应完全一致。

当前自定义 Connection 在内部仍有一处映射到火山 runtime provider code 的兼容实现。它可能影响调试标签和 Task 参数行为；这已被记录为实现边界。

## 验证清单

- [ ] 本地服务已启动，或云端凭据有效；
- [ ] Base URL 是正确 API 根地址；
- [ ] Provider Connection 已保存；
- [ ] 已同步目录，或手工填写准确 model id；
- [ ] 模型已绑定到主模型；
- [ ] 新 Chat 已收到真实回复；
- [ ] 其他角色只在主模型成功后继续配置；
- [ ] 导出备份没有进入公开位置。

## 相关文档

- [Provider 与模型运行时](/docs/architecture/provider-context)
- [应用基础信息](/docs/configuration/application-basics)
- [知识库与 RAG](/docs/product/knowledge)
- [评测工作台](/docs/product/evaluation)
- [Evaluation Runtime 与指标语义](/docs/architecture/evaluation-runtime)
- [当前实现快照](/docs/status/current)
