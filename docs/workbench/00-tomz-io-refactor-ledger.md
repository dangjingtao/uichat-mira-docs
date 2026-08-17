# tomz.io / Mira Docs 改造设计与任务账本

> 状态：Proposal / Implementation Ready
>
> 工作分支：`work/tomz-io-refactor`
>
> 基线分支：`dev`
>
> 目标：先把站点定位、信息架构、迁移边界与任务顺序固定下来；本文件提交阶段不改现有页面与构建逻辑。

---

## 0. 为什么要改

当前仓库同时承载：

- UIChat Mira 产品 / 技术文档；
- Mira Docs API；
- Design Markdown；
- Tomz / Mira 的博客与共同写作；
- `tomz.io` 根站点首页、SEO、PWA 身份。

这套结构早期很省事，但内容继续增长后会出现一个根本问题：**作者主站、项目文档站、共同写作空间正在争夺同一个站点身份。**

本轮改造不追求“重新做一个更漂亮的网站”，而是先解决站点职责。

### 改造后的基本判断

`tomz.io` 应成为 **Tomz 的作者主站 / 数字住所**。

它主要回答：

1. Tomz 最近在写什么、想什么；
2. Tomz 与 Mira 共同留下了什么；
3. Tomz 正在做哪些项目，以及从哪里继续进入这些项目。

Mira 的产品文档应逐步拥有独立站点身份，但 **Mira 来信、共同写作、一起阅读等作者内容继续属于 tomz.io**。

---

## 1. 当前代码基线

以下是本轮设计必须尊重的现状，不先推翻它。

### 1.1 当前顶层内容区

`src/site.config.ts` 当前顶层顺序为：

```text
docs
mira-docs-api
design-md
blogs
```

当前 `siteUrl` 为 `https://tomz.io`，SEO 全局开启。

### 1.2 Markdown 是当前内容真相源

`src/App.tsx` 通过：

```ts
import.meta.glob("./pages/**/*.md")
```

直接加载 `src/pages` 下的 Markdown。

因此本轮应继续把 Markdown 当作内容真相源，不引入 CMS、数据库或第二套文章格式。

### 1.3 当前博客分类与目录已经形成稳定关系

`vite.config.ts` 当前约束：

| group | 目录 |
| --- | --- |
| 产品手记 | `product-journal` |
| 工程现场 | `engineering` |
| 共同思考 | `shared-thinking` |
| Mira 来信 | `mira-letters` |
| 开发者生活 | `developer-life` |

当前 `src/pages/blogs` 已至少存在：

- `product-journal`
- `engineering`
- `shared-thinking`
- `mira-letters`

`developer-life` 已被构建规则支持，但当前目录列表中未看到实际目录，可继续作为可选分类处理。

### 1.4 作者关系已经进入数据模型

现有博客 frontmatter 已支持：

```yaml
author:
writingMode:
writtenBy:
reviewedBy:
commitUrl:
```

并且代码已经对：

- `Mira 来信`
- `共同思考`

做作者身份推断。

因此不要另起一套“Tomz / Mira 共创文章格式”。应扩展现有模型。

### 1.5 当前 SEO 身份仍是 UIChat Mira

现有静态 SEO 构建会生成：

- canonical；
- sitemap；
- robots.txt；
- Article / TechArticle JSON-LD；
- OpenGraph / Twitter meta。

但站点名称、首页文案、publisher、PWA manifest 当前都以 **UIChat Mira** 为中心。

这意味着：**只改首页 UI 不足以完成主站改造。站点身份必须和 SEO / PWA 一起拆。**

### 1.6 URL 与物理 Markdown 路径高度绑定

当前 SEO 路由直接由 `src/pages` 文件路径生成。

因此：

> 在没有 redirect / canonical 迁移机制之前，不允许为了目录“整洁”批量移动历史 Markdown。

这是本轮最重要的迁移约束。

---

# 2. 目标信息架构

## 2.1 tomz.io：作者主站

目标一级入口：

```text
/
/blogs
/thoughts        （展示入口；历史文章 URL 初期不强迁）
/reading
/projects
/about
```

### 首页 `/`

不再以 Mira 产品首页作为唯一身份。

首页承担：

1. Tomz 的简短作者定位；
2. 最近在想；
3. 最近写下；
4. 我和 Mira；
5. 正在做的项目。

首页不是文章列表，也不是项目文档索引。

### 博客 `/blogs`

保留现在的 Markdown 博客体系。

博客负责“完成度相对较高的文章”。

建议展示分类：

- 产品手记；
- 工程现场；
- Mira 来信；
- 共用的床；
- 开发者生活（有内容时显示）；
- 归档。

其中：

> **“共用的床”是展示品牌名，底层现有 `group: 共同思考` 和 `shared-thinking` 目录第一阶段不改。**

