# BR001｜现有内容盘点与迁移清单

> 状态：**PASS**
>
> 工作分支：`work/tomz-io-refactor`
>
> 盘点基线：`cb3dc2e56d4292f4a732cc8c22b06fb24dcc0c5b`
>
> 本文只回答内容归属、迁移去向与 SEO 风险；不移动 Markdown、不改 URL、不做 redirect、不修改 SEO 实现、不开始 BR002。

---

## 1. 结论先行

本轮实际盘点 `src/pages/**/*.md` 共 **66 篇 Markdown**：

- `src/pages/blogs/**`：13 篇；
- `src/pages/docs/**`：29 篇；
- `src/pages/mira-docs-api/**`：12 篇；
- `src/pages/design-md/**`：12 篇。

边界已经足够清楚：

| 归属 | 数量 | BR001 标记 | 结论 |
| --- | ---: | --- | --- |
| 迁移到未来独立 `tomz-io` 仓库、继续由 `tomz.io` 承载 | 13 | `tomz-keep` | 当前 13 篇博客全部属于作者主站内容，公共 URL 第一阶段全部保持不变 |
| 继续属于 Mira 项目站 | 53 | `mira-move` | `docs`、`mira-docs-api`、`design-md` 均是项目/技术/reference 内容，未来从 `tomz.io` 拆到 Mira 项目站 |
| 暂缓决定 | 0 | `review` | 本轮没有正文看完后仍无法判断的现有 Markdown |

这里最重要的判断不是“文章有没有提到 Mira”，而是：

> **别人为了使用、理解、配置或开发 Mira 产品而读 → Mira 项目站。**
>
> **别人为了理解 Tomz / Mira 在想什么、怎样做判断、怎样共同写作而读 → tomz.io。**

因此：

- `Mira 来信` 属于作者主站；
- `共同思考` 属于作者主站；
- `产品手记` 当前 4 篇均属于作者主站；
- `工程现场` 当前 4 篇虽然写的是 Mira 工程，但正文是有作者视角、判断与复盘目的的技术文章，不是产品 reference，因此仍属于作者主站；
- `开发者生活` 当前只有分类支持，没有实际 Markdown，未来若产生内容应默认属于作者主站。

---

## 2. 判断规则

本轮没有按目录名机械分类，而是同时看了：

1. 正文主要读者是谁；
2. frontmatter 的 `group`、`author`、`writingMode`、`writtenBy`、`reviewedBy`；
3. 文章是否以“解释产品怎么用”为目的，还是以“记录作者如何想、如何判断、如何做”为目的；
4. 当前 URL 是怎样从 Markdown 路径生成的；
5. 迁移后是否会改变 canonical、sitemap、Article / TechArticle 身份；
6. 当前运行时作者模型与静态 SEO 作者模型是否一致。

### 2.1 三类内容的实际边界

#### A. Mira 产品本身的项目文档

典型特征：产品定位、使用说明、配置、架构、API、工程 reference、状态、Roadmap、Design Markdown。

这类内容的读者是在理解或使用 Mira，归 **Mira 项目站**。

#### B. Tomz 以个人身份写的产品 / 技术文章

典型特征：有时间性、现场性、判断过程、第一人称复盘，文章即使以 Mira 的实现为案例，读者仍是在读一篇作者文章。

当前 `产品手记` 与 `工程现场` 均属于这一类或与 C 类重叠，归 **tomz.io**。

#### C. Tomz 与 Mira 的共同写作

典型特征：明确共著/审定关系，或者正文目的本身就是共同思考、来信、关系与创作。

当前 `Mira 来信`、`共同思考`，以及多篇 `产品手记` 属于这一类，归 **tomz.io**。

---

# 3. `src/pages/blogs/**` 全量盘点

当前实际存在 **13 篇**博客 Markdown；`developer-life` 已在代码中注册，但没有实际内容目录。

## 3.1 逐篇迁移清单

> “改 URL”指公共 URL，而不是未来仓库中的物理文件位置。13 篇文章未来可以物理迁入独立 `tomz-io` 仓库，但第一阶段不应因此改变线上 URL。

