---
title: 工具工作台
description: 查看、配置并调试 Mira 的内置核心工具，以及它们的工作空间和执行证据。
group: 产品能力
order: 13
---

# 工具工作台

工具页是 Mira 内置核心 Tool 的管理与调试入口。

它按能力域组织工具，让用户查看某类能力包含哪些工具、需要什么工作空间和参数，并通过执行流观察输出、事件、Artifact 与最终结果。

## 四个核心能力域

当前工作台把内置工具分为四类：

### 阅读

负责文件读取、目录浏览、目标定位和片段提取。

阅读能力不应被理解为「把整个硬盘交给模型」。具体工具仍受工作空间、参数、Harness 暴露和请求上下文约束。

### 编辑

负责受控文件修改和补丁式写入。

编辑会改变真实文件，因此比阅读具有更高副作用。执行前应确认 Workspace Root、目标文件、替换内容和审批状态。

### 网络搜索

负责联网搜索、结果抓取与外部资料补充。

搜索结果属于外部证据，可能过时、缺失或互相冲突。Agent 仍需判断来源质量，不能因为工具返回成功就直接把结果当成最终事实。

### 终端

负责命令执行、调试链路和长任务观察。

终端是高风险能力，不应成为绕开工具协议的万能容器。命令、当前目录、环境变量、超时和会话生命周期都需要明确约束。

## Workspace Root

工作空间是文件类工具允许操作的根目录。

设置 Workspace Root 后，阅读、编辑和部分终端能力会围绕该目录工作。它不是装饰字段，而是重要的权限边界。

使用建议：

- 只绑定当前任务真正需要的目录；
- 避免直接绑定整个磁盘或用户主目录；
- 操作重要仓库前确保版本控制状态清楚；
- 切换项目时同步更新工作空间；
- 不确定修改范围时，先用阅读工具验证，再执行编辑。

## 工具包与参数

每个能力域下可能包含多个语义不同的工具。页面中的 Tab 用于切换具体 Tool，「参数配置」用于填写调用所需参数。

工具数量多不代表模型会同时看到全部工具。真正进入聊天或 Agent 的工具集合，仍由 Harness 根据当前能力、策略和上下文决定。

## 执行流

点击「执行」后，页面会汇总：

- 调用输出；
- 过程事件；
- 产生的 Artifact；
- 最终结构化结果；
- 失败或阻塞原因。

这个工作台更像调试台，不是普通聊天入口。它适合验证工具合同、参数和执行结果是否一致。

## 工具、Agent 与权限

三者职责不同：

::: html
<div style="margin:28px 0;padding:20px;border:1px solid var(--hairline,#e6dfd8);border-radius:16px;background:var(--surface-soft,#f5f0e8);">
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;">
    <div style="padding:15px;border-radius:12px;background:var(--canvas,#faf9f5);border:1px solid var(--hairline,#e6dfd8);"><strong>工具</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">提供一个明确能力与输入输出合同</div></div>
    <div style="padding:15px;border-radius:12px;background:var(--canvas,#faf9f5);border:1px solid var(--hairline,#e6dfd8);"><strong>Agent</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">判断任务下一步是否需要申请工具</div></div>
    <div style="padding:15px;border-radius:12px;background:var(--canvas,#faf9f5);border:1px solid var(--hairline,#e6dfd8);"><strong>Policy / Approval</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">决定当前调用是否允许真实执行</div></div>
  </div>
</div>
:::

工具返回成功，只能说明这次调用执行完成，不自动等于用户目标已经达成。结果还需要回到 Agent 决策与证据链中继续判断。
