---
title: Evaluation Runtime 与指标语义
description: Evaluation Package、Dataset、Run、Sample、启发式指标、SQLite 持久化与客户端报告的当前边界。
group: 架构
order: 24
---

# Evaluation Runtime 与指标语义

## 文档范围

本页说明当前 Evaluation 的状态持有者、运行链和指标算法。

```text
Evaluation Package
→ Parsed Dataset
→ Evaluation Run
→ Sample Attempts
→ Metric Summary
→ Client-side Markdown Report
```

这些对象不是同一层：

```text
Package
!= Frozen Corpus

Run Persisted
!= Durable Job

Metric Name
!= Standard Algorithm

Markdown Report
!= Server Artifact
```

## 产品入口与 Runtime

桌面端有两个入口：

| 入口 | 当前职责 |
| --- | --- |
| 新建评测 | 包生成、ZIP 上传、Dataset 校验、Run 启动、日志和结果 |
| 评测中心 | Run 列表、搜索、详情、Markdown 导出和删除 |

后端主要对象：

| 对象 | 状态持有者 |
| --- | --- |
| Parsed Dataset | Evaluation Service 内存 + SQLite |
| Complete Samples | Evaluation Service 内存 + SQLite JSON |
| Evaluation Run | Evaluation Service 内存 + SQLite JSON |
| 执行调度 | 当前 Backend 进程 |
| Markdown Report | 当前桌面客户端 |

## HTTP 接口

当前公开路由：

```text
POST   /evaluation/packages/generate
POST   /evaluation/datasets/parse
GET    /evaluation/runs
GET    /evaluation/runs/:runId
POST   /evaluation/runs
DELETE /evaluation/runs/:runId
POST   /evaluation/runs/batch-delete
```

当前没有 Dataset 管理、Run Cancel、Retry、Resume、Compare 或服务端 Report API。

## Evaluation Package

推荐结构：

```text
manifest.json
evalset.json
documents/*
```

Manifest 主要保存：

```text
datasetName
knowledgeBaseId
mode
topK
topN
repeat
concurrency
timeoutSeconds
```

Sample 主要保存：

```text
id
question
expectedAnswer / referenceAnswer
goldSources
tags
```

### Gold Source 匹配

当前只做：

```text
trim(lowercase(retrieved documentName))
===
trim(lowercase(goldSource))
```

不支持 Document ID、Chunk ID、模糊名称或语义匹配。

### Documents 条目的真实用途

Parser 只记录 documents 名称和大小。它不会读取正文用于评测，也不会把文件导入 Knowledge Base。

自动生成 ZIP 中 documents 内容是固定占位文本。因此当前 ZIP 不能在另一实例中独立重建相同语料和索引。

## Package Generator

自动生成器：

```text
ready + enabled documents
→ 随机选择 documents / chunks
→ evaluation role 生成 JSON Sample
→ 校验字段和重复 question
→ 写 ZIP
```

`evaluation` role 当前只用于 Sample Generation，不在 Run 中做 Judge。

当前没有固定随机 seed、单条重试、自动事实校验或人工审批步骤。

## Dataset Parser

上传条件：

- 单个 `.zip`；
- 最大 100 MB；
- 完整读入内存。

Parser 查找：

```text
manifest.json

evalset.json
或 evalset/evalset.json
或 dataset/evalset.json

documents/*
```

校验结果分为：

- pass；
- warning；
- error。

任一 error 阻止 Run。Reference Answer 或 Gold Source 缺失通常只产生 warning。

Dataset 会立即写入 SQLite。当前没有 Dataset list / delete 入口，因此重复解析和删除 Run 后可能留下孤立 Dataset。

## Run 生命周期

```text
POST /evaluation/runs
→ status=queued
→ persist
→ queueMicrotask(executeRun)
→ status=running
→ Sample workers
→ completed / failed
```

`queued` 是当前进程内事件循环调度，不是持久队列。

Run 支持：

- Sample concurrency；
- Repeat；
- Attempt timeout；
- 持续 Sample / Metric / Log 持久化；
- 最多 200 条日志。

Run 不支持：

- Cancel；
- Pause；
- Resume；
- Checkpoint；
- 独立 Worker；
- 全局资源预算。

## 两种执行模式

### Retrieve

Evaluation 调用名义上的 `retrieveOnly` 路径。

但当前 `ragGraph.retrieve()` 仍运行完整图：

```text
rewrite
→ embed
→ retrieve
→ rerank / fallback
→ generate
```

最后只返回 Sources，丢弃 Answer。

因此当前 Retrieve 模式仍可能依赖 `llm` 并产生 Generate 延迟和成本。生成指标在该模式中固定为 0，表示当前不评估，而不是质量为零。

### Retrieve + Generate

执行完整 RAG，并保存最终 Answer 和 Sources。

Run 不保存完整 RAG Node breakdown、Vector / Lexical 分路、RRF 明细、Rerank degraded 状态、Provider Observation、Token 或 Cost。

## 模型依赖

| 模型角色 | 当前用途 |
| --- | --- |
| `evaluation` | 自动生成 question、expectedAnswer、tags |
| `embedding` | 查询向量化 |
| `rerank` | 可选重排 |
| `llm` | Answer Generate；当前 Retrieve 模式也会因实现漂移调用 |
| `task` | 只有需要根据对话历史改写 Query 时才使用；当前评测通常不带历史 |

当前没有 Judge Model。

## Sample 与 Attempt

同一 Sample 的 Repeat 顺序执行。

成功 Attempt 记录：

- Hit / Recall；
- Sources；
- Answer；
- 三个生成启发式分数；
- Latency。

失败 Attempt 记录错误和实际耗时。

