---
title: Knowledge Base 与 RAG Runtime
description: 知识库对象、索引队列、sqlite-vec、中文词法召回、RRF、Rerank、Sources 与接入边界。
group: 架构
order: 14
---

# Knowledge Base 与 RAG Runtime

## 文档范围

本页说明 Mira 当前 Knowledge Base 和 RAG 的真实运行链。

它回答：

- 文档怎样进入索引；
- 向量与词法检索怎样组合；
- Rerank 失败后怎样降级；
- Chat、Agent 和企业集成怎样复用 RAG；
- 当前有哪些实现偏差。

产品操作见：[知识库与 RAG](/docs/product/knowledge)。

## 当前结论

```text
Knowledge Base
→ Document
→ Chunk
→ Embedding
→ sqlite-vec
→ Vector + Lexical Retrieval
→ RRF
→ Optional Rerank
→ Generate
→ Sources / Observation
```

Knowledge Base 负责资料和索引；RAG Runtime 负责一次查询。两者不是同一个对象。

```text
Knowledge Base exists
!= Index ready
!= Thread bound
!= Retrieval hit
!= Answer correct
```

## 核心对象

### Knowledge Base

保存：

- 名称、描述和 active / archived；
- persona、scenario、tags；
- 默认 Chunk 配置；
- 可选 embeddingModelConfigId；
- 文档与向量索引归属。

当前支持多个知识库，并确保存在不可删除的默认知识库。

### Document

保存完整规范化文本和索引状态：

```text
processing
ready
failed
```

只有 `ready + enabled` 文档进入检索。

### Chunk

Chunk 保存文本、顺序、字符数和规范化文本偏移。

当前偏移不是 PDF 页码、Office 段落或原始二进制坐标。

### Vector Index

索引注册记录：

- knowledgeBaseId；
- vec0 table；
- Embedding model config；
- dimensions；
- distance metric；
- active 状态。

向量表名由知识库、模型、配置和维度派生。

## 导入与索引

### 文本输入

当前上传只接受单个 Markdown 或 TXT。

解码：

```text
strict UTF-8
→ TXT failure fallback GB18030
```

没有 PDF、DOCX、PPTX 或网页解析器。

### Chunk Preview

Preview 与正式索引复用同一 splitter。

输出：

- totalChunks；
- 长度统计；
- effective config；
- 最多 10 个抽样 Chunk。

Preview 不写入 Document、Chunk 或向量表。

### 索引队列

```text
Document created
→ enqueue id
→ serial in-process worker
→ split and replace chunks
→ batch Embedding
→ ensure vector table
→ write vectors
→ ready / failed
```

当前队列：

- 只在一个 backend 进程内；
- 串行处理；
- 没有 durable job table；
- 没有 checkpoint、cancel 或 restart resume。

`processing` 是 Document 状态，不是完整工作流记录。

### Embedding Batch

当前 batch 约束：

```text
max inputs: 32
max characters: 60,000
```

入库和查询都解析全局默认 Embedding role。

Knowledge Base schema 虽然有 embeddingModelConfigId，但它尚未驱动实际 per-KB 模型选择。

## 持久化结构

```text
knowledge_bases
  ├─ documents
  │    └─ document_chunks
  └─ knowledge_base_vector_indexes
          └─ dynamic sqlite-vec table
```

数据库还维护 `document_chunks_fts` FTS5 表和触发器。

### FTS5 边界

FTS5 当前不是主词法检索 Runtime。

主链实际使用：

```text
ready + enabled chunks
→ Orama
→ Mandarin tokenizer
→ per-KB in-memory cache
```

因此“数据库有 FTS5”不等于“当前 RAG 通过 FTS5 检索”。

## 查询图

```text
START
→ rewrite
→ embed
→ retrieve
→ rerank | fallbackAnswer
→ generate | END
```

## Query Rewrite

只在问题较短或包含“这个、它、刚才、前面”等指代，并且存在对话历史时尝试。

- 最多参考最近 6 条消息；
- 使用 Task role；
- 输出必须是一句检索查询；
- 调用失败或输出不合格时保留原问题。

Rewrite 是可降级步骤。

## Query Embedding

查询通过默认 Embedding role 生成向量，并记录：

- Provider；
- protocol；
- endpoint；
- model；
- modelConfigId；
- dimensions；
- duration。

查询向量必须与知识库 active vector index 兼容。

