---
title: 更新日志
description: Mira Desktop 自 v0.101.0 以来的待发布变化，以及当前 Release / R2 / macOS Intel 发布链说明。
group: 现状与方向
order: 19
---

# 更新日志

> 本页是面向官网读者的公开版更新说明。版本事实与最终发布记录以 [Mira Desktop CHANGELOG](https://github.com/uichat-mira/mira-desktop/blob/dev/CHANGELOG.md) 和 [GitHub Releases](https://github.com/uichat-mira/mira-desktop/releases) 为准。

## 待发布 · 自 v0.101.0 以来

Mira Desktop 当前根包版本仍是 `0.101.0`。下面这些变化已经进入 `dev`，但**还没有被命名成下一个正式版本**，因此这里不提前写成 `v0.102.0`。

核对基线：

- 上一正式版本：`v0.101.0`（2026-09-19）
- 当前开发基线：`dev@e4826ed`
- 相比 `v0.101.0`：约 198 个 commits

### 导航从“聊天侧栏”长成应用级工作台

Mira 新增了应用级 Navigation Rail。

知识库、评测中心、开发工具、关于、远程访问与 Forge 等能力开始拥有独立工作区，不再全部挤在聊天侧栏或设置页里。页面骨架、页边距、嵌套路由选中态也一起统一；设备配对弹窗和菜单交互做了相应收紧。

这次变化更接近一次信息架构整理，而不是单纯换皮。

### 新对话默认就是 Agent

Desktop 新建对话现在默认进入现有 Agent Runtime，不再要求用户先手动打开 Agent。

界面也随之收敛：

- 主按钮继续叫“发送”，不再把 Agent 当作一个需要额外理解的发送模式；
- 历史非 Agent 路径明确标记为“兼容 Chat”；
- 既有 Thread 保留自己原来的 `agentEnabled` 状态，不做历史迁移；
- Role 图片动作不再因为默认 Agent 而无条件消失。

换句话说，Agent 开始成为默认运行方式，但旧聊天合同还没有被粗暴删除。

### Agent 的工作空间所有权被重新收口

`v0.101.0` 里的 Conversation Workdir 曾经承担一套独立身份。现在这层所有权已经退休。

当前合同收敛为：

```text
显式 ChatWorkspace
或
隐式 private per-conversation Agent workspace
```

没有显式 Workspace 的 Agent 对话会得到稳定的私有工作空间；选择了 ChatWorkspace 时，显式 Workspace 仍然优先。

AgentRun 现在只冻结并持久化一个 `workspaceRoot`。Artifact 也从这个被冻结的 source root 注册、持久化与读回。旧的 `conversation-workdirs` 磁盘目录名暂时保留，只是为了不搬动现有用户文件，不再代表一套独立运行时身份。

### Agent / SubAgent 的失败边界更稳

这一阶段没有重新发明 Agent Graph，而是继续修稳定性：

- Planner 对一次无效文本 decision 做有限修复，而不是无限重试；
- OpenAI-compatible Provider 的 SubAgent tool schema 会投影为合法 object root；
- approval resume 继续使用被冻结的 workspace root；
- 可恢复的 SubAgent 失败不再让仍在运行的 Parent Agent 提前退出“运行中”UI；
- Agent 运行期间的发送 / 停止状态和线程所有权增加了回归保护。

这些变化大多不会变成新按钮，但会减少“Agent 明明还在跑，界面却先结束了”一类错位。

### Windows 与跨平台测试链补强

Windows PowerShell sandbox 补了一轮比较扎实的运行时修正，包括：

- 退出码归一；
- stdout / stderr 延迟收尾；
- 非交互 PowerShell 进程终止；
- 核心环境变量与 `PSModulePath` 保留。

服务器全量测试也开始在 Linux + Windows CI 上跑，跨平台路径、Office / PDF 外部工具探测、宿主 Python 等差异被纳入自动检查。

### Review 与质量门不再只靠“看起来没问题”

工程侧新增或收紧了几条门：

- Mira AI Review 改由隔离的 OpenCode runner 执行；
- Provider / routing 进入受信配置；
- SonarQube Cloud Quality Gate 接入；
- CodeRabbit review 范围按 Desktop 路径收敛；
- Server Full Test CI 开始承担跨平台全量测试职责。

这些不会直接改变产品功能，但会改变一条修改进入 `dev` 前需要提供的证据。

### Intel Mac 第一次进入正式发布链

Intel macOS Electron 已经在真实 `darwin-x64` 环境完成一轮完整验证：

- Electron app / DMG 可以生成；
- 打包内使用 bundled Node 22；
- 后端 `/health` 成功；
- SQLite、sqlite-vec 与 Forge 初始化成功；
- 重启后复用同一数据库；
- graceful shutdown 后不遗留后台进程。

现在 Intel Mac 已有独立 CI，不再拖住 Windows 的 `Build Desktop Apps` workflow。

正式 `v*` 发布时：

- Intel DMG 会上传到独立 R2 前缀 `mira/macos-intel/latest/`；
- R2 成功后，再把 DMG 附加到同一个 GitHub Release；
- 官网下载菜单检测到该 Release 资产后，会把“macOS Intel · 即将提供”自动切换成真实下载入口。

当前 Intel DMG **仍未做 Developer ID 签名与公证**；Mira 的 canonical macOS target 仍保持 `darwin-arm64`。

## 打 tag 会自动做什么？

会，但有一个前提：**tag 必须与 `package.json` 的版本完全一致。**

例如未来准备发布 `v0.102.0`，必须先把根包版本正式准备成 `0.102.0`，再推送 `v0.102.0` tag。直接在当前 `0.101.0` 上打 `v0.102.0`，Release workflow 会主动失败。

`v*` tag 推送后，当前自动链会执行：

```text
Release Factory
→ Windows Electron / Tauri 构建与校验
→ 自动创建或更新 GitHub Release
→ GitHub 自动生成 Release Notes
→ Windows 资产同步 R2 mira/latest/

同时：
Intel macOS 构建
→ Mac R2 mira/macos-intel/latest/
→ R2 成功
→ DMG 附加到 GitHub Release
→ 官网下载入口自动可用
```

GitHub Release 的正文会通过 `generate_release_notes: true` 自动生成。

**官网这份 changelog 不会由 tag 自动写入。** 它是发布前维护的公开说明，用来把真正重要的产品变化从大量工程 commits 中整理出来。

## 完整差异

需要逐条追源码时，可以直接查看：

- [v0.101.0 → dev 完整比较](https://github.com/uichat-mira/mira-desktop/compare/v0.101.0...dev)
- [Mira Desktop CHANGELOG](https://github.com/uichat-mira/mira-desktop/blob/dev/CHANGELOG.md)
- [Mira Desktop Releases](https://github.com/uichat-mira/mira-desktop/releases)
