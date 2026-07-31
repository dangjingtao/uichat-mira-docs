---
title: 知识库与 RAG
description: 创建知识库、上传 Markdown 或 TXT、预览分段、等待索引完成，并在 Chat 中验证真实检索来源。
group: 产品能力
order: 8
---

# 知识库与 RAG

## 文档范围

本页说明如何使用 Mira 当前正式知识库：

```text
创建知识库
→ 上传文本文件
→ 预览 Chunk
→ 等待索引 ready
→ 绑定到 Chat
→ 用真实问题验证 Sources
```

本页不把以下能力混在一起：

```text
Knowledge Base
!= Evaluation
!= Markdown Workspace
!= Long-term Memory
!= 任意文档解析
```

评测中心会使用知识库和 RAG 结果，但属于独立产品入口。

## 前置条件

首次使用知识库前，至少需要：

- 一个已经通过真实 Chat 验证的主模型；
- 一个已绑定的 Embedding 模型；
- 本地模型服务已启动，或云端 Provider 当前可访问。

进入添加向导第二步时，当前界面会同时检查主模型和 Embedding 模型是否已绑定。

```text
llm role 已绑定
+
embedding role 已绑定
→ Add Wizard 可以继续
```

从后端索引链看，生成向量的直接依赖是 Embedding；主模型用于后续 Chat 和 RAG 生成。这两层不要混淆。

模型设置见：[模型设置](/docs/configuration/model-settings)。

## 完成标准

一份资料进入知识库，不能只看上传请求成功。

完整验收是：

```text
Document 已创建
→ indexStatus = ready
→ 文档保持 enabled
→ Chat 绑定该知识库
→ 真实问题命中正确 Chunk
→ 回答展示真实 Sources
```

以下状态不能互相替代：

| 状态 | 实际含义 |
| --- | --- |
| 上传成功 | 文档记录已创建，索引已进入队列 |
| `processing` | 正在等待或执行切分、Embedding 和写入 |
| `ready` | 当前 Chunk 与向量索引已完成 |
| `failed` | 索引失败，文档不会进入检索 |
| `enabled=false` | 即使 ready，也不会进入检索 |
| Chat 有来源 | 本次问题真实命中了知识库 |

## 数据对象

| 对象 | 当前职责 |
| --- | --- |
| Knowledge Base | 文档、元信息和索引的归属边界 |
| Document | 上传文本、来源和索引状态 |
| Chunk | 检索使用的文本单元 |
| Vector Index | Chunk 的 sqlite-vec 向量表 |
| Lexical Index | 当前进程中的中文词法索引缓存 |
| RAG Source | 最终进入回答的 Document / Chunk 来源 |

Mira 当前支持多个知识库，并保留一个不可删除的默认知识库。

## 创建知识库

进入：

```text
设置
→ 知识库
→ 新建知识库
```

可填写：

| 字段 | 用途 |
| --- | --- |
| 名称 | 识别知识库 |
| 描述 | 说明资料范围 |
| 人格 | 资料适合的专业身份标签 |
| 场景 | 资料适用场景标签 |
| 标签 | 搜索和分类 |

人格、场景和标签是知识库元信息，不会自动成为角色 Prompt，也不会替代线程角色设置。

默认知识库不能删除；用户创建的知识库可以编辑和删除。

## 当前支持的文件

上传当前只接受：

```text
.md
.markdown
.txt
```

规则：

- 每次只能选择一个文件；
- 最大 100 MB；
- 空文件拒绝；
- 优先按 UTF-8 解码；
- TXT 在 UTF-8 失败时可以回退 GB18030。

当前知识库上传不是 PDF、DOCX、PPTX、网页或扫描件解析器。Office 与 PDF 能力属于文枢等其他 Runtime。

## 添加文档

进入：

```text
设置
→ 知识库
→ 选择目标知识库
→ 添加文档
```

添加向导分三步。

### 1. 选择文件

选择一个 Markdown 或 TXT 文件。

如果列表里已经有一个待上传文件，需要先移除，再选择另一个文件。

### 2. 配置与预览 Chunk

![设置文本分段与清洗参数](/images/knowledge-base/kb-upload-chunking.webp)

