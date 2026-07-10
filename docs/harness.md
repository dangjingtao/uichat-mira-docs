---
title: Harness 与工具
description: 把复杂度藏在正确的地方。
group: 核心系统
order: 5
---

# Harness 与工具

Harness 不只是工具列表。它理解环境、收敛候选、执行审批，并用稳定能力语义保护 Planner 不被实现细节淹没。

## 工具能力面

| 能力 | 核心语义 | 治理边界 |
| --- | --- | --- |
| Read | 定位、打开、提取、切片 | 已知目标优先，宽泛 `read` 仅作降级 |
| Edit | 受控写入与块级替换 | 预演与旧文本校验 |
| Search | 统一 Web 研究入口 | 供应商参数由 Harness 隐藏 |
| Terminal | 进程与会话执行 | 强审批、超时、沙箱与流式观察 |

## Read 语义

`read_locate` 用于寻找目标，`read_open` 打开已知目标，`read_extract` 做针对性提取。`read_slice` 不作为普通用户意图的第一选择。

