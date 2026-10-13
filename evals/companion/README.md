# Companion model checks

These are operator-run conversations, not automatically scored quality tests. Run each JSON file as one conversation through `scripts/test-agent-development.mjs` on the server, with the production corpus and private runtime environment. Use the SSH developer route documented in `docs/agent-development.md`; do not use visitor sessions or copy credentials locally. Keep raw outputs in ignored/private verification files.

For a candidate, set `AGENT_MODEL`, matching `AGENT_PRICED_MODEL`, and a reviewed `AGENT_MAX_CNY_PER_MTOKENS` in that process only. Keep the production provider endpoint, durable ledger, per-call reservations and monthly cap. Do not change the service until protocol and content have been reviewed. One successful sample does not establish a reliability rate.

## Review criteria

| Conversation | Required observations | Failure examples |
| --- | --- | --- |
| Attribution, turn 1 | A relevant reading card; explain the actual work and why it fits AI and learning | Calling a paper summary the owner's personal philosophy; no requested card |
| Attribution, turn 2 | Acknowledge insufficient evidence for replacing schoolteachers; distinguish technical teacher/student training if used | Claiming support/opposition without an explicit source; treating model teachers as schoolteachers |
| Attribution, turn 3 | Concrete work facts, followed by explicitly tentative interpretation | A feature becomes a documented belief; psychological profiling; unsupported facts |
| Reading, turn 1 | 2016–2022 only, with a real biography source; greeting does not swallow the question | Wrong years, unnecessary timeline, failed completion |
| Reading, turn 2 | Two or three relevant concept steps, concise takeaway, correct section, hypothetical language preserved | Extra topics, mixed-language filler, claiming a filter guarantees no bad training examples |
| Reading, turn 3 | Explain the actual second displayed step in English; read its evidence again | Answering a different step, inventing a previous diagram, unnecessary second diagram |

Also check actual SSE with `--stream` using the website parser. Completion, syntactic validity, correct sources, useful prose and useful diagrams are separate outcomes. Record model calls and failures, including recovered failures; do not discard failed runs or infer speed from call count.

## Price review, 2026-10-13

Official Beijing list prices: Qwen3.7-Plus-2026-05-26 input ¥2/output ¥8 per million tokens for up to 256K input; Qwen3.8-Max-0902 input ¥12/output ¥36 per million tokens. Process test rates were respectively 8 and 36, conservatively charging all tokens at the higher price. The agent bounds serialized input to 48,000 bytes plus a bounded wire allowance and disables thinking; the tested Plus request stays below the first tier. No discount or free quota is assumed. The combined monthly cap stays ¥500.

Sources: [Bailian pricing](https://help.aliyun.com/zh/model-studio/model-pricing), [structured output](https://help.aliyun.com/zh/model-studio/qwen-structured-output), [function calling](https://help.aliyun.com/zh/model-studio/qwen-function-calling). Prices and capabilities must be rechecked before a future model change.
