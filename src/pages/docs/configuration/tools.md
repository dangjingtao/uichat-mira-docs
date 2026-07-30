---
title: 工具工作台
description: 查看、配置并调试 Mira 当前的核心工具、动态能力、执行边界与证据。
group: 产品能力
order: 13
---

# 工具工作台

工具页是 Mira 内置 Tool 的管理与调试入口。

它可以展示已注册工具、参数、工作空间、调用事件、Artifact 和结构化结果，但需要先记住一条边界：

> **工作台里存在的工具，不等于 Main Planner 本轮一定能看见；Planner 看见，也不等于这一次调用已经获准执行。**

Mira 会分别判断注册、公共工具面、当前可用性、Tool Exposure 和具体 Invocation。

## 当前核心公共工具面

截至 2026 年 7 月 30 日，Main Agent 的核心公共工具不再是六月那套六个 `read_*` 加一个 `edit_file` 的旧矩阵。

### 阅读与代码理解

```text
read_discover
├─ mode: list
└─ mode: locate

grep
read_open
codebase_explore
```

- **`read_discover`**：列目录、找路径和文件名候选，不搜索正文，也不打开文件；
- **`grep`**：搜索字面文本、代码符号、引用、配置键和文档正文；
- **`read_open`**：打开已知文件或已披露的 Skill Resource，可读取指定范围；
- **`codebase_explore`**：探索架构、调用关系和影响面，并回到当前工作空间核验原文。

旧的 `read_list`、`read_locate`、`read_extract`、`read_slice` 和 `read` 仍可能作为内部 primitive 或历史兼容实现存在，但不再是当前 Planner 公共合同。

### 文件编辑

```text
write_file
replace_block
delete_path
move_path
```

- **`write_file`**：创建文件，或在明确允许覆盖时写入完整内容；
- **`replace_block`**：使用唯一匹配的旧文本进行局部替换；
- **`delete_path`**：删除文件或目录，目录递归删除必须显式声明；
- **`move_path`**：移动或重命名文件、目录，默认不覆盖目标。

这四个工具都会改变真实文件，因此都需要审批，并受工作空间边界约束。旧的 `edit_file` 和 `workspace_mutation` 只保留兼容用途。

### 搜索

Mira 当前区分两个不同数据源：

- **`web_search`**：搜索当前公共互联网；
- **`news_search`**：查询本地 News Hub 已经收集的新闻缓存。

它们不能因为用户说了“新闻”就互相偷换。公网搜索可能获得最新资料；本地新闻搜索则依赖已经同步到设备的数据。

### 终端

当前唯一 Terminal 工具是 `terminal_session`。

它不是只能跑一条短命令的简化沙箱，而是完整 Host Runtime，支持：

- shell、Node、Python、Git 和包管理器；
- 临时执行与持久 PTY 会话；
- watcher、开发服务器和 REPL；
- stdout、stderr、timeout、abort 和进程树回收。

Terminal 始终需要审批。工作空间仍是默认执行上下文，但在明确显示真实 `cwd` 并获得审批后，可以执行工作空间外的目标目录；因此不能再把它描述成绝对的 workspace-only 命令盒。

## 动态能力不是固定清单

Mira 还会根据真实服务状态注册或开放其他能力，例如：

- Managed Computer Use Browser；
- 用户已连接浏览器的 Attached Browser；
- 邮件查询；
- GitHub 仓库、Issue、Pull Request 和 Actions；
- 问策的外部专家；
- 已连接并允许 Agent 使用的 External MCP Tools。

这些能力可能依赖登录、连接、运行时、用户账号或微应用配置。页面出现入口，不代表后台服务已经 ready；服务 ready，也不代表本轮 Tool Exposure 一定包含它。

## Tool Exposure 如何形成

Harness 先排除内部兼容工具，并检查明确的可用性条件，然后才处理模型上下文预算。

```text
公共且当前可用的工具不超过 20 个
→ 全部暴露给 Planner
→ 不运行语义排名

公共且当前可用的工具超过 20 个
→ embedding / rerank
→ 暴露前 20 个
```

这里的排名只是为了控制模型上下文大小，不是权限判断，也不是 Harness 在替 Planner 猜任务阶段。

用户在界面选择一个工具包，目前只会为排名增加偏好并记录可用状态，不会自动扩大权限、缩小工具面或直接触发执行。

## Workspace Root

Workspace Root 仍然是文件读取、编辑和代码核验的重要边界。

使用建议：

- 只绑定当前任务真正需要的目录；
- 操作重要仓库前先确认版本控制状态；
- 写入、删除和移动前先阅读目标；
- 切换项目时同步更新工作空间；
- 不要把整个磁盘当作默认工作空间。

需要注意，Workspace Root 对不同能力的含义并不完全相同：Read / Edit 以它作为严格资源边界；Terminal 则以它作为默认执行上下文，并通过具体调用审批处理工作空间外目标。

## 执行、审批与证据

点击「执行」或由 Agent 发起工具调用后，系统会记录：

- 实际工具与参数；
- 调用身份和输入摘要；
- 审批或阻塞状态；
- 过程事件；
- Artifact；
- 结构化结果；
- 失败、超时或拒绝原因。

工具执行成功，只能说明一次 Invocation 已完成。它不会自动宣布用户目标已经达成。

```text
Tool Result
→ Evidence
→ Planner 判断局部事实和全局完成
→ 最终回答或继续执行
```

工具、Agent 和审批分别负责不同问题：

::: html
<div style="margin:28px 0;padding:20px;border:1px solid var(--hairline,#e6dfd8);border-radius:16px;background:var(--surface-soft,#f5f0e8);">
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;">
    <div style="padding:15px;border-radius:12px;background:var(--canvas,#faf9f5);border:1px solid var(--hairline,#e6dfd8);"><strong>工具</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">提供明确能力、参数和真实执行结果</div></div>
    <div style="padding:15px;border-radius:12px;background:var(--canvas,#faf9f5);border:1px solid var(--hairline,#e6dfd8);"><strong>Agent</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">判断下一步、选择具体工具并验收结果</div></div>
    <div style="padding:15px;border-radius:12px;background:var(--canvas,#faf9f5);border:1px solid var(--hairline,#e6dfd8);"><strong>Policy / Approval</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">决定这一次具体调用是否允许执行</div></div>
  </div>
</div>
:::

进一步阅读：

- [Harness 与工具边界](/docs/architecture/harness)
- [MCP](/docs/configuration/mcp)
- [Mira 的工具现在到底是什么](/blogs/engineering/mira-tool-current-truth)
