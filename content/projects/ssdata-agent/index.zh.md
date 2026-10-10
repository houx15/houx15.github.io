---
title: "SSDataAgent：问卷数据模拟与评估"
summary: "一个生成合成调查总体的研究系统，也追问评估指标究竟奖励了什么。"
---

## 研究问题

更高的基准分数，是否意味着更好的合成总体？SSDataAgent 探索将 LLM 作为数据分析员：由模型检查调查数据、拟合生成器，并检验生成的总体。关键不仅是智能体能否提高分数，还包括它使用了哪些信息，以及分数没有衡量哪些属性。

[公开 README](https://github.com/houx15/SSDataAgent/blob/f84416d0d119585d5189c6fd8b691acfe23e26f2/README.md) 介绍了智能体系统。后续报告讨论统计基线、记录复制、受限信息访问和跨调查情境迁移，为理解模型比较提供了更有条件的解释。

## 一个具体的工程改动

经验 copula 实现让各列共享同一个重采样的源数据行。对于分类变量，它使用该行真实类别对应的区间，而不是将依赖关系映射为单一潜在排序。这使联合结构的处理方式更明确，并将其与边际值映射分离。

GitHub 将这项[实现提交](https://github.com/houx15/SSDataAgent/commit/4c7b2f5109600df0a3d85cdcbc24191f5f0cc5c6) 归于 `houx15`。补丁是具体贡献的直接证据，但不代表整个仓库或所有实验均由一人独立完成。

## 评估方式会改变结果的含义

[7 月 15 日报告](https://github.com/houx15/SSDataAgent/blob/f84416d0d119585d5189c6fd8b691acfe23e26f2/docs/report/2026-07-15-benchmark-saturation-and-disclosure.md) 分析了为什么行重采样在保真度指标上可能表现良好，却同时复制真实记录。[7 月 29 日迁移报告](https://github.com/houx15/SSDataAgent/blob/f84416d0d119585d5189c6fd8b691acfe23e26f2/docs/report/2026-07-29-empirical-copula.md) 区分了仅使用源数据的可行条件和获得目标边际分布的 oracle 条件。报告也列出了限制：只有两个计分的时间配对、一个数据集采用较低精度设置，以及跨情境类别映射的假设。

阅读文档时，有一个实现细节值得核对：[当前提交工具](https://github.com/houx15/SSDataAgent/blob/f84416d0d119585d5189c6fd8b691acfe23e26f2/src/ssdataagent/agent/tools/commit.py) 对缺失的时序验证采用提示而非阻断，记录未验证标记和警告。部分旧文档仍将它描述为硬性门槛。

## 证据范围

公开代码与报告能够支持对实现、实验解释和故障诊断的描述。本次作品集整理没有重跑实验、审计调查数据，也没有建立普遍的隐私保证。因此，这里不宣称数值上的优越性或生产部署就绪。

可以进一步讨论：信息优势与模型能力有何区别？一个失效的验证器又会怎样改变智能体的行为？
