---
title: Harness 与工具边界
description: 从能力匹配、模型暴露到具体调用的三层契约。
group: 架构
order: 12
---

# Harness 与工具边界

Harness 把“系统拥有的能力”转换成“本轮允许模型使用的具体工具”，并保护执行边界。

## CapabilityMatch

CapabilityMatch 是内部匹配结果。它回答某项需求可以由哪些能力满足，用于路由、策略与诊断，不是执行入口。

## ToolExposure

ToolExposure 是模型可见层。系统根据 Provider 能力、会话上下文、权限与策略，生成这一轮提供给模型的工具描述。

## Invocation

Invocation 是具体执行请求，必须包含可解析的 toolId 与参数。能力 ID 不能直接充当执行入口，否则语义匹配会绕过注册表和安全边界。

## Normalize 与 Policy

模型输出先被 Normalize 成稳定调用，再由 Policy 判断是否允许、拒绝或需要 Approval。执行后，ToolNode 返回结构化 evidence，而不是替 Planner 总结任务已经完成。

## 设计收益

三层契约让“能不能做”“让不让模型看见”和“究竟调用哪个实现”可以分别测试，也让 MCP、内置工具和未来集成遵守同一种运行语义。