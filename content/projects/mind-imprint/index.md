---
title: Mind Imprint
summary: >-
  An AI learning platform with reading, writing, courses, research workspaces,
  and structured thinking tools.
date: '2026-10-10'
draft: false
lang: en
links:
  - label: Source code
    url: 'https://github.com/houx15/mind-imprint'
  - label: Product website
    url: 'https://mind.uni-robot.cn/'
  - label: Open application
    url: 'https://mind-web.uni-robot.cn/'
assistantTopic: mind
updated: '2026-10-10'
---

## Application

Mind Imprint (思维印记) provides reading, writing, guided courses, and research-project workspaces. Its English product website uses the name **The Mark of Thinking**. The public website and web application login were accessible on 10 October 2026.

The application combines AI dialogue with structured thinking cards. Users open and complete cards; the system stores those actions and conversation records for later review and process assessment. Teacher interfaces present student activity and class reports.

## Implementation

The public repository contains a React/TypeScript frontend, Go API, and PostgreSQL storage. Card definitions determine their forms and completion effects. A project-level card can be completed without referring to a single source document; material-specific effects require that reference.

## Contribution and status

The [card-completion fix](https://github.com/houx15/mind-imprint/commit/958a05a7d3e4381761917449651299bf5cd0622d), attributed to `houx15` with an AI coauthor, corrects the material-reference requirement and adds completion-level tests.

The product has a live website and application entry point. This website review checked those public pages, without logging in or running a learning session. Learning gains and assessment validity are not established by this review.

## Sources

[Public system documentation](https://github.com/houx15/mind-imprint/blob/14cefb80211bb49bba8888eceeada57813465d62/README.md) · [Website implementation and deployment record](https://github.com/houx15/mind-imprint/blob/14cefb80211bb49bba8888eceeada57813465d62/apps/site-v2/README.md).