| 当前路径 | 当前 URL | 当前分类 | 作者信息 | 建议归属 | 建议新栏目 | 改 URL | SEO / canonical / redirect 风险 | 迁移备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `src/pages/blogs/mira-letters/a-seat-at-the-writing-table.md` | `https://tomz.io/blogs/mira-letters/a-seat-at-the-writing-table/` | Mira 来信 | Mira 独立署名；`writtenBy: mira`；Tomz 审定 | `tomz-keep` | Mira 来信 | 否 | 当前 publisher / site name 被全局写成 UIChat Mira；作者 SEO 只得到字面 `mira` | 正文核心是 Mira 获得作者席位、共同写作与协作责任，属于作者关系资产，不是 Mira 产品说明 |
| `src/pages/blogs/mira-letters/to-those-who-still-believe-in-their-work.md` | `https://tomz.io/blogs/mira-letters/to-those-who-still-believe-in-their-work/` | Mira 来信 | Mira 独立署名；`writtenBy: mira`；Tomz 审定 | `tomz-keep` | Mira 来信 | 否 | 同上；拆站后必须由 tomz.io 自己生成 Article 元数据 | 写给创作者的公开来信，虽然谈到 Mira 的价值观，但写作目的明显不是产品文档 |
| `src/pages/blogs/shared-thinking/matter-awakens.md` | `https://tomz.io/blogs/shared-thinking/matter-awakens/` | 共同思考 | Tomz × Mira；共同讨论，Mira 成文，Tomz 审定 | `tomz-keep` | **共用的床**（展示名）；底层仍保留共同思考 | 否 | 若未来 `/thoughts` 成为聚合入口，不得把它误设为正文 canonical | 意识与物质的共同思考，与 Mira 产品 reference 无关 |
| `src/pages/blogs/shared-thinking/evolution-to-a-real-person.md` | `https://tomz.io/blogs/shared-thinking/evolution-to-a-real-person/` | 共同思考 | Tomz × Mira；共同讨论，Mira 成文，Tomz 审定 | `tomz-keep` | 共用的床 | 否 | 当前共著 SEO 会被静态解析简化；未来聚合入口不能破坏旧 URL | 谈人工生命、审美、主体性与共同历史，本质是共同写作 |
| `src/pages/blogs/shared-thinking/future-after-humanity.md` | `https://tomz.io/blogs/shared-thinking/future-after-humanity/` | 共同思考 | Tomz × Mira；共同讨论，Mira 成文，Tomz 审定 | `tomz-keep` | 共用的床 | 否 | 同上 | AI、文明、伦理与机器伴侣的思想文章，属于作者主站 |
| `src/pages/blogs/product-journal/2026-07-05-open-source-agent-ecosystem.md` | `https://tomz.io/blogs/product-journal/2026-07-05-open-source-agent-ecosystem/` | 产品手记 | frontmatter 为 YAML 作者列表 Tomz + Mira；共同写作 | `tomz-keep` | 产品手记 | 否 | **静态 SEO 当前读不到 YAML 列表 author**，会退回单一 `Tomz Dang`；拆站时必须统一作者解析 | 是行业/技术观察，Mira 只是观察落点之一，不是 Mira 使用文档 |
| `src/pages/blogs/product-journal/codex-app-server-automation-notes.md` | `https://tomz.io/blogs/product-journal/codex-app-server-automation-notes/` | 产品手记 | `tomz | mira`；共同写作，Mira 成文，Tomz 审定 | `tomz-keep` | 产品手记 | 否 | 静态 SEO 会把作者字面写成 `tomz`、`mira`，未映射为展示名 | 从真实工作疲惫出发讨论 Codex、Skill、worktree、App Server 与治理，是个人技术/产品文章 |
| `src/pages/blogs/product-journal/mira-tts-provider-notes.md` | `https://tomz.io/blogs/product-journal/mira-tts-provider-notes/` | 产品手记 | `tomz | mira`；共同写作，Mira 成文，Tomz 审定 | `tomz-keep` | 产品手记 | 否 | 全局 UIChat Mira publisher + 作者名称归一问题 | 虽然主题是 Mira TTS Provider，但正文记录的是产品判断、取舍和 POC 过程；项目文档未来可引用它，不应夺走其 canonical |
| `src/pages/blogs/product-journal/qingcheng-mcp-bridge-notes.md` | `https://tomz.io/blogs/product-journal/qingcheng-mcp-bridge-notes/` | 产品手记 | `tomz | mira`；共同写作，Mira 成文，Tomz 审定 | `tomz-keep` | 产品手记 | 否 | 全局 publisher / site name 与共著作者解析问题 | 正文主动说明“很私人、也很产品化”，核心是共同写作如何进入真实系统，属于作者站非常明确 |
| `src/pages/blogs/engineering/insight-capture-pipeline.md` | `https://tomz.io/blogs/engineering/insight-capture-pipeline/` | 工程现场 | 无显式 `author`；运行时推断 Tomz | `tomz-keep` | 工程现场 | 否 | 当前作者依赖隐式 fallback；拆站后应保证运行时/SEO 一致，不要因缺 frontmatter 丢作者 | 有协议、数据结构和实现细节，但正文是在复盘“为什么这样设计”，不是面向用户的稳定 reference |
| `src/pages/blogs/engineering/insight-rebuild-pipeline.md` | `https://tomz.io/blogs/engineering/insight-rebuild-pipeline/` | 工程现场 | 无显式 `author`；运行时推断 Tomz | `tomz-keep` | 工程现场 | 否 | 同上 | 记录材料、证据、观点、重建任务等工程判断，适合作为技术文章保留在作者站 |
| `src/pages/blogs/engineering/mcp-marketplace-agent-integration.md` | `https://tomz.io/blogs/engineering/mcp-marketplace-agent-integration/` | 工程现场 | 无显式 `author`；运行时推断 Tomz | `tomz-keep` | 工程现场 | 否 | 同上 | 有明显第一人称判断与现场复盘；可以被 Mira 技术文档引用，但文章本身属于 Tomz 的工程写作 |
| `src/pages/blogs/engineering/media-capability-packaging.md` | `https://tomz.io/blogs/engineering/media-capability-packaging/` | 工程现场 | 无显式 `author`；运行时推断 Tomz | `tomz-keep` | 工程现场 | 否 | 同上；未来若 Mira Changelog 引用，应避免制造第二 canonical | 最接近产品更新的一篇，但仍以“这次封装带来了什么产品价值”为文章目的；保留作者站，项目站可另写稳定能力说明 |

