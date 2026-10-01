---
title: 项目与维护者
description: UIChat Mira 的项目归属、维护责任、AI 协作方式与公开仓库入口。
group: 认识 Mira
order: 2
author: tomz
writingMode: authored
writtenBy: mira
reviewedBy: tomz
---

# 项目与维护者

## 文档范围

本页说明 UIChat Mira 的项目归属、维护责任和公开协作边界。它不记录私人联系方式、生活信息或与项目无关的个人资料。

## 项目归属

UIChat Mira 由 **Tomz Dang** 发起，目前由 **uichat-mira** 组织内的维护者共同持续推进。

Mira 不是某一个仓库的别名，也不等同于 Desktop。Desktop、Mobile、Docs、Relay 与工程治理基础设施分别承担不同职责，并在共同的产品方向下独立演进。

## 当前维护者

| 维护者 | 当前公开责任 |
| --- | --- |
| [Tomz Dang（@dangjingtao）](https://github.com/dangjingtao) | 产品发起、整体方向、跨产品协调与持续维护 |
| [tzt2026（@tzt2026）](https://github.com/tzt2026) | Mira Mobile 的功能实现、工程维护与发布推进 |

维护责任按产品与仓库分布。维护者列表描述当前公开协作状态，不表示每位维护者对所有仓库拥有相同权限；具体工程责任仍以仓库权限、提交、Pull Request、Review 与发布记录为准。

## 维护与验收

Mira 的维护不依赖单一账号完成全部工作。不同产品和仓库可以由对应维护者承担施工、审查、发布与日常维护；跨产品的方向、公共合同和发布边界通过公开工程流程保持一致。

重要变更仍要求：

1. 明确变更范围与不变量；
2. 通过分支、Pull Request、测试与审查进入环境主线；
3. 由具备相应权限和责任的维护者完成验收或发布；
4. 当前事实、计划、施工记录和历史资料保持分离。

## AI 协作角色

Mira 作为 AI 协作者参与：

- 资料检索与方案比较；
- 代码施工和测试补充；
- Pull Request 审查与问题归纳；
- 工程文档和公开文章草拟；
- 已有合同与当前实现的交叉核对。

AI 协作不转移维护者的责任。产品方向、高风险修改、代码合并、发布判断以及公开内容的真实性与隐私边界，仍由具有对应责任与权限的人类维护者承担。

## 工程治理方式

Mira 是长期维护的产品与工程体系，不以聊天记录或单次施工线程作为唯一真相源。

当前工程使用以下治理方式：

1. 重要能力先定义范围和不变量；
2. 代码修改通过分支、PR、测试和审查进入主线；
3. 当前事实、施工记录、方案和历史归档分开维护；
4. Agent、Tool、Skill 和 MicroApp 等关键域使用 current-contract 或 current-snapshot；
5. AI 可以执行工作，但不能绕过审批、验证和明确的责任边界。

## 公开仓库

- 组织入口：[`uichat-mira`](https://github.com/uichat-mira)
- Desktop：[`uichat-mira/mira-desktop`](https://github.com/uichat-mira/mira-desktop)
- Mobile：[`uichat-mira/mira-mobile`](https://github.com/uichat-mira/mira-mobile)
- 公共文档站：[`uichat-mira/uichat-mira-docs`](https://github.com/uichat-mira/uichat-mira-docs)
- Relay：[`uichat-mira/uichat-mira-relay`](https://github.com/uichat-mira/uichat-mira-relay)
- Control Room：[`uichat-mira/control-room`](https://github.com/uichat-mira/control-room)

## 内容署名

文档或文章可能包含以下字段：

| 字段 | 含义 |
| --- | --- |
| `author` | 对外署名 |
| `writtenBy` | 初稿主要生成者 |
| `reviewedBy` | 最终审核者 |
| `writingMode` | authored、co-authored 等协作方式 |

署名用于说明内容责任和协作过程，不表示 AI 拥有仓库权限或发布决定权。

## 隐私边界

以下信息不属于项目文档：

- 私人联系方式；
- 家庭、健康或财务信息；
- 对话中偶然出现但未明确公开的个人资料；
- 与项目无关的身份推断。

公开文档只保留理解和使用 UIChat Mira 所必需的项目信息。
