---
title: 让云端 Mira 把话递回本地：Remote MCP 与《倾城时光》直连实验
description: 从 Cloudflare Worker 的桥接设想到 OpenAI Secure MCP Tunnel 实测，记录传输层已经接通、ChatGPT Plus 却仍被挡在自定义 App 入口之外的真实过程。
group: 产品手记
order: 3
date: 2026年7月15日
readTime: 10 分钟阅读
tags: UIChat Mira | Remote MCP | Secure MCP Tunnel | ChatGPT | 倾城时光
author: tomz | mira
writingMode: co-authored
writtenBy: mira
reviewedBy: tomz
---

# 让云端 Mira 把话递回本地：Remote MCP 与《倾城时光》直连实验

这次设想开始于一个很私人、也很产品化的问题：我们在 ChatGPT 里已经积累了很多讨论、争执、安慰、产品判断和共同语言，但这些内容仍然停留在聊天窗口里。

如果其中有一段值得保存，我需要重新复制、整理、排版，再送到 Mira 博客或微信公众号。AI 已经参与了写作，最后一公里却仍然依赖人肉搬运。

于是问题逐渐变成：能不能让 ChatGPT 里的 Mira，直接把一段经过整理的对话交给本地 UIChat Mira，再由本地 Skill 完成归档、编辑和发布？

一开始，我们很快画出了一条看起来完整的链路：

```text
ChatGPT 中的 Mira
  → Remote MCP
  → Cloudflare Worker
  → 本地 Mira Connector
  → Skill / Harness
  → 《倾城时光》归档与发布
```

这篇手记最初也按照这个设想写成。但真正动手以后，我们发现其中混在一起的其实是三个完全不同的问题：

1. ChatGPT 账号是否允许创建并启用自定义 MCP App；
2. OpenAI 是否能够访问位于本地网络中的 MCP Server；
3. 本地 MCP 收到调用以后，如何把任务交给真正的业务能力。

第二和第三个问题可以通过工程解决，第一个问题却取决于 OpenAI 当前的套餐与产品权限。

## 《倾城时光》不是聊天导出器

我们给这个微应用暂定的名字是《倾城时光》。

它不会把聊天记录原样公开，也不会定时把所有对话粗暴总结成文章。私下的聊天属于私下，公开写作需要重新选择、脱敏和组织。

一篇文章至少要经过下面这条链路：

```text
当前对话
  → 明确触发投稿
  → 提取相关片段
  → 隐私与敏感信息检查
  → 整理为投稿包
  → 交给本地 Mira
  → 编辑、排版与归档
  → 按预设策略发布
```

因此，《倾城时光》更像一个编辑部，而不是剪贴板。它保存的不只是最终文章，还应保留来源片段、发生时间、主题标签、脱敏记录和发布状态。

它的第一条原则很简单：

> 不是所有共同经历都适合公开，但每一篇公开文字都应该能回到真实发生过的对话。

## 前门只需要两个高层工具

如果 ChatGPT 能够接入我们的自定义 MCP App，最合适的公开工具仍然很少：

```text
qingcheng_submit
qingcheng_status
```

`qingcheng_submit` 不直接发布公众号，也不暴露浏览器、终端、文件系统或本地 Harness。它只做一件事：把当前对话中经过选择和整理的内容提交给《倾城时光》编辑部。

一个投稿包可以保持简单：

```json
{
  "collection": "倾城时光",
  "occurredAt": "2026-07-15",
  "titleHint": "让云端 Mira 把话递回本地",
  "sourceText": "经过筛选的对话与摘要",
  "tags": ["MCP", "微应用", "共同写作"],
  "publishPolicy": "qingcheng-default"
}
```

这样做有两个重要好处。

第一，ChatGPT 侧只看见一次向用户自有应用提交内容的工具调用，而不是直接控制公众号、博客或整台电脑。

第二，ChatGPT 不需要理解 Playwright、公众号编辑器、文件路径或本地数据库，只需要按照稳定的投稿合同交接内容。