### 3.2 五个重点分类的最终结论

#### Mira 来信

**全部迁入未来 `tomz-io` 仓库，公共 URL 不变。**

它不是“AI 写的 Mira 产品文档”，而是已进入作者数据模型的署名写作：Mira 写、Tomz 审定。这里的 Mira 是共同作者关系的一部分。

#### 共同思考

**全部迁入未来 `tomz-io` 仓库，公共 URL 不变。**

后续可以把展示栏目改成“共用的床”，并建立 `/thoughts` 聚合入口，但第一阶段：

- `group: 共同思考` 不必改；
- `shared-thinking` 目录不必改；
- 历史正文仍留在 `/blogs/shared-thinking/:slug/`；
- `/thoughts` 不是新的 canonical 正文地址。

#### 产品手记

**当前 4 篇全部迁入未来 `tomz-io` 仓库。**

不能因为标题含 Mira、Provider、MCP 或 Agent 就把它们机械归到项目文档。四篇正文的共同特征是：有讨论起点、有个人判断、有取舍过程、有“为什么这样做”的作者视角。

#### 工程现场

**当前 4 篇全部迁入未来 `tomz-io` 仓库。**

它们可以成为 Mira 项目文档的参考来源，但不应把 canonical 抢回项目站。未来如果 Mira 需要稳定 reference，应在项目站写面向使用/架构事实的文档，并链接这些文章。

#### 开发者生活

当前：**0 篇**。

代码中已经存在：

- `vite.config.ts` 的 `开发者生活 -> developer-life` 目录映射；
- `App.tsx` 的 `开发者生活` 博客分类。

未来若产生内容，默认归 `tomz.io`；本轮没有文件可迁移。

---

# 4. 非博客 Markdown：继续属于 Mira 项目站

下面 53 篇 Markdown 都不应进入未来的 `tomz-io` 作者仓库。它们属于 Mira 产品、Mira Docs API 或 Design Markdown 的项目性资料。

## 4.1 `src/pages/docs/**`：29 篇

归属：**`mira-move` / Mira 项目站**。

当前 URL 规则：

```text
src/pages/docs/<path>.md
→ https://tomz.io/<path>/
```

建议目标规则：

```text
https://mira.tomz.io/<path>/
```

全量路径：

