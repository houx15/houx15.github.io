# Portfolio implementation and source review

## Current content

The accepted Eleventy layout is retained: introduction and illustrated chat entry, academic background with timeline/radar, and the work sections. Research and Projects now have separate homepage sections and bilingual listing routes (`/research/`, `/projects/`, and `/zh/` equivalents). Mobile navigation wraps onto its own row to accommodate Research. Existing article URLs remain stable, including SSDataAgent under `/projects/ssdata-agent/`; its navigation and listing classification are Research.

Research: SSDataAgent, opinion correlation, opinion dynamics. Projects: Mind Imprint, Knoweia, OrgClaw, AgenTerm, LivePad. AI-attitudes remains accessible as supplementary research software, outside the product gallery. The copy describes questions, methods, implemented components, availability, and documented contributions. Metaphorical headings and inferred cross-project narratives have been removed from both languages and the assistant.

AgenTerm and LivePad are name-only entries. Opinion dynamics is a named research area supported by the user's classification and earlier public profile; its exact repository is unresolved. No private repository contents were used in public descriptions. No papers, numerical results, performance guarantees, or individual roles were invented.

## Source map

Inspected 10 October 2026. Public repository snapshots were read in `/tmp/portfolio-source-review/`; none of those checkout contents are copied into the website. Available local coding directories did not contain the named project checkouts. Public source files resolve the user's `llm-learning-platform` directory clue.

| Item | Sources and revision | Supported description / status |
| --- | --- | --- |
| Profile | User-supplied PhD year and Princeton visit; archived website `40acdb33c13f878907e88f86319442715c398b3d/about/index.html` | Tsinghua B.E. Mechanical Engineering and M.A. Education; PKU Center for Social Research from September 2024; current one-year Princeton VSRC. Exact degree and visit dates remain unspecified. |
| SSDataAgent | `houx15/SSDataAgent` at `f84416d0d119585d5189c6fd8b691acfe23e26f2`; README, July 15/29 reports, commit tool | Public research code and reports on synthetic survey data, information settings, and copying checks. Empirical-copula contribution: `4c7b2f5109600df0a3d85cdcbc24191f5f0cc5c6`, attributed to houx15. Numerical findings not reproduced. |
| Opinion correlation | `houx15/opinion-structure-across-societies` at `dc98fb1b410e9e9791a27c791b2637baa52bba87`, README | Nine policy topics; survey/social-media comparison across US, Europe, China; correlations, semantic similarity, dimensionality. Public README explicitly identifies `opinion_correlation` as the earlier working directory. No private source needed. No publication or authorship breakdown claimed. |
| Opinion dynamics | User classification; archived profile above | Social-media opinion dynamics as research area only. Exact repository, methods, and results unconfirmed. |
| Mind Imprint | `houx15/mind-imprint` at `14cefb80211bb49bba8888eceeada57813465d62`; README, card lifecycle, `apps/site-v2/README.md` | Learning web application; public website uses The Mark of Thinking. `https://mind.uni-robot.cn/` and its linked `https://mind-web.uni-robot.cn/` login were verified in Chrome. No login, learning session, or paid call. Card fix `958a05a7d3e4381761917449651299bf5cd0622d` attributed to houx15 with AI coauthor. |
| Knoweia | `houx15/llm-course-desktop` at `c4dc8cb21685f18e6c2594efc3c8fcebf36c76d1` (package, interface, README); backend at `a0242d8fc0b5e6fcd38a97c4dc475ca301a2bcd7` | Product name verified as **Knoweia**, correcting prior transcription. Electron course application, local Python sidecar, FastAPI/PostgreSQL services. Public releases include v0.3.0; installer not run. Backend plans reference the original `llm-learning-platform` parent directory. No individual role inferred. |
| OrgClaw | `houx15/OrgClaw` at `5962afbb6ee1053a410ca76c1d8e1d56da496ba3`; server, loop, tool registry, providers, architecture | Public agent-runtime prototype. Model adapters, tools, chat endpoint, session storage are present in code. Broader organizational messaging integrations are plans, not verified deployments. No public demo or individual role established. |
| AgenTerm / LivePad | Names explicitly supplied by user | Names only. Private-source feature descriptions require precise approval before publication. |
| AI-attitudes | `houx15/ai-attitudes-social-media` at `52ef184923a34ccf6c229a2ab199a8c273ff9a10` | Research labeling pipeline; storage commit `19a097795f879db3568f746131ed2f1e707f4c5f` attributed to houx15 with AI coauthor. Shared configuration is not evidence of measurement equivalence. |

Each public detail page includes fixed-revision citations. Repository ownership is not treated as proof of sole authorship. No private datasets, credentials, application materials, or chat histories are included. No applicable AGENTS.md or memory_summary.md was found in the website checkout/local Codex sources during the initial inspection.

## Editing

- `src/_data/portfolio.json`: bilingual Research and Projects lists, summaries, verified product links, illustrative radar values.
- `src/assets/ui.js`: bilingual introduction, biography, headings, and interface labels.
- `content/projects/*/index.md` and `index.zh.md`: full paired descriptions. `category: research` or `research-software` controls listing and back-navigation without changing existing URLs.
- `content/reports/`: notes; the SSDataAgent note summarizes sources without adding experiments.
- `src/assets/knowledge.js` and `knowledge-zh.js`: explicit public assistant facts and translations. Named subjects take precedence over generic contribution/failure terms.

The radar remains visibly illustrative, not an approved self-rating. Timeline milestones do not infer emotional or life-status values.

## Assistant status

The published assistant remains an explicitly labeled **local topic-matching demo**, not a live LLM. It has no filesystem, credential, geolocation, private-history, or tool access. Questions render as text. The latest question can appear in a URL fragment when entering chat or switching languages; it is not transmitted to the server but may remain in browser history or a copied link. No full transcript is stored.

The optional server adapter is disabled. It selects only approved fact IDs and returns server-owned wording and citations. Mock-provider tests cover boundaries and failure handling. Activation still needs approved hosting, model/key, and budget; no paid model call was made. See [assistant-backend.md](assistant-backend.md).

## Verification and publishing

Use the bundled Node runtime:

```sh
PATH=/Users/monkey/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH bun run verify
```

31 tests cover content isolation, bilingual routing, separate research/product listings, stable legacy URLs, named-subject routing, privacy boundaries, and optional-server behavior. Production contains 28 HTML pages. Browser review includes desktop/mobile, research and product navigation, language switching, Knoweia answers, and the verified Mind Imprint website/application links. Screenshots are saved in ignored `.verification/portfolio/`.

Local preview: `http://localhost:8081/`. The user authorized main-branch commits and pushes; the existing Pages workflow deploys main. Verify the exact revision in `/build-info.json` and the matching Actions run after each push. No deployment configuration or access policy was changed.