理由：既保住现有文章和 URL，又可以先验证新的栏目表达。

### 共用的床 `/thoughts`

这是“未完成思想”的独立阅读入口，不等于再造一个博客系统。

第一阶段建议做成对现有 `共同思考` 内容的专门聚合页：

- 入口名：共用的床；
- 历史正文仍链接到原 `/blogs/shared-thinking/...`；
- 不移动历史文件；
- 不强制修改 canonical。

后续如果这个内容模型稳定，再决定是否引入稳定的 `/thoughts/:slug` 公共路径。

建议扩展 frontmatter（均为可选）：

```yaml
thoughtStatus: seed | growing | settled
firstSeen: 2026-08-13
updated: 2026-08-17
```

展示含义：

- `seed`：萌芽；
- `growing`：发酵中；
- `settled`：暂时成形。

不设置“finished”，因为这个栏目本身允许未来继续推翻。

### 阅读 `/reading`

用于长期阅读 / 观看项目，例如：

- 读诗篇；
- 人生七年；
- 书；
- 纪录片；
- 未来其他连续阅读项目。

它与普通博客最大的区别不是样式，而是内容结构允许连续对话：

```text
原文 / 故事背景
Tomz 的反应
Mira 的解释或补充
再次讨论
现在留下的问题
```

继续使用 Markdown，不引入专门编辑器。

### 项目 `/projects`

只做作者主站上的项目索引。

建议至少承载：

- Mira；
- Com Design；
- 余光；
- 其他公开实验。

项目卡片只描述“它是什么 + 去哪里看”，不把技术文档搬进主站首页。

### 关于 `/about`

作者信息、站点说明、Tomz / Mira 的写作关系可以放在这里。

不要把 About 做成长履历页。

---

## 2.2 Mira 项目站

目标域名优先建议：

```text
mira.tomz.io
```

首轮不再增加 `docs.mira.tomz.io` 这一层，避免过度拆分。

Mira 项目站承载：

- 产品介绍；
- 使用文档；
- 技术文档；
- API；
- 架构；
- Changelog；
- Mobile / Agent / RAG 等项目性内容。

### 明确不迁走的内容

以下内容即使与 Mira 有关，也继续留在 `tomz.io`：

- Mira 来信；
- Tomz / Mira 共同写作；
- 共用的床；
- 一起阅读；
- 以作者经验为中心的产品随笔。

判断标准：

> **“别人为了使用 / 理解 Mira 产品而读” → Mira 项目站。**
>
> **“别人为了理解 Tomz / Mira 在想什么而读” → tomz.io。**

---

# 3. 视觉与交互方向

本轮不做全新 Design System。

继续沿用现有站点已经形成的：

- Claude / restrained visual language；
- Mira 星环 / orbit 视觉元素；
- Markdown 阅读体验；
- 现有作者信息模型；
- 现有移动端适配。

## 首页气质

首页应从“产品 Landing Page”变成“作者住所”。

关键词：

- 安静；
- 有人味；
- 内容优先；
- 少营销话术；
- 不做巨型炫技 Hero；
- 项目入口克制；
- Mira 存在，但不抢 Tomz 的作者主体。

推荐首页结构：

```text
Tomz Dang
一句作者定位

最近在想
3 条

最近写下
3~6 篇

我和 Mira
Mira 来信 / 共用的床 / 一起读

正在做
Mira / Com Design / 余光 / ...

Footer
```

## 博客页

继续使用当前列表页，不推翻阅读逻辑。

优先调整：

1. 页面标题与描述；
2. 分类展示名；
3. 作者关系表达；
4. 分类说明；
5. 首页与博客之间的跳转关系。

不优先做：

- 卡片大改版；
- 动画重做；
- 每个栏目一套皮肤。

---

# 4. URL / SEO / 迁移原则

## 原则 1：历史文章 URL 优先稳定

现有 `/blogs/...` 文章原则上不因为本轮 UI 改造而移动。

特别是：

```text
/blogs/shared-thinking/:slug
/blogs/mira-letters/:slug
/blogs/product-journal/:slug
/blogs/engineering/:slug
```

第一阶段保持。

## 原则 2：展示名与存储名解耦

例如：

```text
内部 group: 共同思考
内部目录: shared-thinking
展示栏目: 共用的床
```

这允许先验证信息架构，不需要立刻制造 SEO 迁移。

## 原则 3：任何物理移动之前先建立迁移表

迁移表至少包含：

```text
oldPath
newPath
action: keep | redirect | alias
canonical
ownerSite: tomz | mira
```

## 原则 4：主站与 Mira 站必须有不同站点身份

域名拆分后需要分别生成：