不兼容时当前不会自动重建索引。

## Hybrid Retrieval

### Vector Retrieval

- sqlite-vec；
- 默认 cosine；
- 默认 topK=10；
- 范围限制在指定知识库；
- 过滤非 ready 或 disabled 文档。

### Lexical Retrieval

- Orama；
- Mandarin tokenizer；
- documentName 权重高于 content；
- 按 knowledgeBaseId 缓存；
- 文档变化时失效缓存。

### RRF Fusion

```text
vector candidates
+
lexical candidates
→ normalize
→ Reciprocal Rank Fusion, k=60
→ topK
```

同一个 Chunk 在两路命中时会标记 `hybrid` 和 vector / lexical hit modes。

向量没有结果时，词法结果仍可以返回。

## Rerank

真正执行 Rerank 需要：

```text
rerank role configured
+
enabled
+
Provider supports rerank adapter
+
remote model resolves
```

当前支持 topN 和 scoreThreshold。

降级语义：

```text
fallback-no-config
fallback-disabled
fallback-missing-provider-or-model
fallback-provider-call-failed
```

所有 fallback 都继续使用 Retrieval 顺序，不制造本地假分数，也不阻断 Generate。

## Generate 与无来源路径

有来源时：

```text
rerankedChunks
> retrievedChunks
→ LLM Generate
```

没有召回时进入 fallbackAnswer：

- Sources 为空；
- 仍可能调用 LLM；
- 不把无来源回答标记为知识库依据。

知识库没有 enabled 文档时，Chat route 在进入图前直接返回固定无上下文回答。

## Sources 与 Observation

RAG 当前可以记录：

- Rewrite 是否执行；
- Embedding Provider、模型和维度；
- Vector、Lexical 和 Fused candidates；
- matchType 与 hitModes；
- Rerank applied / degraded / finish reason；
- endpoint、参数和耗时；
- 最终 Sources；
- Answer 和 finish reason。

Chat 会把 Sources 持久化到 Assistant Message 的 RAG metadata。

## 三种接入路径

### Chat

```text
Thread knowledgeBaseId
→ full RAG stream
→ Sources
→ persisted answer
```

线程知识库不存在时请求失败；空知识库返回固定无上下文回答。

### Main Agent

```text
Planner retrieve
→ Agent retrieve node
→ Retrieval Evidence
→ Planner continues
```

未绑定知识库时，Agent 记录 partial observation 并跳过。

### 企业集成

```text
WeCom Smart Robot
→ knowledge_query
→ binding knowledgeBaseId
→ non-stream full RAG
→ text reply
```

企业集成当前对无效或缺失 KB 会回退默认知识库；这与 Chat 的失败语义不同。

## 已知实现偏差

### Agent retrieve 多执行 Generate

Agent retrieve 当前使用 `ragRunnableSequence`，不是代码已经存在的 `retrieveOnlyRunnable`。

实际会执行：

```text
rewrite
→ embed
→ retrieve
→ rerank
→ generate
→ discard answer
→ keep sources
```

影响：

- 多一次不必要的模型生成；
- 增加延迟和成本；
- 节点名称与实际 Observation 不完全一致。

### 重建索引没有产品闭环

UI 有确认入口，但当前没有完成的 rebuild API 调用。

切换 Embedding 后，现有索引不会自动修复。

### Add Wizard 过度前置

界面第二步要求 LLM + Embedding；后端索引的直接模型依赖是 Embedding。

### 索引任务不持久

Backend 中断后，没有队列恢复合同。

### KB 级 Embedding 尚未生效

字段存在，实际 Runtime 仍使用全局默认 Embedding role。

### 默认知识库遗留文案

默认描述仍写“单知识库 MVP”，但当前数据与产品均支持多知识库。

## 当前非目标

Knowledge Base 与 RAG Runtime 当前不是：

- 任意格式文档平台；
- durable ingestion workflow；
- multi-KB query planner；
- GraphRAG；
- 长期记忆系统；
- 自动引用事实核验器；
- 专业正确性保证；
- 评测系统本身。

## 相关文档

- [知识库与 RAG](/docs/product/knowledge)
- [模型设置](/docs/configuration/model-settings)
- [Provider 与模型运行时](/docs/architecture/provider-context)
- [Agent 当前运行真相](/docs/architecture/agent)
- [证据优先原则](/docs/philosophy/evidence)
- [当前实现快照](/docs/status/current)
