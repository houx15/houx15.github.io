---
title: "OrgClaw"
summary: "包含工具执行、会话记忆与模型服务适配器的智能体运行时原型。"
lang: "zh-CN"
links: [{"label": "源代码", "url": "https://github.com/houx15/OrgClaw"}]
---

## 已实现组件

OrgClaw 的公开代码包含 Python 智能体循环：调用模型、执行请求的工具并存储对话轮次。FastAPI 服务提供聊天接口。模型适配器支持 Anthropic 与 OpenAI 兼容 API；记忆模块提供内存和 PostgreSQL 两种存储实现。

工具注册表包含文件操作、shell 与 Python 执行、HTTP 请求和 Web 搜索。仓库包含运行时、存储、模型适配器与工具的测试。

## 状态

这是代码已公开的原型。架构文档还描述了面向组织的平台，包括通讯网关和编排层；这些规划不能证明飞书或钉钉集成已经部署。

本页未核实公开产品演示或部署。本次网站整理未执行运行时，也不据此陈述个人作者分工。

## 来源

[智能体服务](https://github.com/houx15/OrgClaw/blob/5962afbb6ee1053a410ca76c1d8e1d56da496ba3/orgclaw/agent/runtime/server.py) · [智能体循环](https://github.com/houx15/OrgClaw/blob/5962afbb6ee1053a410ca76c1d8e1d56da496ba3/orgclaw/agent/runtime/core/loop.py) · [架构规范](https://github.com/houx15/OrgClaw/blob/5962afbb6ee1053a410ca76c1d8e1d56da496ba3/docs/2026-03-06-technical-architecture.md)。
