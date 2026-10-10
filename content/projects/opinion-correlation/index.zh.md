---
title: "跨社会的意见关联"
summary: "比较美国、欧洲与中国的调查及社交媒体数据中的政策意见结构。"
lang: "zh-CN"
links: [{"label": "源代码", "url": "https://github.com/houx15/opinion-structure-across-societies"}]
---

## 研究问题

不同政策议题上的意见如何关联？这种结构在社会与数据来源之间有何差异？公开仓库围绕九个议题，比较 ANES、EVS、WVS 调查与对应地区的 Twitter、微博样本。

## 方法

分析计算意见的两两相关、议题语义相似度，以及受访者与议题构成的意见矩阵的有效维度。实现包括社交媒体相关的随机打乱基线、议题关键词嵌入、谱指标、bootstrap 区间，以及针对抽样和缺失的稳健性分析。

公开 README 还说明了调查重编码、LLM 辅助标注，以及用于生成用户级意见数据的 BERT 相关性和意见模型。

## 状态

分析代码与议题参考材料已在 `opinion-structure-across-societies` 公开。其导入脚本明确将 `opinion_correlation` 标为此前的工作目录。仓库不分发原始社交媒体帖子；调查微观数据遵循各数据提供方的使用条款。

本页介绍研究流程，不陈述数值结论、发表状态或个人作者分工。

## 来源

[公开 README 与仓库结构](https://github.com/houx15/opinion-structure-across-societies/blob/dc98fb1b410e9e9791a27c791b2637baa52bba87/README.md)。
