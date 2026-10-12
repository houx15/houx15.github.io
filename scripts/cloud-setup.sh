#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node -e 'if (Number(process.versions.node.split(".")[0]) !== 24) { console.error("Configure Node.js 24 in the cloud environment before running setup."); process.exit(1); }'
if ! command -v bun >/dev/null 2>&1 || [ "$(bun --version)" != "1.4.2" ]; then
  npm install --global bun@1.4.2
fi
bun install --frozen-lockfile
bun run verify
printf '%s\n' 'Repository setup verified. This does not verify cloud GitHub write access or create/publish an environment.'
