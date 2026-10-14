# Content agent HTTP contract — v2

Status: implemented and integrated with the browser client; candidate capabilities and public deployment can differ. See [current architecture](content-agent.md) and [release procedure](agent-release.md) for dated evidence. Entry: `node server/agent-index.mjs`. Production requires explicit enablement, durable SQLite or Redis state, Turnstile, a signing key, provider configuration and nonzero budgets. Keep runtime secrets outside static configuration.

## Sessions and deployment

HTTPS frontend origin must exactly match configured origin. `POST /v2/sessions`, JSON `{ "challengeToken": "..." }`, returns 201 `{sessionToken, expiresAt}`. Turnstile action is `agent_session`; hostname is the frontend hostname. Token validation is server-side, age <= 300 seconds, with shared replay protection. Session expires after one hour. No login. An anonymous session is not a unique person. Issuance is limited by hashed socket address and globally. Forwarding headers are ignored by default. With AGENT_TRUST_LOOPBACK_PROXY=1, the backend must bind to loopback and accepts only a single valid X-Portfolio-Client-IP overwritten by the local nginx ingress; missing metadata fails closed. X-Forwarded-For is never trusted. Address quotas remain coarse: visitors sharing a public IP share that guard, alongside separate session and global limits.

For github.io + unrelated API domain use `Authorization: Bearer <sessionToken>`, `credentials: omit`; keep the token in memory and optionally in HTTPS per-tab sessionStorage, never URLs, localStorage, logs or saved presentation records. The storage key is scoped to the API origin. New pages restore only unexpired sessions (at most one hour plus clock tolerance); expired, malformed or server-rejected credentials are removed. Storage denial falls back to memory and a new-page challenge. Reset clears the stored credential. This avoids third-party cookie dependence; bearer theft through frontend XSS remains a risk. A future same-site custom domain can use HttpOnly Secure cookies with explicit CSRF protection; cookies are not implemented here. CORS is not authentication.

## Conversation

`POST /v2/agent`, application/json, authorization header, body `{question, language, pageContext?}`. Question: nonempty <=400 UTF-16 characters. Language: `en` or `zh-CN`. Optional pageContext: `{documentId, sectionId?}` or `{documentId, sectionAnchor?}` resolving to the server's published corpus; the section fields are mutually exclusive. Optional openingContext and capability booleans are server-validated; see the capability sections below. No client transcript, arbitrary URL, role, or session ID is accepted. Server retains up to twenty successful exchanges, bounded to 4000 characters per message, for session lifetime. The most recent three exchanges enter model context directly; earlier exchanges have a question index and are read only through the session-scoped recall_conversation tool. Neither the index nor a recalled record grants citation evidence. Clients cannot submit either history. Evidence must be read anew for each turn. One concurrent request per session. Requests are not retried/replayed automatically; a new submission can incur new calls. No paid calls for greeting/dice/page load.

Successful admission returns text/event-stream; use fetch streaming, not EventSource. Each frame has `id: <request UUID>:<sequence>`, `event: <type>`, and one JSON `data:` envelope `{version:2,requestId,id,type,...}`. IDs are stable within the response; there is no reconnect/resume endpoint. Disable proxy buffering.

Events:
- `status`: `{phase:"model_started"|"model_completed"|"tool_started"|"tool_completed",step?,tool?,callId?}`. Only actual execution transitions. No fabricated thinking or summarizing. model_started follows budget reservation.
- `block`: `{block}` with request-prefixed block.id. Tool-produced, validated IDs/URLs only. Types: `post_cards` `{items:[{id,title,summary,url,date,type}]}` (<=3); `questions` `{items:[{documentId,label,query}]}` (<=3); `publication_timeline` `{dateKind:"publication",items:[card]}` (<=12). `event_timeline` `{dateKind:"biography",asOf,qualification,items:[{id,period,kind,title,description,source}]}` (8 approved events). Preserve literal period strings, overlapping periods and missing exact dates; current statements are relative to asOf. No model HTML/JS, render all strings as text. Publication dates never mean career dates.
- `source`: `{source:{id,label,url}}`, from sections actually read, emitted before answer.
- `answer_delta`: `{text,sourceIds}`. Incremental answer prose, with sources emitted first. Only references already read in this turn are allowed. Treat as incomplete until done; never persist deltas as completed answers.
- `answer`: `{text,sourceIds,revision}`. Validated final text must retain the streamed prefix and the same citations. Citation validity does not prove semantic entailment. Render as text, not HTML.
- `done`: `{outcome:"complete"}` after server history save.
- `error`: `{code,partial}` terminal instead of done. Blocks/status may precede failure; keep them marked incomplete and never invent an answer. Transport ending without done/error is interrupted. No failed exchanges saved.

