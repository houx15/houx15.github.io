# Personal website

This repository is `houx15/houx15.github.io`. For requests to draft, preview, revise, or publish website content, read `skills/publish-personal-site/SKILL.md` and follow `docs/publishing.md`. This includes “发布成学习笔记”, “po 学习笔记”, and `$publish-personal-site`. The tracked skill works without a user-level installation.

Use the current checkout, not a machine-specific directory. Runtime: Node.js 24 and Bun 1.4.2. Setup: `bash scripts/cloud-setup.sh`. Validation: `bun run verify`. Draft preview: `bun run preview`.

For Codex Cloud environment setup and publication access checks, read `docs/cloud-publishing.md`. A cloud environment must be created and published in the account UI; repository configuration alone does not create it.

Publication requires an explicit request for the content being published. Draft/preview requests stop before pushing. On a publication request, finish the branch checks, merge, deployment, and live verification when permissions allow. Never equate a local build, pushed branch, or pull request with a live publication. If credentials or environment access are missing, preserve the prepared work and identify the exact missing capability. Never copy credentials from another device, print tokens, or change access controls to bypass a check.
