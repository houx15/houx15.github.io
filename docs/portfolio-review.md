# Portfolio implementation and review

## What is implemented

The existing Eleventy / GitHub Pages site now has a restrained technical portfolio homepage, a plain source-linked conversation interface, source-backed project summaries, a visible editable illustrative radar, an academic milestone timeline, notes, and a source/privacy page. The design restores the original white background, system typography, and rule-separated layout; it contains no mascot, emoji decoration, or decorative project cards. No added dependencies, external fonts, analytics, geolocation, or model services.

The assistant is **not a live LLM**. It uses an explicit allowlist in `src/assets/knowledge.js`. It matches topics and returns authored text with links. Visitor input is inserted as text, never HTML; it is neither persisted nor transmitted. Unknown questions return an honest fallback. Private-file and credential requests return a boundary message. There is no file, tool, or network execution path for visitor instructions. Keyword filtering is a usability feature, not a security sandbox; the lack of privileged capabilities is the actual boundary.

A deployment-ready Node adapter and opt-in browser client now exist; see [assistant-backend.md](assistant-backend.md) for the architecture, tests, configuration, and activation blockers. No successful real model response has been verified. The current static deployment cannot safely hold provider credentials. To enable live AI later, select and authorize a server-side host/provider and cost limit; keep secrets in that host's secret store, use only the approved public corpus, enforce request/body/token limits and rate limits, add timeouts and explicit error states, validate citations against the source allowlist, and display privacy information before transmitting questions. Never connect this public assistant to a personal filesystem, local agent service, or chat archive. No credentials from other projects were inspected or reused.

## Editing

- `src/_data/portfolio.json`: introduction, approach, academic summary, projects, domain names and illustrative initial values.
- `src/assets/knowledge.js`: curated public answers and citations. Keep these synchronized with profile edits.
- `src/index.njk`: homepage and milestone markup.
- `src/_includes/project-cards.njk`: shared project cards.
- `src/assets/portfolio.js`: local interaction and chart drawing.
- `src/assets/style.css`: existing article styles plus the portfolio visual system.

The radar is intentionally labeled illustrative next to the chart, in its description, and beside its controls. Browser edits are temporary. Before describing it as a self-assessment, obtain Evie's actual domains and scores. The milestones intentionally omit a quantitative Y axis and calendar positions because dates and self-described values have not been supplied.

## Provenance / remaining editorial decisions

Inspected October 10, 2026:

- Existing `src/_data/site.json`: Yuxin Hou, 侯煜欣, public email, GitHub account.
- User's task brief: Evie alias, third-year Sociology PhD at Peking University, one-year Princeton VSRC, curiosity and rapid learning as desired self-description. No enrollment dates or quantified learning-speed claims were inferred.
- Public GitHub repository listing: `https://api.github.com/users/houx15/repos?per_page=100`.
- `https://github.com/houx15/mind-imprint#readme`: exact product title Mind Imprint / 思维印记 and high-level learning-platform description. Its README was inspected; the project application itself was not tested. Personal contribution and claimed impact remain unverified. Confirm this corresponds to the spoken “My Name Print.”
- The user corrected the project name to **Knowia**. Public GitHub code and repository searches did not identify it, and inspected candidate READMEs did not establish a match. Only the confirmed name is shown, with no fabricated repository link, features, or results.
- No decorative project illustrations are used.
- No published reports exist in the content directory, so the notes section truthfully shows an empty state.
- No applicable AGENTS.md or memory_summary.md was found in the checkout/inspected local Codex directories; the local memory database exposed no tables. Personal session history was not mined or copied.

## Verification and preview

`bun run verify` uses Node for the existing test runner. In this Mac environment, use:

```sh
PATH=/Users/monkey/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH bun run verify
PATH=/Users/monkey/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH bun run preview
```

Preview: `http://localhost:8081/`. Tests include content/publication isolation and new assistant grounding, unknown/private question handling, source URL restrictions, and no network/storage/geolocation calls. Browser checks cover desktop and 390px mobile, keyboard-operated chart updates, citations, injection-safe display, and error logs.

Main pushes trigger the existing GitHub Actions build and Pages publication. The user subsequently authorized main commits and pushes; no deployment configuration or access policy was changed. Confidential application materials and private documents were not included.

## Revised project selection

Selected from public repository READMEs, inspected October 10, 2026:

- [SSDataAgent](https://github.com/houx15/SSDataAgent#readme): connects social-survey simulation with tool-using agents and evaluation. Public descriptions of its architecture support the summary; reported numerical benchmark claims were deliberately omitted because they were not reproduced.
- [Mind Imprint](https://github.com/houx15/mind-imprint#readme): demonstrates a concrete learning workflow and separation of model decisions, rendering, and process records. No individual contribution claims were added.
- [AI-attitudes social-media pipeline](https://github.com/houx15/ai-attitudes-social-media#readme): provides evidence of attention to measurement comparability, provider provenance, and reproducible processing. The site explicitly says it processes extracted data rather than crawling it.

Knowia remains pending exact public-repository identification. No private repository information was used. Public GitHub repository contents are the source of project descriptions, not evidence that all functionality was independently tested.

## Visible charts (latest revision)

Both the radar and academic timeline are visible by default. The radar is rendered at build time, has a labeled 0–5 scale, visible numeric controls, and explicit placeholder captions. The timeline displays the two owner-supplied academic milestones; dates are marked pending, no durations are represented by spacing, and no life-status values are inferred. It changes from a horizontal milestone line on desktop to a vertical line on mobile.

The dialogue includes a restrained pencil-line computer SVG. Its cursor responds to input focus; processing strokes animate only while the request handler is busy. Reduced-motion settings disable both effects. The live/demo label remains separate and explicit.
