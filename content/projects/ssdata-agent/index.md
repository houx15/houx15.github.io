---
title: SSDataAgent
summary: Agent-based generation and evaluation of synthetic social-survey data.
date: '2026-10-10'
draft: false
lang: en
links:
  - label: Source code
    url: 'https://github.com/houx15/SSDataAgent'
category: research
assistantTopic: ssdata
relatedReport: /reports/evaluation-and-information-access/
updated: '2026-10-10'
---

## Research question

SSDataAgent studies the use of an LLM agent to generate synthetic survey data. The agent inspects source data, writes and runs modeling code, and evaluates the generated population. Evaluation covers distributional fidelity and the risk of copying source records.

## Method

The public repository includes statistical baselines and empirical-copula transfer. The latter resamples shared source rows across variables to retain their joint structure, then maps values to the specified marginals. For categorical variables, the implementation uses the sampled row’s category interval.

The transfer report separates a source-only setting from an oracle setting supplied with target marginals. These settings have different information access and should be compared separately.

## Status and contribution

Research code and experiment reports are public. The [empirical-copula implementation commit](https://github.com/houx15/SSDataAgent/commit/4c7b2f5109600df0a3d85cdcbc24191f5f0cc5c6) is attributed to `houx15`.

The reported transfer evaluation contains two scored time pairs and a reduced-precision setting. Its results have not been reproduced for this website; no general performance or privacy guarantee is stated here.

## Sources

- [System README](https://github.com/houx15/SSDataAgent/blob/f84416d0d119585d5189c6fd8b691acfe23e26f2/README.md).
- [Benchmark saturation and record disclosure report](https://github.com/houx15/SSDataAgent/blob/f84416d0d119585d5189c6fd8b691acfe23e26f2/docs/report/2026-07-15-benchmark-saturation-and-disclosure.md).
- [Empirical-copula transfer report](https://github.com/houx15/SSDataAgent/blob/f84416d0d119585d5189c6fd8b691acfe23e26f2/docs/report/2026-07-29-empirical-copula.md).
