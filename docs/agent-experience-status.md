# Agent experience status

Reviewed 2026-10-14. This is a current-state index; older dated observations in `agent-completion-audit.md` remain historical evidence. The overall experience is **not yet proven complete**. Passing tests or a successful individual model response does not establish semantic fidelity, sustained reliability or visitor appeal.

## Release boundary

- Last verified public release: PR #6, frontend `4ad6d31b738a33e9b36ac8cfb9d16fda75fcec76`, backend `20261014-14bd263`. Live model access is connected. The initial Pages timeout was resolved by retrying its cancelled deployment.
- Pending PR #7: `7f20a06`, brief caption before its visual, with first prose position retained after restoration. Exact source, CI and inactive release preparation passed. Publication approval is pending; do not activate the superseded `b61af43` package.
- Pending PR #8 application: `8780919`, bounded malformed-final-JSON correction, concrete source-bound follow-ups shown after completion, and retained follow-up conversational context. Its branch has 296 passing tests/build/site checks. It has not been deployed or prepared as an approved immutable release.
- A temporary combination of #7 and #8 passed 298 tests/build/site checks. Application changes merged automatically; both appended view test cases were retained to resolve their file conflict. This does not merge either PR or authorize publication.

Recheck GitHub, live build metadata and the actual running backend before publishing; these dated identifiers are not future authority.

## Requirements and evidence

| Requested outcome | Current evidence | What is still unproven |
|---|---|---|
| Original black-and-white circle with eyes, no mouth/hands/3D | Public homepage inspected on this date: one character and speech entrance; `companion.css`, templates | Overall appeal and physical-device motion comfort; screenshots cannot establish these |
| One focus, typed invitation, randomized opening | Public homepage → chat → dice completed; one story card, one topic-follow action, secondary reroll; `companion-stories.js`, `dice-card.js` | Full keyboard/reduced-motion journey across all openings |
| Serious reading space and separate companion | Public MASS note §8 → companion correctly identified §8.1; closing returned to the same visible passage. Desktop Enter/Escape also preserved the existing draft, reading position and launcher focus (keyboard-reading-audit.md) | Physical mobile keyboard and assistive-technology use |
| Easy reading-section and selected-text conversation | Actual public section context verified; `reading-position` / `reading-selection` tests cover draft and anchor handling | Selected-text browser path and in-flight close/return on mobile |
| Streaming with honest progress and cancellation | Real public answers and failures observed; actual HTTP/provider cancellation tests exist | Public browser + proxy + paid provider cancellation/accounting in one combined trace |
| Concise biography with visual and work recommendation | PR #6 public sample completed with qualified dates, source links and Mind Imprint card last | Broader biography correctness and explicit usefulness of recommendation rationale; #7 ordering still pending |
| Useful diagrams and source citations | Concept-flow and biography tools, source validation, prior public samples; deterministic validators/tests | Semantic entailment, preservation of qualifications, useful visual choice across varied questions |
| Explain the current note and offer a concrete next question | Public section request failed with `json_parse/final_answer`; private candidate #8 completed in two calls with a concrete button; phone replay verified delayed reveal and exact click text | Candidate public release and natural follow-up quality over multiple real turns. One sample paraphrased auditable criteria as “formal” criteria, so fidelity remains imperfect |
| Remember what the visitor saw | #8 retains first displayed question; HTTP test recreates a client/session and resolves “why that question?” with a fresh source read; existing concept memory/recall tests | Real-model deictic follow-up after navigation and long-history recall beyond narrow fixtures |
| Search a large knowledge base | 2,500-document retrieval fixture and bilingual tokenization tests in `content-agent.test.mjs` | Relevance on a larger real corpus; production currently has one published learning note |
| No login; distinguish anonymous sessions and limit abuse | Deployed Turnstile/session guard and SQLite accounting; server-issued sessions, public protections retained during actual browser testing | Anonymous session/IP limits do not prove unique human identity; coordinated abuse is not exhaustively tested |
| Keys remain server-side; monthly ceiling ≤ ¥500 | Public config contains origin/site key only; private runtime/state outside releases; developer tests use same monetary ledger, separate visitor admission | No claim of a comprehensive security audit; continue checking artifact contents and state-preserving release procedure |
| Practical publication workflow across devices | Tracked skill, content CLI, cloud instructions and publication checks | Fresh account/device cloud publication path not reverified during this pass; repository config alone does not prove account environment availability |

## Next acceptance work

1. Finish the pending approved-release path when the owner responds. Preserve both test suites when combining changes. Do not turn pending source code into a claim about the public website.
2. Verify one public current-section explanation → concrete button → follow-up → source return after the reading fixes ship. Record content quality as well as successful transport.
3. Exercise a visitor who types a deictic follow-up instead of clicking the button; then navigate to a different article and distinguish old context from current reading position.
4. Address demonstrated semantic drift with source-specific counterexamples. Do not interpret lexical guards or source IDs as proof that claims follow from their sources.
5. Validate physical-mobile keyboard, keyboard-only navigation, reduced motion, and longer conversations. These gaps must not be silently replaced by desktop viewport screenshots.

Keep the opening restrained. Add no game menu or extra calls to action merely to make the feature list longer. Change the next highest-impact observed failure, and retain evidence of what actually improved.
