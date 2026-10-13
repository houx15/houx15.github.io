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

## Private browser streaming preview

After `bun run build`, run `node scripts/preview-agent-development.mjs` locally with Node 24. It prints a temporary URL bound only to `127.0.0.1` on a random port. `AGENT_DEV_SSH_HOST` selects an existing SSH alias (default `kookat`); optionally set `AGENT_DEV_KNOWN_HOSTS` to an already-verified host-key file. The remote command uses this project's installed Node, current release and private environment paths. Never disable host-key checking or copy the model environment locally.

The preview uses the website's actual SSE parser, answer renderer, styles and scrolling helper. It runs one independent question at a time, with no model conversation history. It is a development interface, not an alternate public website or a claim of Turnstile/nginx coverage. The local bridge checks Host, Origin and an ephemeral per-process token. It never forwards SSH stderr or model credentials to the browser. No API key is stored in the repository or HTML.

The remote runner's `--stream` mode accepts one JSON-array line on stdin, emits the website's SSE event vocabulary, and keeps stdin open as a cancellation channel. Stopping in the browser closes that channel over SSH and aborts the server-side provider signal; the existing 45-second limit remains a backstop. Unknown usage is still charged conservatively. A 60-second local worker deadline bounds SSH failures. Stop the local preview process when finished; it is never deployed as a public service.

## Model evaluation and current selection

The current server selection (2026-10-13) is pinned `qwen3.8-max-0902`, using native function calls and JSON Object final-answer mode. `AGENT_PRICED_MODEL` matches that exact ID; the reviewed accounting upper bound is `AGENT_MAX_CNY_PER_MTOKENS=36`. The monthly ceiling stays 500 CNY. The price is higher than the earlier qwen-plus configuration; reservations conservatively use the higher of input/output prices for all tokens, and unknown usage stays charged. See `evals/companion/README.md` for dated official price references and known quality failures. A successful tool or source ID is not a semantic-quality guarantee.

The two JSON conversations in `evals/companion/` are reusable SSH-runner inputs. Evaluate each as a conversation, read its source text and inspect its diagrams against the human rubric. Temporary process overrides may select another model only after reviewing its price and updating all three model/pricing variables together. Do not rewrite production configuration merely to compare a model. A production switch must preserve private file permissions and every unrelated field, keep the existing ledger, validate the staged provider, and retain a rollback copy of both provider and private runtime file. Never commit that runtime file or its backup.
