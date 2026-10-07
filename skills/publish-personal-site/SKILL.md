---
name: publish-personal-site
description: Draft, revise, preview, and publish Yuxin Hou's projects, products, technical reports, and articles on houx15.github.io, including text, figures, formatting, validation, and deployment verification. Use for this personal website's content workflow.
---

# Personal website publishing

Work in the `houx15/houx15.github.io` repository. The known local checkout is `/Users/monkey/Codings/houx15.github.io`; use the current checkout if its origin is the same repository. Check the working tree and read `docs/publishing.md` for the current source format, commands, and deployment procedure. Do not silently target another repository if this checkout is missing.

## Editorial requirements

The owner wants academic, precise, pragmatic language and an original, simple website. Use direct names such as Projects and Technical Reports. Do not introduce branding metaphors, playful labels, sales copy, unsupported claims, or imitation of another author's work.

Preserve the author's argument and original language unless translation or substantive rewriting is requested. Distinguish evidence, assumptions, interpretation, and limitations. Do not invent experiments, results, citations, capabilities, credentials, dates, or images presented as evidence. Read [references/editorial.md](references/editorial.md) when preparing text, figures, or citations.

## Workflow

1. Determine whether the user wants drafting, revision, preview, or publication. Use supplied text, notes, repositories, screenshots, data, and citations. Ask only for missing information that changes factual content; keep unresolved points visible in the draft. A short project description does not require a full paper structure.
2. Choose `project` for products/tools/demos and `report` for technical reports/articles. Use `bun run content new …` for new entries. Keep existing slugs stable when updating. Store only intended public attachments beside the Markdown file. Set the correct language and an accurate short summary.
3. Apply the existing content template and styles. Use figures to support the content, with descriptions, captions, provenance, and legible labels. Do not redesign the website as part of ordinary publication.
4. Use `bun run preview` for draft review. Inspect the rendered page, including desktop and phone layouts. Where material permits, check formulas, code, tables, image loading and legibility, heading links, citations, and demo/source links. If browser verification is unavailable, report that specific gap rather than claiming it passed.
5. When publication is requested, run `bun run content ready <type> <slug>` and `bun run verify`. The first command changes local publication state but does not push. Review the exact content diff, resolve material issues, then follow the branch/CI/merge/deploy procedure in `docs/publishing.md`. Authorization already given for this content persists; do not add a redundant approval gate.
6. Verify the matching GitHub Actions run and the actual live page/listing. Report the page link, what changed, and any unresolved limitation. A successful local build or push alone is not a successful publication.

Requests for a draft or preview stop before publication. Repository drafts are excluded from the website, but this is a public Git repository, so do not commit confidential source materials. Keep unrelated changes out of the content commit. Never disable GitHub checks or Pages environment restrictions to make deployment pass.
