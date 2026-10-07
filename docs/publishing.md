# Writing and publishing

## Routine use with Codex

Use `$publish-personal-site` with your source material. For example:

- “把这些实验记录整理成一篇中文 report，保留我的论证，先给我预览。”
- “根据这个仓库和截图整理项目介绍，不要添加没有实现的功能。”
- “检查这篇文章的文字、图表、引用和手机排版，然后发布。”

The skill supports drafting, revising, previewing, and publishing. A request for a draft or preview does not publish anything. A clear instruction to publish is sufficient; no repeated confirmation is required for the same agreed scope.

## One-time setup

Install Node.js 24 and Bun 1.4.2, then run `bun install --frozen-lockfile` in this repository. The GitHub workflow uses these versions too. The website remains a regular Markdown project without Codex.

Install the repository's skill into Codex with `bun run skill:install`. It is copied to `$CODEX_HOME/skills/publish-personal-site`, or `~/.codex/skills/publish-personal-site` when `CODEX_HOME` is unset. To update an existing installation after reviewing changes, use `bun run skill:install --update`. Start a new chat if the installed skill has not appeared in the current session.

## Create and preview

```sh
bun run content new report evaluation-method --title "Evaluation method" --lang en
bun run content new project analysis-tool --title "Analysis tool"
bun run content list
bun run preview
```

`article` and `product` are accepted aliases for `report` and `project`. The slug becomes the permanent URL. Keep it stable after publication. Titles can be changed independently.

Preview runs at `http://localhost:8081/` and includes drafts. `bun run dev` at `http://localhost:8080/` contains published entries only. Draft preview writes `_preview/`; production writes `_site/`. Draft pages and their attachments are excluded from production, its listings, and sitemap. **This repository is public: committed drafts are still visible on GitHub.** Keep confidential material outside the repository.

Edits trigger preview rebuilds automatically. After deleting a content folder, restart preview (or save another source file) to refresh the listing; Eleventy queues file removals until the next change event.

Each entry is a folder:

```text
content/reports/evaluation-method/
  index.md
  comparison.png
  appendix.pdf
```

Required metadata:

```yaml
---
title: "Evaluation method"
summary: "One or two accurate sentences describing the question and scope."
date: "2026-10-07"
draft: true
lang: en
---
```

Use `lang: zh-CN` for Chinese. Published entries need a title, summary, valid quoted date, and nonempty body. Optional fields: `updated`, `featured` (projects), and `links`, a list of `{label, url}` objects with HTTPS URLs. A report need not follow a rigid academic-paper structure. Use only the sections the material warrants.

## Text, mathematics, figures, and references

- The template provides the page title. Start body sections at `##`; `##` and `###` automatically form a linked table of contents.
- Use `$x$` inline and `$$ ... $$` for display mathematics. KaTeX runs during the build, with local styles and fonts.
- Fenced code blocks take a language, such as `python`, `bash`, or `javascript`.
- Markdown tables scroll inside their own container on small screens.
- Use descriptive image alt text and put the caption in the optional title:

```md
![Comparison of the two methods across evaluation conditions](comparison.png "Figure 1. Results under the specified evaluation conditions. Source: …")
```

- Each standalone Markdown image renders as a figure. Captions are plain text. Number figures consistently, refer to them in the text, and identify borrowed sources. For data plots, preserve axis labels, units, uncertainty, and the script/data used to generate them. Do not use generated imagery as evidence.
- Keep images local when you have the right to redistribute them. Prefer PNG for charts and screenshots, WebP/JPEG for photographs, and SVG for trusted vector figures. A useful starting point is twice the displayed width (roughly 1,400 px); check label legibility on mobile before reducing size. Do not stretch images or require decorative covers.
- Public attachment extensions copied from a published entry: PNG, JPEG, WebP, GIF, AVIF, SVG, PDF, CSV, JSON, ZIP, MP4, WebM. Every such file in that entry folder is public, whether linked or not. Notes/source code can remain separate or be linked from a code repository; review ZIP contents before publication.
- Use linked references or Markdown footnotes `[^source]`, with `[^source]: ...` definitions. Verify authors, titles, dates, and URLs against the actual sources; the automated checker does not establish factual correctness or external-link availability.
- Markdown permits HTML for necessary cases such as video or a figure with a linked credit. Do not paste unreviewed scripts or third-party tracking embeds.

## Prepare for publication

```sh
bun run content ready report evaluation-method
bun run verify
```

`ready` validates the entry, marks it public, sets its publication date to today in America/New_York (or `--date YYYY-MM-DD`), builds production output, and checks local links and assets. It restores the source if validation/build checks fail. It **does not commit or push**. For an existing published entry, the original date is retained and `updated` is set instead.

Inspect the page in a browser at desktop and phone widths. Check the conclusion and limitations, references, captions, formulas, tables, image legibility, and project links. Automated checks cover structural correctness; they do not replace this content review.

## Publish

1. Confirm the requested content is ready and publication is in scope. Inspect `git status`, the diff, and `origin`; do not include unrelated work.
2. Fetch the remote. Work on `codex/content-<slug>` based on current `main`, or continue a suitable existing content branch. Do not reset or overwrite user changes.
3. Run `bun run verify`. Stage only the intended content folder and any reviewed shared changes; commit and push the branch. The `Build and deploy website` workflow validates `codex/**` branches without deploying them.
4. Wait for the CI run for that exact commit. If it fails, inspect and fix the cause before retrying. A timeout does not mean a failed run.
5. Merge the checked branch into updated `main`, push, and wait for its exact workflow run's build **and deploy** jobs to succeed. No force push is needed.
6. Run `bun run verify:live --revision <full-commit-sha> --path /reports/<slug>/` (or the project path). This checks the live build's exact revision, public routes, stylesheet, and local images. Then open the live entry and relevant listing in a browser. Check text, loaded images, formula styling, links, and mobile layout. Return the actual page URL and deployment result.

If a push or deployment outcome is unknown, inspect the remote SHA/run before retrying. Never create duplicate commits or disable branch restrictions to bypass a failed deploy. If a failed check requires content decisions, leave the work on its branch and explain what is missing.

## CI and recovery

- Public site: `https://houx15.github.io/`.
- Default/publication branch: `main`.
- Pages source: GitHub Actions; workflow: `.github/workflows/pages.yml`.
- Deployment environment: `github-pages`, restricted to branch `main`.
- Old site: `codex/archive-site-2026-10-07` (also retained on `master`). Do not publish from those branches.
- For a regression, revert the specific faulty change on `main`, preserving history, then let the same checked deployment run. Do not change Pages settings for normal content publication.

## Test coverage

`bun run verify` runs isolated end-to-end builds for empty content, published projects/reports, draft exclusions, multilingual text, formulas, figures/captions, code, tables, footnotes, metadata, internal links, and the content CLI's draft-to-ready/update/error paths. Fixtures are created in temporary folders, never published as user work.
