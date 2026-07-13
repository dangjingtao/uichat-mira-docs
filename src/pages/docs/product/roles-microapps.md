---
title: 角色工作台
description: 把提示词拆成可维护、可预览、可复用的角色原型。
group: 产品能力
order: 9
---

# 角色工作台

Mira 把角色做成了一个提示词工程工作台。

::: html
<div style="margin:28px 0; padding:20px; border:1px solid var(--hairline,#e6dfd8); border-radius:16px; background:var(--surface-soft,#f5f0e8);">
  <div style="font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--primary-active,#a9583e); margin-bottom:14px;">Role Card Anatomy</div>
  <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:10px;">
    <div style="padding:14px;border-radius:12px;background:var(--canvas,#faf9f5);border:1px solid var(--hairline,#e6dfd8);"><strong>世界观</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">如何理解事实、风险与冲突</div></div>
    <div style="padding:14px;border-radius:12px;background:var(--canvas,#faf9f5);border:1px solid var(--hairline,#e6dfd8);"><strong>人格核心</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">身份、关系感与稳定行为</div></div>
    <div style="padding:14px;border-radius:12px;background:var(--canvas,#faf9f5);border:1px solid var(--hairline,#e6dfd8);"><strong>适用场景</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">角色通常在哪里、为何工作</div></div>
    <div style="padding:14px;border-radius:12px;background:var(--canvas,#faf9f5);border:1px solid var(--hairline,#e6dfd8);"><strong>示例对话</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">直接示范如何接话和推进</div></div>
    <div style="padding:14px;border-radius:12px;background:var(--canvas,#faf9f5);border:1px solid var(--hairline,#e6dfd8);"><strong>表达风格</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">句长、语气、结构与密度</div></div>
    <div style="padding:14px;border-radius:12px;background:var(--canvas,#faf9f5);border:1px solid var(--hairline,#e6dfd8);"><strong>约束规则</strong><div style="font-size:13px;margin-top:6px;color:var(--body-c,#3d3d3a);">必须、禁止和冲突优先级</div></div>
  </div>
</div>
:::
在当前界面中，这项能力统一称为「角色」。它保存的不是一段临时聊天指令，而是一份可以持续编辑、预览、复制和复用的提示词原型。

![角色提示词工程工作台](/images/roles/role-workbench.webp)

*左侧管理可复用角色，右侧按字段编辑角色内容、标签和模型参数。*

角色适合定义：

- AI 是谁，以及它具有怎样的背景与身份；
- 它如何理解世界和判断问题；
- 它与用户保持怎样的关系和姿态；
- 它通常在哪些场景中工作；
- 它应该怎样表达；
- 哪些边界不能越过；
- 遇到典型问题时，它应该如何接话。

## 角色不是一个万能容器

角色主要负责稳定的人设和表达方式，不应把所有上下文都塞进角色卡。

以下内容应当与角色分开管理：

| 内容 | 应归属的位置 |
| --- | --- |
| 专业资料和事实来源 | 知识库 |
| 当前聊天记录 | 会话历史 |
| 跨线程召回的用户事实 | 记忆系统 |
| 当前线程中的关系变化 | 线程角色状态 |
| 可使用的外部能力 | 工具或 MCP |
| 工具何时需要审批 | 工具策略与权限系统 |
| 某次临时任务要求 | 当前用户消息或任务上下文 |

这种拆分可以避免角色卡越来越长，也可以减少知识、记忆和工具规则相互污染。

## 角色列表

角色列表保存可复用的提示词原型。

用户可以：

- 新建角色；
- 导入角色；
- 编辑角色名称与简介；
- 打开角色内容编辑器；
- 查看字段说明；
- 预览提示词拼装结果；
- 创建角色副本；
- 删除角色；
- 保存修改或恢复到当前已保存状态。

角色可以具有正式、默认、启用或草稿等状态。具体可用状态以当前版本界面为准。

## 核心字段