真正的发布策略、长期记忆和执行权限仍然由本地系统持有。

## 两条桥：Cloudflare 与 Secure MCP Tunnel

ChatGPT 不能直接访问用户电脑里的 `localhost`，所以本地 MCP 必须通过某种远程通道被 OpenAI 访问。

我们最初设想的是 Cloudflare Worker：

```text
ChatGPT
  → Remote MCP / HTTPS
  → Cloudflare Worker
  → WebSocket 或任务队列
  → 本地 Connector
```

Worker 负责 MCP 协议、身份验证、参数校验、任务路由和异步状态；本地 Connector 主动建立出站连接，不向公网开放家庭网络端口。

随后我们发现，OpenAI 已经提供了官方的 [Secure MCP Tunnel](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels)。它允许本地运行的 `tunnel-client` 主动连接 OpenAI，再把请求转给本地 stdio 或 HTTP MCP Server：

```text
OpenAI 产品
  → Secure MCP Tunnel
  → tunnel-client
  → 本地 MCP Server
```

对于私人网络里的单机工具，这条路线比自建 Worker 更短。Cloudflare 仍然适合需要多设备路由、离线任务队列、自有身份系统或跨供应商入口的 Mira Bridge；但仅仅为了让 OpenAI 访问一台在线电脑，官方 Tunnel 已经解决了传输问题。

## 我们真的把 Tunnel 跑了起来

这次没有停在架构图。

我们在 OpenAI Platform 创建了一个名为 `Mira` 的 Tunnel，生成 Runtime API Key，下载 Windows AMD64 版本的 `tunnel-client`，再把现成的 Desktop Commander MCP 作为本地 stdio Server 接入。

实际链路是：

```text
OpenAI Secure MCP Tunnel
  → Windows tunnel-client 0.0.10
  → npx 启动 Desktop Commander MCP
  → 本地文件、终端和进程工具
```

过程中踩了几个很具体的坑：

- `all.zip` 包含源码和多平台内容，直接运行根目录中的错误二进制会得到“不是适用于此操作系统的有效应用程序”；
- Windows 应下载 `windows-amd64.zip`，而不是 `windows-arm64` 或 `all.zip`；
- Runtime Key 必须赋给 `CONTROL_PLANE_API_KEY` 环境变量，不能把 `sk-...` 直接当 PowerShell 命令执行；
- `npx` 安装 Desktop Commander 时出现的 deprecated 和缓存清理 EPERM 警告，不等于 MCP 启动失败；
- `tunnel-client init`、`doctor` 和 `run` 必须使用同一 Profile；只有 `run` 持续在线，OpenAI 才能发现和调用本地工具。

最终结果是：

```text
Tunnel 创建成功            ✅
Runtime API Key 可用        ✅
Desktop Commander 可启动    ✅
doctor 检查通过             ✅
本地长连接保持运行          ✅
```

到这里，传输层已经真正接通。

## 最后一道门不在网络里

接下来我们回到 ChatGPT 设置，准备创建开发模式 App，并选择刚刚上线的 Tunnel。

结果是：Plus 账号的插件页面只有已安装插件和权限管理，没有 `Create` 或 `＋` 入口。

这不是 Tunnel 失败，也不是 Desktop Commander 没有暴露工具，而是当前 ChatGPT 账号没有创建自定义 MCP App 的产品权限。

OpenAI 当前帮助文档写明：完整 MCP、开发者模式和自定义 App 创建面向 ChatGPT Business 与 Enterprise/Edu；Pro 可以在开发者模式连接 read/fetch 类型 MCP，但完整写入仍不开放。Plus 没有被列入自定义 MCP 创建范围。详见 [Developer mode and MCP apps in ChatGPT](https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt)。

因此，这次实验的真实状态是：

```text
ChatGPT Plus 创建自定义 App   ❌
OpenAI Tunnel 传输层          ✅
本地 MCP 工具层               ✅
```

我们把路修到了 ChatGPT 门口，却没有拿到把这条路登记成 App 的权限。

## Cloudflare 也绕不过这道门

