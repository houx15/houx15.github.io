# Companion release procedure

This is a preparation and verification procedure, not authorization to deploy. Production publication requires the pending version-specific owner approval. Keep development on the draft PR until that approval arrives.

## Observed baseline — 2026-10-14

- Public frontend revision: `323c4de2b6b38122e049bac0b9b0ab70e6997d76`, read from `/build-info.json`.
- Public API health: available, protocol version 2. This endpoint does not identify backend code or exercise a model.
- Candidate application revision: `47304f70ccbab50e785036becc0a68e1e88a8f71` on `codex/reading-draft-context`, draft PR #1. Later documentation-only commits do not change its application behavior; record the exact approved commit at release time.

Re-read these values before release. Do not infer backend revision from the frontend revision.

## Compatibility and packaging

The new client sends `supportsConceptRevisions: true`. The older HTTP implementation at frontend baseline revision rejects unknown request fields. The candidate server accepts the optional field, defaults it to false for older clients and validates reading section anchors. Therefore deploy and verify the compatible backend before publishing the new frontend. A version-2 health response alone cannot prove that capability.

The Pages workflow builds and tests development branches but only publishes `main`. It does not deploy the backend. A merged frontend is not a completed full-stack release.

Prepare an immutable release from the exact approved tracked commit, never a copy of the dirty working tree. Backend relative imports require both `server/` and `src/assets/`. Include the tracked operator scripts and the build's published `_site/assets/agent-corpus.json` (or validate the existing configured corpus path). Build the frontend and corpus from the same approved source; exclude unrelated private drafts and runtime files. Use Node 24 and the repository's locked build dependencies.

Secrets, SQLite state and private configuration stay outside the release directory. Preserve the current provider, pricing, ¥500 monthly ceiling, signing key, Turnstile configuration and state path. Do not set `AGENT_INITIALIZE=1`, replace the ledger, reset counters or change provider merely to deploy application code.

## Ordered execution after approval

1. Record approved commit, current frontend revision, backend release target and private rollback configuration location without printing its contents. Confirm no unrelated working-tree files entered the artifact.
2. Build and run `bun run verify` for that commit. Validate the staged backend imports, public corpus and configuration using the existing private environment without logging it. Any paid private evaluation uses the separate developer runner and shared monetary ledger.
3. Activate the compatible backend using the established service/release mechanism. Verify the running release path and code, health, and the configured state path. Verify legacy requests remain supported. Stop if startup or accounting validation fails; do not publish the frontend.
4. Publish the approved frontend through Pages. Verify `/build-info.json` against the deployed commit, not merely the workflow's completion status.
5. On the public domain, complete Turnstile with human participation. Verify one streamed answer, source opening, follow-up context, reading-section context and cancellation/interruption behavior. Confirm no keys in browser requests or artifacts and no developer bypass endpoint. Distinguish public quota rejection from provider failure; use private admission for further development rather than changing visitor limits.

## Rollback

Keep the previous immutable release and private configuration available. A backend-only startup failure before frontend publication can revert to the previous backend while preserving the same accounting database. Once the new frontend is public, prefer retaining the backward-compatible candidate backend when rolling back frontend UI.

If the backend must also revert to an implementation that rejects new fields, first restore and verify the previous frontend. Existing browser tabs may still send the new fields: a frontend rollback does not make that backend rollback seamless. Account for those tabs explicitly in recovery communication or retain the compatible backend while fixing the failure. Never delete session/accounting state to disguise an incompatible rollback.

Record actual deployed revisions, checks, observed failures and remaining evidence gaps in the completion audit. A healthy process and green build are necessary but insufficient for declaring the visitor experience complete.