```text
src/pages/docs/about/author.md
src/pages/docs/about/origin.md
src/pages/docs/about/product-about.md
src/pages/docs/about/product-map.md

src/pages/docs/architecture/agent-strategy.md
src/pages/docs/architecture/agent.md
src/pages/docs/architecture/harness.md
src/pages/docs/architecture/provider-context.md
src/pages/docs/architecture/runtime.md

src/pages/docs/configuration/application-basics.md
src/pages/docs/configuration/general-settings.md
src/pages/docs/configuration/mcp.md
src/pages/docs/configuration/model-settings.md
src/pages/docs/configuration/tools.md

src/pages/docs/engineering/development-console.md
src/pages/docs/engineering/development.md
src/pages/docs/engineering/docs-system.md
src/pages/docs/engineering/repository.md

src/pages/docs/philosophy/controlled-agency.md
src/pages/docs/philosophy/evidence.md
src/pages/docs/philosophy/local-first.md

src/pages/docs/product/enterprise-integrations.md
src/pages/docs/product/knowledge.md
src/pages/docs/product/microapps.md
src/pages/docs/product/roles-microapps.md
src/pages/docs/product/workspace.md

src/pages/docs/sitemap.md
src/pages/docs/status/current.md
src/pages/docs/status/roadmap.md
```

### `docs/about/author.md` 的特殊判断

这篇最容易因“作者”二字被误判。

正文实际是在解释 **Tomz 作为 UIChat Mira 发起人/维护者与 Mira 项目的关系**，并且明确写明：只保留“与项目有关、适合公开的作者信息”，私人生活不属于产品说明书。

所以：

- canonical 内容继续属于 Mira 项目站；
- 未来建议去 `https://mira.tomz.io/about/author/`；
- Tomz 作者主站未来的 `/about` 可以吸收其中少量事实，但应该是一篇新的作者站 About，而不是把这篇项目说明机械搬过去；
- 当前 `https://tomz.io/about/author/` 未来需要跨站 redirect 到 Mira 项目站，不能拿它直接顶替新的 `https://tomz.io/about`。

## 4.2 `src/pages/mira-docs-api/**`：12 篇

归属：**`mira-move` / Mira 项目站**。

当前 URL：

```text
https://tomz.io/mira-docs-api/<path>/
```

建议目标：

```text
https://mira.tomz.io/mira-docs-api/<path>/
```

全量路径：

```text
src/pages/mira-docs-api/guide/authoring.md
src/pages/mira-docs-api/guide/configuration.md
src/pages/mira-docs-api/guide/content-model.md
src/pages/mira-docs-api/guide/deployment-cloudflare-pages.md
src/pages/mira-docs-api/guide/deployment-github-pages.md
src/pages/mira-docs-api/guide/getting-started.md
src/pages/mira-docs-api/guide/navigation.md
src/pages/mira-docs-api/guide/what-is-mira-docs.md

src/pages/mira-docs-api/reference/build-integration.md
src/pages/mira-docs-api/reference/frontmatter.md
src/pages/mira-docs-api/reference/seo.md
src/pages/mira-docs-api/reference/typora-r2-guide.md
```

这组内容是明确的 authoring / configuration / deployment / reference，不存在作者主站归属歧义。

## 4.3 `src/pages/design-md/**`：12 篇

归属：**`mira-move` / Mira 项目站**。

当前 URL：

```text
https://tomz.io/design-md/<path>/
```

建议目标：

```text
https://mira.tomz.io/design-md/<path>/
```

全量路径：

```text
src/pages/design-md/视觉/product-design-system.md
src/pages/design-md/视觉/product-design-system/components.md
src/pages/design-md/视觉/product-design-system/elevation.md
src/pages/design-md/视觉/product-design-system/guidelines.md
src/pages/design-md/视觉/product-design-system/layout.md
src/pages/design-md/视觉/product-design-system/notes.md
src/pages/design-md/视觉/product-design-system/overview.md
src/pages/design-md/视觉/product-design-system/responsive.md
src/pages/design-md/视觉/product-design-system/type.md
src/pages/design-md/视觉/theme/apple.md
src/pages/design-md/视觉/theme/claude.md
src/pages/design-md/视觉/theme/supabase.md
```

这组是设计系统/reference 内容。未来即使 Design Markdown 再独立成项目，也不应因此进入 Tomz 作者主站；在本轮二分边界中明确归 Mira 侧。

---

# 5. 与个人主站 / 作者身份 / 博客展示直接相关的现有实现

这些不是本轮要修改的代码，但未来创建独立 `tomz-io` 仓库时必须有意识地迁走或重建。

## 5.1 Markdown 加载与 URL 数据源

