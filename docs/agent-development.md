# Server-only developer tests

Visitor limits protect the public website. Operator evaluation must not consume the visitor daily token allowance, session issuance, address rates, or session turns.

Run `scripts/test-agent-development.mjs` over SSH on the agent host, in the current release directory, using Node 24 and the existing private runtime environment:

```sh
node --env-file=/home/monkey/.config/portfolio-agent/runtime.env scripts/test-agent-development.mjs <<'JSON'
[{"question":"用两句话介绍一下煜欣。","language":"zh-CN"}]
JSON
```

Use the installed Node 24 absolute path if it is not on PATH. The script accepts 1–6 turns on stdin, with question, language, and optional pageContext/openingContext. It reuses the production corpus, model, tools, streaming provider, history representation, and paid-completion wrapper. It opens no listener and creates no public bypass credential. Its process alone opts into developer admission; the web server has no configuration flag or HTTP field that enables this mode. This evaluates model/agent behavior, not browser, Turnstile, or nginx behavior.

Both paths use the same durable monthly CNY ledger and the same reviewed model price. The approved total remains at most ¥500/month. Developer tests have a 45-second turn deadline, six model calls, and at most 325,000 conservatively reserved tokens per turn. Unknown usage remains charged; cancellations do not refund unknown spending. Shared concurrency remains two active requests, including tests.

The existing `spent` field remains visitor daily spending. New `developmentSpent` tracks developer daily spending separately, without a daily admission ceiling; both reset at UTC midnight. Reservations carry a development scope only for server-admitted tests. Old reservations without scope remain visitor reservations. Existing historical charges are not erased or retroactively reclassified. Every request still reserves against `money[BeijingMonth]` before reaching the provider. Counters are conservative accounting, not the vendor invoice.

Do not use manually issued public visitor sessions for repeated model evaluation. Use the SSH runner. Actual public browser/HTTP tests intentionally retain public protections; do not add hidden browser flags or skip Turnstile to simulate development mode.
