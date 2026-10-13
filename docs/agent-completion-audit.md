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

## Ordered visual references in conversational memory

The candidate stores a bounded, server-owned summary of successful concept diagrams alongside concise answer text: diagram title, ordered step titles and source IDs. Plain-text-only turns retain their existing representation. Older diagrams that do not fit are explicitly counted as omitted; arbitrary presentation payloads and descriptions are not persisted in model history. The existing 4000-character per-message and three-exchange history bounds remain.

An HTTP/client integration test creates a diagram, reconstructs the client as after navigation, asks about its second step, and verifies that the model receives the actual ordered visual summary before rereading the source. A separate test proves remembered IDs alone cannot authorize an answer. Full verification passed. This preserves conversational references; it is not semantic long-term memory or proof of model factual accuracy.

The subsequent candidate operator run failed after four calls with 8,394 known reconciled tokens. Its reported provider_transport category is inconclusive: the temporary provider imported the production diagnostic mapper while its candidate stream parser introduced output_limit. That mismatch can classify a newly introduced parser reason as generic transport failure. Do not infer a network cause from this run. Future candidate evaluation should stage a complete, consistent module set. Temporary candidate files were removed; production remains 0d78efd. Candidate commit 1c5a9df passed remote build 38440940036.

## Consistent candidate diagnosis and concise diagrams

A complete candidate module set staged from ca98863 confirmed output_limit on the fourth call, after a search and two read_content actions (8,394 known tokens). The server corpus confirms the 45-character document ID is valid; ID length alone was not evidence of a failed read. This corrects the earlier uncertainty caused by mixed diagnostic versions.

The next candidate exposes concrete per-item limits to the model: 60 characters for concept-step labels and 128 for descriptions, with one short explanatory sentence and separate UI source links. Runtime validation enforces the same item limits and returns correction guidance before rendering; it never clips generated descriptions. A regression test covers an overlong description, rejection without a visible block, then a valid correction. JSON-action tool results now carry structured data rather than a second JSON-encoded string; the adapter/agent integration test verifies this wire representation. Full verification passed.

A subsequent shape-only trace showed valid pagination (offsets 3 and 6), then show_concept_flow with concise descriptions but unread source IDs; no diagram was emitted. The candidate now supplies the exact currently read IDs as source-item enum choices for concept tools. A rejected unread source returns fixed correction guidance plus canonical available source IDs/labels, still without rendering or granting evidence. Tests verify corrected selection, absence of premature blocks and bounded failure for repeated invalid calls. Full verification passed. ID validation still does not establish semantic entailment.

### b732abd public verification and follow-up evidence refresh

The bounded b732abd operator sample completed a five-step diagram in five calls, 16,833 tokens and about 10 seconds. Backend file hashes were checked before activation, rollback copies retained, main deployment 38442390047 succeeded, and the exact live revision verifier passed. A fresh public browser then completed a five-step MASS diagram. Source navigation and restored presentation history worked. The diagram's final prose still repeated its steps and overstated monotonic improvement; factual concision remains a review gap.

The public cross-page follow-up failed in its first model round with answer_evidence: remembered citations were being used without a new read. The next candidate therefore actually rereads up to three distinct public source sections from the most recent remembered diagram before calling the model. It supplies normal source text and tool-result messages, emits normal read status, deduplicates IDs, ignores unavailable sources, and counts these reads against the existing eight-tool limit. It neither trusts memory as evidence nor skips validation. Tests verify fresh text before streamed answering, bounded refresh and shared tool-budget enforcement. Full verification passed. Public follow-up success is still unproven until this change is deployed and exercised.

### First successful public cross-page diagram follow-up

Version dd3a009 was activated after baseline/candidate hash checks and a rollback copy. Main deployment 38443112661 succeeded. In the same public browser session that had shown the five-step diagram, source navigation opened the MASS note and restored the diagram. After the source-refresh fix, manually resubmitting the preserved question about the second step completed successfully. The answer explained the distinction between final-output quality and correctness of intermediate behavior; its expanded source disclosure linked to section 3.1, “成果用于评价，轨迹用于学习”. The input became available again. This establishes that specific public path after a concrete fix, not broad model reliability or exact compliance with the requested two-sentence format (the answer was one semicolon-separated sentence). The screenshot review confirmed the result and source link were visible in the reading companion. Prose/diagram redundancy, overstatements in the initial diagram summary, broader semantic evaluation and long-context behavior remain open.


### 2026-10-13 — Manual retry focus

