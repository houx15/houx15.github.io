---
title: OrgClaw
summary: >-
  An agent-runtime prototype with tool execution, session memory, and
  model-provider adapters.
date: '2026-10-10'
draft: false
lang: en
links:
  - label: Source code
    url: 'https://github.com/houx15/OrgClaw'
---

## Implemented components

The public OrgClaw code contains a Python agent loop that calls a model, executes requested tools, and stores conversation turns. A FastAPI server exposes a chat endpoint. Provider adapters support Anthropic and OpenAI-compatible APIs; memory implementations include in-memory and PostgreSQL stores.

The tool registry includes file operations, shell and Python execution, HTTP requests, and web search. The repository includes tests for the runtime, stores, providers, and tools.

## Status

This is a public code prototype. The architecture document describes a broader organizational platform, including messaging gateways and an orchestration layer. Those plans are not evidence of deployed Feishu or DingTalk integration.

No public product demo or deployment was verified for this page. The runtime was not executed during this website review, and no individual authorship breakdown is asserted.

## Sources

[Agent server](https://github.com/houx15/OrgClaw/blob/5962afbb6ee1053a410ca76c1d8e1d56da496ba3/orgclaw/agent/runtime/server.py) · [Agent loop](https://github.com/houx15/OrgClaw/blob/5962afbb6ee1053a410ca76c1d8e1d56da496ba3/orgclaw/agent/runtime/core/loop.py) · [Architecture specification](https://github.com/houx15/OrgClaw/blob/5962afbb6ee1053a410ca76c1d8e1d56da496ba3/docs/2026-03-06-technical-architecture.md).
