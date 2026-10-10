---
title: "SSDataAgent：评估条件"
summary: "一篇基于 SSDataAgent 公开资料的阅读笔记：统计保真度、记录复制，以及可行条件与 oracle 条件的区别。"
---

本笔记概述 SSDataAgent 公开报告中的信息设定与评估限制，不包含新增实验。

## 信息访问

[基准报告](https://github.com/houx15/SSDataAgent/blob/f84416d0d119585d5189c6fd8b691acfe23e26f2/docs/report/2026-07-15-benchmark-saturation-and-disclosure.md) 比较不同信息设定下的统计基线。访问个体记录与访问聚合分布属于不同条件；分布保真度与源记录复制也属于不同评估维度。

## 迁移设定

[经验 copula 报告](https://github.com/houx15/SSDataAgent/blob/f84416d0d119585d5189c6fd8b691acfe23e26f2/docs/report/2026-07-29-empirical-copula.md) 区分仅使用源数据的迁移和获得目标边际分布的 oracle 条件。报告包含两个有评分的时间对、一个较低精度设定，以及类别映射假设。这些限制影响结果的解释范围。

## 验证行为

[当前提交工具](https://github.com/houx15/SSDataAgent/blob/f84416d0d119585d5189c6fd8b691acfe23e26f2/src/ssdataagent/agent/tools/commit.py) 在缺少时序验证时记录警告和未验证标记。这是提示性行为，与部分旧文档描述的硬性门槛不同。

系统说明与实现来源见 [SSDataAgent](/zh/projects/ssdata-agent/)。
