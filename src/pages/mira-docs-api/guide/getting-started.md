---
title: 快速开始
description: 在本地启动、构建和预览 Mira-Docs。
group: 快速开始
order: 4
---

# 快速开始

Mira-Docs 是当前仓库中的文档层。它不单独运行一个文档服务，开发、构建和预览都使用仓库根目录的 Vite 脚本。

## 环境

需要已安装 Node.js 和 npm。依赖安装后，以下命令在仓库根目录执行：

```bash
npm install
```

## 开发

启动开发服务器：

```bash
npm run dev
```

修改 `src/pages` 下的 Markdown 后，Vite 会重新加载页面。新增或删除顶层目录时，目录虚拟模块会失效并触发整页刷新。

## 构建

生产构建同时执行 TypeScript 检查和 Vite 构建：

```bash
npm run build
```

输出目录是 `dist`。构建还会生成 PWA 的 manifest、service worker 和静态资源清单。

## 预览

预览最近一次构建：

```bash
npm run preview
```

`preview` 只能验证构建产物，修改 Markdown 不会自动进入产物；改完内容后先重新执行 `npm run build`。