`src/App.tsx` 使用：

```ts
import.meta.glob("./pages/**/*.md")
```

把 Markdown 直接作为站点内容真相源。

运行时路径也由物理文件路径推导。因此未来拆仓时，作者站仍可以继续使用 Markdown，但必须保证博客相对路径稳定，否则会自然生成不同路由。

## 5.2 已存在的作者关系模型

`App.tsx` 已有：

```text
author
writingMode
writtenBy
reviewedBy
commitUrl
```

并且已有：

- `Tomz Dang` 作者 profile；
- `Mira` 作者 profile；
- 共著展示 `Tomz Dang × Mira`；
- Mira 来信签名；
- Tomz / Mira 头像；
- `Mira 来信` / `共同思考` 的作者关系推断。

这套模型本身就是作者站资产，后续应迁移/复用，而不是在 `tomz-io` 再造第二套共创 frontmatter。

## 5.3 博客分类与展示

现有实现已经支持：

```text
产品手记
工程现场
共同思考
Mira 来信
开发者生活
```

`vite.config.ts` 还维护 group 与目录的一一映射，并在不一致时警告“目录移动会改变文章 URL”。

这条警告本身也证明：**当前内容物理路径已经是 URL 合同的一部分。**

## 5.4 当前“作者介绍”仍然是产品语境

`App.tsx` 的 Tomz 介绍目前强调：

- UIChat Mira 的创造者与维护者；
- 一个前端开发者持续构建 local-first AI workspace；
- GitHub / 项目工程判断。

Footer 也是 `UIChat Mira` + `Copyright © 2026 Tomz Dang`。

这些实现说明当前站已经有作者身份组件，但它仍服务于 **“Mira 产品站里的作者”**，不是完整的 **“Tomz 作者主站”**。BR002 可以重组它，但 BR001 不修改 UI。

## 5.5 资产依赖

当前可见作者/品牌资产包括：

```text
public/tomz-avatar.png
public/mira-avatar.png
public/mira-logo.png
https://assets.tomz.io/...
GitHub avatar
```

博客正文也直接引用 `assets.tomz.io` 图片。

拆仓不要求立刻迁图片，但 `assets.tomz.io` 将成为两站共享依赖，需要明确长期所有权与可用性，避免主站/项目站任一侧重构时误删共享资源。

---

# 6. 当前 SEO / URL 实现与拆站耦合点

## 6.1 URL 生成与物理路径绑定

静态 SEO 的 `seoDocPath(file)` 直接从 `src/pages` 路径推导 URL：

```text
src/pages/docs/foo.md        → /foo
src/pages/blogs/foo.md       → /blogs/foo
src/pages/mira-docs-api/...  → /mira-docs-api/...
src/pages/design-md/...      → /design-md/...
```

最终 canonical URL 由：

```text
siteUrl + base + path + trailing slash
```

生成。

风险：只要未来移动 Markdown 并改变相对路径，URL 就会跟着变。**所以迁仓时必须保持博客相对路径，项目文档跨域迁移必须先有 redirect 表。**

## 6.2 `siteUrl` 是单一全局值

当前：

```ts
export const siteUrl = "https://tomz.io";
```

所有 Markdown 共用这一站点根地址。

拆站后不能继续让 Mira 项目文档生成 `tomz.io` canonical。两个站必须分别拥有自己的 `siteUrl`：

```text
tomz.io          → 作者主站
mira.tomz.io     → Mira 项目站
```

## 6.3 sitemap / robots 是单站全量生成

`vite.config.ts` 会递归读取 `src/pages` 的全部 Markdown，把博客、Mira 文档、Mira Docs API、Design Markdown 混在同一份 sitemap 中，再写一份 `robots.txt` 指向它。

拆站后必须：

- `tomz.io/sitemap.xml` 只列作者站 URL；
- `mira.tomz.io/sitemap.xml` 只列 Mira 项目站 URL；
- 两站 robots 分别指向自己的 sitemap；
- 旧 `tomz.io` 的 53 个项目文档 URL 在 redirect 生效后不应继续被主站 sitemap 宣告为 canonical 页面。

## 6.4 canonical 当前完全由全局 `siteUrl` 推导

当前没有 per-document owner site，也没有 alias / redirect 层。

因此拆站时最大的 SEO 风险不是页面 UI，而是：

