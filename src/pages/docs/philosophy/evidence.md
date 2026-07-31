---
title: 证据优先原则
description: Evidence、Artifact、完成判断和失败记录的统一要求。
group: 产品哲学
order: 6
---

# 证据优先原则

## 原则定义

Mira 不把模型表述、计划状态或界面提示当作任务完成证据。

可用于支持结论的事实必须来自可追踪来源，并进入 AgentRun、Tool Invocation、检索记录、Evaluation Result 或 Artifact 等稳定结构。

```text
模型说“完成”
!= 任务已经完成
```

## Evidence 来源

| 来源 | 可证明的内容 | 不能单独证明的内容 |
| --- | --- | --- |
| 用户输入 | 用户目标、约束和已提供事实 | 外部状态已经改变 |
| Retrieval Result | 找到了哪些文档片段及来源 | 片段中的要求已经被执行 |
| Tool Result | 具体调用返回了什么 | 用户全局目标已经覆盖 |
| SubAgent Result | 局部工作包的结果与未完成项 | Parent 任务整体完成 |
| Artifact | 文件、图片、音频、报告等产物存在 | 产物内容一定正确 |
| Evaluation Result | 在给定数据集和指标下的表现 | 所有真实场景均通过 |
| Runtime Status | 某个服务或进程当前状态 | 未来持续可用 |
| Documentation | 已核验合同与边界 | 未验证代码已经实现 |

## Evidence 流程

Agent 主线中的事实流为：

```text
Retrieve / Tool / Child Runtime
→ Raw Observation
→ Evidence Accumulation
→ Main Planner Completion Check
→ Frozen Finalization Packet
→ Generate / Finalize
```

执行节点只返回事实和失败状态，不负责替用户宣布最终完成。

## 两种判断

### Evidence answerable

当前证据是否足以支持某个回答或说明。

例如：

- 已读取目标文件；
- 已获得 API 返回；
- 已找到相关文档；
- 已记录失败原因。

### Task completed

用户请求的所有必要目标是否已经完成。

例如：

- 不只是找到文件，还完成了修改、验证和交付；
- 不只是创建 PR，还确认检查通过并按要求合并；
- 不只是生成 Artifact，还检查内容和格式符合要求。

只有 Main Planner 或明确的确定性 Controller 可以根据全局目标判断完成。

## 失败也是 Evidence

以下结果不能被吞掉或改写成笼统成功：

- 权限不足；
- 等待审批；
- 运行时未安装；
- Provider 不可用；
- 参数校验失败；
- 超时或网络错误；
- 结果为空；
- Artifact 未生成；
- Verification 不通过；
- Child 返回 recoverable 或 terminal failure。

失败记录至少应包含：

```text
operation / toolId
input summary
failure stage
error code or message
retryability
user impact
next allowed action
```

## Artifact 要求

Artifact 是 Evidence 的一种，但还需要独立验证：

1. 文件或资源真实存在；
2. 路径或引用可访问；
3. 类型和扩展名正确；
4. 内容满足任务要求；
5. 生成过程没有被失败状态覆盖；
6. 用户获得明确的交付入口。

只返回一个文件名或预期路径，不等于已经产生 Artifact。

## 文档中的证据规则

公开文档必须区分：

| 状态 | 说明 |
| --- | --- |
| Current | 已由当前代码、测试或重复验证支持 |
| Partial | 已有部分实现，缺少完整入口、合同或验证 |
| Experimental | 有真实代码或入口，但仍可能变化 |
| Planned | 目标或设计，不代表已经实现 |
| Historical | 仅用于解释过去，不回答当前行为 |

文档中不得使用未来时态或设计目标冒充当前实现，也不得因为当前代码发生回归就静默修改 settled contract。

## 完成声明要求

最终回答或文档声明“完成”前，应确认：

- 用户目标是否逐项覆盖；
- 所有需要的 Tool / Runtime 是否真实执行；
- 写操作是否回读验证；
- Artifact 是否可访问；
- 已知失败和未完成项是否明确说明；
- Evidence 是否能支持最终表述。

## 非目标

证据优先不意味着：

- 所有内部推理都向用户公开；
- 每个简单回答都需要复杂 Trace；
- Tool Result 永远可信且无需验证；
- 生成了日志就自动满足审计；
- 文档可以替代真实运行验收。

## 相关文档

- [Agent 当前运行真相](/docs/architecture/agent)
- [Harness 与工具边界](/docs/architecture/harness)
- [知识库与评测](/docs/product/knowledge)
- [当前实现快照](/docs/status/current)
