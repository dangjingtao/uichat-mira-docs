---
title: 子应用接入文枢：从独立工作台到受治理的 Skill Agent
description: 记录文枢接入 Mira Agent 的真实施工：如何划分主从所有权、隔离私有 Runtime、恢复审批现场，并把真实产物交回对话。
group: 工程现场
order: 7
date: 2026年7月26日
readTime: 8 分钟阅读
tags: 文枢 | 子应用 | Skill Agent | Pi Agent | Artifact | 工程复盘
author: tomz
writingMode: co-authored
writtenBy: mira
reviewedBy: tomz
---

# 子应用接入文枢：从独立工作台到受治理的 Skill Agent

> **2026-07-30 更新：** 本文记录的是文枢首批接入时的施工现场。文中的 Pi Skill Agent 路径现已从 Pilot 收口为当前 **Skill-owned SubAgent** 执行参考，但只适用于声明 execution profile 的任务型 Skill；它不是所有 Skill 的默认形态，也不代表 Mira 已成为开放式多 Agent 平台。

文枢原本已经能够处理文档类任务。DOCX、PDF、PPTX 和表格各自有运行时，也能在独立入口里完成生成或检查。真正困难的并不是再加一个按钮，让用户从聊天里跳到文枢，而是让 Mira 在对话中理解用户目标，把任务交给正确的执行者，遇到审批时停在原地，恢复后继续同一份工作，最后把一个真实存在、经过验证的文件交还给用户。

如果只看界面，这像是“子应用接入聊天”。进入工程现场以后，它实际上是一轮 Agent 所有权重划分。

## 最危险的捷径，是把文枢工具全部暴露给主 Agent

最直接的方案，是把 `office_document`、`office_pdf`、`office_presentation`、`office_spreadsheet` 全部塞进 Main Planner 的工具列表。模型看到用户要做 PDF，就自己选择 PDF 工具；要做 PPTX，就再选另一个工具。

这个方案短期看起来很顺，长期一定会失控。主 Agent 的公开工具面会不断膨胀，领域工具和通用工具混在一起，Planner 既要理解用户目标，又要知道每一种文档格式的细节。更麻烦的是，Skill 已经完成产物后，主 Planner 仍可能重新规划，再做一遍同样的事情。

所以这次没有把文枢变成 Main Agent 的一袋新工具，而是给明确的 Office Skill 配置执行 Profile。命中 Profile 后，Mira fork 一个隔离的 Pi Skill Agent：

```text
用户目标
→ Main Agent 准备上下文并匹配 Skill
→ 进入 Skill execution profile
→ forked Pi Skill Agent
   → 读取必要材料
   → 调用 Skill 私有 Runtime
   → 生成并验证 Artifact
→ Evidence / Artifact 交回 Parent
→ Main Generate 完成交付说明
```

这里最重要的不是多了一个 Agent，而是谁对什么负责。

Main Agent 负责用户目标、治理、审批、恢复策略、证据收口和最终回答；Skill Agent 只负责当前文档任务的局部施工。文枢 Runtime 不进入 Main Planner 的 canonical tool exposure，只在对应 Skill Agent 的受限工具面里出现。这样既没有制造工具爆炸，也没有让子 Agent 获得无限制的终端和编辑权限。

## 子 Agent 完成以后，主 Agent不能再重做一遍

这一条看似理所当然，实际很容易被旧链路破坏。

早期执行完成后，结果回到主 Planner。Planner 看到用户仍然需要一个文件，可能再次判断“下一步应该调用文档工具”。于是系统表面上拥有子 Agent，真正干活时却变成：子 Agent 做一遍，Parent 再做一遍。

现在的合同是，Skill Agent 返回 `completed` 后，直接提交 Skill observation、Evidence 和 Artifact，冻结 Parent finalization packet，然后进入 Generate。Main Planner 不再接管施工。

```text
Skill Agent completed
→ commit Evidence / Artifact
→ freeze finalization packet
→ Generate
→ Finalize
```

