# Agent completion audit — 2026-10-13

The full requested outcome remains incomplete. This audit does not equate test success with live agent quality or publication.

| Requirement | Current evidence | Remaining gate |
|---|---|---|
| Original monochrome circle with eyes, quiet homepage, one entry | Templates, companion CSS and real browser screenshots | Owner's aesthetic review of this iteration |
| One opening at a time; sequential actions | Companion opening selection and view tests; actual opening interaction | Observe longer conversations with a real model |
| Global companion on serious reading pages | Base template and article dialog browser exercise | Wider device/accessibility review |
| Return to the same article without losing conversation | Browser: source link closed dialog, focused ARTICLE, retained one turn; reopening retained one outline and one turn | Test while a real model session is active |
| Keyword retrieval over many notes | Corpus and retrieval tests, including a 2,500-document fixture | Real corpus relevance and multilingual model evaluation |
| Sourced prose, recommendations, visuals | Runtime tools, stream validation, mock HTTP integration; rendered biography timeline and source outline | Real model usefulness, factual attribution, selection quality; broader conceptual visualization |
| Honest tool progress and cancellation | Backend/client cancellation tests; validated event renderer | Real provider and HTTPS ingress cancellation/accounting |
| Conversation continuity across different pages | HTTPS per-tab bearer restoration implemented; local real-HTTP test verifies a new client resumes server history, plus expiry/revocation/storage-denial tests | Real browser navigation with a verified live session remains pending |
| Context management | Server retains last three successful exchanges | No semantic compaction; evaluate long-conversation loss before selecting an implementation |
| Anonymous access and budget controls | Live Turnstile success; invalid token 403 and unauthenticated chat 401; SQLite restart/budget tests; bilingual privacy disclosure | Real token replay and ingress concurrency/cancellation evaluation |
| No exposed model key | Keys entered directly on server; public frontend includes only origin/site key; credential-pattern scan passed | Maintain secret review for releases |
| Container and operation | Separate v2 entry point, configuration checker and Dockerfile prepared | Actual container build, startup, HTTPS deployment, lifecycle check |
| Public rollout | c4facd2 deployed and live revision verified; backend active with explicit owner authorization | Continue quality and UX evaluation |

## Deployment and real-provider check — 2026-10-13

Hosting is the owner's kookat server, with a Node 24 user service staged and valid HTTPS at agent.kookat.icu. The owner explicitly authorized backend activation and frontend publication. The service is active; the frontend points to agent.kookat.icu. The owner entered the model credential directly into the server-only private environment file. No credential was copied into this repository.

Provider: Bailian, Beijing workspace OpenAI-compatible endpoint; initial model qwen-plus. Approved ceiling: 500 CNY/month. A bounded real-provider smoke test returned HTTP 200 and SSE, with first parsed text at 1,402 ms, 2 deltas, and 103 total tokens. A separate real-agent biography test used read_profile and query_profile_events, completed in two model rounds, emitted 35 text deltas and validated citations, and used 3,804 tokens. These are direct server-side smoke tests, not browser-to-public-service validation. They were run with bounded requests outside the disabled production accounting service; preserve the 3,907-token test usage when reconciling provider billing. Successful source IDs do not establish that every generated claim is accurate; broader factual evaluation remains necessary.

Remote preflight passed after configuring SQLite and Turnstile. The Turnstile secret probe passed, and a real browser session succeeded. SQLite replaces Redis on this single-host deployment. The API key, signing secret and private environment file stay outside Git. Never request keys in chat.

The implementation is published and the paid endpoint is active under the owner’s explicit authorization. Remaining UX, continuity, accounting and end-to-end verification gates in the table still apply.

## Live integration evidence

Production release c4facd2 passed build/deploy and exact live-revision verification. A real browser completed Turnstile without a manual challenge, asked for a biography and received a sourced answer plus chronology. A note-side dialogue initially failed because the model guessed a nonexistent section ID. Commit 196ca09 returns corrective tool feedback within the same step and cost limits, without granting evidence for the failed lookup. It is deployed to the backend and on main. A subsequent real browser note question completed with links to actual article sections. A separate invalid_model_response failure was observed but not consistently reproduced; successful retries do not establish full reliability.

Long generated timelines pushed answer text out of view. Commit 33a0377 collapses timelines longer than three items behind a single disclosure; all dates, descriptions and sources remain accessible. Local browser visual/expansion checks and full verification passed. Production layout confirmation remains a separate check.

The biography answer exposed an internal citation identifier; the prompt now discourages these in prose. This is not a deterministic output guarantee. Broader conceptual diagrams, cross-document model-session continuity, long-conversation context management, mobile/accessibility review and systematic real-model evaluations remain incomplete.

## Follow-up release and error feedback

Release 0dcc77e is live and its exact revision passed the public-route verifier. A fresh real browser conversation passed Turnstile and returned a biography and timeline. The narrative still repeated chronology despite the complementary-prose instruction; this remains a quality gap. A subsequent cross-page test encountered the session-creation rate limit, so real cross-page continuity is not yet proven. The reverse proxy still lacks the dedicated visitor-address header; activation of separate visitor limits awaits the owner's administrator change.

