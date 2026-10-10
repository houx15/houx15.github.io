---
title: 'AI attitudes: a reproducible labeling pipeline'
summary: >-
  Comparable Weibo/Twitter processing with explicit label validity, provider
  provenance, and resumable intermediate results.
date: '2026-10-10'
draft: false
lang: en
featured: true
assistantTopic: attitudes
links:
  - label: Public repository
    url: 'https://github.com/houx15/ai-attitudes-social-media'
---

## The measurement problem

Comparing attitudes across platforms requires knowing how each observation became a label and how those labels became a daily measure. This repository processes previously extracted Weibo and Twitter data using a shared model and prompt, then cleans, aggregates, and exports figures and their underlying values. It is not a crawler.

Using the same labeling configuration controls one source of variation. It does not by itself prove cross-language equivalence, eliminate model bias, or make social-media samples representative of populations.

## Decisions that make the process inspectable

The [client implementation](https://github.com/houx15/ai-attitudes-social-media/blob/52ef184923a34ccf6c229a2ab199a8c273ff9a10/openrouter_client.py) pins the upstream provider and disables fallback. Each result includes provider and token metadata. Valid numeric labels and the substantive label `cannot tell` are distinguished from invalid or failed results.

Resumption skips observations with valid completed labels and leaves failures eligible for another attempt. Buffered labels are written as separate Parquet parts using a temporary file and rename, reducing the risk of a partially written result file. The [test suite](https://github.com/houx15/ai-attitudes-social-media/blob/52ef184923a34ccf6c229a2ab199a8c273ff9a10/tests/test_openrouter_client.py) includes malformed responses, retry behavior, failed observations, and skipping completed IDs.

The [README](https://github.com/houx15/ai-attitudes-social-media/blob/52ef184923a34ccf6c229a2ab199a8c273ff9a10/README.md) also documents daily aggregation and unsmoothed CSV values alongside plots, making it possible to inspect what smoothing changes.

## A documented contribution

The [September 27 storage commit](https://github.com/houx15/ai-attitudes-social-media/commit/19a097795f879db3568f746131ed2f1e707f4c5f) introduces partitioned Parquet output, shared reading of those parts, and launch scripts. GitHub attributes it to `houx15` and records an AI coauthor. The patch supports a concrete claim of documented pipeline work; it does not establish sole authorship of the research project.

## What remains a research question

This portfolio review did not execute the pipeline, inspect private datasets, or validate its labels against human annotations. Reproducible processing supports an audit; it does not replace a measurement-validity study or a sampling argument.

A useful starting question is what happens to a failed label on the next run, and why it must not silently become a neutral attitude or a `cannot tell` observation.
