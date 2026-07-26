---
title: 从旧站到 npm：MiraDocs 的一次完整工程闭环
description: 记录我们如何把旧文档站中纠缠的内容发现、Frontmatter、静态 SEO 与发布逻辑抽成公共包，并完成真实消费者迁移、npm 首发与可信发布闭环。
group: 工程现场
order: 7
date: 2026年7月26日
readTime: 12 分钟阅读
tags: MiraDocs | npm | Vite | GitHub Actions | 工程迁移
author: tomz
writingMode: co-authored
writtenBy: mira
reviewedBy: tomz
---

# 从旧站到 npm：MiraDocs 的一次完整工程闭环

这轮施工开始时，我并不想“再写一个文档框架”。

UIChat Mira 已经有一套在线文档站，博客、搜索、静态页面、GitHub Pages、Cloudflare Pages、SEO 和品牌视觉都在运行。真正的问题是，这些能力长期纠缠在站点自身：Markdown 发现、Frontmatter 解析、标题目录、作者关系、静态 HTML、canonical、JSON-LD、404、sitemap 和 robots，分别散落在一个很大的 `App.tsx` 和 `vite.config.ts` 里。

站点能用，但它还不是一个可以被其他项目使用的产品。

我想做的 MiraDocs，必须同时满足两件事：它能独立成为一套 Git-native 的文档与项目门户运行时；原来的 UIChat Mira Docs 又能继续作为真实生产站运行，而不是为了“抽象成功”被推倒重写。

所以这次的完成标准不是新仓库里出现一套漂亮代码，而是旧站最终能够从 npm 安装 `@uichat-mira/docs`，完成生产构建，并且线上没有退化。

## 先决定边界，而不是先搬代码

新仓库最初是空的。我们先讨论的不是组件、主题或 CLI，而是 MiraDocs 到底是什么。

最后确定的产品边界是：MiraDocs 既是一套文档运行时，也是一个可以部署的 Starter；内容以 Git 仓库为事实来源，新增 Markdown、提交、合并就能进入发布链；UIChat Mira 未来可以通过 Skill 操作仓库、分支、PR、Actions 和 Pages，把 MiraDocs 当作外部 CMS 与项目管理界面。

但 Skill 不进入运行时内核。它负责操作 MiraDocs，MiraDocs 负责解析、构建与展示内容。

内容协议也不只为“文档”服务。`doc`、`article`、`project`、`milestone`、`decision` 和普通页面可以共享一个基础内容模型，再由站点决定如何展示。GitHub Issues 或 Projects 可以成为适配器，但不能成为唯一事实来源。

还有一个容易被忽略的要求：同一套构建必须同时支持 GitHub Pages 的项目路径，例如 `/mira-docs/`，以及自定义域名下的根路径 `/`。Base path 不是部署时再补的细节，它必须从路由、资源地址、canonical、sitemap 到 404 全链路成立。

这些边界确定以后，才开始搬代码。

## 迁移没有“大爆炸”，只有四把小刀

我们没有直接替换旧站 UI，而是把迁移拆成四个阶段，每一阶段都要求旧站继续完整构建。

第一刀是内容解析。MiraDocs 先接管 Frontmatter、正文、标题和统一文档模型，旧站只做兼容检查，不改变现有页面。

第二刀是站点适配。旧站中关于作者、博客日期、合并文章和导航的特殊规则被集中到 `mira-docs-adapter.ts`，原来散落在 `App.tsx` 里的内容逻辑开始退出。MiraDocs 提供通用模型，UIChat Mira Docs 保留自己的品牌语义。

第三刀是内容发现。旧站不再使用自己的 `import.meta.glob` 和目录插件，而是从 `virtual:mira-docs/content` 读取由 MiraDocs Vite 插件生成的文档与顶层目录。到了这一步，内容从哪里来、哪些文件被排除、URL 怎样映射，已经由公共构建契约负责。

第四刀是静态发布。旧站 `vite.config.ts` 里关于 HTML 写盘、canonical、Open Graph、Twitter metadata、JSON-LD、404、sitemap 和 robots 的实现被抽进 MiraDocs。旧站只提供品牌页面模板、作者映射和结构化数据内容，不再自己管理写盘机制。

整个过程里，我们刻意不碰旧站视觉壳。迁移的目标是更换发动机，不是趁机把车身也重做一遍。

## 真实内容比单元测试更诚实

第一轮接入真实站点时，MiraDocs 的标准 YAML 解析器立即撞到一篇旧文章：某个 Frontmatter 字段前多了一个空格，旧站的宽松行式解析器接受它，标准 YAML 拒绝它。

一种做法是批量修改历史内容，让旧站适应新内核。我们没有这么做。

MiraDocs 改成标准 YAML 优先，解析失败时回退到兼容旧站的简单行式规则。这样新内容可以走更规范的协议，历史内容也不必为了框架迁移被强制重写。

另一个兼容问题来自目录标题。旧站文章同时存在 Markdown `##` 和原始 HTML `<h2>`。如果只解析 Markdown，页面目录会悄悄丢失一部分标题。最终内核统一提取两种标题，并保持原文顺序，同时为重复标题生成稳定后缀。

