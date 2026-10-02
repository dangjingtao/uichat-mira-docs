---
title: 评测工作台
description: 从 Knowledge Base 生成或上传评测包，校验 Dataset，运行检索或 RAG 评测，并正确解释结果。
group: 产品能力
order: 9
---

# 评测工作台

## 文档范围

本页说明如何完成一次当前 Mira Evaluation 闭环：

```text
准备 Knowledge Base 与模型
→ 生成或上传 Evaluation ZIP
→ 检查 Dataset 校验
→ 启动 Run
→ 查看 Sample / Sources / Logs
→ 导出 Markdown 报告
```

Evaluation 用于定位检索、生成和稳定性问题。它不自动证明专业结论正确，也不是上线 Gate。

## 前置条件

开始前至少需要：

- 一个存在且包含 `ready + enabled` 文档的 Knowledge Base；
- 可用的 Embedding 模型；
- 可用的主模型 `llm`；
- 需要自动生成评测包时，额外配置 `evaluation` 模型；
- 需要 Rerank 时，配置可用 Rerank 模型。

当前 `evaluation` 模型只用于生成评测样本：

```text
Knowledge Base Chunk
→ question
→ expectedAnswer
→ tags
```

它不承担 Run 的 LLM Judge。Faithfulness、Relevance 和 Completeness 当前由本地词项重合启发式计算。

模型配置见：[模型设置](/docs/configuration/model-settings)。

## 产品入口

进入：

```text
设置
→ 评测中心
```

评测中心用于：

- 查看历史 Run；
- 搜索 Run、Dataset 或 Knowledge Base；
- 查看详情；
- 导出 Markdown；
- 删除已结束 Run。

点击“新建评测”进入工作台。

## 完成标准

一次评测不能只看“Run 已完成”。完整验收至少包括：

```text
Dataset 无 validation error
→ Run 实际进入 running
→ Sample Results 持续产生
→ Sources 对应当前 Knowledge Base
→ 失败样本已检查
→ 指标按当前算法解释
→ 报告可以导出
```

以下状态不能互相替代：

```text
ZIP 已生成
!= Dataset 已通过校验

Run completed
!= 指标是标准学术实现

分数较高
!= 真实业务已经通过验收
```

## 路径一：生成评测包

在新建评测页打开评测包生成器。

### 1. 选择 Knowledge Base

目标 Knowledge Base 必须存在，并至少包含一个 `ready + enabled` 文档。

生成器会根据当前 ready 文档和 Chunk 数显示可用范围。

### 2. 选择 Preset

当前提供：

| Preset | 用途 |
| --- | --- |
| Fast | 小样本快速冒烟 |
| Balanced | 日常回归 |
| Strict | 更大样本与 Repeat |

Preset 只是参数起点，不是质量等级证明。

### 3. 检查参数

主要参数：

| 参数 | 作用 |
| --- | --- |
| Sample Count | 生成多少问题 |
| Document Count | 从多少文档中抽样 |
| Chunks per Document | 每份文档候选 Chunk 数 |
| Mode | 只检索或检索 + 生成 |
| topK | 初始召回数量 |
| topN | 最终保留数量 |
| Repeat | 每条样本重复次数 |
| Concurrency | 同时处理的 Sample worker 数 |
| Timeout | 每次 Attempt 的等待上限 |

服务端当前会限制自动生成参数：

- Sample Count：1–100；
- Chunks per Document：1–20；
- Concurrency：1–10；
- Timeout：5–300 秒；
- topK：1–50；
- topN：1–20；
- Repeat：1–10。

当前 Strict preset 在界面中可能显示 600 秒，但服务端会把生成包中的 Timeout 限制为 300 秒。

### 4. 生成人工可审阅的 ZIP

生成器会随机抽取文档和 Chunk，并调用 `evaluation` 模型生成 JSON 样本。

生成成功证明模型返回了可解析且不重复的问题，但不能证明参考答案一定正确。运行前应人工检查 Sample 预览。

### 5. 注意语料快照边界

自动生成 ZIP 的 `documents/*` 只是同名占位文件，不包含真实知识库正文。

```text
Evaluation ZIP
!= Frozen Knowledge Base Snapshot
```

同一个 ZIP 运行时仍查询当前本机 `knowledgeBaseId`。文档、Chunk、模型或 RAG Runtime 变化后，结果会变化。

## 路径二：上传评测包

工作台当前只接受：

```text
一个 .zip 文件
最大 100 MB
```

推荐结构：

```text
manifest.json
evalset.json
documents/*
```

Dataset 中至少需要：

- 有效 `knowledgeBaseId`；
- 至少一个 documents 条目；
- 至少一条非空 question；
- 无 validation error。

详细格式见：[Evaluation Runtime 与指标语义](/docs/architecture/evaluation-runtime)。

## 校验结果

当前校验包括：

| 校验 | Error | Warning |
| --- | --- | --- |
| 包结构 | 缺少 manifest、documents 或有效 Sample | 无 |
| Reference Answer | 无有效 Sample | 部分或全部缺失参考答案 |
| Gold Sources | 无有效 Sample | 部分或全部缺失 Gold Source |
| Knowledge Base | ID 缺失或当前实例不存在 | 无 |

规则：

```text
存在 error
→ 不能启动 Run

只有 warning
→ 可以运行，但部分指标解释能力下降
```

Gold Source 当前必须填写 RAG 返回的准确 `documentName`。系统只做 trim 和 lowercase 后的精确名称匹配，不做语义或模糊匹配。

## Dataset 预览

上传后可以查看：