Mira 不鼓励把角色定义写成一整段难以维护的长文本，而是把不同作用的内容拆成独立字段。

### 名称

用于让用户一眼识别这个角色是谁。

名称应简短、稳定，不要把一次性任务直接写进名称。

### 简介

用一两句话说明角色的定位和用途。

简介主要用于角色列表和快速识别，不承担完整提示词功能。

### 角色描述

角色描述用于定义角色的身份、背景、职业、外貌特征以及它在世界中的位置。

它应当以事实为主，而不是使用「温柔、聪明、专业」之类只有修饰、缺少可观察行为的形容词。对于长期复用的角色，还可以写清它与 `{{user}}` 的稳定关系。

### 世界观

定义角色看待世界与问题的方法论。

它不是装饰性的背景故事，而是角色进行判断、取舍和解释时采用的底层依据。

推荐写清：

- 角色相信什么；
- 如何判断事实与风险；
- 面对冲突时优先保护什么。

示例：

> 你相信判断必须建立在事实和证据上。面对争议时，你会先拆清前提，再给出结论。如果效率和准确性冲突，你优先保证结论可靠。

### 人格核心

定义角色身份、气质、立场、关系感和稳定行为。

这里回答的是「角色是谁、通常怎样回应」，而不是「这一次要完成什么任务」。

推荐结构：

```text
角色身份：……
对 {{user}} 的态度：……
稳定行为：……
```

### 适用场景

描述角色最常工作的环境、关系和目标边界。

它可以帮助模型判断什么时候应该主动推进，什么时候应该谨慎收住。

推荐结构：

```text
地点 / 环境：……
角色关系：……
当前局势：……
目标或气氛：……
```

### 示例对话

用少量高价值对话直接示范角色怎样接话、推进、拒绝或澄清。

示例应少而准确，每组尽量只体现一种典型语气或动作。

```text
{{user}}: 这个方案能上吗？
{{char}}: 能，但要先补齐异常路径和回滚方案。

{{user}}: 为什么你先看风险？
{{char}}: 因为上线后的代价通常比现在补一遍高。
```

不要把示例对话写成对角色行为的说明文字。模型需要看到真正的对话形式。

### 表达风格

控制角色怎样说话，而不是规定它知道哪些事实。

可以分别说明：

- 句长；
- 语气；
- 内容结构；
- 信息密度；
- 是否使用列表、比喻或专业术语。

示例：

> 以短句为主，必要时再补长句解释。语气平静直接，不夸张。先给结论，再说明依据。减少重复和无意义的客套。

### 约束规则

写清角色不能越过的边界、必须遵守的规则，以及不同要求发生冲突时的优先级。

推荐结构：

```text
必须：……
禁止：……
冲突时优先：……
```

约束应尽量明确、可判断。像「尽量好一点」「看情况回答」这类模糊表达很难形成稳定行为。


### 模型参数

角色可以保存一组与生成表现有关的模型参数，例如温度、Top P 和 Top K。

模型参数影响回答的随机性与采样方式，但不能代替角色字段。角色身份、判断原则和表达边界仍应写在对应字段中，而不是依靠提高或降低温度来「调人设」。

## 字段说明与正反示例

角色编辑器提供字段说明、推荐写法、正面示例和反面示例。

第一次创建角色时，建议先阅读字段说明，而不是直接复制一段超长系统提示词。字段拆分的价值不只是界面更整齐，还能帮助用户判断：

- 哪些内容属于稳定身份；
- 哪些内容只是临时任务；
- 哪些规则必须写得明确；
- 哪些示例真正能够影响角色表达；
- 哪些重复内容可以删除。

这部分更适合使用截图说明，不必专门录制视频。



## 提示词预览

> 第一版先使用结构图说明上下文层级，不要求额外补截图或视频。

