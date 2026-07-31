---
title: 角色工作台
description: 角色的真实字段、保存语义、线程绑定、预览限制、生成参数与媒体联动。
group: 产品能力
order: 9
---

# 角色工作台

## 文档范围

角色工作台用于创建和维护可复用的 Role，并把 Role 绑定到 Chat Thread。

当前 Role 由三部分组成：

```text
Prompt Fields
+ Optional LLM Profile
+ UI Metadata
```

Role 负责稳定身份、表达方式和文本约束，不负责保存专业资料、长期记忆、工具权限或模型连接。

![角色提示词工程工作台](/images/roles/role-workbench.webp)

## 当前结论

必须区分：

```text
Role 已保存
!= Role 已绑定到当前 Thread

Role 已绑定
!= 绑定了角色专属模型

Preview 看起来正确
!= 真实请求相同

status = active
!= 已经过实际模型验证
```

Role 的生成参数只覆盖部分采样参数，不选择 Provider 或模型。

## 角色字段

| 字段 | 当前用途 | 是否进入真实 Role Prompt |
| --- | --- | --- |
| 名称 | 列表、线程标签、角色名 | 是 |
| 简介 | 列表摘要和提示 | 否 |
| 头像 | 工作台和 Chat 助手头像 | 否 |
| 状态 | `active / draft` | 否 |
| 标签 | 列表识别，最多三个 | 否 |
| 角色描述 | 身份与背景 | 是 |
| 世界观 | 判断与价值基底 | 是 |
| 人格核心 | 稳定气质与行为方式 | 是 |
| 适用场景 | 工作环境与关系 | 是 |
| 示例对话 | 示例文本 | 是 |
| 表达风格 | 语气、句长和结构 | 是 |
| 约束规则 | 必须与禁止事项的文本说明 | 是 |

`{{user}}` 和 `{{char}}` 当前不会被替换，只会作为普通文本发送给模型。

## 新建角色

点击“新建角色”时，Mira 会立即在后端创建一个 `draft` Role：

```text
点击新建
→ POST /roles
→ SQLite 中产生 draft Role
```

它不是仅存在于页面内的未保存草稿。关闭页面不会自动撤销这条记录。

## 保存语义

### 主保存

工作台主保存会提交名称、简介、标签、头像、Prompt 字段和 LLM Profile，并把状态写为：

```text
active
```

因此当前常规路径是：

```text
新建 = draft
第一次主保存 = active
```

当前没有完整的发布、下架和版本管理流程。

### Prompt 字段抽屉

字段抽屉中的“保存”只把修改写回当前页面草稿。之后仍需点击主保存，内容才会进入后端。

### 模型参数抽屉

模型参数抽屉中的“保存”会立即单独写入后端。

所以可能出现：

```text
模型参数已保存
+ 其他角色字段仍未主保存
```

### 重置

重置只把当前页面恢复到最近加载的后端内容，不创建历史版本，也不能撤销已经单独保存的模型参数。

## 生成参数

Role 当前可以保存：

- Temperature；
- Top P；
- Top K；
- Max Tokens；
- Frequency Penalty；
- Presence Penalty。

这些参数：

- 不选择 Provider Connection；
- 不选择远端模型；
- 不声明 Vision 或 Tool Calling 能力；
- 不替代角色 Prompt。

当前没有统一数值范围校验。远端 Provider 可能忽略不支持的字段，也可能拒绝超出范围的值。

### 当前清除缺口

已保存的单项参数目前不能可靠地通过清空输入删除。

原因是：

```text
清空输入
→ 前端从 PATCH payload 省略该字段
→ 后端与旧 Profile 合并
→ 旧值继续保留
```

因此清空或重置后，应重新打开参数抽屉确认真实保存结果。

## 在 Chat 中使用

### 新 Thread

在线程尚未创建时选择 Role，Role id 暂存在欢迎态。首次发送消息后，Role id 随 Thread 一起保存。

### 已有 Thread

选择或移除 Role 会更新当前 Thread 的 `roleId`。

Role 不会作为可见 System Message 出现在聊天历史中。发送时，后端读取 Role 并生成 request-only system context。

### 修改 Role

Thread 只保存 Role id，不保存 Role 版本快照。