- `<title>` 模板；
- description；
- canonical；
- OpenGraph site name；
- JSON-LD publisher / author；
- sitemap；
- robots.txt；
- PWA manifest（如 Mira 站继续保留 PWA）。

不能继续用一套全局 `UIChat Mira` 元数据覆盖所有页面。

## 原则 5：迁移不以“目录整齐”为 KPI

一个旧 URL 不漂亮，但已经稳定存在，比为了洁癖改成漂亮新 URL 更有价值。

---

# 5. 内容模型设计

## 5.1 继续保留的通用字段

```yaml
title:
description:
group:
order:
date:
readTime:
tags:
cover:
author:
writingMode:
writtenBy:
reviewedBy:
commitUrl:
```

## 5.2 思想栏目新增可选字段

```yaml
thoughtStatus:
firstSeen:
updated:
```

## 5.3 阅读栏目建议新增可选字段

```yaml
series:
episode:
readingStatus: reading | paused | completed
sourceTitle:
```

不要求所有文章补字段；只有对应栏目使用。

---

# 6. 实施任务卡

任务顺序按依赖关系排列。除非明确说明，所有任务都从 `work/tomz-io-refactor` 继续工作。

---

## BR001｜内容盘点与迁移清单

**目标**

把现有 `src/pages` 内容按“作者主站 / Mira 项目站 / 保持原址”分类，生成后续迁移的唯一清单。

**要做**

1. 遍历 `src/pages/**/*.md`；
2. 输出每篇内容的：路径、标题、group、当前 URL；
3. 标记：
   - `tomz-keep`
   - `mira-move`
   - `review`
4. 给所有计划迁移内容生成 `oldPath -> targetPath` 草案；
5. 不移动文件。

**产物**

建议：

```text
docs/workbench/01-content-migration-map.md
```

**禁止**

- 不批量改 frontmatter；
- 不移动 Markdown；
- 不改线上 URL；
- 不凭标题自动判断全部归属，模糊项保留 `review`。

**验收**

- 所有现有 Markdown 均在清单中；
- 每篇只有一个当前 URL；
- 迁移项都有明确 oldPath；
- `Mira 来信` / `共同思考` 默认归 `tomz-keep`。

---

## BR002｜作者主站首页与一级导航

**依赖**：BR001 可并行后半段，但不得依赖内容实际迁移。

**目标**

让 `tomz.io` 首屏身份从“UIChat Mira 产品首页”切换为作者主站，同时不破坏现有 docs / blogs 路由。

**要做**

1. 新首页内容结构：
   - 作者定位；
   - 最近在想；
   - 最近写下；
   - 我和 Mira；
   - 正在做；
2. 一级导航按作者主站重新组织；
3. `/blogs` 保持可达；
4. 项目文档入口暂时仍可指向原站内路径；
5. 首页内容尽量由现有 Markdown 数据计算，不手写重复文章列表。

**设计约束**

- 不做新的 Design System；
- 不做巨型营销 Hero；
- Mira 是重要共同作者 / 项目，但不是首页唯一主体；
- 移动端优先保证信息顺序与可点击性。

**禁止**

- 不迁移 docs；
- 不改历史文章 URL；
- 不在首页复制整篇项目介绍。

**验收**

- 用户打开 `/` 能明确理解这是 Tomz 的个人主站；
- 最近文章来自真实内容数据；
- Mira / Com Design / 余光可作为项目入口展示；
- 原有博客文章仍正常访问。

---

## BR003｜博客信息架构 + “共用的床”

**依赖**：BR002。

**目标**

在不移动历史 Markdown 的前提下，把博客分类从工程目录名提升为面向读者的栏目语言，并建立“共用的床”入口。

**要做**

1. 将 `共同思考` 的展示名映射为 `共用的床`；
2. 底层 `group: 共同思考`、`shared-thinking` 目录暂不改；
3. 增加 `/thoughts` 聚合入口或等价一级入口；
4. `/thoughts` 列表读取现有共同思考文章；
5. 文章详情首阶段继续使用原 `/blogs/shared-thinking/...`；
6. 支持可选字段：
   - `thoughtStatus`
   - `firstSeen`
   - `updated`
7. 没有新字段的历史文章必须正常显示。

**禁止**

- 不把全部历史 `共同思考` frontmatter 批量改名；
- 不移动 `shared-thinking` 目录；
- 不创造第二套 Markdown loader。

**验收**

- 用户界面主要看到“共用的床”，而不是工程目录语言；
- 历史文章 URL 不变；
- 旧文章无新字段时不报错；
- `Mira 来信` 的作者推断逻辑不受影响。

---

## BR004｜阅读与项目入口

**依赖**：BR002。

**目标**

补齐作者主站两个长期模块：`阅读` 与 `项目`。

**要做**

### 阅读