> 同一批项目文档如果同时在 `tomz.io` 和 `mira.tomz.io` 可访问、两边又各自宣告自己 canonical，会制造重复内容与索引迁移混乱。

项目文档真正迁出时必须是 **新 host canonical + 旧 host 301** 的配对施工。

13 篇博客则相反：域名与路径都不变，不需要 301，只需要换成作者站正确的 site identity。

## 6.5 Article / TechArticle 划分过于依赖 root

当前逻辑：

```text
root === blogs → Article
其他 Markdown  → TechArticle
```

这个粗粒度在当前仓库尚可，但拆站后应由每个站自己管理 schema。

当前 13 篇博客继续作为 `Article` 合理；53 篇项目文档继续作为 `TechArticle` 也基本合理。真正需要改的是 **publisher / author / site identity**，不是为了拆站强行改变 schema 类型。

## 6.6 `site name` / publisher 全局锁死为 UIChat Mira

当前静态 SEO 将以下值统一写成 UIChat Mira：

- `<title>` 后缀：`· UIChat Mira`；
- `og:site_name`：`UIChat Mira`；
- WebSite JSON-LD name：`UIChat Mira`；
- Article / TechArticle publisher：Organization `UIChat Mira`；
- 首页标题与 description：Mira 产品定位；
- PWA manifest name / short name / description：Mira；
- OG image：Mira logo。

这对 Mira 项目站是合理资产，对未来 Tomz 作者主站则是错误身份。

BR002 即使只改首页 UI，也不能把这件事当作已经完成；真正拆站时需要独立的主站 SEO identity。

## 6.7 运行时作者解析与静态 SEO 作者解析不一致

这是本轮发现的一个明确耦合问题。

`App.tsx` 的 frontmatter 解析能够识别：

- YAML list；
- `tomz | mira`；
- `Mira 来信` 默认 Mira；
- `共同思考` 默认 Tomz × Mira；
- 展示名映射为 `Tomz Dang` / `Mira`。

但 `vite.config.ts` 的静态 SEO：

1. 只用正则读取单行 `author: ...`；
2. 然后按 `|` / 逗号拆分；
3. 没读到就 fallback `Tomz Dang`；
4. 不经过运行时的 author profile 映射。

因此当前存在至少三种偏差：

- YAML list `author:` 的文章，静态 SEO 可能退回只有 `Tomz Dang`；
- `author: tomz | mira` 会生成字面 `tomz`、`mira`，而不是规范展示名；
- `author: mira` 会生成字面 `mira`。

拆站时必须让 Article JSON-LD 与页面真实作者关系使用同一个 author normalization；不能把当前静态 SEO 解析原样复制到新作者站。

## 6.8 首页 `/` 是特殊迁移，不是普通 301

当前 `https://tomz.io/` 的产品身份是 UIChat Mira；改造后同一个 URL 要成为 Tomz 作者主站。

所以旧产品首页不能像普通项目文档一样把 `/` 301 到 `mira.tomz.io`，否则会把作者主站一起重定向走。

正确理解是：

```text
https://tomz.io/           → 原 URL 留下，内容身份改为作者主站
https://mira.tomz.io/      → 新建 Mira 项目首页，获得自己的 canonical
```

Mira 首页 SEO 权重的迁移需要靠站内明确项目入口、品牌链接与后续搜索引擎重新理解，而不是 root 级 301。

---

# 7. 旧 URL → 建议目标 URL / 去向

## 7.1 13 篇博客：URL 全部原地保留

| 旧 URL | 建议目标 | action | ownerSite |
| --- | --- | --- | --- |
| `https://tomz.io/blogs/mira-letters/a-seat-at-the-writing-table/` | 原 URL | `keep` | tomz |
| `https://tomz.io/blogs/mira-letters/to-those-who-still-believe-in-their-work/` | 原 URL | `keep` | tomz |
| `https://tomz.io/blogs/shared-thinking/matter-awakens/` | 原 URL；可被 `/thoughts` 聚合 | `keep` | tomz |
| `https://tomz.io/blogs/shared-thinking/evolution-to-a-real-person/` | 原 URL；可被 `/thoughts` 聚合 | `keep` | tomz |
| `https://tomz.io/blogs/shared-thinking/future-after-humanity/` | 原 URL；可被 `/thoughts` 聚合 | `keep` | tomz |
| `https://tomz.io/blogs/product-journal/2026-07-05-open-source-agent-ecosystem/` | 原 URL | `keep` | tomz |
| `https://tomz.io/blogs/product-journal/codex-app-server-automation-notes/` | 原 URL | `keep` | tomz |
| `https://tomz.io/blogs/product-journal/mira-tts-provider-notes/` | 原 URL | `keep` | tomz |
| `https://tomz.io/blogs/product-journal/qingcheng-mcp-bridge-notes/` | 原 URL | `keep` | tomz |
| `https://tomz.io/blogs/engineering/insight-capture-pipeline/` | 原 URL | `keep` | tomz |
| `https://tomz.io/blogs/engineering/insight-rebuild-pipeline/` | 原 URL | `keep` | tomz |
| `https://tomz.io/blogs/engineering/mcp-marketplace-agent-integration/` | 原 URL | `keep` | tomz |
| `https://tomz.io/blogs/engineering/media-capability-packaging/` | 原 URL | `keep` | tomz |

