---
title: 'SSDataAgent: evaluation conditions'
summary: >-
  A repository reading note on statistical fidelity, record copying, and
  feasible versus oracle conditions in SSDataAgent.
date: '2026-10-10'
draft: false
lang: en
updated: '2026-10-10'
---

This note summarizes the information settings and evaluation limits in SSDataAgent’s public reports. It does not add an experiment.

## Information access

The [benchmark report](https://github.com/houx15/SSDataAgent/blob/f84416d0d119585d5189c6fd8b691acfe23e26f2/docs/report/2026-07-15-benchmark-saturation-and-disclosure.md) compares statistical baselines under different information settings. Access to individual records and access to aggregate distributions are different conditions. Distributional fidelity and copying of source records are also separate evaluation dimensions.

## Transfer settings

The [empirical-copula report](https://github.com/houx15/SSDataAgent/blob/f84416d0d119585d5189c6fd8b691acfe23e26f2/docs/report/2026-07-29-empirical-copula.md) separates source-only transfer from an oracle condition supplied with target marginals. It reports two scored time pairs, a reduced-precision setting, and assumptions about category mappings. These limits restrict the interpretation of its results.

## Verification behavior

The [current commit tool](https://github.com/houx15/SSDataAgent/blob/f84416d0d119585d5189c6fd8b691acfe23e26f2/src/ssdataagent/agent/tools/commit.py) records a warning and unverified flag when chronology verification is missing. This is advisory behavior, unlike the hard gate described in some older documentation.

See [SSDataAgent](/projects/ssdata-agent/) for the system description and implementation sources.