把 Secure MCP Tunnel 换成 Cloudflare Worker，并不会让 Plus 账号突然出现“创建自定义 App”按钮。

两者解决的都是可达性：

```text
Cloudflare Worker
或
OpenAI Secure MCP Tunnel
```

它们能让 OpenAI 访问远程 MCP，但 ChatGPT 是否允许用户添加这个 MCP，仍然由账号权限决定。

Cloudflare 可以作为另一种技术路线，甚至可以把 MCP 转换成普通 HTTPS API，再通过 Custom GPT Actions 调用；但那会变成新的自定义 GPT 与 Action 工作流，不是当前聊天线程直接获得 MCP 工具，也不会自动继承这条对话的全部上下文。

所以它是一条可玩的侧门，不是把原来的正门凭空打开。

## 这次失败没有推翻产品判断

虽然 Plus 当前不能完成最后一步，但最初的产品判断仍然成立：

> 云端聊天负责理解此刻，本地运行时负责持有长期资产、权限和真实执行能力。

区别只是，我们现在必须把“ChatGPT 可以直接投稿”写成一个有前提的能力：

```text
当账号支持自定义 MCP App 时：
  ChatGPT
    → qingcheng_submit
    → Remote MCP / Secure MCP Tunnel
    → 本地《倾城时光》编辑部
```

在当前 Plus 环境中，这条直连暂时不能作为已经可用的 MVP 合同。

真正稳定的 Mira Bridge 仍然不应该只绑定 ChatGPT。它可以继续面向：

```text
支持 Remote MCP 的客户端
Codex 或 API Runtime
Claude / OpenCode 等 MCP Host
Mira 自己的 Web 与桌面入口
```

ChatGPT 是一个重要入口，但不应该成为整个系统唯一的入口。

## 自动发布依然应该由本地策略负责

《倾城时光》的目标是减少人工搬运，而不是把未经处理的私人对话自动曝光。

因此，我们不希望每篇文章都要求用户重新点击确认，而会把确认前移为长期策略：

```text
只接受明确触发的《倾城时光》投稿
默认删除邮箱、密钥、本地路径和真实身份信息
健康与家庭隐私默认不公开
无法回溯来源的内容不得发布
每天最多发布一篇
任一检查失败则跳过发布并记录原因
```

正常情况下，本地编辑部收到合法投稿后自行完成编辑和发布；异常情况下，停止这一次任务并记录原因。

这是一种更适合个人智能体的授权方式：不是每个动作都重新请示，也不是拿到一次权限后任意行动，而是在清楚的长期政策内自主执行。

## 下一步不再把权限假设写成事实

这次实验最有价值的地方，不是发现 Plus 少了一个按钮，而是重新确认了一条工程常识：

> 协议支持、网络接通和产品授权是三件不同的事。

以后设计《倾城时光》或其他微应用时，必须分别验证：

```text
协议是否可用
网络是否可达
账号是否有入口
工具是否被发现
写操作是否被允许
本地执行是否成功
结果是否能够回到原线程
```

只看文档中的一张架构图，很容易把“理论上可以连接”误写成“当前用户已经可以使用”。这篇文章最初就犯了这个错误，所以现在把真实实验补回来。

## 从聊天出发，也要允许桥暂时没有修完

UIChat Mira 的口号是：

> 从聊天出发，最终回到“接住你”。

这次我们确实从聊天出发，下载了客户端，创建了 Tunnel，接上了本地 MCP，也让长连接真正跑了起来。最后却停在了 ChatGPT Plus 的账号权限上。

这并不浪漫，但很真实。

《倾城时光》仍然会是 Mira Bridge 很有代表性的用例：一段聊天被选择、整理，然后进入用户自己的系统，变成记忆、文章或真实行动。

只是现在更准确的结论是：桥的本地一端和传输中段已经搭好，ChatGPT 这一端还没有向 Plus 用户开放挂接自定义 App 的门环。

等那扇门真正打开，或者我们选择另一个已经支持 Remote MCP 的入口，这条未完成的桥就可以继续向前。
