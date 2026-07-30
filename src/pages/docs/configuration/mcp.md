---
title: MCP
description: 安装、连接和发现外部 MCP Server，并控制它们是否可以进入 Agent。
group: 产品能力
order: 14
---

# MCP

Mira 主要作为 MCP Host 使用。

MCP 页面负责管理市场中的第三方 MCP Server、已安装服务，以及后续非核心内置 MCP 包。当前界面重点是市场浏览、安装状态、连接配置、能力发现与 Agent Access，不会在安装后自动把全部工具注入聊天。

## MCP Server 是什么

MCP Server 是一个通过 Model Context Protocol 对外提供能力的服务。

它可能提供：

- Tools：可以执行的动作；
- Resources：可以读取的资源；
- Prompts：服务端提供的提示模板。

MCP 不是模型 Provider。Provider 负责模型推理请求，MCP Server 负责把外部工具和资源通过统一协议交给 Host。

## 市场与已安装

页面顶部可以在「市场」和「已安装」之间切换。

- **市场**用于浏览可安装服务；
- **已安装**用于管理当前设备上的 MCP Server；
- 搜索框可以按名称、描述、Endpoint 或能力 ID 筛选；
- 刷新用于重新获取当前状态；
- 使用指南用于解释安装和连接流程。

当前界面把市场浏览和 Agent 自动使用分开。发现一个服务，不代表它已经安装；安装完成，也不代表它已经连接或允许 Agent 调用。

## 一个服务的状态链

可以把 MCP 的使用过程理解为：

```text
发现
→ 安装
→ 启用
→ 配置
→ 连接
→ 接受免责声明
→ Discover Tools
→ 允许 Agent 使用
→ 进入公共可用工具面
→ 本轮 Tool Exposure
→ 具体调用审批
```

其中任一步失败，都不应伪装成「可用」。

页面会显示连接状态、发现到的能力数量、协议版本和服务描述，帮助用户判断问题发生在哪一层。

## 配置与连接

不同 MCP Server 可能需要不同配置：

- 本地命令与参数；
- 工作目录；
- 环境变量；
- 远程 Endpoint URL；
- Bearer Token 或自定义请求头；
- 超时时间；
- 其他服务专属参数。

配置保存后，还需要实际连接。连接成功说明 Host 能够与 Server 通信，但不代表所有 Tool 都已经发现、允许 Agent 使用或适合当前任务。

## Discover

「Discover」用于重新发现当前 Server 提供的 Tools、Resources 和 Prompts。

服务升级、配置变化或远端能力调整后，可以重新 Discover。页面会显示已发现的数量和名称，便于核对服务声明与实际能力是否一致。

当前进入 Agent Tool Runtime 的是已发现并成功投影的 Tool。投影后的稳定 ID 形式是：

```text
mcp:<serverId>:tool:<toolName>
```

这避免外部 Tool 与 Mira 内置 Tool 重名，也阻止 Provider 私有命令直接穿透到 Planner。

## 允许 Agent 使用

「允许 Agent 使用」是单独的权限开关。

关闭时，MCP Server 仍然可以保持安装和连接状态，但它的能力不会进入 Agent 可用集合。

打开后也不是无条件暴露。External MCP Tool 要进入 Agent 公共能力面，还必须同时满足：

- Server 已启用并连接；
- Transport 配置有效；
- 免责声明已接受；
- Discover 已获得 Tool；
- canonical projected implementation 仍存在；
- 当前用户显式打开 Agent Access。

随后 Harness 才会把它与其他公共工具一起形成 Tool Exposure。

```text
公共且可用工具 <= 20
→ 全部暴露

公共且可用工具 > 20
→ embedding / rerank
→ 暴露前 20
```

排名只控制模型上下文，不代表已经批准执行。External MCP 的每次真实 Tool Invocation 仍需要审批。

这层分离很重要：

- **已安装**回答「设备上有没有」；
- **已连接**回答「当前能不能通信」；
- **已发现**回答「服务声称提供什么」；
- **允许 Agent 使用**回答「是否允许进入公共可用能力面」；
- **Tool Exposure**回答「模型本轮能否看见」；
- **Policy / Approval**回答「这一次具体调用是否允许真实执行」。

## 本地与远程 MCP

Mira 可以面对两种常见服务。

### 本地进程

通常通过命令、包名和环境变量启动，例如基于 Node.js、Python 或本地二进制的 MCP Server。

它依赖本机运行时、工作目录和依赖安装情况。配置本地命令意味着 Mira 会管理一个真实进程，不应把安装成功等同于运行时健康。

### 远程服务

通常通过 Streamable HTTP Endpoint 连接。

它依赖网络、认证、服务可用性和远端协议兼容性。远程 MCP 获得的数据范围应由工具参数、Server 配置和用户授权共同控制。

## 会话恢复

当已持久化的 MCP 会话失效时，Runtime 可以尝试一次重新初始化，再重试当前调用。恢复不是无限重连；第二次仍失败时，会返回结构化失败并停止继续尝试。

## 常见问题排查

1. 服务是否已安装并启用；
2. 本地命令或远程 Endpoint 是否正确；
3. 所需运行时和依赖是否存在；
4. 环境变量和认证信息是否完整；
5. 连接是否成功；
6. 是否已接受免责声明；
7. Discover 是否拿到 Tool；
8. Agent Access 是否打开；
9. 当前工具是否仍成功投影到 Registry；
10. 本轮 Tool Exposure 是否包含它；
11. Policy 或审批是否阻止了本次调用。

不要把「Agent 没有选择这个工具」直接判断为 MCP 连接失败。连接、Discover、公共可用性、模型暴露、Planner 选择和真实执行是不同层级。

进一步阅读：

- [工具工作台](/docs/configuration/tools)
- [Harness 与工具边界](/docs/architecture/harness)
