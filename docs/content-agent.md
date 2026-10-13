# Content agent: implementation and next steps

## Current stage

This is the first implementation stage, not a deployed live AI agent. No provider key is needed to build, test, or use the local content explorer. The existing `/v1/assistant` endpoint and its approved-fact-only contract remain unchanged. `server/content-agent.mjs` is an independently tested, provider-injected tool loop; it is not yet attached to HTTP or the old chat UI.

Run `bun run verify`, then `bun run dev` and open `/` or `/zh/`. The homepage is now a single entrance: an irregular black outline with eyes, a looping animation, and one typewritten invitation. Clicking enters full-screen chat. The separate search panel was removed following owner feedback; retrieval stays behind the character.

The reading pages keep their academic typography. A small character opens the same full-screen conversation layer, with current-article context. Closing returns to reading. The first conversation offers one action; accepting it hides the invitation and reveals a sourced story with one follow-up. Earlier turns no longer retain competing action buttons. Opening interactions use authored public material, not paid inference. This is an interaction prototype, not a completed live agent.

Ten recent opening-interaction turns persist in optional per-tab session storage; reset clears them. This is UI continuity, never authentication or enforceable quota. Reduced-motion preferences disable animation and typing. Article retrieval reads only the published index and currently returns an excerpt, not AI explanation.

## Publication and retrieval

Every site build exports `assets/agent-corpus.json`, including only published projects, reports and learning notes, even in draft preview. It projects approved fields rather than copying arbitrary frontmatter. It preserves heading links, image alt text, language, canonical document IDs, publication dates and a content hash. Edits/deletions change the hash and the page's index URL. The build requires no model credentials.

The shared browser/server engine builds an inverted index with BM25-style scoring, weighted titles/tags/headings, NFKC normalization, Chinese bigrams and preserved technical identifiers. Unquoted terms use OR matching; quoted phrases must occur in a matching section. It supports date/type filters, offset/limit, and translation deduplication. It has no semantic synonym expansion or vector retrieval yet. Query-time postings are indexed, but the local explorer downloads the full corpus on first interaction: move queries to the backend before a large corpus makes mobile transfer/indexing expensive. The 2,500-document test verifies discoverability, not a production latency target.

Tools: `search_content`, `read_content`, `find_related_posts`, `query_timeline`, `show_post_cards`, `show_visualization`, `suggest_questions`.

Cards resolve real document IDs, not model-supplied links. The only visual is currently a **publication timeline**, not a biography/event timeline. Suggestions are document-specific reading starters, not generated conversational questions. Related reading uses title/tag relevance, excluding the current canonical document; diversification and prerequisites remain future work.

## Agent protocol

`runContentAgent` accepts a question, bounded conversation history, a public corpus, an injected `complete` adapter, cancellation signal, and event callback. It allows five completions and eight tool calls. History cannot supply system or tool roles. Tool names/arguments are allowlisted; citations must identify sections read in this invocation. Presentation blocks have stable IDs, and are emitted after validation. The final answer includes sources and corpus revision.

The adapter receives normalized messages and tool definitions, and returns either `{toolCalls:[{id,name,arguments}]}` or `{text,sourceIds}`. These are internal shapes, not a specific provider's API format. Tests use scripted adapters; real model tool selection, factual grounding and prompt-injection resistance have not been evaluated. Valid citation IDs prove provenance, not that every generated claim is supported. Final prose currently emits as one validated event, not token streaming.

## Next implementation stages

1. Choose model/provider and runtime hosting. Add its adapter, per-completion budget reservation, token caps, timeout/abort propagation and sanitized errors. Keep API keys solely in runtime secrets. GitHub Actions secrets may provision a deployment; never inject them into static assets.
2. Connect a new versioned HTTP streaming route and browser client. Validate each block, preserve conversation context, and explicitly display partial failures. Retain global/per-client limits, and use shared atomic accounting if deploying multiple instances. The existing ledger assumes a single process.
3. Add a profile tool and event records from the approved biography, preserving uncertain/overlapping dates. Add event timelines, then evidence-backed overview/relationship visuals. Publication timestamps must never substitute for event timestamps.
4. Integrate the new agent into the main conversation UI with current-page context, source-aware follow-up questions and text/block streaming. Evaluate genuine provider responses before enabling publicly.
5. Measure retrieval on owner-reviewed questions; add hybrid semantic retrieval if it improves recall. Test missing evidence, quoted opinions, evolving views, cross-language queries, malicious source text, recommendations, mobile layout, latency and costs.

No changes in this stage publish content, configure secrets, call paid models, or deploy a backend.

## Visitor protection before live launch (planned, not active)

- Keep greeting, dice, and authored encounters free of model calls. No expensive call on initial page load, hover, or animation.
- Establish a server-issued, random, signed, expiring visitor session. Prefer a first-party HttpOnly Secure cookie on a same-site deployment. The current github.io frontend plus an unrelated API hostname needs an explicit cross-site design; do not assume third-party cookies work. Session storage is not an identity or quota authority.
- Validate a Turnstile challenge server-side when establishing an AI session or stepping up suspicious traffic. Check expected hostname/action and reject expired/replayed/invalid tokens. Avoid an account/login requirement. Official documentation: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- Anonymous sessions distinguish browser sessions, not unique humans. Clearing cookies, changing browsers/IPs, or automation can create new identities. Combine per-session daily quota, short-window rate/concurrency limits, session-issuance limits, conservative IP/network controls, and a global hard budget. Do not rely on CORS, client counters, or a challenge alone.
- Reserve estimated worst-case cost atomically before every paid completion, including routing/summarization; reconcile actual use afterward. Abort work on disconnect. Apply model token, tool-step and output-size limits. Use persistent shared accounting for multiple instances and keep an operator kill switch.
- Scope the assistant to Yuxin's public biography, work, views, and explanations relevant to the current published reading. Related conceptual questions are useful; an unrelated general assistant request should receive a short redirect. Evaluate this on real prompts, including prompt injection in both questions and source documents; do not claim a keyword filter or prompt alone guarantees scope.
- Never display fabricated thinking/tool progress. UI statuses are generated by actual tool/stream events. Context summarization is a future capability, not a decorative status animation.
- Treat all retrieved content and visitor history as untrusted. Visitors cannot write author viewpoints, publish files, or access server credentials. No real model endpoint is enabled until these controls are integrated and evaluated.

Cookie deployment reference: https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/Third-party_cookies
