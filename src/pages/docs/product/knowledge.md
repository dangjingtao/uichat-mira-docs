---
title: 知识库与评测
description: 从文档入库、分段和索引，到检索测试与可复现的质量评测。
group: 产品能力
order: 8
---

# 知识库与评测

Mira 的知识库用于管理需要反复查询和引用的资料。

::: html
<div style="margin: 28px 0; padding: 20px; border: 1px solid var(--hairline, #e6dfd8); border-radius: 16px; background: var(--surface-soft, #f5f0e8);">
  <div style="font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--primary-active,#a9583e); margin-bottom:14px;">Knowledge Base Flow</div>
  <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:10px;">
    <div style="padding:14px; border-radius:12px; background:var(--canvas,#faf9f5); border:1px solid var(--hairline,#e6dfd8);"><strong>01 配置模型</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">准备默认 Embedding</div></div>
    <div style="padding:14px; border-radius:12px; background:var(--canvas,#faf9f5); border:1px solid var(--hairline,#e6dfd8);"><strong>02 创建知识库</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">填写范围与元信息</div></div>
    <div style="padding:14px; border-radius:12px; background:var(--canvas,#faf9f5); border:1px solid var(--hairline,#e6dfd8);"><strong>03 上传文档</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">解析、分段和索引</div></div>
    <div style="padding:14px; border-radius:12px; background:var(--canvas,#faf9f5); border:1px solid var(--hairline,#e6dfd8);"><strong>04 检查质量</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">查看分段与状态</div></div>
    <div style="padding:14px; border-radius:12px; background:var(--canvas,#faf9f5); border:1px solid var(--hairline,#e6dfd8);"><strong>05 测试检索</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">用真实问题验证</div></div>
  </div>
</div>
:::
文件进入知识库后，系统会围绕文档内容建立可检索的数据结构。用户不仅可以在聊天中使用这些资料，还可以查看文档分段、测试检索结果，并通过评测中心检查知识库是否真的能够找到正确内容。

知识库解决的是「AI 可以依据什么资料回答」，它不负责定义角色的人设、语气和行为方式。

## 使用前准备

上传知识库文件之前，需要先配置默认的 Embedding 模型。

Embedding 模型负责把文本转换成可以进行相似度检索的向量。如果当前没有可用的默认 Embedding 模型，Mira 会暂时禁用知识库文件上传入口，并提示用户先完成模型配置。

> Embedding 模型与日常聊天模型不是同一种用途。配置聊天模型并不代表知识库已经具备索引能力。

## 创建和编辑知识库

一个知识库可以包含以下基础信息：

| 字段 | 用途 |
| --- | --- |
| 名称 | 用于识别知识库 |
| 描述 | 说明资料范围与用途 |
| 人格 | 标记知识库适合配合的专业身份，例如医生 |
| 场景 | 标记典型使用场景，例如门诊问答 |
| 标签 | 用于分类和快速识别 |

其中「人格」和「场景」属于知识库元信息，不等同于角色卡。它们用于说明资料的适用背景，不会替代角色的完整提示词定义。

![设置文本分段与清洗参数](/images/knowledge-base/kb-upload-chunking.webp)

*上传流程的第二步用于配置切块方式、长度、重叠、语言预设和文本清洗规则，并实时预览实际分段。*

![知识文档处理完成](/images/knowledge-base/kb-upload-complete.webp)

*处理完成页会给出文件数和文本分块总数，随后即可返回知识库管理页面。*


### 文本分段与清洗

上传流程的第二步提供分段预览。当前界面可以配置：

- 切块方式；
- 最大长度与重叠长度；
- 长度单位；
- 是否保留分隔符；
- 语言预设；
- 自定义分隔符；
- 连续空白替换、URL 与邮箱清理等预处理规则；
- 是否按问答结构分段。

右侧预览会显示抽样分块、分块总数、平均长度、最短块和最长块。这里是上传流程中最值得检查的一步：参数不合适时，应当在正式入库前调整，而不是等检索失败后再排查。

## 管理知识库文件

![知识库文档列表](/images/knowledge-base/kb-list-overview.webp)

*知识库列表集中展示文档状态、分段规模、召回次数和常用管理操作。*


知识库列表用于查看和管理已经入库的文档。

当前页面分为两部分：