The streamed-error renderer now uses the same reviewed, bilingual error messages as request failures. Budget exhaustion retains its actionable explanation after the stream callback and caller catch; partial output remains visible and explicitly incomplete. A regression test exercises the actual SSE parser-to-view path. Unknown provider error strings are never rendered. This is local regression evidence, not a new paid browser test.

## Article context across turns

The server now retains the validated pageContext and language alongside each successful user question in its existing three-exchange history. Previously, the article identity was discarded after the first answer, making references such as “the previous note” ambiguous after navigation. The HTTP integration test changes from one article to another using a restored client and verifies both distinct page identities reach the next model invocation. This proves context transport with a mocked model, not real-model reference resolution. History remains conversational context, not citation evidence; each answer must read its sources again. The existing 4,000-character per-message bound is checked before admitting a request.

## Keyboard recovery after failed requests

A production browser check reproduced a failed request leaving focus on BODY and clearing the question. The composer now transfers displaced keyboard focus to Stop while waiting, then restores it to the input only if the visitor has not moved focus elsewhere or closed the reading dialog. Failed requests restore their question as an editable draft; nothing is resent automatically. Local browser verification of an actual request failure confirmed the original question remained in the focused textarea. This is not a complete screen-reader or mobile-keyboard audit.

## Opening-flow visual review

A fresh desktop browser capture followed homepage → chat → dice story. The homepage retains one clear illustrated chat entry. The dice result revealed that the previous generic focus recovery moved attention to the composer even after an authored game. Recovery is now restricted to live requests; a dice result focuses its story heading when it displaced focus, without interrupting a visitor who moved elsewhere or closed the dialog. Before/after screenshots of the same story and DOM inspection confirmed the composer no longer receives focus. Empty conversations also hide the reset action until it becomes relevant. Mobile soft-keyboard behavior and assistive-technology review remain unverified.

## Visual and narrative coordination

The runtime now adds actual rendered block types to the next model invocation's system context only after those blocks have been emitted. The original source text and qualifications remain available. This makes the difference between visible UI and raw tool output explicit without truncating the visitor's answer or adding a model call.

An owner-authorized server-side Bailian test used the same public biography question previously observed repeating the full chronology. The candidate returned two sentences summarizing the biography and its cross-domain pattern, alongside an event_timeline, without enumerating all eight events. It used two model calls and 4,303 tokens. Every call reserved/reconciled against the existing production SQLite budget, with an additional 0.5 CNY worst-case reservation ceiling for this diagnostic. This is one direct-provider sample, not a public browser or broad quality evaluation. Factual interpretation and consistency across questions remain review gates.

## Source-backed concept steps and provider compatibility

Added show_concept_flow: 2–5 model-written explanatory steps, each tied to a source actually read in the current turn. Canonical links come from the evidence map. The UI explicitly labels these as AI interpretations, expands only one step at a time, and preserves links for checking claims. Local browser checks at 390×844 confirmed no horizontal overflow and that opening step two closes step one. This provides sequential conceptual explanation, not arbitrary graphs, causal verification or author-approved diagrams.

Real-provider diagnosis found HTTP 200 streams containing both prose preambles and tool calls ending in tool_calls. Previously these were rejected. The parser now discards those bounded preambles while preserving validated tool calls and usage. Structured answer text already streamed cannot subsequently become a tool call; regression tests cover both cases.

Five bounded operator tests were used while diagnosing and improving this feature. Two initial tests failed in the first provider round. A third completed but selected an article outline rather than concept steps. After clarifying tool selection, one run failed at the final model call; the next completed a four-step MASS concept_flow and answer in four calls, using 12,357 tokens. Known reconciled usage across the latter three runs was 31,240 tokens; calls lacking valid usage retain their conservative budget reservations. Each diagnostic had an additional 0.5 CNY reservation ceiling and used the production accounting guard. No public challenge bypass was installed.

The successful sample still repeated steps in its final prose and used broader phrasing than the source in places. A source link is not proof of semantic correctness. Provider reliability, explanatory concision, broader graph layouts, and public-browser end-to-end concept flow remain incomplete. Temporary diagnostics are not part of the public API.

### Public browser follow-up for 0e66385

The exact production revision passed the live-route verifier. A fresh public browser passed Turnstile and completed the MASS concept question, rendering four sourced concept steps and final prose. Clicking the step's source navigated to the note; opening the article companion restored the diagram and displayed the continuing-session label. A subsequent question referring to the diagram's third step failed with the incomplete-response UI. Therefore public concept rendering is proven for this sample, while successful cross-page model continuation remains unproven. The draft and input focus were preserved on that failure. The concept answer still repeated the four steps; concision remains a quality gap.

## Diagnosed lookup exhaustion

Version a7fd90c adds allowlisted failure categories without conversation text, credentials or IP addresses. A fresh public MASS request failed with stage=agent, modelCalls=5, partial=false, category=step_limit. This establishes a concrete failure cause for that sample; it does not prove all earlier failures share that cause.

