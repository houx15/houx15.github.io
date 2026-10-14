# Content agent: architecture and release status

## Status and evidence

The repository implements a provider-backed, streaming content agent and its browser UI. It is no longer the original local explorer prototype. Repository implementation, private model evaluation and public deployment are separate evidence levels.

On 2026-10-14, the public site's `/build-info.json` reported `323c4de2b6b38122e049bac0b9b0ab70e6997d76`; the API `/health` returned `{available:true,version:2}`. Health does not prove a particular backend revision, successful Turnstile verification, available quota or a successful model answer. Candidate application revision `47304f70ccbab50e785036becc0a68e1e88a8f71` has additional capabilities awaiting publication. See [release procedure](agent-release.md), [completion audit](agent-completion-audit.md) and [evaluation fixtures](../evals/companion/README.md) for evidence and remaining gaps.

## Visitor experience

The homepage offers an eyes-only irregular outline character and one typewritten invitation. The invitation opens full-screen conversation. Authored greetings, encounters and story interactions require no model call. Controls appear progressively; a draft question retains the story it began with and hides competing opening actions. Reduced-motion preferences disable animation and typing.

Academic reading pages retain their typography. The companion opens a conversation over the current article; closing restores reading. A draft retains its starting section across closing and reopening. Clearing the draft adopts the current section. Submission snapshots that section before clearing the composer, so asynchronous verification cannot silently change the question's context.

Answers stream alongside validated source links, reading cards, article outlines, biography timelines and conceptual step diagrams. Progress labels reflect actual execution events. Failed or interrupted answers remain incomplete. Concept corrections update a matching original diagram only after successful completion; missing targets receive a standalone correction record. No decorative reasoning transcript or invented context-compression status is shown.

## Retrieval and evidence

Every build exports `assets/agent-corpus.json` from published projects, reports and learning notes, including heading links, language, canonical IDs, original text and a content revision. Drafts are excluded even during preview. No model credentials are needed to build.

The shared keyword engine uses weighted BM25-style retrieval, normalization, Chinese bigrams, technical identifiers, quoted phrases, filters and translation deduplication. The server searches its published corpus. Agent search includes up to three bounded original sections as read evidence; other search hits require `read_content`. Reading-page position lookup also loads the public corpus in the browser, which remains a scaling concern. There is no vector or semantic synonym retrieval yet.

Biography tools read approved facts and event dates; publication dates never stand in for career dates. Recommendation cards resolve existing document IDs and published language editions. Showing a card does not read its content. Related-post ranking is relevance-based, not evidence that a recommendation is unique or optimal.

Citation IDs must refer to evidence read in the current turn. Exact quotation checks and a limited uncertainty-marker check constrain concept diagrams and revisions. These checks establish neither general semantic entailment nor factual accuracy. Mixed-certainty passages, implicit claims and ordinary answer prose still require substantive evaluation.

## Runtime and memory

`server/agent-index.mjs` connects the provider, durable accounting, corpus and v2 HTTP service. The browser obtains a signed anonymous session after server-validated Turnstile, then uses fetch-based SSE. The provider supports incremental public prose and function calls; private reasoning is not displayed. A turn allows at most six model completions and eight tool calls, under bounded input, output and execution time.

The server retains up to twenty successful exchanges. The latest three enter model context directly; earlier exchanges have an index and session-scoped recall tool. Recalled statements are conversational context, not new citation authority. Browser-supplied transcripts are rejected. Retained diagrams carry stable identities so later corrections can target their steps.

See [HTTP contract](agent-backend-contract.md) for wire details. No tool executes arbitrary code, publishes files, accesses private biography or reveals runtime credentials.

## Cost and access

Visitor sessions, addresses, request rates and daily usage are limited. Anonymous sessions are not unique-human identity; Turnstile and rate limits reduce abuse without providing that guarantee. Durable SQLite or Redis accounting reserves conservative cost before each paid completion and preserves charges for unknown usage.

Private SSH developer admission is separate from visitor daily/session quotas. Development and visitors share the approved ¥500 monthly ceiling and global concurrency. There is no browser flag or public endpoint granting developer privileges. Follow [developer testing](agent-development.md); never reset accounting to unblock development or place keys in source, HTML or GitHub artifacts.

## Remaining acceptance work

Publish compatible backend and frontend in order after release approval, then verify the actual public Turnstile → streamed answer → follow-up → interruption flow. Private runner success is not public-browser proof. Continue evaluating semantic fidelity, relevant recommendations, provider failures, mobile keyboard/accessibility and owner acceptance of the experience. Large-corpus retrieval quality and browser corpus transfer remain open engineering questions.
