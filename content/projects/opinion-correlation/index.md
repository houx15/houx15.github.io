---
title: Opinion correlation across societies
summary: >-
  A comparison of policy-opinion structure in surveys and social media across
  the US, Europe, and China.
date: '2026-10-10'
draft: false
lang: en
links:
  - label: Source code
    url: 'https://github.com/houx15/opinion-structure-across-societies'
category: research
---

## Research question

How are opinions on different policy topics associated, and how does this structure differ across societies and data sources? The public repository compares nine topics using ANES, EVS, and WVS surveys alongside region-specific Twitter and Weibo samples.

## Method

The analysis calculates pairwise opinion correlations, topic-semantic similarity, and the effective dimensionality of respondent-by-topic opinion matrices. It includes shuffled baselines for social-media correlations, topic-keyword embeddings, spectral measures, bootstrap intervals, and robustness analyses for sampling and missingness.

The public README documents survey recoding, LLM-assisted labeling, and BERT relevance and opinion models used to produce cleaned user-level opinions.

## Status

Analysis code and topic reference material are public in `opinion-structure-across-societies`. Its import script explicitly identifies `opinion_correlation` as the earlier working directory. Raw social-media posts are not distributed; survey microdata are subject to their providers’ terms.

This page describes the research workflow. It does not report numerical findings, publication status, or an individual authorship breakdown.

## Sources

[Public README and repository structure](https://github.com/houx15/opinion-structure-across-societies/blob/dc98fb1b410e9e9791a27c791b2637baa52bba87/README.md).
