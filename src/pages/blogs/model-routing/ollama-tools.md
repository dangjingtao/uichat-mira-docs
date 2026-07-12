---
title: 给 Ollama 模型接上工具调用能力
description: 大部分本地模型原生不支持 function calling，我们用一个轻量的提示模板层补上了这块能力。
group: 工程现场
order: 2
date: 2026年7月2日
readTime: 8 分钟阅读
---

# 给 Ollama 模型接上工具调用能力

这是一篇用于博客列表页联调的示例文章。

## 内容提要

- 工具协议的最小封装
- 提示模板的约束方式
- 与本地模型输出不稳定性的兼容