- Dataset 名和文件信息；
- Knowledge Base；
- mode / topK / topN / Repeat；
- Document 和 Sample 数；
- documents 清单；
- 前四条 Sample；
- 校验结果。

预览不展示完整 Dataset，也不会读取 ZIP documents 正文作为运行语料。

## 启动 Run

点击运行后：

```text
Run queued
→ Backend 进程内调度
→ Run running
→ Sample workers 执行
→ completed 或 failed
```

工作台大约每 1.5 秒读取一次 Run 状态。

`queued` 不是 durable job queue；Backend 重启后当前不会自动续跑。

## 两种模式

### Retrieve

目标是只检查 Sources 和检索指标。

但当前底层仍执行完整 RAG Graph，包括 Generate，再丢弃 Answer。因此当前 Retrieve 模式可能产生额外 LLM 延迟和成本。

在该模式中：

```text
Faithfulness = 0
Relevance = 0
Completeness = 0
```

这里的 0 表示“当前不评估”，不是生成质量为零。

### Retrieve + Generate

执行检索、可选 Rerank 和回答生成，并计算当前生成启发式分数。

## 日志与进度

日志中可以检查：

- Dataset 加载与校验；
- Run 创建和启动；
- Worker、Sample 和 Repeat；
- 命中、耗时和错误；
- 最终汇总。

Run 最多保存 200 条日志。进度条是基于已完成 Sample 数的估算，不是底层每个 RAG Node 的精确进度。

## Sample 与 Repeat

每条 Sample 可以重复执行多次。

当前规则：

- 成功 Attempt 的分数和耗时取平均；
- 任一成功 Attempt 命中，Sample 的 hit 为 true；
- 展示 Recall 更高、命中更好、耗时更低的最佳 Attempt；
- 只要任一 Repeat 失败，Sample 最终状态就是 failed；
- 任一 Sample failed，Run 最终状态就是 failed。

因此：

```text
Run failed
!= 所有 Sample 都失败
```

必须打开 Sample 详情和 failed count 一起判断。

## 当前指标怎么读

| 指标 | 当前适合的解释 |
| --- | --- |
| Hit@K | 至少命中一个 Gold documentName 的 Sample 比例 |
| Recall@K | Gold documentName 的覆盖率 |
| MRR | 当前历史近似值，不是真实首个正确来源排名倒数 |
| Faithfulness | Answer 与 Retrieved Sources 的词项重合 |
| Relevance | Answer 与 Question / Reference 的词项重合 |
| Completeness | Reference tokens 在 Answer 中的覆盖 |
| Source Hit Rate | 当前实质与 Hit@K 同义 |
| Average Latency | Sample 总耗时，不是纯检索节点耗时 |
| Failed Count | 最终 status=failed 的 Sample 数 |

当前没有 RAGAS、LLM Judge、人工评分、统计显著性或 Token / Cost 指标。

完整算法见：[Evaluation Runtime 与指标语义](/docs/architecture/evaluation-runtime)。

## 评测中心

Run 结束后，评测中心支持：

- 查看历史记录；
- 客户端搜索；
- 查看 Sample、Attempt、Sources 和日志；
- 导出 Markdown；
- 删除单条或批量删除。

当前没有：

- 分页；
- Run Compare；
- Baseline；
- Retry；
- Cancel / Pause / Resume；
- Dataset 管理；
- Release Gate。

排队中或运行中的 Run 不能删除。

## Markdown 报告

报告在桌面客户端根据当前 Run JSON 即时生成，可以包含：

- 配置和校验；
- 指标表；
- Sample 与 Sources；
- 日志；
- 风险建议；
- Mermaid 图和加权概览。

加权概览只存在于当前前端报告代码，不保存在 Run，也不是服务端质量合同。旧 Run 以后重新导出时会使用届时最新的报告算法和文案。

## 常见问题

### Run 一直停在 queued 或 running

Backend 如果在运行期间重启，当前记录会保持原状态，但不会重新排队或恢复。当前删除 API 又不允许删除这两种状态。

这是已知生命周期缺口，不表示工作仍在后台继续。

### Timeout 后资源仍占用

当前 Timeout 通过 `Promise.race` 返回失败，没有取消底层 RAG 或 Provider 请求。底层调用可能继续执行。

### 同一个 ZIP 两次分数不同

可能原因：

- Knowledge Base 内容变化；
- Embedding、Rerank 或 LLM 变化；
- RAG Runtime 变化；
- 模型随机性；
- 自动包最初没有冻结语料；
- Repeat 和并发差异。

### MRR 与其他系统差很多

Mira 当前 `mrr` 不是标准 rank MRR，不能与外部基准直接比较。

## 验证清单

- [ ] Knowledge Base 当前存在且资料版本已记录；
- [ ] Embedding 和 LLM 真实可用；
- [ ] 自动 Sample 已人工预览；
- [ ] Dataset 没有 validation error；
- [ ] Gold Source 使用准确 documentName；
- [ ] Run 实际产生 Sample Results；
- [ ] failed Sample 已逐条检查；
- [ ] Sources 与问题相关；
- [ ] 指标按当前启发式解释；
- [ ] 报告未被当作版本化服务端 Artifact；
- [ ] 分数没有被直接当作上线或专业正确性证明。

## 相关文档

- [模型设置](/docs/configuration/model-settings)
- [知识库与 RAG](/docs/product/knowledge)
- [Knowledge Base 与 RAG Runtime](/docs/architecture/knowledge-rag)
- [Evaluation Runtime 与指标语义](/docs/architecture/evaluation-runtime)
- [当前实现快照](/docs/status/current)