Before streaming, errors are JSON `{error:{code}}` with 400 invalid_request, 401 invalid_session, 403 forbidden/challenge_failed, 429 rate_limited, 503 unavailable. After headers, errors are sanitized SSE. AbortController/client disconnect cancels upstream and prevents subsequent paid calls. Deadline 45 seconds; per-provider deadline defined by the configured adapter, bounded by the overall turn deadline. No raw upstream details, prompts, tokens, or credentials are logged.

## Limits and accounting

At most six completions (five tool-capable rounds plus final synthesis), eight tools, 2048 output tokens per completion, bounded input serialized bytes 48,000. Reserve conservative input UTF-8 bytes + output token cap before EVERY provider call (also any future router/summary). Retain reservation on provider failure/ambiguous usage; reconcile only valid bounded actual usage. Daily UTC global token ceiling defaults to zero; operator must also configure provider monetary spending cap and model pricing. This is a token ceiling, not a currency guarantee. Runtime enabled switch is checked per request/call. Session: 20 turns/day, 6/minute, concurrency one. Global concurrency two, issuance 100/day and address issuance 5/hour; address requests 12/minute. Leases expire after 60 seconds, beyond request deadline. State rollback fails closed.

Shared Redis REST adapter uses versioned compare-and-set Lua transactions for sessions, replay, limits, leases and reservations. No eviction/expiry of the state key; dedicated persisted Redis required, bounded state pruned transactionally. Missing/corrupt state fails closed; operator initializes once with `AGENT_INITIALIZE=1` then removes it. Local memory store is for tests/development only and explicitly refused in production. Store failures fail closed. No retry of paid provider calls.

## Frontend integration and remaining evidence

Frontend configuration contains only the public backend origin and public Turnstile site key; private keys remain on the server. Add Turnstile using a public site key, hostname allowlist and action `agent_session`; retain the returned one-hour bearer in memory and optional per-tab sessionStorage, as described above. Use the v2 routes and schema above. Do not claim local mocks are live execution. `read_profile` reads the existing approved public facts; `query_profile_events` returns the existing owner-approved biography with its 2026-10-10 asOf date and original uncertain/overlapping periods. No new biographical facts are invented. Citation IDs can be article section IDs, `profile:<factId>` or `event:<eventId>`. Revision includes both article and biography revisions.

Scope is enforced through model instructions and evidence requirement, with fixed server-authored refusal for missing evidence. Related learning explanations are allowed. Prompt/keyword filters cannot guarantee relevance or resistance to injection; real-model evaluation must precede public launch. See `docs/agent-backend-evaluation.md`.

### Integration delta for the concurrently built client

The frontend validates and renders post cards, suggestions, publication timelines, biography timelines, reading maps, and incremental answer deltas. Source URLs remain site-relative; rendering uses textContent. Public release state must be checked independently of this contract; consult the dated architecture and release records.

### Reading outline block

`show_reading_map({id, sectionIds})` presents 1–6 existing sections of one public document. Unknown or cross-document section IDs are rejected. The server preserves original section order, deduplicates selections, and supplies original headings and excerpts (up to 240 characters), never model-generated relationships. The presentation tool does not grant answer citation evidence; `read_content` is still required.

The `reading_map` block contains `id`, `type`, `documentId`, `title`, `url`, and `items: [{id,title,excerpt,url}]`. The frontend expands the first excerpt and leaves subsequent ones collapsed. The label explicitly describes original article structure, not a causal diagram. Visual history retains this block under the same validation as incoming results.


### Incremental provider output — October 13

The DeepSeek adapter requests stream:true and include_usage:true, incrementally assembles fragmented tool arguments, and decodes the final JSON answer with sourceIds before text. It forwards only decoded public prose; reasoning_content is not displayed. Partial unicode/escapes are held until complete. Truncated, oversized, mixed tool/prose and length-limited responses fail. Upstream usage is reconciled only when available; missing usage retains the reservation. The final answer and done event are still mandatory. The UI marks interrupted prose as incomplete, and presentation history stores only successfully completed answers.

Reference: https://api-docs.deepseek.com/api/create-chat-completion/ (stream, delta, finish_reason and usage fields). The 84-test local suite includes text delivery before provider completion, fragmented arguments, unicode, provenance gating and partial interruption. This historical adapter test count is not current acceptance evidence; see the dated evaluation records for real-provider observations and unresolved failures.

### Conceptual explanation steps

`show_concept_flow({title, labels, descriptions, sourceIds})` accepts 2–5 aligned steps. Titles are at most 100 characters, descriptions 400, and the overall title 120. Every source must already be in this turn's read evidence; the server supplies canonical source labels and URLs. It emits `concept_flow` with `interpretation: true` and `items: [{title, description, source: {id,label,url}}]`. This is model-generated explanatory organization, not original article headings or an author-provided diagram. Valid source IDs establish provenance, not semantic entailment or causal validity.