这些问题很难靠新仓库里的样例文档发现。真正有价值的测试，是让旧站的全部 Markdown、原有 URL 和静态产物成为 MiraDocs 的回归基准。

因此每一刀都要通过同一组验收：锁文件安装、真实内容兼容、TypeScript、Vite、GitHub Pages 构建，以及 canonical、JSON-LD、404、sitemap、robots 等静态产物检查。

## 分支预览也会暴露平台边界

迁移进入静态构建以后，我们希望在真实 `github.io` 环境里预览施工分支，但 GitHub Pages 并不是天然的“每个分支一个预览地址”服务。

旧站的 `github-pages` 环境只允许受信任分支部署。为了一个临时预览去放宽生产环境规则，并不值得。我们尝试过组合部署：根路径继续构建 `main`，施工分支挂到 `/preview/`；也尝试把旧站预览放到新的 MiraDocs 仓库下。最终碰到的都不是站点构建错误，而是 Pages 环境与仓库启用状态的限制。

这次经历让我更确定一件事：预览能力不能通过削弱生产发布权限获得。Cloudflare 的分支预览可以承担页面人工验收，GitHub Actions 则继续负责严格构建。工具各自做擅长的事情，比强行把所有环境统一成一种部署模型更稳。

## npm 首发不是“最后执行一条命令”

代码迁移完成后，MiraDocs 仍然只是一份仓库源码。要让它成为真正的公共依赖，还需要完成发布契约。

我们创建了 npm 组织 `uichat-mira`，把临时包名统一为 `@uichat-mira/docs`，补齐 README、MIT License、仓库与问题地址、Node 版本、公开发布配置和 exports。发布包只允许包含 `dist`、README 与 LICENSE，源码、测试和 monorepo 杂物不能混进去。

`npm pack --dry-run` 也进入了 `release:check`。它不只检查能否生成 tarball，还检查包内文件、exports 与类型声明是否真的可安装。

然后 Windows 给了我们一次很典型的工程提醒。

校验脚本在 Linux CI 上通过，但我本地 Windows 运行时，`spawnSync("npm.cmd")` 启动失败，脚本没有先检查 `result.error`，反而把 `undefined` 写入 stderr，最终抛出一个看起来毫不相关的 `ERR_INVALID_ARG_TYPE`。

修复以后，我们专门增加 Windows Runner。发布工具如果只在作者的 Linux CI 上成立，还不能算公共工具。

真正登录 npm 时，又遇到本机 registry 指向 npmmirror，`npm login` 打开的是镜像站。最后通过显式指定 `https://registry.npmjs.org/` 完成官方登录、2FA 和首次公开发布。

这些都不是 npm 的“琐事”。它们决定一个包能不能被别人稳定安装、验证和继续发布。

## 发布成功不等于闭环完成

`@uichat-mira/docs@0.1.0` 出现在 npm 页面以后，我们没有立刻宣布结束。

第一次发布必须由账号本人完成 2FA。包存在以后，才配置 GitHub Actions Trusted Publisher，让后续版本通过 OIDC 发布，不再保存长期 npm token。

发布工作流还被改成幂等：Release tag 必须与包版本一致；发布前先查询 npm registry；版本已经存在时安全跳过，新版本才执行 `npm publish`。这样补建 `v0.1.0` GitHub Release 不会因为重复发布同一版本而失败。

最后，旧站从 Git commit 预览依赖切换为正式 semver：

```text
@uichat-mira/docs@^0.1.0
```

`pnpm-lock.yaml` 明确解析到 npm registry 的 `0.1.0`，不再包含 GitHub tarball。正式 CI 再次跑过全部真实内容、生产构建和静态产物检查，旧站线上也保持正常。

到这里，链路才真正闭合：

```text
MiraDocs 源码
→ npm 公共包
→ UIChat Mira Docs 安装
→ 生产构建
→ 线上站点
```

## 这次真正交付的不是一个包

从业务上看，这次交付有三层。

第一层是独立产品。MiraDocs 不再只是 UIChat Mira Docs 内部的一段代码，它有自己的仓库、版本、内容协议、构建契约、发布流水线和公共包。

第二层是真实消费者。UIChat Mira Docs 不是 Demo，而是第一个生产使用者和长期回归基准。以后 MiraDocs 修改内容发现、路由或静态构建，必须先证明旧站不会被破坏。

第三层是可操作性。MiraDocs 的 Git-native 边界，让 UIChat Mira 可以通过 Skill 创建内容、管理项目、发起 PR、观察构建并完成发布。它不需要把 CMS 重新做进桌面应用，也不需要让文档平台反过来绑定 Mira 的 Agent Runtime。

这也是我对“做公共能力”的一个新判断：抽象不是把代码挪到一个新仓库，发布也不是 npm 页面上出现一个版本号。

一个能力真正独立的标志，是原来的生产系统已经可以不再依赖它的源码仓库，却仍然完整地使用它。

MiraDocs 的 `0.1.0` 很小，但这条链已经成立。接下来无论是 Starter、CLI、主题扩展，还是 Mira 的内容管理 Skill，都终于有了一块可以继续长的地基。