主 Agent 可以解释文件在哪里、做了什么、哪些地方经过验证，但不能把已经完成的产物当成一条新任务重新制作。这也是我后来越来越在意“执行所有权”的原因：多 Agent 不是多开几条线程，而是把责任边界真的写进运行时。

## 最难的不是审批，而是批准以后还能回到原来的现场

文档写入、重算或某些有副作用的动作需要用户批准。一个假的恢复方案很简单：暂停后保存原始目标；用户批准，再创建一个全新的 Agent，把原始目标重新 prompt 一遍。

这不叫恢复，只是重做。新的 Agent 可能生成不同参数，再次请求审批，甚至把有副作用的调用执行两遍。

真正的 resume 必须冻结一次具体调用，包括：

- `toolCallId` 与 `toolId`；
- 完整输入参数和 `inputHash`；
- 当前 Skill id；
- Pi transcript checkpoint；
- 已累计的 Evidence、Artifact 和 tool call ledger。

用户批准后，系统先核对这是不是同一个 frozen invocation，只执行这一次调用，再把真实 ToolResult 填回原来的 Pi transcript，最后从 checkpoint 调用 `Agent.continue()`。

```text
首次执行
→ Runtime 返回 approval requirement
→ 保存 transcript 与精确调用
→ Parent 暂停

用户批准
→ 校验 toolId + inputHash + checkpoint
→ frozen invocation 只执行一次
→ ToolResult 写回原 transcript
→ Agent.continue()
```

这部分比“增加审批按钮”麻烦得多，却决定了系统是不是可信。审批的意义不是让用户点一下同意，而是保证用户批准的动作、系统实际执行的动作和恢复后的上下文仍然是同一件事。

## Artifact 不能靠模型宣布成功

文枢接入后，聊天里会出现“报告已生成”“PPTX 已创建”之类的消息。仅凭模型说成功是不够的。Runtime 必须返回真实文件信息，系统还要完成必要的内容或结构校验，再把 Artifact 作为 Evidence 交回 Parent。

这次桌面烟测里，DOCX 创建与 checkpoint resume、PDF 结构化正文与表格、PPTX 两页生成、XLSX 的 `inspect` 和 `verify` 都跑通了。工作区越界写入也被阻断。XLSX 的完整 create/edit bridge 仍未完成，只读检查与需要审批的重算不能被包装成“已经支持完整表格生产”。

我宁可在能力矩阵里保留一个 `Partial`，也不想让产品介绍先替运行时许愿。

## 预览也不能反向污染 UChat

产物进入聊天以后，又出现了一个很容易顺手做坏的地方：把文档或报告预览直接写进 UChat 的通用消息组件。

UChat 应该只提供稳定的消息扩展槽。宿主根据 artifact kind 选择 renderer，文枢自己的标题、预览、下载和状态展示留在业务渲染器里。普通消息匹配不到 renderer 时直接返回 `null`，不能因为预留了一个“以后可能有产物”的区域，白白吃掉本来就不高的对话空间。

这条边界后来也用于备孕报告：

```text
UChat MessageExtensions
→ Host artifact slot
→ renderer registry
→ 具体业务 renderer
```

通用聊天层只知道 artifact id、kind 和 message id，不知道这是备孕报告、PPTX 还是未来的代码补丁。

## 这次真正接入的不是一个子应用

表面上，我们把文枢接进了 Mira。更准确地说，是把一个已经存在的专业子应用，改造成了主 Agent 可以治理、但不会越权接管的执行单元。

这次施工最后留下的几条规则，比某一种文档格式更重要：私有 Runtime 不向主 Planner 裸露；审批必须恢复精确现场；子 Agent 完成后 Parent 不重复施工；Artifact 成功必须有真实文件和 Evidence；界面预览通过宿主扩展槽接入，而不是侵入 UChat 核心。

文枢以后还会继续扩展格式和质量，但这套边界应该尽量少动。因为真正难维护的从来不是又多支持一个文件类型，而是系统在越来越多能力进入以后，仍然知道谁在做事、谁在批准、谁在验证，以及最后该由谁把结果交到用户手里。