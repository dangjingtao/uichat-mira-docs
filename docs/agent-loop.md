---
title: Agent Loop
description: Planner 是循环的控制者。
group: 产品架构
order: 4
---

# Agent Loop

当前稳定主循环：

```text
Planner → Normalize → Policy → ToolNode → Evidence → Planner
```

目标不是继续扩张 Graph，而是确保每次工具执行都回到 Planner，由它依据目标覆盖度决定继续、恢复或回答。

## 关键语义

> `evidence answerable` 不等于 `task completable`。

证据能解释局部结果，并不意味着用户目标已经完成。Planner 在回答前必须检查请求中的关键目标是否已被覆盖。

## 失败合同

- **Recoverable**：允许恢复；恢复耗尽后生成受保护回答。
- **Terminal**：Graph 失败，Generate 不执行。

