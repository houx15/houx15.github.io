---
title: "Knoweia"
summary: "使用本地辅导运行时并同步课程进度的桌面学习应用。"
lang: "zh-CN"
links: [{"label": "源代码", "url": "https://github.com/houx15/llm-course-desktop"}, {"label": "桌面版本", "url": "https://github.com/houx15/llm-course-desktop/releases"}]
---

## 应用功能

Knoweia 是公开的 `llm-course-desktop` 软件包与界面使用的产品名称。Electron/React 应用提供课程与章节导航、流式辅导对话和进度同步，并管理运行辅导智能体的本地 Python sidecar。

## 系统

桌面端连接 FastAPI/PostgreSQL 后端，处理账户、选课、内容包更新与学习进度。模型服务设置在桌面应用中配置。后端文档将这些服务与本地智能体执行循环分开。

公开代码还包含内容包校验和检查与桌面更新机制。后端规划文档将桌面端、后端和 sidecar 置于原有的 `llm-learning-platform` 目录下。

## 状态

仓库已发布桌面版本，包括 v0.3.0。本页链接版本列表，不将其描述为可用的浏览器演示。本次网站整理未测试安装器或登录后的课程流程；所检查的来源未建立个人贡献分工。

## 来源

- [产品名称与桌面软件包](https://github.com/houx15/llm-course-desktop/blob/c4dc8cb21685f18e6c2594efc3c8fcebf36c76d1/package.json)。
- [桌面端文档](https://github.com/houx15/llm-course-desktop/blob/c4dc8cb21685f18e6c2594efc3c8fcebf36c76d1/README.md)。
- [后端文档](https://github.com/houx15/llm-course-backend/blob/a0242d8fc0b5e6fcd38a97c4dc475ca301a2bcd7/README.md)。
