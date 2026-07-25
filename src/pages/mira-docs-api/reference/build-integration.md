---
title: Vite 构建集成
description: 使用 @uichat-mira/docs/vite 接管内容发现、热更新和静态输出。
group: 参考
order: 21
---

# Vite 构建集成

MiraDocs 的 Vite 入口是：

```ts
import { miraDocs } from "@uichat-mira/docs/vite"
```

## 基本接入

```ts
miraDocs({
  contentDir: "src/pages",
  config: {
    title: "UIChat Mira",
    description: "本地优先的多模型智能体工作空间",
    siteUrl,
  },
  exclude: (sourcePath) => /(^|\/)README\.md$/i.test(sourcePath),
  route: (_sourcePath, doc) =>
    doc.path.replace(/^\/docs(?=\/|$)/, "") || "/",
  staticRoutes: miraDocsStaticBuild,
})
```

## 内容发现

插件递归读取 `contentDir` 下的 Markdown，依次执行：

```text
读取文件
→ parseMiraDoc
→ exclude
→ route
→ normalize path
→ compareMiraDocs
```

它生成 `virtual:mira-docs/content`：

```ts
import docs, { roots } from "virtual:mira-docs/content"
```

插件监听内容目录，变化时失效虚拟模块并触发完整刷新。

## 当前旧站接入

迁移前，`App.tsx` 使用 `import.meta.glob` 解析 Markdown，`vite.config.ts` 另有 `virtual:page-directories`。现在两套发现逻辑已经删除。

当前边界：

```text
@uichat-mira/docs/vite
└── 发现、解析、排序、roots、热更新

src/content/mira-docs-adapter.ts
└── 作者、博客、合并页、旧导航模型

React 页面
└── 视觉、搜索、主题和交互
```

## 静态构建

`staticRoutes` 有三种形式：

```ts
false                       // 不生成静态路由
true                        // 使用默认静态构建
MiraDocsStaticBuildOptions  // 自定义
```

插件在 Vite `writeBundle` 阶段读取最终 manifest，并写入 `build.outDir`。

## 构建验证

当前迁移 CI 运行：

```bash
pnpm install --frozen-lockfile
pnpm run verify:mira-docs
pnpm run build:github-pages
pnpm run verify:static-output
```

这同时覆盖内容契约、类型、Vite、静态 HTML 和部署 base。