An immediately repeated question replaces only the most recent failed turn when that turn contains no answer or visual content. Partial prose, source cards, completed turns, different questions and intervening interactions remain intact. No automatic retry is introduced. Renderer regression tests cover these boundaries; the full repository verification passed. A local browser fixture using the real renderer confirmed two manual retries still show one question and one failure message. This simulated failure did not call the model and is not a production model-reliability test.


### 2026-10-13 — Prose evidence and live quality check

Release d20a56e retains at most three cited source IDs alongside prose history, refreshes current article/profile/event text before follow-up generation, and counts those reads against the existing tool budget. Biography event reads do not display an unsolicited new timeline. Unknown references grant no evidence; memory remains within 4,000 characters. The general biography fact now preserves the already-approved Center for Social Research and full VSRC identity. Full verification passed, runtime hashes were checked before activation with rollback copies, Pages run 38445635147 succeeded, and exact public revision verification passed.

Real-browser evaluation does NOT establish adequate answer quality. Before the change, a biography introduction incorrectly said “社会学系” and generalized VSRC to “访问学者”; a follow-up asking whether the owner advocated replacing teachers failed at model call 1 with answer_evidence. After deployment, the same follow-up failed at call 6 with final_shape and no partial answer. This changes the diagnosed failure stage but does not demonstrate a successful fix for this conversation. A new conversation correctly used “访问学生研究合作者（VSRC）” but still invented “社会学系” instead of the sourced Center for Social Research. Source-ID validity alone does not establish factual entailment. The next quality work must address precise biography attribution and bounded recovery from invalid final output, with actual provider samples. Do not claim these gaps are solved by the new prompt or passing tests.


### 2026-10-13 — Bounded answer correction and model comparison

Release abe948a corrects an unshown candidate rejected for unread citations or invalid final shape within the original six-completion budget. It never retries transport failures or rewrites already streamed text. The streaming and nonstreaming paths are covered, as are repeated invalid citations, partial-answer preservation and budget exhaustion. Local verification and branch CI passed. Runtime activation checked the exact d20a56e baseline and retained a rollback copy. Pages run 38446862375 and exact live revision verification passed.