当前可以配置：

- Character、Recursive、Markdown 或 Token splitter；
- Chunk 大小和重叠；
- 是否保留分隔符；
- 单个或多个分隔符；
- Markdown、Python、Java、Rust 等语言预设；
- 字符数或 UTF-8 Bytes 长度；
- 空白归一化；
- URL 与邮箱移除；
- 问答结构切分。

默认值：

```text
Recursive splitter
Chunk Size: 1024
Overlap: 50
Markdown preset
Replace Whitespace: true
```

预览返回：

- Chunk 总数；
- 最短、最长与平均长度；
- 规范化文本长度；
- 当前有效配置；
- 最多 10 个抽样 Chunk。

抽样预览不是完整文本，也不保证每次出现完全相同的样本位置。

### 3. 上传与索引

![知识文档处理完成](/images/knowledge-base/kb-upload-complete.webp)

上传后，桌面端会轮询 Document 状态。

- 轮询间隔约 1.5 秒；
- 当前桌面等待上限约 10 分钟；
- `ready` 表示本次索引完成；
- `failed` 会显示后端保存的错误信息。

索引在当前 backend 进程中串行执行。它不是可以跨重启恢复的持久任务系统。

## 文档管理

![知识库文档列表](/images/knowledge-base/kb-list-overview.webp)

当前列表支持：

- 切换和搜索知识库；
- 搜索、筛选和排序文档；
- 查看 `processing / ready / failed`；
- 启用或停用文档；
- 单条或批量删除；
- 编辑知识库元信息；
- 查看文档详情。

只有 `ready + enabled` 的文档进入检索。

### 删除文档

删除文档会同时清理：

- Document；
- 关联 Chunk；
- 该 Chunk 在知识库向量表中的数据；
- 当前词法索引缓存。

删除不可撤销。

### 重建索引

当前列表中存在“重建索引”确认入口，但确认后只显示等待提示，没有完成后端重建调用。

因此它目前不能作为修复 Embedding 维度不匹配的正式操作。

需要更换 Embedding 时，当前可靠做法是：

1. 保留原 Embedding 继续使用现有索引；或
2. 在确认资料可恢复后，删除并使用新 Embedding 重新上传文档。

不要把未完成的重建按钮当成已经交付的能力。

## 文档详情

![知识库文档详情与分段预览](/images/knowledge-base/kb-document-detail.webp)

详情页用于检查：

- Document ID；
- 知识库归属；
- 来源、扩展名、大小和编码；
- 字符数、Chunk 数和索引状态；
- 完整文本；
- 真实 Chunk、位置和长度。

检查重点：

- 是否出现乱码；
- 标题、列表和段落是否被错误切断；
- Chunk 是否过长或过短；
- 关键上下文是否被分散到互不完整的 Chunk；
- 无关页眉、模板文本或链接是否占据索引。

## 当前检索方式

当前检索不是纯向量搜索。

```text
Query Rewrite（必要时）
→ Query Embedding
→ Vector Retrieval
+
Chinese Lexical Retrieval
→ Reciprocal Rank Fusion
→ Optional Rerank
→ Generate
```

### 向量检索

使用 sqlite-vec，从当前知识库的 enabled + ready 文档中召回候选。

### 词法检索

当前主链使用 Orama 和中文 tokenizer，在 backend 进程中按知识库缓存索引。

数据库虽然维护 FTS5 表，但当前主检索链不通过 SQLite FTS5 执行词法召回。

### Rerank

Rerank 是可选阶段。

- 配置并调用成功：按远端相关性重新排序；
- 没有配置：直接使用融合结果；
- Provider 调用失败：降级使用融合结果；
- 失败不会阻断整次 RAG。

## 在 Chat 中使用

普通线程当前绑定一个知识库。

在 Chat 中选择知识库后，真实链路是：

```text
User Question
→ Thread knowledgeBaseId
→ RAG Runtime
→ Sources
→ Model Answer
→ Message Persistence
```

验证问题应接近真实使用，不要只输入文件名。

```text
不推荐：产后康复指南
推荐：剖宫产后多久可以开始低强度核心训练？
```

检查：

