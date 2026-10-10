---
title: "Mind Imprint · 思维印记"
summary: "提供阅读、写作、课程、研究工作区与结构化思维工具的 AI 学习平台。"
lang: "zh-CN"
links: [{"label": "源代码", "url": "https://github.com/houx15/mind-imprint"}, {"label": "产品官网", "url": "https://mind.uni-robot.cn/"}, {"label": "打开应用", "url": "https://mind-web.uni-robot.cn/"}]
---

## 应用功能

Mind Imprint（思维印记）提供阅读、写作、引导式课程与研究项目工作区。英文产品官网使用 **The Mark of Thinking** 这一名称。2026 年 10 月 10 日检查时，公开官网与 Web 应用登录页均可访问。

应用将 AI 对话与结构化思维工具卡结合。用户打开并完成卡片，系统保存操作和对话记录，用于后续回顾与过程评估。教师端提供学生活动与班级报告。

## 实现

公开仓库包含 React/TypeScript 前端、Go API 与 PostgreSQL 存储。卡片定义决定表单与完成后的操作。项目级卡片不必关联单篇材料；涉及具体材料的操作需要材料引用。

## 贡献与状态

[卡片完成流程修复](https://github.com/houx15/mind-imprint/commit/958a05a7d3e4381761917449651299bf5cd0622d) 调整了材料引用要求，并增加完成流程级测试。该提交署名为 `houx15`，同时记录了 AI 共同作者。

产品官网与应用入口已上线。本次网站整理检查了这些公开页面，未登录或运行学习会话，也未验证学习成效或评估效度。

## 来源

[公开系统文档](https://github.com/houx15/mind-imprint/blob/14cefb80211bb49bba8888eceeada57813465d62/README.md) · [官网实现与部署记录](https://github.com/houx15/mind-imprint/blob/14cefb80211bb49bba8888eceeada57813465d62/apps/site-v2/README.md)。