The runtime now reserves a final tool-free synthesis opportunity after five lookup rounds (or after eight tools). It can answer from already-read evidence or acknowledge insufficient evidence; it cannot continue searching or pretend to have drawn a visual. The completion remains subject to normal reservation, reconciliation, output and deadline limits. A regression test verifies five reads followed by one sourced synthesis, and provider tests verify the last request omits tool definitions.

## Cross-page follow-up protocol investigation

After 5ebca00, a public browser request produced a sourced four-step MASS diagram; navigating to its source and asking a two-sentence follow-up failed on the first provider call with json_parse. Session restoration worked; successful follow-up remains unproven.

A candidate enabling JSON mode during all qwen-plus rounds did not solve this: bounded operator tests returned HTTP 200 but attempted answers citing unread evidence. The provider adapter also incorrectly wrapped exceptions from its evidence-validation callback as provider_transport. The candidate now preserves callback exceptions so the existing allowlisted diagnostic recorder can identify answer_evidence. A regression test checks identity preservation and safe classification; raw exceptions are still not logged.

JSON mode is limited to tool-free synthesis in the current candidate. Tool rounds keep their existing protocol. A bounded test of this revised candidate still failed in the first round with json_parse. A subsequent shape-only diagnostic confirmed stop, no tool calls, no valid JSON, and no enclosing code fence. No raw provider response was printed or persisted. Thus stripping Markdown fences is not an evidence-backed fix for this sample. The candidate passes local verification but is not a proven fix for cross-page continuation and has not replaced production. Further protocol work must preserve autonomous tool use, verified evidence, streaming, and accounting rather than hide failures with automatic retries.

## Structured action candidate

For Bailian qwen-plus, the candidate now uses one JSON protocol for either toolCalls or a sourced final answer, rather than combining native function calling with JSON answer mode. Tool schemas are supplied in the system message; prior actions and untrusted tool results are represented explicitly in the message history. The application still owns execution, argument validation, evidence, presentation, step limits and accounting. Other provider/model adapters retain the native protocol. The stream parser accepts bounded, unmixed JSON actions only in enabled tool rounds, and never streams action text as an answer.

Regression coverage exercises a real adapter-to-agent read_profile round followed by a sourced streamed answer, disabled action rounds, mixed shapes, duplicate call IDs and malformed arguments. Full local verification passed.

An owner-authorized follow-up sample completed in four calls (9,851 tokens), but the answer gave a generic explanation of model errors instead of the source's distinction between final-output quality and correctness of every intermediate step. This remains a semantic-quality gap. An initial diagram sample completed in six calls (26,153 tokens) without drawing. After adding remaining-action-budget guidance and a reminder to locate the actual limitation passage, a second diagram sample emitted concept_flow in five calls (19,546 tokens). Its final prose still partly restates the diagram. These are bounded operator tests, not yet public-browser proof or broad reliability evidence. Each retained the production accounting guard and an additional 0.5 CNY reservation ceiling.

### Public check and bounded argument repair

The structured-action backend was activated with verified file hashes and rollback copies; main deployment 38439237035 completed successfully. A fresh public browser passed session admission but its diagram request failed in round four with category=tool_arguments and no partial answer. This contradicts any claim that operator success proves public reliability.

The next change returns a fixed error and the allowed schema for invalid arguments to a known tool, without executing it or granting evidence. The rejected call still consumes the existing tool and completion budgets; unknown tools and invalid call identities remain fatal. A regression test verifies rejection, correction, one actual source read and a sourced answer. Repeating invalid arguments still ends at the normal step limit. Full verification passed. This is action-level correction inside an admitted request, not automatic resubmission of a failed visitor request.

## Output capacity investigation

Argument correction 0d78efd is active; deployment 38439757398 and the exact live revision verifier passed. A fresh public diagram request still failed, now in model round four with finish_reason rather than tool_arguments. This does not prove which finish reason was returned.

The next candidate gives truncation its own fixed output_limit category and centralizes the per-completion output cap at 2048 tokens. HTTP reservations and usage reconciliation share that constant, retaining the 500 CNY monthly guard and existing tool/round limits. Tests cover reconciliation at 1600 and 2048 output tokens, conservative retention above the cap, and rejection of truncated output. Full local verification passed.

A bounded candidate operator test did not complete: six calls, 19,705 known reconciled tokens, final_shape. Increasing output capacity alone is therefore not a proven reliability fix. The candidate has not replaced production. Further diagnosis should inspect the allowed action sequence and final shape without recording request text, raw provider output or secrets.

A shape-only action trace of another bounded candidate test recorded search_content and a failed short document-ID read, then a corrected read_content call, followed by a timeout in the third provider invocation (4,464 known tokens before that failure). No raw tool arguments or content were logged. The candidate now allows 30 seconds for an individual model call while keeping the entire HTTP request deadline at 45 seconds. This accommodates longer diagram output without allowing an unbounded turn. It is not yet a proven fix for all observed failures.
