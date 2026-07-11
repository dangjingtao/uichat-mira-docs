---
title: 文档系统
description: 完整源码索引与面向读者的精选站点如何共存。
group: 工程
order: 15
---

# 文档系统

Mira 源码当前索引了 338 篇 Markdown。完整性很重要，但完整索引不等于良好的公共导航。

## 两种视图

源码文档站保留全部工程材料，适合搜索、审计和维护；这个产品文档站提供精选入口，按“认识、哲学、产品、架构、工程、现状”组织核心认知。

## Current Contract 优先

架构判断应优先引用 current-contract 文档、area map 和实际源码。历史 proposal、任务记录与迁移说明用于解释过程，不能自动代表当前实现。

## Frontmatter 约定

本站每篇 Markdown 使用 title、description、group 与 order。group 决定侧栏目录，order 决定阅读顺序；二级标题自动生成页内导航。

## 搜索与 Sitemap

Ctrl/Command + K 会索引标题、描述和全文。Sitemap 是人工维护的阅读地图：它决定读者看到的结构，搜索则负责跨结构找到具体概念。

## 防止再次变乱

新增主题应先选择目录，再决定它是概念页、产品页还是工程页。一个目录保持少量清晰文章，细节通过正文和源码链接展开。