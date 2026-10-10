---
title: "SSDataAgent"
summary: "使用智能体生成和评估社会调查合成数据。"
lang: "zh-CN"
links: [{"label": "源代码", "url": "https://github.com/houx15/SSDataAgent"}]
---

## 研究问题

SSDataAgent 研究如何使用 LLM 智能体生成社会调查合成数据。智能体检查源数据，编写并运行建模代码，评估生成的总体。评估包括分布保真度与源记录复制风险。

## 方法

公开仓库包含统计基线与经验 copula 迁移实现。后者在不同变量间共享重采样的源数据行，以保留联合结构，再将取值映射到指定的边际分布。分类变量使用被抽中记录实际所在的类别区间。

迁移报告区分仅使用源数据的设定，以及额外获得目标边际分布的 oracle 设定。两者可用信息不同，不能混作同一条件比较。

## 状态与贡献

研究代码和实验报告已公开。[经验 copula 实现提交](https://github.com/houx15/SSDataAgent/commit/4c7b2f5109600df0a3d85cdcbc24191f5f0cc5c6) 的作者记录为 `houx15`。

报告中的迁移评估包含两个有评分的时间对，部分设定使用较低精度。本网站未复现实验结果，不据此声称普遍的性能优势或隐私保证。

## 来源

- [系统 README](https://github.com/houx15/SSDataAgent/blob/f84416d0d119585d5189c6fd8b691acfe23e26f2/README.md)。
- [基准饱和与记录披露报告](https://github.com/houx15/SSDataAgent/blob/f84416d0d119585d5189c6fd8b691acfe23e26f2/docs/report/2026-07-15-benchmark-saturation-and-disclosure.md)。
- [经验 copula 迁移报告](https://github.com/houx15/SSDataAgent/blob/f84416d0d119585d5189c6fd8b691acfe23e26f2/docs/report/2026-07-29-empirical-copula.md)。
