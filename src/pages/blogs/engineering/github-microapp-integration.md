---
title: 从连接 GitHub 到真正协作：Mira 的微应用接入现场
description: 记录 GitHub 微应用从授权入口走向完整协作能力的过程，以及权限、工具、网络与 Skill 之间最终形成的边界。
group: 工程现场
order: 9
date: 2026年7月26日
readTime: 8 分钟阅读
tags: GitHub | 微应用 | Harness | Skill | Agent | 权限设计
author: tomz
writingMode: co-authored
writtenBy: mira
---

# 从连接 GitHub 到真正协作：Mira 的微应用接入现场

这次 GitHub 接入，前后折腾了近十二个小时。

最开始看起来只是一个很小的功能：在 Mira 里增加一个 GitHub 微应用，让用户登录、选择仓库，然后让 Agent 能够处理项目里的事情。

真正进入工程现场以后，问题很快变成了另一件事：我们到底是在做一个登录页面，还是在给 Mira 建立一条可信的远程协作链路？

这个区别非常重要。登录成功只代表身份认证完成，仓库出现在页面上也只代表授权范围可见。它们都不等于 Agent 已经拥有稳定、完整、可审计的 GitHub 能力。

## 用户不应该配置 GitHub App

第一版页面还把 `Client ID`、`App Slug` 和保存按钮暴露给用户。

这在开发阶段看起来很自然：缺什么配置，就让用户填什么配置。但从产品角度看，它把 Mira 自己的基础设施责任推给了普通用户。

用户真正应该做的只有两件事：

```text
登录 GitHub
选择允许 Mira 使用的仓库
```

因此我们把 GitHub App 的公开配置收回项目内部。Mira 使用自己的 GitHub App 和 Device Flow 发起登录，用户不需要 PAT，不需要知道 Client ID，也不需要理解 App Slug。

微应用页面最终只保留：

- 连接与断开；
- Device Flow 授权；
- installation 仓库列表；
- 添加或调整仓库授权；
- 验证连接状态。

这一刀切下来以后，微应用的职责终于清楚了：**它是授权入口，不是 GitHub 功能大全。**

## 仓库范围必须由 GitHub 说了算

接入外部系统时，最容易犯的错误之一，是在本地再维护一份“我认为用户授权了哪些资源”的名单。

我们没有这么做。

Mira 每次执行 GitHub 工具前，都会重新读取 GitHub App installation 返回的真实仓库范围。用户在 GitHub 官方页面选择 `All repositories` 或 `Only select repositories`，这个结果才是最终边界。

即使一个仓库是公开的，只要它没有被当前 installation 授权，Mira 也不能绕过去读取。

这让微应用里的“选择项目”不再只是一个 UI 选项，而是整个能力链的安全根。

```text
GitHub installation
        ↓
真实仓库范围
        ↓
Harness 执行前校验
        ↓
允许或拒绝工具调用
```

## 浏览器成功，不代表后端成功

Device Flow 很快就跑通了，但随后出现了一个很典型的桌面应用网络问题。

浏览器已经显示：

```text
Congratulations, you're all set!
```

Mira 却仍然停在“等待授权”。

日志里真正发生的是：浏览器可以访问 GitHub，但 Node 后端直连 `github.com:443` 持续超时。浏览器走了代理，后端的 `fetch` 没走。

这件事暴露了两个问题。

第一，Device Flow 的轮询不能把一次网络抖动当成永久失败。后端需要保留授权会话并退避重试，前端也不能碰到一次超时就停止确认。

第二，GitHub 不能再单独发明一套代理设置。Mira 已经有通用 SOCKS5 出口，GitHub 的登录、用户信息、installation 和 API 请求都应该复用它。

最终链路变成：

```text
浏览器完成授权
        ↓
后端持续轮询，不因瞬时超时终止
        ↓
GitHub 请求复用 Mira 通用 SOCKS5
        ↓
取得 token 并加密落库
        ↓
加载真实授权仓库
```

这次修复的价值不只在“终于连上了”。它把浏览器与本地后端之间那条容易被忽视的网络边界补完整了。

## 四个 Read 不是 GitHub 接入

授权完成后，我们最初做了四个只读工具：仓库、Issue、Pull Request 和 Actions 状态。

它们能跑，也能返回 Artifact，甚至已经足够做一些项目概览。但我很快意识到，这仍然不是我想要的 GitHub 接入。

