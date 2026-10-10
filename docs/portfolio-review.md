# Portfolio implementation and review

## Implementation

The existing Eleventy / GitHub Pages site has a restrained technical homepage, source-linked conversation interface, three substantive project case studies, one repository reading note, visible editable illustrative radar, and an academic milestone timeline. The design uses white space, system typography, simple rules, and a small pencil-line computer identity. Focus and processing animations respect reduced motion. No dependencies, external fonts, analytics, or geolocation were added.

The published assistant is **a local topic-matching demo, not a live LLM**. `src/assets/knowledge.js` is its explicit public allowlist. Input is rendered as text; questions are not persisted or transmitted. Unknown questions return an honest fallback. There is no visitor-accessible filesystem, credential, tool, or network execution path. Keyword filtering is a usability feature; absence of privileged capabilities is the actual boundary.

A disabled Node adapter and opt-in client are implemented; see [assistant-backend.md](assistant-backend.md). Tests use a mock provider. No successful real model response or paid call has been verified. Activation needs an approved server-side host, provider key/model, and nonzero daily usage budget. The static Pages deployment cannot hold secrets. No credentials from other projects were inspected or reused.

## Editing and reader journey

- `src/_data/portfolio.json`: intro, approach, project summaries, domains, illustrative values.
- `content/projects/`: SSDataAgent, Mind Imprint, and AI-attitudes case studies, including fixed-revision evidence and contribution commits.
- `content/reports/evaluation-and-information-access/`: explicitly labeled repository reading note, not a new experiment.
- `src/assets/knowledge.js`: synchronized source-backed answers; specific engineering, research-method, and failure questions.
- `src/index.njk`: homepage and milestones; `src/_data/visualizations.js` renders the radar at build time.
- `src/entry.njk`: article contents and related-reading/assistant paths.

The homepage project summaries lead to local case studies and public code. The assistant's citations lead to those same case studies. A project’s “Ask” link prefills only a reviewed topic; navigation never submits a question or contacts a model. Case studies do not repeat as duplicate homepage listings. Knowia’s unresolved source is documented on About and in the assistant rather than occupying the main project list.

The radar's five values remain conspicuously illustrative pending actual owner ratings. Browser edits are temporary. The timeline has no inferred life-status values or scaled durations: it shows Tsinghua degrees before September 2024, PKU from September 2024, and Princeton as a concurrent current visit. Exact degree-completion and visit dates remain unspecified.

## Source provenance

Inspected October 10, 2026. Only public GitHub content and the user's supplied profile were used:

- Existing `src/_data/site.json`: name, Chinese name, public email and GitHub.
- User brief: Evie alias, third-year Sociology PhD, current one-year Princeton VSRC, curiosity/rapid learning as desired editable self-description.
- Archived public website, revision `40acdb33c13f878907e88f86319442715c398b3d`, `about/index.html`: Tsinghua B.E. Mechanical Engineering and M.A. Education; PKU Center for Social Research entry September 2024.
- SSDataAgent revision `f84416d0d119585d5189c6fd8b691acfe23e26f2`: README, July 15 and July 29 reports, current commit tool. The current chronology check is **advisory**, correcting older hard-gate prose. Contribution evidence: empirical-copula commit `4c7b2f5109600df0a3d85cdcbc24191f5f0cc5c6`, attributed to houx15. No numerical superiority or privacy guarantee is claimed.
- Mind Imprint revision `14cefb80211bb49bba8888eceeada57813465d62`: README, card lifecycle and tests. Contribution: completion guard fix `958a05a7d3e4381761917449651299bf5cd0622d`, attributed to houx15 with AI coauthor. Branding commit `b5b7b367cb9a22b8a26a2b2e90e833e8080e9e58` names the UI The Mark of Thinking. The exact repository is `mind-imprint`, matching the likely spoken reference; owner can confirm that connection.
- AI-attitudes revision `52ef184923a34ccf6c229a2ab199a8c273ff9a10`: README, OpenRouter client, tests. Contribution: partitioned storage commit `19a097795f879db3568f746131ed2f1e707f4c5f`, attributed to houx15 with AI coauthor. Shared labeling is not described as proof of representativeness or eliminated language/model bias.
- Knowia is the owner-confirmed name; public repository/code searches and candidate READMEs did not establish its exact source. No guessed description or link.

These sources substantiate documented design and specific commits, not sole project authorship, independent deployment tests, research reproduction, or measured learning outcomes. No private datasets or application materials were included.

No applicable AGENTS.md or memory_summary.md was found in the inspected checkout/local Codex directories; the local memory database had no tables. Personal chat/session histories were not mined.

## Verification and publication

Use the bundled Node runtime on this Mac:

```sh
PATH=/Users/monkey/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH bun run verify
PATH=/Users/monkey/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH bun run preview
```

All 22 tests pass, covering content isolation, publication workflow, source grounding, unsupported/private questions, safe client errors/citations, server boundaries, mock provider behavior, durable budgets, and quotas. Build/link checks cover nine HTML pages. Browser review covers desktop and 390px mobile, keyboard radar changes, project/assistant navigation, empty/unknown/private input, and visible source links. Screenshots are kept in ignored `.verification/portfolio/`.

Preview: `http://localhost:8081/`. Main pushes trigger existing GitHub Pages CI. The user subsequently authorized committing and pushing to main; no deployment configuration or access policy was changed. Match the deployed `/build-info.json` revision to the pushed commit before claiming publication is complete.
