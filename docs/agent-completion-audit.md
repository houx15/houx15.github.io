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
| Conversation continuity across different pages | Presentation history survives in sessionStorage; bearer remains memory-only | Not implemented for model sessions. Hosting/domain decision informs transport architecture |
| Context management | Server retains last three successful exchanges | No semantic compaction; evaluate long-conversation loss before selecting an implementation |
| Anonymous access and budget controls | Turnstile, Redis CAS, quotas and fail-closed tests using mocks | Actual service configuration, persistent state, edge protection, provider spending cap, privacy disclosure |
| No exposed model key | Secrets runtime-only; frontend origins/site key empty; explicit container COPY list | Deployment secret configuration and artifact review |
| Container and operation | Separate v2 entry point, configuration checker and Dockerfile prepared | Actual container build, startup, HTTPS deployment, lifecycle check |
| Public rollout | Development branch prepared; paid endpoint disabled | Launch gates and live verification |

## Deployment and real-provider check — 2026-10-13

Hosting is the owner's kookat server, with a Node 24 user service staged and valid HTTPS at agent.kookat.icu. The service remains disabled; frontend live-agent configuration remains empty. The owner entered the model credential directly into the server-only private environment file. No credential was copied into this repository.

Provider: Bailian, Beijing workspace OpenAI-compatible endpoint; initial model qwen-plus. Approved ceiling: 500 CNY/month. A bounded real-provider smoke test returned HTTP 200 and SSE, with first parsed text at 1,402 ms, 2 deltas, and 103 total tokens. A separate real-agent biography test used read_profile and query_profile_events, completed in two model rounds, emitted 35 text deltas and validated citations, and used 3,804 tokens. These are direct server-side smoke tests, not browser-to-public-service validation. They were run with bounded requests outside the disabled production accounting service; preserve the 3,907-token test usage when reconciling provider billing. Successful source IDs do not establish that every generated claim is accurate; broader factual evaluation remains necessary.

Remote preflight now reports only missing AGENT_REDIS_TOKEN, AGENT_REDIS_URL and AGENT_TURNSTILE_SECRET. Persistent accounting and real visitor verification must be configured and tested before activation. The API key, signing secret and private environment file stay outside Git. Never request keys in chat.

The implementation is being committed to a development branch; this does not publish the website or activate the paid endpoint. Remaining UX, continuity, accounting and end-to-end launch gates in the table still apply.