The renderer discloses that distinction, uses textContent, and allows one expanded step at a time using a shared details name. The first step opens initially; each has a link to its original source. Incoming and restored blocks use the same validation. Clients opt in with supportsConceptFlow: true on each question. Without that boolean, the HTTP server excludes the tool and tells the model to use prose. Deploy the compatible backend first, then the frontend; existing open tabs keep working.

Provider prose accompanying a tool-call completion is bounded and discarded, never exposed as a final answer. Tool calls cannot follow structured answer text that has already streamed. Final answers still require the validated JSON/evidence protocol.

### Failure diagnostics

After a reserved model call has started, failures produce one bounded operational record with a random request ID, fixed category, stage, model-call count and partial-output boolean. No prompt, completion, source text, URL, IP address, token, raw exception or stack is logged. Provider JSON, stream shape, timeout and runtime evidence failures are classified separately. Pre-model validation/rate-limit failures are not logged by this hook. Diagnostics are best-effort and cannot prevent session/accounting cleanup. The process supervisor applies its own journal retention; these records are not a transcript store.

The runtime allows at most five lookup rounds and eight tool calls, followed by at most one final synthesis round with no provider tools. This sixth completion is not an automatic retry: it uses the evidence already read and must still reserve cost through the same guard. The overall 45-second request deadline, per-call output limit, daily allowance and monthly ceiling remain unchanged. If the tool-call cap is reached earlier, the next completion is already tool-free.

Quota errors retain HTTP 429 / terminal SSE behavior. `daily_budget_exhausted` and `monthly_budget_exhausted` carry `resetsAt` as Unix milliseconds (daily UTC midnight; monthly Beijing midnight). Clients validate this optional timestamp and display it in the visitor’s timezone. This reports the quota reset, not a promise of service availability or an automatic retry. Legacy `budget_exhausted` remains readable. No amounts, visitor identifiers or credentials are included.

### Targeted concept corrections

Clients opt into `supportsConceptRevisions: true` (optional boolean, default false). The server then offers `revise_concept_step` for one retained concept step per turn. `visualId` identifies a server-recorded diagram; it is not authorization. Browser-supplied history remains rejected. The tool resolves the step against retained successful exchanges, including earlier history and subsequent revisions. Missing descriptions, legacy diagrams without stable IDs, duplicate IDs and stale revision chains cannot authorize an edit.

A revision must re-read the step's original source in the current turn. Article steps require an exact source quote or a matching fresh quoteId. The original diagram title, step title, position and source identity remain fixed; only its explanation and quote change. This verifies provenance, not semantic entailment.

The emitted block is `{id,type:'concept_revision',visualId,title,items:[{position,title,previousDescription,description,quote?,source}]}`. It is a pending change until `done`. On completion the client applies it only to a successfully completed, still-mounted target with the same source ID and previous description. On interruption the old diagram remains unchanged. If the target is no longer displayed, a standalone correction record is retained without claiming that the old diagram changed. The record is collapsed by default. No scrolling or focus change is triggered by updating the old step.

Successful revision events are preserved in client saved turns and replayed in order. Server memory retains complete before/after descriptions before allocating space to prose, within its existing serialized bound. Original diagram records remain immutable; subsequent revisions supersede their description for later references. A backend supporting this capability must be deployed before a frontend begins sending the new request field.

### Self-contained concept captions

`show_concept_flow` optionally accepts a nonempty `caption` of at most 160 characters. Like a captioned biography timeline, this must be the only tool in its batch and its sources must already have been read. Once the normal concept/evidence/quotation validation succeeds, the server emits the diagram, one caption delta and the final answer without another model completion. Source references are deduplicated. Biography captions retain the biography identity check. Omit caption when the question still needs additional explanation or tools; the ordinary streaming-answer path remains available. The existing v2 browser protocol is unchanged.

### Explicit uncertainty tripwire

Before emitting a concept diagram or applying a concept revision, a lexical check compares explicit possibility markers in its cited quote (or read passage when no quote is supplied) with unqualified prediction markers in that step's title and explanation. Diagram-wide titles and terminal captions are checked against the selected read passages. Clauses are separated so a “可能” in one clause cannot qualify an unrelated “会” in the next. Negative certainty can also conflict with uncertain evidence. Common non-modal Chinese words such as 社会/学会 are excluded from the 会 prediction pattern.

A conflict returns bounded tool feedback before display; the model may repair within the existing call/tool budget. There is no extra review model, automatic rewriting, network retry or budget increase. This is deliberately not semantic entailment: marker-free categorical claims, mixed certainty within one source, paraphrases, scope, negation and cross-language semantics are not fully resolved. The check may be conservative for a passage containing both uncertain and definite claims. Passing it never establishes factual accuracy, and the final prose path is not a general semantic filter.