因此修改 Role 后：

```text
所有仍绑定该 Role 的 Thread
→ 下一次请求使用最新 Role 内容
```

旧回复不会重新生成。

## 三种聊天模式

| 模式 | Role Prompt | Role 生成参数 |
| --- | --- | --- |
| 普通 Chat | 生效 | 生效 |
| RAG Chat | 只在 Generate 阶段生效 | 当前不生效 |
| Agent Chat | 进入 Agent request context | 传入 Agent Runtime |

Role 不进入 RAG 的 Query Rewrite、Embedding、Retrieve 或 Rerank。

Role 约束是 Prompt 文本，不是 Harness Policy。它不能增加工具权限、跳过审批或改变 Agent 的终止合同。

## `active` 与 `draft`

Chat 角色选择器只列出 `active` Role，但后端请求注入当前不检查状态。

所以当一个已绑定 Role 被 API 改成 `draft` 时，可能出现：

```text
界面不再显示角色标签或头像
+ 后端仍继续注入该 Role
```

这是当前实现偏差。不要只根据界面标签判断真实请求是否仍带有 Role。

## Preview 的真实含义

### Prompt Preview

Prompt Preview 是前端根据当前编辑字段手工拼出的说明文本，不读取后端真实请求快照。

### Chat Preview

Chat Preview 是前端固定模板生成的示例回复，不会调用模型。

因此：

```text
Preview
= 编辑辅助
!= 实际 Request
!= 实际模型回复
!= Provider 能力测试
```

Preview 还会展示“简介”，但真实 Role system prompt 当前不使用简介。

验证 Role 必须回到真实 Chat，并在目标模型下发送测试消息。

## 头像、TTS 与图片

### 头像

当前 Role 头像来自内置头像包，不支持在角色工作台上传自定义头像。

### TTS

TTS 不由 Role 选择 Provider 或声音。Role 只影响文字内容，回答成功后再由 TTS Runtime 合成音频。

### 图片生成

当前选择 Role 时，如果 Thread 没有绑定 Knowledge Base，桌面端会自动打开图片生成开关。

自动图片生成需要：

```text
imageEnabled = true
+ 已绑定 Role
+ 未绑定 Knowledge Base
+ Image capability 已配置
```

回答成功后，Assistant 文本会直接作为图片 Prompt。配置远端图片 Provider 时，这可能产生额外任务、等待和费用。

解绑 Role 后不会继续自动生成图片，但 Thread 中的 `imageEnabled` 值可能仍然保留。

## 删除角色

删除 Role 会：

```text
删除 Role
→ 已绑定 Thread 的 roleId 变为空
→ Thread 与 Messages 保留
```

它不会像当前删除非默认 Knowledge Base 那样级联删除对话。

删除 Role 不会自动清除 Thread Context Summary。如果 Summary 中已经沉淀了旧角色语气，后续回复仍可能保留少量旧语境。

## 当前没有的能力

当前工作台没有：

- 复制 Role；
- 导入或导出 Role；
- Role 版本历史；
- 每个 Thread 固定 Role 快照；
- 角色继承；
- 角色专属 Provider 或模型；
- 角色专属知识库；
- 角色级长期记忆；
- 动态成长状态；
- Tool Policy；
- 真实模型 Preview；
- 真实 Request Snapshot；
- 完整发布与下架流程。

## 验证清单

1. 新建后确认列表中已经产生 draft Role；
2. Prompt 字段修改后执行主保存；
3. 单独保存模型参数后检查其他字段是否仍未保存；
4. 在真实 Chat 中验证角色行为；
5. 普通 Chat、RAG 和 Agent 分别验证参数差异；
6. 选择 Role 后检查图片开关与可能费用；
7. 删除 Role 后确认 Thread 与消息仍保留；
8. 不把 Preview 当成模型测试结果。

## 相关文档

- [Role Runtime 与请求上下文](/docs/architecture/role-runtime)
- [对话工作区](/docs/product/workspace)
- [Chat 与 UChat Runtime](/docs/architecture/chat-runtime)
- [模型设置](/docs/configuration/model-settings)
- [知识库与 RAG](/docs/product/knowledge)
- [Agent 当前运行真相](/docs/architecture/agent)