1. 是否命中正确文档；
2. Sources 是否包含实际相关 Chunk；
3. 向量、词法或混合命中是否合理；
4. 回答是否超出来源；
5. 未命中时是否错误声称“根据知识库”。

知识库为空时，Chat 会返回固定无上下文回答，不执行完整 RAG。

## Agent 与企业集成

### Agent

Main Agent 可以在 Planner 选择 retrieve 时读取当前线程知识库，并把 Sources 记录为 Retrieval Evidence。

当前 Agent retrieve 存在一处实现偏差：它实际调用完整 RAG，包括一次 Generate，随后只使用 Sources。该偏差可能增加延迟与模型成本，但本轮文档没有修改 Runtime。

### 企业微信知识问答

`knowledge_query` MicroApp 当前可以绑定企业微信智能机器人 AccessPoint：

```text
WeCom Smart Robot
→ knowledge_query binding
→ selected knowledgeBaseId
→ full RAG
→ text reply
```

该入口与 Chat 的缺失知识库行为不同：无效绑定当前会回退默认知识库。

## Embedding 兼容

知识库向量索引会记录实际使用的：

```text
Embedding Model
Model Config ID
Dimensions
```

查询时，当前默认 Embedding 必须和索引兼容。

更换模型或维度后，如果找不到兼容索引，检索会要求重建或切回原模型。

虽然 Knowledge Base 数据中存在 `embeddingModelConfigId` 字段，当前索引与查询仍使用全局默认 Embedding role。它还不是已经生效的每知识库独立模型配置。

## 常见问题

### 页面显示有 Embedding，但不能添加

检查：

- 主模型是否也已绑定；
- Embedding Connection 是否只是保存，还是服务真正在线；
- 本地模型是否已经下载并启动；
- Add Wizard 是否刷新到最新角色配置。

### 文档长期停在 processing

当前索引队列不支持重启恢复。若 backend 在处理中退出，状态可能留在 processing。

确认服务日志和 Document 状态；当前没有正式的 retry / resume 按钮。

### 文档 failed

常见原因：

- Embedding Provider 不可访问；
- 模型 ID 不存在；
- 模型返回维度异常；
- 文本过大或上游超时；
- 向量表与预期维度冲突。

### Chat 没有命中

依次检查：

1. 线程是否绑定正确知识库；
2. 文档是否 ready；
3. 文档是否 enabled；
4. 问题是否接近资料中的真实语义或术语；
5. Sources 是否为空；
6. 当前 Embedding 是否与索引兼容；
7. Rerank 是否因阈值过滤掉结果。

## 与评测的边界

知识库负责资料、索引与查询链；评测负责用固定样本验证检索和回答质量。

```text
Knowledge Base Runtime
→ produces Retrieval / RAG Result

Evaluation Runtime
→ measures that Result
```

当前页面不承诺具体评测指标和报告合同。评测系统将在独立文档中说明。

## 当前边界

Mira 当前没有承诺：

- PDF、Office、网页和扫描件自动入库；
- 多文件批量上传；
- 索引任务跨重启自动恢复；
- 切换 Embedding 后自动重建；
- 一个线程同时查询多个知识库；
- 每个知识库独立选择并实际使用 Embedding；
- Rerank 始终可用；
- Knowledge Base 等同于长期记忆；
- 检索命中等同于专业结论正确。

## 验证清单

1. 主模型已经通过真实 Chat；
2. Embedding 请求真实可用；
3. 文件是单个 Markdown 或 TXT，且不超过 100 MB；
4. Chunk 预览符合资料结构；
5. Document 最终进入 ready；
6. 文档保持 enabled；
7. 线程绑定正确知识库；
8. 真实问题能命中正确 Source；
9. 回答没有超出来源；
10. 删除后 Chunk 和 Sources 不再出现。

## 相关文档

- [模型设置](/docs/configuration/model-settings)
- [Knowledge Base 与 RAG Runtime](/docs/architecture/knowledge-rag)
- [对话工作区](/docs/product/workspace)
- [Provider 与模型运行时](/docs/architecture/provider-context)
- [证据优先原则](/docs/philosophy/evidence)
- [当前实现快照](/docs/status/current)
