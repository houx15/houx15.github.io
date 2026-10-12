# Codex Cloud publishing

## Status and scope

The repository contains a portable publishing skill, installation/check scripts, and the existing GitHub Pages deployment workflow. These files do not themselves create a Codex Cloud environment or grant GitHub access. Account-side creation, environment publication, and a fresh cloud-task verification must be completed before calling the cloud workflow operational.

## Environment configuration

Create an environment in ChatGPT Settings → Codex Cloud → Environments. Select only `houx15/houx15.github.io`; suggested name: `Personal site publishing`. Keep access **Only me**.

Ask the environment setup agent to:

1. Read `AGENTS.md`, `skills/publish-personal-site/SKILL.md`, and this document from the checked-out repository.
2. Install Node.js 24, Bun 1.4.2, Git, and GitHub CLI (`gh`). Use the provided runtime management and official package sources. Do not copy local-machine credentials.
3. Set the install script to run `bash scripts/cloud-setup.sh` from the repository root. It installs locked dependencies and verifies the site without publishing content.
4. Configure the start skill to locate this repository, read `AGENTS.md` and the publishing skill, and check the runtime. Use `bun install --frozen-lockfile` if dependencies need refreshing. Do not publish anything merely on startup.
5. Allow the package-manager domains plus `api.github.com`, `github.com`, and `houx15.github.io` for repository operations, workflow checks, and live verification. Add download hosts only if the selected official tool installation requires them. Reference browsing may require additional destinations for a particular note.
6. Verify the connected GitHub identity has access to this repository. Run `node scripts/cloud-access.mjs` inside the cloud environment. It is read-only and does not print credentials. A clone or successful build alone does not prove permission to publish.
7. Review setup results, save, and publish the environment. Then verify again from a fresh cloud task.

If the environment's built-in GitHub connection supports PRs but not terminal `gh`/git writes, preserve the prepared content and use its supported PR flow. Report that direct publication is not yet configured. Do not silently claim a PR is published, install broad credentials, change branch protections, or grant repository permissions. Any additional credential must be supplied by the owner through the environment's secure account settings with the appropriate repository scope, never through chat or source files.

## Copyable setup request

> Configure this environment for publishing learning notes to houx15/houx15.github.io. Read AGENTS.md, docs/cloud-publishing.md, and skills/publish-personal-site/SKILL.md. Install Node.js 24, Bun 1.4.2, Git, and GitHub CLI, then run bash scripts/cloud-setup.sh. Use the repository publishing skill at startup. Keep the environment private. Verify GitHub access using node scripts/cloud-access.mjs. Do not copy credentials from another device or publish invented test content. Tell me exactly which setup, authentication, or publication step remains unverified before asking me to publish the environment.

## Fresh-task verification

- Confirm the skill can be read directly from `skills/publish-personal-site/SKILL.md` (even if automatic discovery does not list it), and that `.agents/skills/publish-personal-site/SKILL.md` resolves.
- Run `bun run verify`: the isolated tests cover note import, generated summaries, draft exclusion, timeline/search, and existing pages. Test fixtures must not be committed or published.
- Run `node scripts/cloud-access.mjs`. This checks reported repository write permission and workflow visibility, but does not mutate the repository or prove git transport/main-branch permission.
- For the first actual publication request, use real owner-supplied content and the branch/CI/merge/deploy steps in `docs/publishing.md`. Verify the exact live commit and note URL. Only then report that end-to-end cloud publication has passed.

## Everyday use

On a phone, open Codex and select the published environment. On web/desktop, select Work in → Cloud and choose the same environment. Say “发布成学习笔记” with the content, or “先预览” to stop before publication. The laptop does not need to be online. This requires the configured environment, not an arbitrary unconnected chat.

Official setup documentation: https://learn.chatgpt.com/docs/environments/cloud-environments