1. 建立 `/reading`；
2. 继续以 Markdown 为内容源；
3. 支持：
   - `series`
   - `episode`
   - `readingStatus`
   - `sourceTitle`
4. 首批内容允许为空，不为了页面完整伪造文章。

### 项目

1. 建立 `/projects`；
2. 首批项目入口：Mira / Com Design / 余光；
3. 项目卡仅保留简介、状态、链接；
4. 后续项目允许通过配置或轻量数据结构追加。

**禁止**

- 阅读模块不做复杂书架系统；
- 不引入 CMS；
- 项目页不复制项目技术文档。

**验收**

- `/reading` 和 `/projects` 可直接从主站导航进入；
- 无内容状态正常；
- 新增一篇 reading Markdown 不需要改页面代码；
- 项目链接支持站内与外部地址。

---

## BR005｜Mira 项目站身份拆分

**依赖**：BR001，建议 BR002~BR004 稳定后执行。

**目标**

让 Mira 产品 / 技术文档可以独立运行在 `mira.tomz.io`，并且不再与 tomz.io 共用一套站点身份。

**要做**

1. 明确 Mira 站内容 roots；
2. 构建层支持按站点生成内容；
3. tomz.io 与 Mira 站分别配置：
   - `siteUrl`
   - site name
   - title template
   - description
   - logo / social meta
   - JSON-LD 身份
   - sitemap
   - robots
4. Mira 站继续使用现有产品视觉语言；
5. tomz.io 不再输出 `UIChat Mira` 作为全局 publisher / site name；
6. PWA manifest 只在有明确产品意义的站点保留。

**优先目标域名**

```text
mira.tomz.io
```

**禁止**

- 不为了拆域名复制两份完整代码库；
- 不把 Mira 来信 / 共同写作迁到 Mira 项目站；
- 不在没有迁移表时移动 docs 文件。

**验收**

- 两个站点生成的 canonical 均指向各自域名；
- sitemap 不串站；
- tomz.io 首页和 Article meta 不再错误标记为 UIChat Mira 产品站；
- Mira 文档站仍可独立构建和访问。

---

## BR006｜迁移、Redirect 与回归验证

**依赖**：BR001、BR005。

**目标**

按迁移清单逐步迁出项目文档，并保证旧链接、SEO 和阅读体验可追踪。

**要做**

1. 按 `01-content-migration-map.md` 逐批处理；
2. 每次迁移同时建立 redirect / alias；
3. 校验 canonical；
4. 校验两个 sitemap；
5. 校验站内旧链接；
6. 校验 GitHub Pages / 实际部署环境；
7. 抽查移动端；
8. 记录无法安全迁移的旧 URL，宁可保持原址。

**最低回归清单**

```text
/
/blogs
至少 3 篇历史博客详情
Mira 来信
共同思考 / 共用的床
/reading
/projects
Mira docs 首页
Mira docs 深层文档
sitemap.xml
robots.txt
canonical
OG meta
404 fallback
```

**禁止**

- 不一次性批量移动所有目录；
- 不删除旧内容后再补 redirect；
- 不用 JavaScript 前端跳转代替可用的正式 redirect / 静态兼容方案，除非部署平台确实没有其他能力并在文档中说明。

**验收**

- 已迁移旧地址存在明确去向；
- 无主要 404 回归；
- SEO 元数据不串域名；
- 历史博客仍可正常阅读；
- `dev` 在合并前可完整构建。

---

# 7. 推荐执行顺序

```text
BR001 内容盘点
  ↓
BR002 作者首页 / 导航
  ↓
BR003 博客 / 共用的床
  ├── BR004 阅读 / 项目
  ↓
BR005 Mira 站身份拆分
  ↓
BR006 真实迁移 + SEO 回归
```

BR003 与 BR004 在 BR002 后可并行。

---

# 8. 本轮明确不做

以下不是当前阶段目标：

- 全站视觉推倒重做；
- 更换技术栈；
- 上 CMS；
- 把 Markdown 改成数据库；
- 给每个栏目创建独立子域名；
- 重写历史文章；
- 一次迁完所有项目文档；
- 为了目录漂亮修改已有稳定 URL；
- 把 Mira 从作者主站中完全移除。

---

# 9. 最终判断标准

这次改造完成后，站点应该形成两个清楚但互相连接的身份：

### tomz.io

> 一个人的数字住所。
>
> 有完成的文章，也有尚未想完的事情；有 Tomz，也有 Mira；项目从这里被看见，但不会淹没这个人的写作。

### mira.tomz.io

> 一个产品的正式住所。
>
> 让需要了解、使用、开发 Mira 的人，不必穿过 Tomz 的全部个人写作才能找到答案。

如果未来继续增加 Com Design 等独立项目，也沿用同一原则：**先证明它需要独立站点，再拆，不为架构漂亮提前分家。**