A bounded operator trace with current qwen-plus completed the viewpoint question in three calls before the repair, so the prior final_shape failure was not reproduced deterministically. That answer inferred personal attitudes from product features and did not pass attribution review. The available pinned qwen3.8-max-0902 model was then tested with the same JSON-action protocol, without changing production settings. It cited unread search evidence and failed in call three. With bounded correction, a new sample completed in four calls (5,461 reconciled tokens) with the explicit no-evidence fallback. This is a recovery sample, not evidence that this model is better. Its accounting used a 36 CNY/M-token upper bound from the official Beijing pricing table (https://help.aliyun.com/zh/model-studio/model-pricing, checked 2026-10-13), a 12 CNY total reservation ceiling, and the existing monthly guard. Current-model samples retained the 0.5 CNY diagnostic ceiling. No private response text or credential was logged; response-shape traces used allowlisted labels only.

The current-model candidate operator sample completed in four calls (14,400 reconciled tokens). After activation, a fresh public-browser viewpoint question completed and cited MASS section 6.3. The cited section actually discusses teacher/student learning signals and humans designing tasks, validators, sampling and hard-case corrections; the answer distinguished this technical explanation from personal educational beliefs. It still said the owner had not expressed the position, where “no supporting public evidence was found” would be more accurate. This single public success does not establish broad reliability or prove the repair path was exercised in that particular browser request. Exact academic affiliations remain an unresolved quality gate; production remains qwen-plus.


### 2026-10-13 — Known biography identity errors

Release 1030ab3 adds narrow rejection checks for observed incorrect institutional and appointment names when prose cites biography evidence. Chinese Peking University “社会学系/中国社会研究中心” and English “Department of Sociology” claims, plus Princeton “访问学者/Visiting Scholar”, trigger correction rather than silent replacement. Biography prose is held until sentence boundaries so fragmenting a name across provider chunks cannot expose the known error. Valid sentences continue streaming; a mistake after already-visible prose remains a partial failure, never a rewritten answer. Other sourced prose keeps its existing streaming behavior. These checks do not establish general factual correctness and may reject a sentence that repeats an incorrect name to negate it; the correction guidance asks for the positive approved identity.

Tests cover fragmented invalid names, successful correction, final-only validation and preservation of visible partial answers. Full verification passed. An owner-authorized, 0.5 CNY-capped operator test corrected a candidate and completed in three calls (4,128 reconciled tokens), accurately naming the Center for Social Research and VSRC. Exact baseline hashes were checked before activation and rollback copies retained. A fresh public browser then completed a two-sentence introduction with “北京大学社会研究中心” and “访问学生研究合作者（VSRC）”. Pages run 38447566239 succeeded and exact revision verification passed. This advances the specific identity regression; broader biography, attribution and long-conversation evaluation remain required.


### 2026-10-13 — Bounded earlier-conversation recall

Release 9dcd72f retains up to twenty successful exchanges for the existing one-hour server session. The latest three enter context directly. Earlier exchanges receive a compact question index; recall_conversation retrieves one exact server-owned pair, including original page and remembered diagram context. Recalled claims remain untrusted context and grant no source evidence. This is retrieval-based context compaction, not a generated semantic summary. It cannot recover records discarded before this release. The model still has the original six-call/eight-tool limits. The visitor-facing progress label and bilingual retention disclosure were updated.

Tests cover a fifth real HTTP request recalling the first, session isolation, twenty-turn bounds, failed-turn exclusion, rejected client-supplied archives, and the requirement to reread public evidence. Full verification and branch CI passed. A synthetic earlier-diagram fixture using the real qwen-plus provider invoked recall_conversation, read_content and show_concept_flow, then correctly explained final-outcome filtering versus intermediate-step correctness in four calls (11,926 reconciled tokens). The extra diagram was unnecessary and remains a presentation-quality issue. Runtime baseline hashes and rollback copies were checked. Pages run 38448634420 and exact live revision verification passed.

A fresh public-browser session completed four actual turns (MASS distinction, doctoral affiliation, startup dates, UNICEF dates), and recovered all four after a refresh. Loading ?v=9dcd72f picked up the new restored-history wording after the ordinary browser cache initially retained the old text. The fifth turn asking to return to the first topic stopped with budget_exhausted, so public fifth-turn recall remains unproven. Read-only aggregate accounting showed 980,191 daily charged/reserved tokens against 1,000,000, 31 unreconciled reservations, no active requests, and 4.397734 CNY charged/reserved against the 500 CNY monthly ceiling. These are conservative ledger amounts, not the provider invoice. No limit was raised or reset for this test. Daily accounting resets on the next request after UTC day rollover; monthly accounting uses Beijing calendar months. Further paid public evaluation should wait until quota can admit it. Unrelated implementation and UI validation can continue.


### 2026-10-13 — Quota recovery feedback

Release 1c625fd distinguishes daily token protection from monthly money protection and emits a validated reset timestamp. Daily reset uses UTC midnight; monthly reset uses Beijing calendar midnight, including month rollover. The visitor sees the reset in their local timezone, with their existing draft preserved and no automatic retry. Legacy generic quota errors remain readable. No quota value, monetary ceiling, credential or ledger total was changed.

Full tests passed, including zero provider calls when the first reservation is rejected, rollover dates, rejection of malformed timestamps, and preservation of specific errors through the caller catch. A local real-renderer fixture showed the daily message and preserved draft; it was explicitly labeled a simulation and removed before publication. No paid model call was made for this change. Branch CI, Pages run 38449796597 and exact live revision checks passed. Backend activation followed frontend publication, checked baseline/candidate file hashes, kept rollback copies, and returned healthy over HTTPS. Live fifth-turn conversation validation still awaits sufficient daily quota.


### 2026-10-13 — Restored conversation reading clarity

1. Reproduced four restored turns in the real local UI with seeded public-content fixtures. Repeated per-turn session notices competed with the answer text. Replaced them with one session-level notice outside the scrollable log, retaining the distinction between continuing and expired sessions.
2. Inspected saved desktop screenshots: `/tmp/portfolio-restoration-audit/01-before.jpg`, `02-after.jpg`, and `03-article.jpg`. All four answers and source disclosures remained. On an article, the current article prompt remained the next action.
3. Browser checks confirmed the close button returns focus to the article launcher; reset removes the history notice and returns to the article opening. Full `bun run verify` passed. No paid model request was made.

Scope: desktop local UI with simulated stored history. This does not prove mobile keyboard behavior, screen-reader compliance, Escape handling, or real fifth-turn model recall; those remain separate checks.


### 2026-10-13 — Short viewport opening

- At 390×420, the actual local opening clipped the composer and hid its footer. Added a height-based compact greeting with the same character and a single invitation, keeping normal-height composition unchanged.
- Browser measurements after repair: composer bottom 384 / footer bottom 410 at height 420; English 320×320 composer bottom 284 / footer bottom 310, no horizontal overflow. Inspected saved before/after screenshots and normal 390×844 composition in `/tmp/portfolio-mobile-audit/`. Reset the temporary browser viewport afterward.
- Full `bun run verify` passed. No model calls. Resized desktop rendering is not proof of iOS/Android virtual-keyboard behavior, zoom handling, or assistive technology support.