- 左侧用于搜索、创建和切换不同知识库，并显示每个知识库的文档数量与更新时间；
- 右侧用于管理当前知识库中的文档，可以按全部、可用和停用状态筛选；
- 文档表格显示名称、更新时间、状态与操作入口；
- 每份文档可以单独启用或停用；
- 页面支持编辑知识库、查看元数据、添加文件、删除所选文档和删除整个知识库；
- 底部汇总当前文件数与文本分块总数；
- 双击文档可以进入详情页。

删除文档后，与该文档相关的分块和索引数据也会一并移除。删除操作不可撤销。

## 查看文档详情与分段

![知识库文档详情与分段预览](/images/knowledge-base/kb-document-detail.webp)

*文档详情同时提供基础信息与真实分段预览，用于检查解析和切分质量。*


进入文档详情后，可以查看：

- 文档 ID；
- 来源与文件类型；
- 创建和更新时间；
- 标签；
- 字符数；
- 分段数量；
- 原始文件大小；
- 当前索引状态；
- 内容摘要；
- 文档分段预览。

分段预览会抽取分布较均匀的真实切分结果，帮助用户快速检查：

- 文档是否被正确解析；
- 标题、段落和列表是否被错误截断；
- 单个分段是否过长或过短；
- 乱码、页眉、页脚等噪声是否进入知识库；
- 重要内容是否仍然保留完整语义。


## 测试检索

文件成功入库不代表实际检索效果一定理想。

「测试检索」用于输入一个问题，观察系统能够召回哪些文档分段。它适合在以下情况下使用：

- 刚上传一批新资料；
- 调整了文档内容或分段方式；
- 用户提问时经常找不到正确资料；
- 检索结果命中了同一文档中的错误段落；
- 准备正式使用某个专业知识库之前。

测试时不要只输入文档标题。更有价值的测试问题，应当接近用户真实会问的自然语言问题。

例如，与其测试：

> 产后康复指南

不如测试：

> 剖宫产后多久可以开始低强度核心训练？


## 知识评测中心



单次检索测试适合快速排查问题；知识评测中心适合用一组样本持续检查效果。

当前评测能力覆盖两类模式：

- **仅检索**：只检查知识库能否召回正确资料；
- **检索 + 生成**：同时检查最终回答是否依据来源、是否切题、是否覆盖关键点。

评测结果可以包含：

| 指标 | 说明 |
| --- | --- |
| Hit@K | 前 K 个结果中是否出现正确内容 |
| Recall@K | 正确内容被召回的覆盖程度 |
| MRR | 正确结果在排序中的位置质量 |
| Faithfulness | 回答是否贴合来源，是否出现无依据扩写 |
| Relevance | 回答是否切题 |
| Completeness | 关键点是否覆盖完整 |
| Source Hit | 是否命中预期来源 |
| Avg Latency | 平均运行耗时 |

评测不是为了追求一个漂亮的总分，而是帮助用户发现资料、分段、检索、重排或回答生成中的具体问题。


## 重建索引

重建索引用于重新执行文档分段、向量化和索引写入。

适合重建的情况包括：

- 更换了 Embedding 模型；
- Embedding 维度发生变化；
- 调整了分段策略；
- 原索引损坏或状态异常；
- 文档内容已经更新，但索引仍然基于旧版本。

> 文档详情页提供「重建索引」入口。执行前应确认当前 Embedding 模型与分段配置，避免无意中改变已有检索结果。

## 正式知识库与 Markdown 工作空间

Mira 内部存在两条容易混淆的资料处理路线：

### 正式知识库

- 文件需要入库；
- 文档会被解析和分段；
- 使用 Embedding 建立向量表示；
- 可以进行检索、RAG 与评测；
- 适合长期积累、跨文件查询和稳定复用。

### Markdown 工作空间

- 直接面向一组 Markdown 文件；
- 不要求把资料写入正式知识库；
- 不依赖 Embedding 索引；
- 更适合轻量浏览、整理、定位和验证项目文档。

两者可以服务相似任务，但不是同一个系统。用户不应为了临时阅读几个 Markdown 文件，被迫建立完整知识库；也不应把需要长期检索和评测的大量资料，仅当作普通文件夹处理。

## 使用建议

- 一个知识库尽量围绕相对清晰的主题或业务范围建立；
- 上传前先删除明显无关的页眉、页脚、广告和重复内容；
- 上传后至少检查一次文档详情和分段预览；
- 使用真实问题测试检索，而不是只搜文件名；
- 专业资料应保留来源、版本与更新时间；
- 高风险领域的知识库回答仍需人工判断，不能把检索结果当作最终专业结论；
- 知识库效果变差时，先判断问题来自资料、解析、分段、检索还是生成，不要立刻更换所有模型。

