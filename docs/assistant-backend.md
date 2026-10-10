# Live portfolio assistant: deployment and verification

## Current status

Implementation and mocked-provider tests are complete. **No real model response has been verified.** The published site remains the clearly labeled local demo because `src/assets/assistant-config.js` has an empty backend origin. Merely shipping this adapter does not enable live AI.

The repository has only GitHub Pages hosting. Its repository secret/variable names and the local process environment showed no configured provider or backend. No credential values were read, no other project's credentials were reused, and no provider account or paid commitment was created.

## Design

The existing Node/Eleventy stack is retained. `server/index.mjs` is a standalone Node 24 service, deployable behind an HTTPS reverse proxy on an approved host. It uses built-in Node APIs and no added dependencies. A container recipe is included, but no container host has been provisioned or deployed.

The DeepSeek chat-completion endpoint is fixed in server code, preventing visitor-selected destinations or credentials. Set the model explicitly to one available on the approved account. Provider format was checked against [the official API reference](https://api-docs.deepseek.com/api/create-chat-completion/) and [JSON mode guidance](https://api-docs.deepseek.com/guides/json_mode/). The request disables reasoning and streaming and caps output at 256 tokens.

The live model selects up to three fact IDs from `src/assets/knowledge.js`. The service rejects unknown IDs, duplicate IDs, extra response fields, tools, truncation, malformed JSON, oversized responses, and provider failures. Final factual wording and citations are assembled from the approved collection, never model-supplied URLs or invented prose. The LLM can still select an irrelevant fact; this is **constrained retrieval, not open-ended generative chat**. Greeting variants are likewise model-selected from reviewed wording. The interface says “live AI selection,” and does not present authored wording as unconstrained generated prose.

Only a submitted question (maximum 400 characters), the small public corpus, and output instructions enter an answer request. There is no conversation history, file retrieval, shell, browser, tool calling, or personal knowledge-store access. Greeting requests contain only a morning/afternoon/evening category after opt-in. No automatic location collection occurs. Even a successful prompt injection cannot grant capabilities the service does not have.

## Smallest remaining setup

Obtain approval for:

1. An existing server/container host and HTTPS origin for this Node service, with one process and a persistent writable volume. GitHub Pages cannot run it.
2. A DeepSeek key configured **only on that server**, plus an explicitly selected model. Do not paste the key into GitHub Pages, chat, committed files, or browser configuration.
3. A daily paid-request ceiling and an account-side monetary spending cap. No nonzero ceiling is assumed. A small smoke test uses one answer request and optionally one greeting request; do not run it until its cost is authorized.

After the host is selected, configure the variables in `server/.env.example` through its secret manager. `PORTFOLIO_DAILY_REQUESTS=0` disables calls. Start with an approved number, for example 20 only if authorized. Each request is at most 256 output tokens and uses a bounded fixed corpus; failed upstream attempts also consume the local daily allowance. A request cap is **not** a dollar-denominated provider budget.

## Host setup

Use Node 24. The service defaults to loopback port 8787; terminate HTTPS at the approved proxy. Set `PORTFOLIO_ORIGIN=https://houx15.github.io`. For a container, use `server/Dockerfile`, publish only behind the proxy, and mount a persistent state directory writable by the unprivileged node user.

Create the ledger **once** in that persistent directory, without overwriting an existing ledger:

```sh
node --input-type=module -e 'import fs from "node:fs"; fs.writeFileSync(process.argv[1], JSON.stringify({date:new Date().toISOString().slice(0,10),used:0}), {flag:"wx",mode:0o600})' /var/lib/portfolio-assistant/budget.json
```

Set `PORTFOLIO_BUDGET_FILE` to that absolute path. Launch `node server/index.mjs` using the service manager's environment (or `node --env-file=/secure/path/portfolio.env server/index.mjs` for a manually managed host). No environment file is auto-loaded.

One process acquires a directory lock next to the ledger. Duplicate processes are rejected; missing, corrupt, or unwritable state disables calls. Reservations are synchronously persisted before provider requests and survive restart. UTC rollover resets the daily count; clock rollback fails closed. Graceful SIGTERM releases the lock. After an unclean crash, an operator must verify that the old process is dead before removing the stale `.lock` directory. Preserve the ledger and volume across updates. Do not horizontally scale this implementation; use an atomic shared quota store before adding replicas.

The service limits each remote socket address to 6 requests/minute and permits 2 in-flight requests globally. It deliberately ignores X-Forwarded-For, so a reverse proxy shares a conservative burst limit. Configure additional edge limiting on the approved host if needed; do not trust arbitrary forwarding headers. CORS is an origin boundary for browsers, **not authentication**: non-browser callers can spoof Origin. The persistent global budget limits paid abuse even then. A public service can still suffer denial of service; this is not a bot-proof system.

Use TLS, restrict inbound access to the proxy, and disable request-body/access-query logging in the host/proxy. The app does not log prompts, model output, credentials, or raw upstream errors. Short-lived HMAC address keys live in memory only; the durable ledger contains just a date and request count. DeepSeek's data-retention policies still apply.

## Activation and acceptance

1. `GET /health` returns 503 while disabled and 200 with `available:true` when configured. This reports configuration, **not a successful model test**.
2. On the approved host, submit an actual `POST /v1/assistant` with `Origin: https://houx15.github.io`, `Content-Type: application/json`, and `{"kind":"answer","question":"What does Mind Imprint do?"}`. Verify a real provider call and an answer with `mode:"live"`, `factIds:["mind"]`, and the correct source. Do not call a test double evidence of live success.
3. Check an unsupported/private-data question, timeout, request cap, and citation handling. Test that no secrets or backend files appear in `_site`.
4. Set only the reviewed HTTPS origin in `src/assets/assistant-config.js`. Run `bun run verify`, push the approved update, and verify its matching deployed revision.
5. In the live browser, opt in and verify a model-selected greeting and sourced answer. Observe provider usage on the server/account, without publishing credentials or request bodies.

The frontend makes no backend request without an explicit click and consent. It sends no cookies, referrer, or past conversation. Loading disables duplicate submissions; timeout, service failure, and limits are visible. It never silently swaps a failed live call for a demo response. Visitors can explicitly switch back to the local demo.

## Tests

`tests/assistant.test.mjs` exercises the provider contract with test doubles, source validation, untrusted input boundaries, timeouts, durable quota restart/lock/failure behavior, per-client/global limits, real local HTTP routing, disabled configuration, CORS, oversized bodies, and the public client's failure handling. Existing content/draft isolation tests remain in the full suite. All test provider responses are mocked and incur no charges.
