---
title: 微应用
description: 把知识、资讯、邮件、图像、语音与浏览器任务整理成可直接进入的专用工作台。
group: 产品能力
order: 15
---

# 微应用

微应用用于承接具体业务入口。

它们不是一组散落在设置页里的开关，也不是必须通过聊天指令才能触发的隐藏能力，而是拥有独立配置、执行状态、结果区和诊断信息的专用工作界面。

![微应用总览](/images/guide/microapps-overview.svg)

*当前微应用页把知识、资讯、邮件、浏览器任务、图像、语音与代码理解能力组织成可以直接进入的工作台。*

## 为什么需要微应用

有些能力适合停留在聊天里，例如一次问答、一次改写或一次简单工具调用。

但当能力开始包含参数面板、任务状态、产物预览、审批节点和长期配置时，继续把所有内容塞进聊天窗口会让产品越来越像一个混乱的万能后台。

微应用解决的正是这类问题：

- 给具体业务一个稳定入口；
- 允许能力拥有自己的配置与结果区；
- 把调试状态、执行证据和产物留在同一页面；
- 让聊天继续保持自然，而不是承担所有后台管理工作。

## 当前微应用地图

::: html
<div style="margin:28px 0;padding:20px;border:1px solid var(--hairline,#e6dfd8);border-radius:16px;background:var(--surface-soft,#f5f0e8);">
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px;">
    <div style="padding:15px;border-radius:12px;background:var(--canvas,#faf9f5);border:1px solid var(--hairline,#e6dfd8);"><strong>智识进化库</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">多媒体知识捕获与 AI 自我整理</div></div>
    <div style="padding:15px;border-radius:12px;background:var(--canvas,#faf9f5);border:1px solid var(--hairline,#e6dfd8);"><strong>资讯聚合台</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">本地科技资讯聚合与消费入口</div></div>
    <div style="padding:15px;border-radius:12px;background:var(--canvas,#faf9f5);border:1px solid var(--hairline,#e6dfd8);"><strong>邮件中心</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">SMTP / IMAP 账号、发信与同步</div></div>
    <div style="padding:15px;border-radius:12px;background:var(--canvas,#faf9f5);border:1px solid var(--hairline,#e6dfd8);"><strong>Computer Use Studio</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">浏览器计划、审批、执行与证据</div></div>
    <div style="padding:15px;border-radius:12px;background:var(--canvas,#faf9f5);border:1px solid var(--hairline,#e6dfd8);"><strong>Image Generation Studio</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">API Provider 与 ComfyUI 工作流</div></div>
    <div style="padding:15px;border-radius:12px;background:var(--canvas,#faf9f5);border:1px solid var(--hairline,#e6dfd8);"><strong>TTS Studio</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">Piper、GPT-SoVITS 与 API 语音合成</div></div>
    <div style="padding:15px;border-radius:12px;background:var(--canvas,#faf9f5);border:1px solid var(--hairline,#e6dfd8);"><strong>CodeGraph Studio</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">受控的代码图谱接入与状态调试</div></div>
    <div style="padding:15px;border-radius:12px;background:var(--canvas,#faf9f5);border:1px solid var(--hairline,#e6dfd8);"><strong>Default Knowledge Query</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">把本地知识问答接到外部入口</div></div>
  </div>
</div>
:::

## 邮件中心

邮件中心直接接入真实 SMTP / IMAP，用来管理邮箱账号、发送测试邮件、同步近期收件箱并查看邮件列表。

它体现了微应用与普通工具的区别：工具可以提供“发送邮件”或“读取邮件”的能力，而邮件中心负责把账号、状态、收件箱和操作流程整理成一个长期可用的工作台。

## Image Generation Studio

图像生成工作台同时承接 Provider Prompt 生图与 ComfyUI Workflow。

页面可以管理模型、Prompt、Seed、尺寸、节点映射、任务状态与结果预览。图像生成因此不必被硬塞进 Chat Completions，也不必只作为聊天附件存在。

## TTS Studio

TTS Studio 将 Piper、GPT-SoVITS 与 API 服务商放入同一语音合成工作台。

用户可以独立配置 Provider、提交文本、试听结果并检查产物状态。语音能力由此保持可替换，不需要硬编码到聊天主流程。

## Computer Use Studio

Computer Use Studio 是受控浏览器任务工作台。

它把 Goal、Site Scope、Plan、Evidence 与 Result 分开显示，并为高风险动作保留审批暂停点。当前边界首先覆盖浏览器，不把它包装成宿主桌面的万能控制器。

## CodeGraph Studio

CodeGraph Studio 的重点不仅是“能不能运行”，还包括 blocked-safe 状态、外部索引限制、仓库污染保护和 Fake Provider 调试。

当底层条件不可靠时，页面明确显示阻断原因，而不是假装能力已经可用。

## 微应用与 Agent 的关系

微应用是面向用户的专用工作界面；Agent 是运行时中的任务控制器；工具和 MCP 则提供具体能力。

三者可以组合，但不应混为一层：

- 微应用负责承载业务流程；
- Agent 负责判断下一步；
- 工具负责执行明确动作；
- Policy 与审批负责限制副作用。
