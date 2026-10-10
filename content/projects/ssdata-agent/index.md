---
title: 'SSDataAgent: survey simulation and evaluation'
summary: >-
  A research system for generating synthetic survey populations—and examining
  what its evaluation actually rewards.
date: '2026-10-10'
draft: false
lang: en
featured: true
assistantTopic: ssdata
relatedReport: /reports/evaluation-and-information-access/
links:
  - label: Public repository
    url: 'https://github.com/houx15/SSDataAgent'
---

## The research question

Does a better benchmark score mean a better synthetic population? SSDataAgent explores an LLM-as-data-analyst approach: the model inspects survey data, fits a generator, and checks the generated population. The interesting question is not only whether an agent can improve a score, but which information it used and which properties the score leaves out.

The [public README](https://github.com/houx15/SSDataAgent/blob/f84416d0d119585d5189c6fd8b691acfe23e26f2/README.md) describes the agent system. Later repository reports examine statistical baselines, record copying, restricted information access, and transfer between survey contexts. Those reports provide a more qualified account than a headline model comparison.

## A concrete engineering change

The empirical-copula implementation keeps a shared resampled source row across columns. For categorical variables, it uses that row’s actual category interval rather than mapping dependence onto a single latent ordering. This makes the treatment of joint structure explicit and keeps it separate from the marginal value mapping.

GitHub attributes the [implementation commit](https://github.com/houx15/SSDataAgent/commit/4c7b2f5109600df0a3d85cdcbc24191f5f0cc5c6) to `houx15`. Its patch is direct evidence of a documented contribution. It is not a claim of sole authorship of the repository or every experiment.

## Evaluation changes the interpretation

The [July 15 report](https://github.com/houx15/SSDataAgent/blob/f84416d0d119585d5189c6fd8b691acfe23e26f2/docs/report/2026-07-15-benchmark-saturation-and-disclosure.md) examines why resampling can look strong under a fidelity benchmark while copying real records. The [July 29 transfer report](https://github.com/houx15/SSDataAgent/blob/f84416d0d119585d5189c6fd8b691acfe23e26f2/docs/report/2026-07-29-empirical-copula.md) separates a feasible source-only condition from an oracle condition with target marginals. It also records limits: two scored time pairs, reduced precision for one dataset, and assumptions about categories across contexts.

One implementation detail matters when reading the documentation: the current [commit tool](https://github.com/houx15/SSDataAgent/blob/f84416d0d119585d5189c6fd8b691acfe23e26f2/src/ssdataagent/agent/tools/commit.py) makes missing chronology verification advisory. It records an unverified flag and a warning rather than refusing the commit. Some older descriptions still call it a hard gate.

## What this page establishes

The public code and reports document an implementation, experiment interpretation, and failure diagnosis. This portfolio review did not rerun the experiments, audit the underlying survey data, or establish a general privacy guarantee. Numerical superiority and deployment readiness are therefore not claimed here.

For a focused discussion, ask about the difference between information access and model capability, or how a broken verifier can change an agent’s behavior.
