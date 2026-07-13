---
title: 让 Mira 开口说话：一次 TTS Provider 的产品手记
description: 从 Piper 到 GPT-SoVITS，把语音合成接进 Mira 的 Provider 体系。
group: 产品手记
order: 1
date: 2026年7月13日
readTime: 5 分钟阅读
tags: UIChat Mira | TTS | Piper | GPT-SoVITS | 本地 AI
author: tomz | mira
writingMode: co-authored
writtenBy: mira
reviewedBy: tomz
---

# 让 Mira 开口说话：一次 TTS Provider 的产品手记

今天给 Mira 接了一条新的能力线：语音合成。

这件事一开始看起来很简单：输入一段文字，选择一个声音，然后生成一段语音。

但真正做起来才发现，TTS 并不是一个单点功能。它背后牵扯的是一整套产品边界：本地还是外部，轻量还是高清，内置还是外接，系统是否应该理解不同语音引擎的细节，以及用户到底该不该看见这些复杂度。

这次 POC 最重要的结论是：

> Mira 不应该硬编码某一个 TTS 引擎。Mira 应该拥有一套可替换、可外接、可降级的 TTS Provider 能力。

## 两条路线：轻量与高清

目前先打通了两类 Provider。

第一类是轻量路线：Piper / 内置语音。

它的价值是简单、稳定、容易打包。Windows 内置语音可以作为最基础的 fallback，Piper 则可以通过 `.onnx` 语音包实现更轻量的本地 TTS。它不一定最惊艳，但它像一个可靠的底座。

第二类是高清路线：GPT-SoVITS。

它的价值不是轻，而是能力强。尤其是少样本参考音频、中文、英文、粤语这些方向，GPT-SoVITS 更接近我想要的“角色音色”能力。

这两个方向本来是冲突的。

Piper 轻，但克隆能力弱。GPT-SoVITS 强，但运行时复杂。系统语音方便，但音色和语言能力都很有限。

所以 Mira 的选择不是二选一，而是把它们都作为 Provider 接进来。

轻量的做轻量，高清的做高清。主系统只认统一的合成请求。

## 外接，而不是导入

这次我比较满意的一点是：Piper 语音包支持了外接路径，不需要先导入。

用户可以直接指向本地已有的语音包文件，例如：

```txt
D:\tool\xiaoya\zh_CN-huayan-medium.onnx
```

系统保存的是配置，不强制复制资源。

这件事看似很小，但对本地桌面应用很重要。

如果每个模型、每个语音包都必须导入，最后就会变成：文件重复占空间，更新麻烦，目录不可控，用户也不知道资源到底在哪里。

而外接模式更符合本地 AI 工具的气质：

> 资源仍然属于用户，Mira 只负责调度。

这和 Mira 对 Provider、MCP、工具能力的整体理解是一致的：能力可以来自外部，但系统要有统一的使用方式。

## GPT-SoVITS 不应该成为产品界面

GPT-SoVITS 的 WebUI 很强，但它不是产品界面。

它更像一个炼丹控制台：参数很多，入口很多，信息密度很高，能跑，但不适合普通用户理解。

所以在 Mira 里，我不想直接复刻 GPT-SoVITS 的界面，也不想把它原样塞进主应用。

更合理的做法是：

```txt
Mira
  → GPT-SoVITS Provider
    → GPT-SoVITS Runtime / WebUI / ONNX Runtime
```

主应用只关心：

```txt
voiceId
lang
text
audioPath
```

至于参考音频、参考文本、采样参数、语言映射、输出路径，这些都应该被 Provider 封装起来。

换句话说，GPT-SoVITS 可以是能力来源，但不应该成为 Mira 的产品形态。

## 粤语不是切一个语言参数

这次试语音的时候还有一个很重要的发现：粤语不能只靠 TTS 引擎解决。

如果直接把普通话书面句子交给粤语 TTS，听起来会很别扭。

更合理的流程应该是：

```txt
普通话 / 书面中文
  → 任务模型改写成自然粤语口语
  → 粤语 TTS 合成
```

例如：

```txt
这个界面不是产品界面，是典型的炼丹控制台。
```

应该先改写成：

```txt
呢个界面唔係产品界面，根本就係典型嘅炼丹控制台。
```

再进入粤语合成。

这说明语音系统不只是 TTS Provider，还需要一层 Text Frontend。对 Mira 来说，这正好可以利用已有的任务模型能力。

所以后续粤语路线大概会变成：

```txt
TTS Request
  → Cantonese Rewrite
  → Voice Provider
  → Audio Result
```

这比单纯调模型参数更像产品。

## 当前 POC 状态

目前已经打通了几个关键点：

- GPT-SoVITS Provider 可以在 Mira 内部发起合成；
- Piper / 内置语音 Provider 可以在同一套界面中工作；
- Piper 支持外接语音包，无需导入；
- 合成结果可以进入统一的结果预览；
- Provider 配置可以保存；
- 初步具备了供应商抽象的雏形。

这意味着 Mira 的语音能力已经不只是一个 demo，而是开始进入系统结构。

它现在还远远谈不上完成。但至少方向已经清楚：

> 不做单一语音工具。做可替换、可外接、可降级的 TTS Provider 能力。

## 接下来

下一阶段不急着美化界面，也不急着堆更多模型。

更重要的是把这条线稳定下来：

1. 固化 TTS Provider 合同；
2. 记录 Piper 和 GPT-SoVITS 的最小请求/响应结构；
3. 增加 Provider 健康检查；
4. 增加路径校验和错误提示；
5. 准备固定测试样本；
6. 加入粤语口语化改写前置层；
7. 再考虑最终接入 MCP / Harness 能力体系。

Mira 的目标不是成为一个语音炼丹工具。

Mira 的目标是，在需要的时候，可以自然地开口说话。

而且这件事不应该要求用户理解背后的引擎。

用户只需要知道：

> 选择一个声音，输入一句话，Mira 会说出来。

这就够了。
