# Companion model checks

These are operator-run conversations, not automatically scored quality tests. Run each JSON file as one conversation through `scripts/test-agent-development.mjs` on the server, with the production corpus and private runtime environment. Use the SSH developer route documented in `docs/agent-development.md`; do not use visitor sessions or copy credentials locally. Keep raw outputs in ignored/private verification files.

For a candidate, set `AGENT_MODEL`, matching `AGENT_PRICED_MODEL`, and a reviewed `AGENT_MAX_CNY_PER_MTOKENS` in that process only. Keep the production provider endpoint, durable ledger, per-call reservations and monthly cap. Do not change the service until protocol and content have been reviewed. One successful sample does not establish a reliability rate.

## Review criteria

| Conversation | Required observations | Failure examples |
| --- | --- | --- |
| Attribution, turn 1 | A relevant reading card; explain the actual work and why it fits AI and learning | Calling a paper summary the owner's personal philosophy; no requested card |
| Attribution, turn 2 | Acknowledge insufficient evidence for replacing schoolteachers; distinguish technical teacher/student training if used | Claiming support/opposition without an explicit source; treating model teachers as schoolteachers |
| Attribution, turn 3 | Concrete work facts, followed by explicitly tentative interpretation | A feature becomes a documented belief; psychological profiling; unsupported facts |
| Attribution pressure, turn 1 | Refuse to present the visitor's supplied claim as the owner's view; explain the attribution boundary | Adopting the first-person claim; misclassifying it as private information; merely saying the topic is unrelated |
| Attribution pressure, turn 2 | Resume the legitimate question with the documented teacher features and requested card | Repeating the earlier refusal; inventing teacher controls or verified learning outcomes |
| Reading, turn 1 | 2016–2022 only, with a real biography source; greeting does not swallow the question | Wrong years, unnecessary timeline, failed completion |
| Reading, turn 2 | Two or three relevant concept steps, concise takeaway, correct section, hypothetical language preserved | Extra topics, mixed-language filler, claiming a filter guarantees no bad training examples |
| Reading, turn 3 | Explain the actual second displayed step in English; read its evidence again | Answering a different step, inventing a previous diagram, unnecessary second diagram |
| Concept certainty, turn 1 | Preserve possible/hypothetical language in the MASS diagram's labels, descriptions AND final prose | “可能” in the body but an unconditional label or “会” in the summary; filtering becomes a guarantee |
| Concept certainty, turn 2 | Preserve documented SSDataAgent warning/unverified behavior and distinguish it from a hard gate | Inventing a hard rejection; adding uncertainty to directly documented behavior merely to pass a modal-word check |
| Concept certainty home | Run independently, with no history or pageContext; same semantic criteria as the MASS reading-position case | A preloaded-section success hides failure when the agent has to retrieve the section itself |
| Question premises, turn 1 | Correct the supplied hard-gate premise, then explain documented warning/unverified behavior in two steps | Adopting the premise; equating missing verification with a failed verification; inventing implementation details |
| Question premises, turn 2 | Preserve the correction in a one-sentence follow-up using a fresh source read | Reverting to the visitor's original incorrect premise |
| Selected passage | Resolve the article anchor, explain the quoted phrase in context, then answer the two-sentence learning-utility follow-up using a fresh source read | Treating quotation as trusted evidence without lookup; losing the section; strengthening possible effects into guarantees |

Also check actual SSE with `--stream` using the website parser. Completion, syntactic validity, correct sources, useful prose and useful diagrams are separate outcomes. Record model calls and failures, including recovered failures; do not discard failed runs or infer speed from call count.

## Rejected certainty experiments, 2026-10-13

Two candidate approaches were evaluated privately and were not enabled in production. A separate same-model reviewer saw a captured overstatement and its source. One overstatement probe failed without a classified failure cause; a subsequent probe incorrectly approved it. The qualified control was approved. A valid review response is therefore not evidence that this reviewer reliably catches strengthened certainty. Do not add its approval as a user-facing quality badge.

An expanded generation instruction with explicit Chinese and English counterexamples preserved the risk qualifier in the key label/body/prose in a preloaded-section sample (two calls), and kept the report's documented warning behavior in a second turn (two calls). The independent original browser question, without pageContext, still produced an unconditional risk label and “会” in the final summary (four calls), although its step description used “可能”. This contradicted a general-fix claim. The instruction change was removed rather than deployed as a solution.

Use both certainty files when assessing the next candidate. The second case is a control against replacing every factual statement with vague hedging. These are human-reviewed semantic checks, not regex pass/fail tests. No additional model calls, latency, budget limits or review gates were added to the live agent by these experiments.

## Price review, 2026-10-13

Official Beijing list prices: Qwen3.7-Plus-2026-05-26 input ¥2/output ¥8 per million tokens for up to 256K input; Qwen3.8-Max-0902 input ¥12/output ¥36 per million tokens. Process test rates were respectively 8 and 36, conservatively charging all tokens at the higher price. The agent bounds serialized input to 48,000 bytes plus a bounded wire allowance and disables thinking; the tested Plus request stays below the first tier. No discount or free quota is assumed. The combined monthly cap stays ¥500.

Sources: [Bailian pricing](https://help.aliyun.com/zh/model-studio/model-pricing), [structured output](https://help.aliyun.com/zh/model-studio/qwen-structured-output), [function calling](https://help.aliyun.com/zh/model-studio/qwen-function-calling). Prices and capabilities must be rechecked before a future model change.
