---
title: Mira Agent Core Benchmark
description: Mira Agent Core Benchmark v0.1 的公开入口：冻结题库、测试方法、正式结果与可追溯来源。
group: Agent Benchmark
order: 40
---

# Mira Agent Core Benchmark
Mira Agent Core Benchmark 用于测试 Mira 在真实 Agent 工作中能否**完成任务、保持自主、稳定重复、遵守治理边界**。

它不是单一总分排行榜，也不是 Mira 自己给自己写的演示题。官网只展示公开投影；评分合同、冻结题库与原始 artifacts 仍由 canonical repository 持有。

## 当前版本

| 项目 | 当前值 |
| --- | --- |
| Benchmark | v0.1 |
| Case set | core-v0.1 |
| Case set 状态 | frozen |
| 冻结题库 | 25 题：Beginner 9 / Intermediate 8 / Advanced 8 |
| 正式自动计分 | 17 题 |
| Diagnostic / untimed | 8 题 |
| Formal run 日期 | 2026-10-04 |
| Formal run 状态 | **incomplete** |
| 完整计分 case | 16/17 |

当前 Formal run 为 **incomplete**：ADV-02 的一个 deterministic criterion 需要 recoverable-vs-terminal failure classification，但冻结证据无法机械提供该事实，因此完整 17 题 headline 保持为空。官网不会拿 16 题均值冒充完整 Benchmark 总成绩。

## 从这里开始

- [正式题库](./cases/)：查看 25 个冻结 case 的公开题面、意图、计分参与方式与 timing。
- [测试方法](./method/)：了解 3 次 repetition、canonical/adapted/noncanonical、四个主指标、timeout 与 Judge 边界。
- [正式结果](./results/)：查看当前 Formal run 的实验身份、case/tier 结果与 incomplete 原因。

## 为什么不发布一个总分

Core v0.1 固定报告四个主指标：

- **Task Success**：任务接受条件实际完成了多少，并应用 timing credit；
- **Autonomy**：Mira 是否需要额外任务求解帮助；
- **Reliability**：同一题重复 3 次时能否稳定 on-time pass；
- **Governance**：是否遵守用户限制、approval 与受控边界。

四个指标不会再压成一个“漂亮总分”。如果某个正式 case 因证据缺口成为 incomplete_case，benchmark-level headline 会 fail closed，而不是缩小分母。

## Canonical source

本页由 machine-readable public snapshot 自动生成，来源固定到：

- Repository: [uichat-mira/mira-desktop](https://github.com/uichat-mira/mira-desktop)
- Source commit: [bcb79fafa5b7e98e82d4f830df4112d6ce9c07a0](https://github.com/uichat-mira/mira-desktop/commit/bcb79fafa5b7e98e82d4f830df4112d6ce9c07a0)
- [Benchmark contract](https://github.com/uichat-mira/mira-desktop/blob/bcb79fafa5b7e98e82d4f830df4112d6ce9c07a0/docs/development/agent-core-benchmark-v0.1.md)
- [Frozen case set](https://github.com/uichat-mira/mira-desktop/blob/bcb79fafa5b7e98e82d4f830df4112d6ce9c07a0/docs/development/agent-core-benchmark-v0.1-case-set.json)
- [Formal public result](https://github.com/uichat-mira/mira-desktop/blob/bcb79fafa5b7e98e82d4f830df4112d6ce9c07a0/docs/development/benchmark-artifacts/formal-core-v0.1-2026-10-04/public-result.json)
- [Formal report](https://github.com/uichat-mira/mira-desktop/blob/bcb79fafa5b7e98e82d4f830df4112d6ce9c07a0/docs/development/benchmark-artifacts/formal-core-v0.1-2026-10-04/report.md)

官网是公开展示层，不覆盖这些 canonical sources。