Sample 聚合：

- 成功 Attempt 的数值取平均；
- 任一成功 Attempt 命中，Sample Hit 为 true；
- 最佳 Attempt 按 Recall、Hit、Latency 选择；
- 任一 Attempt 失败，Sample status 仍为 failed。

Run 聚合：

```text
任一 Sample failed
→ Run failed
```

因此 failed Run 仍可能包含大量成功结果。

## Timeout

当前 Timeout 使用：

```text
Promise.race(ragCall, timeoutRejection)
```

没有把 AbortSignal 传递给底层 Provider。

```text
Attempt 已超时
!= 底层请求已取消
```

全部 Attempt 失败时，Sample latency 使用配置 Timeout，而不是实际失败耗时平均。

## SQLite 持久化

表：

```text
evaluation_datasets
evaluation_runs
```

Dataset、Samples 和 Run 以 JSON 快照保存。

当前没有 `userId` 字段。它适用于当前本地单实例，不构成未来服务器多用户隔离合同。

### Backend 重启

启动时会 hydrate Dataset 和 Run JSON，但不会恢复执行。

```text
running / queued Run
→ Backend restart
→ 状态仍为 running / queued
→ 不重新排队
→ 当前 API 又拒绝删除
```

这会产生永久卡住的 Run，是当前最高优先级的生命周期缺口之一。

## 指标基础

当前 Gold Source 匹配只基于 documentName。

### Hit@K

```text
至少命中一个 Gold documentName 的 Sample 数
/
全部 Sample 数
```

不检查首次命中排名，也不检查命中 Chunk 是否足以回答问题。

### Recall@K

```text
命中的唯一 Gold documentName 数
/
Gold documentName 总数
```

Sample 多 Repeat 时先平均成功 Attempt，再对全部 Sample 聚合。

### MRR

当前不是标准 Mean Reciprocal Rank。

每条 Sample 当前贡献：

```text
hit ? max(recall, 1/3) : 0
```

代码没有读取首个正确来源的实际排名。该字段应理解为历史近似值，不能与外部 MRR 直接比较。

### Source Hit Rate

当前：

```text
sourceHit = hit
```

所以 Source Hit Rate 在聚合结果中实质与 Hit@K 同义，不是返回来源中 Gold 来源所占比例。

## 生成启发式指标

当前没有 LLM Judge。Tokenization 主要是：

```text
lowercase
→ 按非英文数字和非中文字符切分
→ unique token set
```

### Faithfulness

```text
Answer tokens 中出现在 Retrieved Sources 的比例
```

Answer 为空时，当前代码会使用 `expectedAnswer` 作为计算 basis。

它只能反映词项重合，不能检查逻辑、数字、否定关系、证据支持或幻觉。

### Answer Relevance

```text
Question / Answer token overlap * 0.6
+
Expected Answer / Answer token overlap * 0.4
```

没有 expectedAnswer 时，第二项回退为 Question overlap。

### Answer Completeness

```text
Expected Answer tokens 被 Answer 覆盖的比例
```

它不惩罚错误或多余内容，也不能识别同义表达。

## Average Latency 与 Failed Count

Average Latency 是 Sample 总耗时平均，不是纯 Retrieval 延迟。

当前 Retrieve 模式中的额外 Generate 也计入其中。

Failed Count 统计最终 Sample status=failed。由于任一 Repeat 失败都会让 Sample failed，它同时包含部分成功和完全失败的样本。

## Aggregate 边界

检索指标对全部 Sample 聚合，失败 Sample 以 0 进入分母。

生成指标只对最终 status=success 的 Sample 聚合。因此有一个 Repeat 失败但其余成功的 Sample，会被排除在生成指标平均之外。

## Markdown Report

报告由桌面端即时生成，不是服务器 Artifact。

客户端还计算一套硬编码权重的加权平均，并对 Latency 与 Failed Count 做前端归一化。

该分数：

- 不保存到 Run；
- 没有 algorithm version；
- 不是 Runtime 成功标准；
- 可能在未来导出同一旧 Run 时改变。

报告中的 Mermaid、风险建议和指标解释也属于当前客户端代码。

## 当前偏差与影响

| 严重度 | 当前偏差 | 影响 |
| --- | --- | --- |
| 高 | queued / running 重启后不恢复且不能删除 | Run 可永久卡住 |
| 高 | 指标名称强于算法 | 容易误当标准 RAG 评测 |
| 中 | Retrieve 仍执行 Generate | 额外模型依赖、延迟和成本 |
| 中 | ZIP 不冻结语料 | 跨时间和跨实例不可严格复现 |
| 中 | Timeout 不取消底层调用 | 超时后资源可能继续占用 |
| 中 | Dataset 无管理入口 | 数据可能持续积累 |
| 中 | 任一 Repeat 失败令 Run failed | 总状态掩盖部分成功 |
| 低 | Strict 600 秒被 clamp 为 300 秒 | UI 与 manifest 不一致 |
| 低 | Report weighted score 未版本化 | 旧 Run 解释可能变化 |

## 当前非目标

Evaluation 当前不是：

- RAGAS；
- LLM-as-a-Judge；
- 研究型标准基准；
- 模型排行榜；
- Release Gate；
- Experiment Tracking 平台；
- Durable Worker 系统；
- 跨实例自包含评测包；
- 专业正确性证明。

## 相关文档

- [评测工作台](/docs/product/evaluation)
- [知识库与 RAG](/docs/product/knowledge)
- [Knowledge Base 与 RAG Runtime](/docs/architecture/knowledge-rag)
- [模型设置](/docs/configuration/model-settings)
- [当前实现快照](/docs/status/current)