::: html
<div style="margin:28px 0; padding:20px; border:1px solid var(--hairline,#e6dfd8); border-radius:16px; background:var(--surface-soft,#f5f0e8);">
  <div style="font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--primary-active,#a9583e); margin-bottom:14px;">Request Context Stack</div>
  <div style="display:grid; gap:8px;">
    <div style="padding:12px 14px;border-radius:10px;background:#252320;color:#faf9f5;"><strong>系统层</strong><span style="margin-left:10px;font-size:13px;color:#c9c5bd;">固定规则与安全边界</span></div>
    <div style="padding:12px 14px;border-radius:10px;background:var(--surface-card,#efe9de);"><strong>角色层</strong><span style="margin-left:10px;font-size:13px;color:var(--body-c,#3d3d3a);">世界观、人格核心、风格与约束</span></div>
    <div style="padding:12px 14px;border-radius:10px;background:var(--canvas,#faf9f5);border:1px solid var(--hairline,#e6dfd8);"><strong>知识层</strong><span style="margin-left:10px;font-size:13px;color:var(--body-c,#3d3d3a);">RAG 模式下召回的资料</span></div>
    <div style="padding:12px 14px;border-radius:10px;background:var(--canvas,#faf9f5);border:1px solid var(--hairline,#e6dfd8);"><strong>历史层</strong><span style="margin-left:10px;font-size:13px;color:var(--body-c,#3d3d3a);">当前会话的真实消息</span></div>
    <div style="padding:12px 14px;border-radius:10px;background:var(--primary,#cc785c);color:#fff;"><strong>本轮输入</strong><span style="margin-left:10px;font-size:13px;">用户当前的问题或任务</span></div>
  </div>
</div>
:::
预览功能用于查看角色字段最终如何进入请求上下文。

当前预览可以区分：

- 普通聊天；
- RAG 聊天；
- 系统层；
- 角色层；
- 知识层；
- 历史层；
- 测试输入。

这让用户能够看见角色并不是孤立生效的。一次实际请求可能同时包含系统规则、角色定义、知识库上下文、历史消息和当前输入。

在 RAG 模式中，知识库上下文会在生成前注入；在仅预览角色本体时，知识层可以被跳过。历史消息会保留对话语境，但不会替代角色定义。


## 导入、复制与分享

导入适合把已有角色定义转换为 Mira 中的角色副本；复制适合在一个稳定角色的基础上制作不同版本。

建议复制而不是直接覆盖的情况：

- 为同一角色制作简洁版和详细版；
- 为不同任务调整约束；
- 测试两种表达风格；
- 保留正式版本，同时继续修改草稿；
- 对比普通聊天与专业知识库场景。


## 角色与知识库如何配合

角色和知识库可以组合使用，但它们解决不同问题。

例如，一个「循证医学解释助手」角色可以规定：

- 先说明证据强度；
- 避免把相关性说成因果；
- 对高风险问题提醒线下就医；
- 语言保持清晰、克制。

与它配合的「生殖医学指南」知识库则提供：

- 具体指南内容；
- 研究结论；
- 诊疗流程；
- 来源和更新时间。

角色决定表达和判断方式，知识库提供可依据的资料。角色不能让错误资料变正确，知识库也不能自动形成稳定的人设。

## 角色与 Agent 的区别

角色回答「这个 AI 应该以怎样的身份和方式工作」。

Agent 还需要回答：

- 当前任务是否需要拆解；
- 应该选择什么工具；
- 是否需要用户审批；
- 工具结果是否足以完成任务；
- 失败后应该恢复、重试还是停止。

因此，角色可以参与 Agent 的行为表现，但角色卡本身不等于一个完整 Agent。

## 编写建议

- 先写清人格核心，再补表达风格；
- 世界观写判断原则，不写空泛赞美；
- 场景写当前舞台，不写角色完整传记；
- 示例对话少而准，优先覆盖最重要的交互；
- 硬规则放在约束中，不要散落在多个字段；
- 不要把专业知识全文复制进角色卡；
- 修改后使用预览检查重复、冲突和顺序；
- 重要角色保留一个稳定版本，再复制草稿继续调整。

