---
title: Knoweia
summary: >-
  A desktop course-learning application with a local tutoring runtime and
  synchronized course progress.
date: '2026-10-10'
draft: false
lang: en
links:
  - label: Source code
    url: 'https://github.com/houx15/llm-course-desktop'
  - label: Desktop releases
    url: 'https://github.com/houx15/llm-course-desktop/releases'
---

## Application

Knoweia is the product name in the public `llm-course-desktop` package and interface. The Electron/React application provides course and chapter navigation, streamed tutoring conversations, and progress synchronization. It manages a local Python sidecar that runs the tutoring agents.

## System

The desktop client connects to a FastAPI/PostgreSQL backend for accounts, course enrollment, content-bundle updates, and progress. Model-provider settings are configured in the desktop application. The backend documentation separates these services from the local agent-execution loop.

The public code also contains bundle checksum verification and a desktop update mechanism. The backend planning documents place the desktop, backend, and sidecar under the original `llm-learning-platform` directory.

## Status

The repository publishes desktop releases, including v0.3.0. This page links the release list rather than claiming that a browser demo is available. The installer and authenticated course workflow have not been tested for this website. The inspected sources do not establish an individual contribution breakdown.

## Sources

- [Product name and desktop package](https://github.com/houx15/llm-course-desktop/blob/c4dc8cb21685f18e6c2594efc3c8fcebf36c76d1/package.json).
- [Desktop documentation](https://github.com/houx15/llm-course-desktop/blob/c4dc8cb21685f18e6c2594efc3c8fcebf36c76d1/README.md).
- [Backend documentation](https://github.com/houx15/llm-course-backend/blob/a0242d8fc0b5e6fcd38a97c4dc475ca301a2bcd7/README.md).
