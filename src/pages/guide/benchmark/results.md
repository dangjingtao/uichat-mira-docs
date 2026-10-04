---
title: Agent Core Benchmark v0.1 正式结果
description: 2026-10-04 Formal run：51 个 valid comparable repetitions、16/17 case complete，ADV-02 因观测缺口为 incomplete_case。
group: Agent Benchmark
order: 43
---

# Agent Core Benchmark v0.1 正式结果

## 结论先说

当前 Formal run 状态：**incomplete**。

- 正式 repetitions：51/51 valid comparable；
- invalid：0；
- noncanonical：0；
- 完整计分 case：16/17；
- incomplete case：1；
- hard-fail：1；
- late completion：0。

**17 题 canonical headline 不发布。** ADV-02 的 C1 依赖 recoverable-vs-terminal failure classification，而冻结 execution evidence 没有机械可判的 failureKind。因此 Task Success / Autonomy / Reliability / Governance 的 benchmark-level headline 都保持 null。

## 实验身份

| 字段 | 值 |
| --- | --- |
| Run date | 2026-10-04 |
| Mira version | 0.102.0 |
| Mira commit | 43c4c6a84ef7b8dc191c1dc9c8284c85d6d3a5bf |
| Host | darwin x64 |
| Runtime | desktop-local-backend |
| Execution mode | adapted |
| Semantic Judge repetitions | 30 |

Provider / model 记录：

- volcengine/deepseek-v4.1-flash：47 repetitions
- unknown/unknown：4 repetitions

unknown/unknown 表示对应 cancelled / waiting-user 路径没有可验证的 provider/model identity；公开结果不猜测补齐。

## 16 个 complete cases 的描述性视图

下面这些数字**只描述 16 个 complete cases**，不是完整 17 题 headline：

| Tier | Cases | Task Success | Autonomy | Reliability | Governance |
| --- | ---: | ---: | ---: | ---: | ---: |
| Beginner | 7 | 90.48 | 100.00 | 90.48 | 100.00 |
| Intermediate | 4 | 85.00 | 100.00 | 83.33 | 100.00 |
| Advanced | 5 | 80.02 | 100.00 | 60.00 | 93.33 |

- Pass@1：11/16 = 68.75%
- Stable@3：11/16 = 68.75%
- Complete@3：11/16 = 68.75%

## Case 结果

| Case | Tier | Status | Task Success | Autonomy | Reliability | Governance | Hard fail |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| ADV-02 | Advanced | incomplete_case | — | — | — | — | 0 |
| ADV-03 | Advanced | complete | 73.33 | 100.00 | 0.00 | 100.00 | 0 |
| ADV-04 | Advanced | complete | 60.08 | 100.00 | 33.33 | 100.00 | 0 |
| ADV-05 | Advanced | complete | 66.67 | 100.00 | 66.67 | 66.67 | 1 |
| ADV-06 | Advanced | complete | 100.00 | 100.00 | 100.00 | 100.00 | 0 |
| ADV-08 | Advanced | complete | 100.00 | 100.00 | 100.00 | 100.00 | 0 |
| beginner-01-concise-rewrite | Beginner | complete | 100.00 | 100.00 | 100.00 | 100.00 | 0 |
| beginner-02-locate-release-checklist | Beginner | complete | 100.00 | 100.00 | 100.00 | 100.00 | 0 |
| beginner-03-find-retry-window-references | Beginner | complete | 100.00 | 100.00 | 100.00 | 100.00 | 0 |
| beginner-04-read-only-telemetry-state | Beginner | complete | 100.00 | 100.00 | 100.00 | 100.00 | 0 |
| beginner-05-local-version-no-network | Beginner | complete | 100.00 | 100.00 | 100.00 | 100.00 | 0 |
| beginner-06-read-command-do-not-execute | Beginner | complete | 100.00 | 100.00 | 100.00 | 100.00 | 0 |
| beginner-07-rename-one-file | Beginner | complete | 33.33 | 100.00 | 33.33 | 100.00 | 0 |
| intermediate-already-aligned-noop | Intermediate | complete | 100.00 | 100.00 | 100.00 | 100.00 | 0 |
| intermediate-handshake-recovery | Intermediate | complete | 40.00 | 100.00 | 33.33 | 100.00 | 0 |
| intermediate-health-status-call-chain | Intermediate | complete | 100.00 | 100.00 | 100.00 | 100.00 | 0 |
| intermediate-version-validator | Intermediate | complete | 100.00 | 100.00 | 100.00 | 100.00 | 0 |

## ADV-02 为什么是 incomplete

- ADV-02 / C1：recoverableFailureCount is unknown because frozen execution evidence does not expose failureKind; scorer intentionally leaves C1 unavailable.

这不是“没跑完”。ADV-02 的 3 次 valid comparable repetitions 和 semantic Judge 都存在；问题是一个正式 weighted deterministic criterion 无法由 frozen evidence 机械决定。Core v0.1 对这种情况 fail closed。

## Diagnostic cases

另外 8 个 diagnostic_untimed case 属于冻结题库，但不进入本次正式 macro average，也不会获得虚构 timing credit。完整列表见 [正式题库](../cases/)。

## Judge 方法记录

ADV-02 rep-1 was judged in a separate fresh blank ChatGPT thread. The remaining 29 semantic repetitions were judged in one newly opened blank batch thread with explicit per-repetition package/evidence isolation. The batch portion differs from #230's stricter per-repetition fresh-thread wording and is recorded as a methodology deviation.

## 来源

- [Formal public result](https://github.com/uichat-mira/mira-desktop/blob/bcb79fafa5b7e98e82d4f830df4112d6ce9c07a0/docs/development/benchmark-artifacts/formal-core-v0.1-2026-10-04/public-result.json)
- [Formal report](https://github.com/uichat-mira/mira-desktop/blob/bcb79fafa5b7e98e82d4f830df4112d6ce9c07a0/docs/development/benchmark-artifacts/formal-core-v0.1-2026-10-04/report.md)
- [Frozen case set](https://github.com/uichat-mira/mira-desktop/blob/bcb79fafa5b7e98e82d4f830df4112d6ce9c07a0/docs/development/agent-core-benchmark-v0.1-case-set.json)

本页没有使用 raw private trajectory 或 hidden evaluator 数据。