只读能力只能“看见项目”，不能真正参与协作。

另一个极端也不好：把 GitHub API 拆成十几个甚至几十个原子工具，会让 Planner 面对一片工具海洋。工具数量膨胀以后，路由、参数选择、审批和可观测性都会越来越难控制。

最后我们把能力收敛为四个领域工具：

```text
github_repository
github_issue
github_pull_request
github_actions
```

工具数量仍然只有四个，但内部使用有限的 `operation` 枚举和独立参数 Schema，共覆盖 29 个主要操作。

`github_repository` 负责仓库、分支、提交、文件和比较；`github_issue` 负责查询、创建、更新、评论与状态流转；`github_pull_request` 负责读取、创建、Review 与合并；`github_actions` 负责运行、日志、dispatch、rerun 和 cancel。

这不是一个松散的万能 `action` 参数。每个 operation 都有自己的参数合同，无关字段会在执行前被拒绝。

工具少，不代表能力弱。真正重要的是，一个工具是否承担了清楚而完整的领域职责。

## 写操作必须进入审批链

GitHub 能力一旦从读取走向写入，问题就不再只是“接口能不能调用”。

创建 Issue、修改文件、提交 Review、合并 PR、取消工作流，都会改变远程世界。它们必须留下明确的意图和证据。

因此读取操作可以直接执行，所有远程写入都进入 Harness 的精确输入审批。审批只对当前工具和当前参数指纹有效；仓库、分支、正文、SHA 或文件内容发生变化后，必须重新批准。

删除文件、合并 PR、取消 Actions 运行被归为更高风险动作，需要更明确的确认。

```text
读取当前事实
        ↓
形成具体写入参数
        ↓
Harness 审批
        ↓
执行远程操作
        ↓
回读 GitHub 验证最终状态
```

最后一步尤其重要。不能因为写接口返回成功，就直接告诉用户“完成了”。创建 Issue 后要回读编号和状态，提交文件后要确认 commit SHA，合并 PR 后要确认 `merged=true`，触发工作流后要重新读取 run 状态。

请求已经发出，不等于事情已经完成。

## 微应用、工具与 Skill 终于分开了

完成四个领域工具后，我们又增加了一个 `GitHub 协作` Skill，由 Mira Lab 提供。

它不注册新工具，也不会因为被命中就扩大 Planner 的 ToolExposure。它负责的是另一层问题：当用户说“看看这个项目最近怎么样”“把这个需求建成 Issue”“审查 PR #42”时，Agent 应该采用什么协作方法。

Skill 里定义了五类主要工作流：

- 项目脉搏；
- Issue 管理；
- Pull Request 审查；
- 交付推进；
- Actions 故障诊断。

于是整个结构终于稳定下来：

```text
GitHub 微应用
负责登录、installation 与仓库授权

GitHub 四个领域工具
负责真实读取与远程操作

Harness
负责仓库校验、审批、Evidence 与 Trace

GitHub 协作 Skill
负责领域方法、执行顺序与交付质量

Planner
只使用当前任务真实暴露的能力
```

微应用不是工具，Skill 也不是工具。授权、执行、治理和方法各自拥有自己的真相源。

## 接入完成的标准，不是页面亮起来

这次最值得记录的，不是我们最终接入了多少 GitHub API，而是中间几次差点把半成品当成完成。

Device Flow 授权成功，不等于后端拿到了 token；仓库列表出现，不等于工具会遵守授权范围；四个 Read 能执行，不等于 Mira 已经具备 GitHub 协作能力；写接口可以调用，也不等于远程操作是安全和可验证的。

最终验收覆盖了四个工具的严格注册、29 个 operation 的 Schema、参数互斥、未审批不发送写请求、审批后的远程请求格式、旧只读工具退出注册，以及 Server typecheck、指定 Vitest 和根目录 `pnpm check`。

到这里，我才愿意把它称为一次完整接入。

GitHub 微应用只是门。

门后还要有清楚的房间、可靠的通道、守门的规则，以及知道怎样在里面工作的人。对 Mira 来说，这四层分别是微应用、领域工具、Harness 和 Skill。

真正的能力，从来不是把一个图标放进设置页。

它是从用户点击“连接 GitHub”开始，一直延伸到 Mira 能够理解项目、推进协作、执行远程操作，并且让每一步都有边界、有证据、可以被人接住。