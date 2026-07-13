---
title: 应用基础信息
description: UIChat Mira 的产品名称、运行形态、技术底座与当前公开边界。
group: 产品能力
order: 10
---

# 应用基础信息

这一页集中说明 UIChat Mira 当前最基础、最稳定的产品信息。

它不是发布承诺，也不会把路线图中的设想伪装成现成功能。版本、平台和能力边界都应以当前源码和正式发布包为准。

## 基本资料

| 项目 | 当前信息 |
| --- | --- |
| 产品名称 | UIChat Mira |
| 产品定位 | 本地优先的个人 AI 工作台 |
| 当前源码版本 | `0.7.1` |
| 当前主平台 | Windows 桌面端 |
| 桌面运行形态 | Electron；Tauri 壳并行演进 |
| 前端 | React + Vite |
| 本地后端 | Fastify |
| 本地数据 | SQLite + sqlite-vec |
| 模型接入 | 本地模型与多 Provider 云端模型 |
| 核心入口 | 对话、知识库、评测、角色、模型、工具、MCP、微应用 |
| 项目口号 | 从聊天出发，最终回到「接住你」 |

![UIChat Mira 设置导航与能力入口](/images/product/mira-settings-navigation.webp)

*设置页把模型、工具、MCP、知识库、评测、角色和微应用放在同一个工作空间中。*

## 本地优先是什么意思

本地优先不等于强制离线，也不等于拒绝云端模型。

Mira 的本地优先主要体现在：

- 桌面应用与本地后端共同组成主要运行环境；
- 对话、配置、知识、索引和工作状态尽量留在用户自己的设备；
- 用户可以选择 Ollama、LM Studio 等本地模型，也可以接入云端 Provider；
- 外部服务获得的是完成某项请求所需的数据，而不是对整个工作空间的默认访问权；
- 工具和 MCP 能力进入 Agent 前，仍需经过 Harness、Policy 和权限边界。

## 应用数据大致分为哪些部分

::: html
<div style="margin:28px 0;padding:20px;border:1px solid var(--hairline,#e6dfd8);border-radius:16px;background:var(--surface-soft,#f5f0e8);">
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;">
    <div style="padding:14px;border-radius:12px;background:var(--canvas,#faf9f5);border:1px solid var(--hairline,#e6dfd8);"><strong>账户与偏好</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">用户名、语言、主题和密码</div></div>
    <div style="padding:14px;border-radius:12px;background:var(--canvas,#faf9f5);border:1px solid var(--hairline,#e6dfd8);"><strong>对话数据</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">线程、消息、附件和执行记录</div></div>
    <div style="padding:14px;border-radius:12px;background:var(--canvas,#faf9f5);border:1px solid var(--hairline,#e6dfd8);"><strong>知识与索引</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">文档、分块、向量与评测结果</div></div>
    <div style="padding:14px;border-radius:12px;background:var(--canvas,#faf9f5);border:1px solid var(--hairline,#e6dfd8);"><strong>能力配置</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">Provider、工具、MCP 和微应用</div></div>
    <div style="padding:14px;border-radius:12px;background:var(--canvas,#faf9f5);border:1px solid var(--hairline,#e6dfd8);"><strong>工作空间</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">用户主动绑定的文件系统范围</div></div>
  </div>
</div>
:::

这些数据的生命周期不同。删除聊天不等于删除知识库，清空日志也不等于删除工作空间文件。执行任何清理操作前，应先看清确认弹窗说明。

## 当前不应写死的数据

以下信息容易随着构建和版本变化，不在本页长期写死：

- 安装包大小；
- 最低硬件配置；
- 当前支持的全部 Provider 列表；
- 每一种文件格式和限制；
- 尚未进入正式发布的路线图功能；
- 未明确发布的许可证与商业授权方式。

这些内容应由发行说明、安装文档和具体功能页维护。
