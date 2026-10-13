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
