# Companion experience: design direction

Current implementation status and remaining gates: [agent-experience-status.md](agent-experience-status.md). The prototype/integration observations below are dated history; live model access and cross-page sessions have since been connected.

Owner decisions, 12 October 2026. This document concerns interaction design; the separate backend thread owns the runtime/API contract.

## Two spaces

Reading pages remain academic, quiet, and typographically clear. The companion is a separate black-and-white line-drawn space, including its icons, cards and dialogue. Opening the companion from an article preserves the article as context and closing returns to the same reading position.

## First encounter

The homepage's primary focus is one irregular circle with two eyes. No mouth, arms, hair, dumpling peak, 3D material, bright color, or decorative dashboard. Its slight movement loops, respecting reduced motion. A single sentence appears with a typewriter effect. The character and speech bubble form one link into a full-screen conversation. There is no search form, list of prompt buttons, game menu or card collection on the first screen.

## Sequential disclosure

The current interaction has one primary next action. Randomness may select one opening or story; it must not present all alternatives at once. A game invitation appears inside conversation. Accepting it removes the invitation; a story appears with one next step. Previous action buttons become history. The composer remains available for visitors who already know what they want to ask.

Progress is truthful: dice animation is a game animation, not simulated inference. Real model/tool states will be driven by backend events. A local authored answer must not be presented as live AI reasoning.

## Reference interpretation

https://fakecheese.me/ was inspected in a real browser. Its first screen combines an ambient background, an immediate greeting, and a clear chat affordance; works appear below the fold. The useful reference is this hierarchy and immediacy, not its visual assets, colors, glitch background or exact layout. Our visual language stays original, monochrome and line-drawn.

The owner approved the cleaner circle-and-eyes direction but expects higher standards than generic feature assembly. Review actual screenshots and interactions, not just DOM correctness. Prioritize proportion, negative space, expression, transition continuity and timing. Avoid adding controls to solve every requirement visibly.

## Prototype observation — 12 October 2026

Implemented locally: single homepage entrance; looping outlined character; typed greeting; full-screen chat; sequential authored dice stories; source links; article entry; optional per-tab continuity. Live models are not connected. Backend work must not be blocked by visual iteration.

Next design pass: refine the first encounter and the transition into conversation as one continuous scene; then refine the reveal of one sourced story and one diagram. Do not expand the game/menu count before those interactions are convincing. Assess desktop, narrow screens, keyboard use and reduced motion. Do not deploy until publication is requested.

## Original parallel ownership — historical

Backend thread: “个人网站 Agent 后端与安全架构”, ID `01a1320b-8a28-7ce1-96c0-41edc1fedda1`. It writes `server/**`, `lib/agent-corpus.mjs`, `src/assets/agent-tools.js`, backend tests and new `docs/agent-backend*.md`. It will define the versioned HTTP/SSE contract in `docs/agent-backend-contract.md`.

This thread owns the visual templates, companion UI, styling and frontend integration. Both threads share the checkout; neither should reset/stash/switch branches or overwrite the other's files. Shared configuration/dependencies are coordinated through the documented contract.

## Integration review — 12 October 2026

The browser now consumes the v2 server stream, with real tool progress, sourced cards and biography/publication timelines. Model access remains disabled until public deployment configuration and server credentials are configured. The local HTTP integration test exercises the actual browser client against the server with a mocked provider; it does not establish live-model quality or production security.

Completed answers retain visual blocks and citations in optional per-tab presentation storage. Interrupted answers are not saved as completed turns. Restored answers are visibly identified as previous conversation records. This is not cross-page model memory: bearer credentials remain in JavaScript memory and the server owns conversation history, so full page navigation currently starts a new authenticated model session. True cross-page continuity remains an implementation requirement, not a completed feature.

Mobile review caught and fixed a flex sizing issue that pushed the composer offscreen after long answers. The reading dialog now opens at the current article invitation rather than the beginning of the older conversation. Question links prefill the composer instead of making a model request on navigation. Cancelling during visitor verification stops the pending user interaction and late tokens cannot initiate a session.
