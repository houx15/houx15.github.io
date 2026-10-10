---
title: "AI attitudes：可复核的态度标注流程"
summary: "面向微博与 Twitter 的可比较处理流程，显式记录标签有效性、服务来源与可恢复的中间结果。"
---

## 测量问题

比较不同平台上的态度，需要知道每条观察如何变成标签，以及标签如何汇总为每日指标。该仓库使用相同的模型和提示处理已经提取的微博与 Twitter 数据，然后清洗、汇总，并导出图表及其底层数值。它不是爬虫。

相同的标注配置控制了一项变化来源，但本身不能证明跨语言等价、消除模型偏差，或让社交媒体样本具有总体代表性。

## 让流程可检查的设计

[客户端实现](https://github.com/houx15/ai-attitudes-social-media/blob/52ef184923a34ccf6c229a2ab199a8c273ff9a10/openrouter_client.py) 固定上游服务商并禁用自动切换。每条结果保留服务商与 token 元数据。有效的数值标签以及具有实质含义的 `cannot tell`，与无效或失败的结果分开记录。

恢复运行时，会跳过已有有效标签的观察，而失败项仍可再次尝试。缓冲的标签通过临时文件与重命名写入独立 Parquet 分片，以降低结果文件写入不完整的风险。[测试集](https://github.com/houx15/ai-attitudes-social-media/blob/52ef184923a34ccf6c229a2ab199a8c273ff9a10/tests/test_openrouter_client.py) 覆盖格式错误的响应、重试、失败观察和已完成 ID 的跳过行为。

[README](https://github.com/houx15/ai-attitudes-social-media/blob/52ef184923a34ccf6c229a2ab199a8c273ff9a10/README.md) 还介绍了每日汇总，以及与图表一同导出的未平滑 CSV 数值，便于检查平滑处理改变了什么。

## 一项可追溯的贡献

[9 月 27 日存储提交](https://github.com/houx15/ai-attitudes-social-media/commit/19a097795f879db3568f746131ed2f1e707f4c5f) 引入分片 Parquet 输出、统一的分片读取与启动脚本。GitHub 将其归于 `houx15`，并记录了一位 AI 共同作者。补丁支持对具体流程工作的描述，不代表整个研究项目由一人独立完成。

## 仍然需要研究的问题

本次作品集整理没有执行流程、查看私人数据集，或用人工标注验证标签。可复核的处理过程有助于审计，但不能替代测量有效性研究或抽样论证。

可以从一个具体问题开始：失败标签在下一次运行时会怎样处理？为什么不能悄悄将其变成中性态度或 `cannot tell`？