## 7.2 Mira 产品文档：跨 host 迁移

| 当前范围 | 当前 URL | 建议目标 | action | ownerSite |
| --- | --- | --- | --- | --- |
| `src/pages/docs/**` | `https://tomz.io/<path>/` | `https://mira.tomz.io/<path>/` | `redirect`（实际迁移时） | mira |
| `src/pages/mira-docs-api/**` | `https://tomz.io/mira-docs-api/<path>/` | `https://mira.tomz.io/mira-docs-api/<path>/` | `redirect`（实际迁移时） | mira |
| `src/pages/design-md/**` | `https://tomz.io/design-md/<path>/` | `https://mira.tomz.io/design-md/<path>/` | `redirect`（实际迁移时） | mira |
| 当前 Mira 产品首页 | `https://tomz.io/` | 新建 `https://mira.tomz.io/`；旧 `/` 留给作者站 | **不是普通 redirect** | tomz + mira 各自拥有新身份 |

### 代表性具体映射

```text
https://tomz.io/about/origin/
→ https://mira.tomz.io/about/origin/

https://tomz.io/about/author/
→ https://mira.tomz.io/about/author/

https://tomz.io/architecture/agent-strategy/
→ https://mira.tomz.io/architecture/agent-strategy/

https://tomz.io/product/knowledge/
→ https://mira.tomz.io/product/knowledge/

https://tomz.io/mira-docs-api/reference/seo/
→ https://mira.tomz.io/mira-docs-api/reference/seo/

https://tomz.io/design-md/视觉/product-design-system/overview/
→ https://mira.tomz.io/design-md/视觉/product-design-system/overview/
```

这张表只是 **迁移合同草案**。BR001 不执行任何 redirect 或 canonical 修改。

---

# 8. 后续施工必须守住的边界

1. **先建作者站，不先搬历史 URL。** 13 篇博客在新仓库中应保持与当前 URL 对应的相对结构。
2. **Mira 来信 / 共同思考不能因为作者叫 Mira 就回到项目站。**
3. **项目站可以引用作者文章，不要复制后制造第二 canonical。**
4. **“共用的床”先做展示品牌，不做 URL 大迁移。**
5. **53 篇项目 Markdown 真正跨域时，必须同时处理新 canonical 与旧 301。**
6. **root `/` 单独处理。** 它从 Mira 产品首页变成 Tomz 作者首页，不能 301 整个根地址。
7. **不要复刻当前两套不一致的作者解析。** 新作者站必须让 UI 作者关系与 JSON-LD 作者关系来自同一个模型。
8. **不要把 `docs/about/author.md` 当成作者主站 About 直接搬。** 它是 Mira 项目作者说明。
9. **`assets.tomz.io` 暂时可共享，但要作为拆站依赖登记。**

---

# 9. BR001 最终判定

## PASS

边界已经足够清楚，可以进入 **BR002｜作者主站首页与一级导航**。

本轮没有 `review` 内容，也没有阻止 BR002 的内容归属问题。

明确结论：

- **13 / 13 篇现有博客 → tomz.io 作者主站；**
- **53 / 53 篇非博客项目 Markdown → Mira 项目站；**
- **0 篇暂缓；**
- **13 篇历史博客 URL 第一阶段全部保持不变；**
- **项目文档未来跨域迁移的主要风险在 canonical / sitemap / publisher / author normalization / redirect，而不在 Markdown 内容本身。**

PASS 只代表可以开始 BR002，不代表已经授权执行 Markdown 迁移、SEO 修改、301 或 Mira 项目站拆分。
