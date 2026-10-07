# Yuxin Hou — personal website

An independently designed, text-first website for projects and technical reports. Built with Eleventy; deployed as static HTML to GitHub Pages. No client-side framework or external font service is required.

## Local development

Requirements: Node.js 24 and Bun 1.4.2 (versions are pinned in CI).

```sh
bun install --frozen-lockfile
bun run dev          # published content only, http://localhost:8080
bun run preview      # includes drafts, http://localhost:8081
bun run verify       # integration tests, production build, link/asset checks
```

Production output is `_site/`. Draft preview is isolated in `_preview/`. Neither directory is committed.

## Content

Write Markdown in `content/projects/<slug>/index.md` or `content/reports/<slug>/index.md`. Reports and articles share the reports section. Place images and public attachments alongside the Markdown file and link to them with relative paths. Only entries explicitly marked `draft: false` enter a production build.

The website starts with no projects or reports. Test fixtures are generated in temporary directories and never published as personal work.

See [Writing and publishing](docs/publishing.md) for the complete workflow. Use `bun run content new report <slug> --title "Title"` to start a draft, and `bun run skill:install` to install the reusable Codex skill.

Identity and contact information: `src/_data/site.json`. About text: `src/about.njk`. Templates: `src/_includes/`. Styling: `src/assets/style.css`.

## Deployment

`.github/workflows/pages.yml` tests all `main` and `codex/**` pushes and pull requests to `main`. Only a successful build on `main` can deploy to the `github-pages` environment, through GitHub's official Pages actions. The repository's Pages source must be **GitHub Actions**.

The old Hexo-generated website is preserved on `codex/archive-site-2026-10-07` and the former `master` branch. The new site does not require its themes, remote assets, or build system.
