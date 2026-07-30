---
title: 导航如何生成
description: MiraDocs 如何通过内容清单与站点适配生成导航。
group: 快速开始
order: 5
---

# 导航如何生成

MiraDocs 不在页面组件里扫描文件。内容发现统一由 Vite 插件完成，React 端只消费生成后的清单。

## 虚拟内容模块

```ts
import docs, { roots } from "virtual:mira-docs/content"
```

它导出：

- `docs`：排序后的 `MiraDoc[]`
- `roots`：内容源中的顶层目录

虚拟模块会随 Markdown 变化失效，开发服务器随后完整刷新。

## 当前站点的导航边界

当前 UIChat Mira 站点仍保留原有信息架构：

```text
src/pages/
├── docs/            # 默认文档区，URL 不显示 docs
├── blogs/           # 博客
├── mira-docs-api/   # MiraDocs 文档区
└── ...
```

`design-md` 继续作为视觉内容的物理来源，因此既有 `/design-md/...` 文章地址保持不变；站点适配层只把它的导航归属映射到 MiraDocs。顶部不再生成独立视觉入口，MiraDocs 左栏统一显示“视觉”分组，物理目录不会变成空栏目。

旧的 `/design-md` 栏目根路径会明确引导到 `/mira-docs-api`，不会继续暴露空目录页面；深层视觉文章仍使用原地址。

Vite 插件负责发现文件，`src/content/mira-docs-adapter.ts` 负责把通用 `MiraDoc` 映射成旧站需要的文档模型。

## URL 兼容

当前配置使用：

```ts
miraDocs({
  contentDir: "src/pages",
  exclude: (sourcePath) => /(^|\/)README\.md$/i.test(sourcePath),
  route: (_sourcePath, doc) => {
    const path = doc.path.replace(/^\/docs(?=\/|$)/, "")
    return path || "/"
  },
  // ...
})
```

因此迁移前后的历史 URL 保持不变。MiraDocs 不要求消费者采用某一种目录前缀。

## 顶部与侧边导航

MiraDocs 提供内容数据，不强制导航 UI。当前站点继续使用：

- `roots` 确定内容的物理来源。
- 物理目录、`group` 与站点适配映射共同生成侧边分组。
- `src/site.config.ts` 控制顶层顺序和显示名称。
- 站点适配层保留博客、作者、逻辑归属和合并页规则。

## 合并页

具有相同 `merge` 的旧站内容会在适配层按 `order` 拼接，只有 `mergeIndex: true` 的入口保留路由。合并正文中的 Markdown 与 HTML 标题都会进入统一目录。

这项规则是兼容扩展，而不是 MiraDocs 对所有消费者的强制约定。
