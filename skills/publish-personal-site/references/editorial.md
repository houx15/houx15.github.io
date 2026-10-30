# Editorial and figure guidance

## Author's writing preferences

These preferences incorporate the author's article revisions on 2026-10-13, the Draft AI jobs article revisions, and the explicit review-hub corrections on 2026-10-30. Apply the objective voice and evidence guidance to technical, research, and project-design articles. Do not impose a long paper structure on short notes or unrelated writing. New explicit instructions take precedence.

- **Interpret examples by their role.** When the author supplies an opening to demonstrate style, infer the voice and argument, then complete the article already requested. “我先写到这里” in such an example does not by itself cancel the full-article request. Do not merely paste the sample, stop at its endpoint, or expose parenthetical production directions such as “这里可视化” in the reader-facing draft. Implement requested figures as part of the deliverable.
- **Default to objective academic narration.** Make the problem, evidence, system, or design choice the subject of the sentence. Avoid “我 / 我的 / 我想 / 我认为 / 我希望” as the article's narrative voice, including its opening and outlook. Explain a project's origins through its motivating problem and documented influences. Preserve direct quotations and cited titles when needed; personal essays or an explicitly requested personal voice are exceptions. Academic prose should remain readable and concrete, without inflated terminology or invented personal experiences.
- **Use direct titles and informative summaries.** Respect titles and summaries the author explicitly supplies. Prefer a subject title such as “个性化的模型benchmark” over an unsolicited rhetorical question. A summary should explain the idea and its intended use without advertising it.
- **Organize product/idea articles around the idea, technical structure, and outlook.** Explain components, interfaces, design choices, and tradeoffs. Avoid narrating every setup/run step unless the user wants a tutorial. A metaphor used in the introduction need not become a series of playful headings such as “先给自己出一套题” or “然后让新模型来面试”.
- **Remove filler and paternalistic conclusions.** Avoid commentary about how the product's name sounds, forced justifications for making it, and passages telling the reader what they ought to value. State that a prototype is a toy through its implemented scope and unvalidated assumptions, without repeated disclaimers or self-deprecation.
- **Support broader discussion with evidence.** For claims about evaluation, research trends, or general implications, use relevant primary literature rather than concluding slogans. Separate published findings, their scope, the author's interpretation, and the project's untested hypotheses. Academic tone means a precise argument with evidence, not more jargon. Where useful, specify a validation design: comparison baselines, held-out tasks or time periods, outcome measures, controls, and uncertainty. Do not invent findings to fill these slots.
- **Consolidate overlapping discussion.** Limitations, outlook, and validation often belong in one section. Each paragraph should add a claim, evidence, or a design implication; merge repeated statements about reliability, real-world usefulness, or confounding conditions. Preserve meaningful citations and concrete experimental proposals when shortening.

## Projects and products

Explain the concrete problem, what the implemented artifact does, how to use or inspect it, and relevant limits. Inspect the repository/demo before claiming features. Distinguish implemented behavior from planned work. Add source/demo/download links only when they exist. Screenshots should show the actual current artifact; preserve any qualifications or version context.

## Reports and articles

- **Author identity.** Refer to the author as **Yuxin** in bylines or attribution. Do not put the author’s full real name in articles, captions, titles, or article metadata, including when adapting the author’s own report. Set `author: Yuxin` for new articles. Preserve cited researchers' names. The objective-narration preference of 2026-10-30 supersedes the earlier permission to use “我 / 我的” naturally; it does not authorize rewriting unrelated site identity pages.

### Argument, research coverage, and source verification

- **Inventory the substantive material before selecting a narrative.** Read supplied design documents, analyses, and revision records. Preserve independently meaningful results and intellectual influences; distinguish work omitted from an earlier draft from work that was never done. Do not reduce a rich investigation to a convenient single result or relegate its core contributions to an appendix.
- **Organize by reader questions.** Develop the problem, relevant evidence, reasoning, and implications in connected prose. For a system-design article, explain how prior research and engineering experience motivate concrete choices. Do not replace this argument with a development diary, feature catalogue, or audit checklist.
- **Use literature in the argument.** Explain the source's relevant finding or proposal, its scope, and the design implication. Distinguish empirical studies, conceptual frameworks, and engineering experience. Consult primary papers or authors' original accounts; check titles, authors, publication versions, samples, baselines, metrics, and any numerical claims used. Record an access limitation accurately and narrow claims to what was verified. References alone do not establish that a project works or is novel.
- **Preserve important distinctions.** Define concepts before symbols or internal labels. Keep populations, comparison groups, denominators, observations, interpretations, and causal claims distinct. Explain tensions among results rather than hiding them as robustness checks. For evolving products, separate initial proposals, current implementation, abandoned ideas, and untested outcomes.
- **Lead with substance; concentrate qualifications.** Explain findings and mechanisms before discussing unresolved questions. Keep interpretation-changing caveats near the claim, consolidate broader limitations, and remove repeated “cannot prove / not equivalent to / not yet validated” passages. Concision must not erase meaningful evidence or experimental proposals.
- **Keep production records separate.** Commit hashes, commands, test counts, file inventories, and checking logs belong in supporting material unless needed to understand or reproduce a result. A concise version reference is sufficient for an evolving system. Passing site tests does not substitute for checking the article's substantive claims.

Choose a structure that fits the material. An empirical report may need question, method, data, results, and limitations; an explanatory article may not. State the main point clearly and define important terms. Keep observations distinct from causal claims. Mark uncertain or missing evidence in the draft instead of filling gaps with plausible statements. Quote or cite sources accurately, preserve the user's original analysis, and never make a reading note appear to be an original experiment.

The title and summary should identify the subject and scope. Avoid promotional adjectives and inflated novelty claims. Do not turn concise notes into long formal prose merely to sound academic. Keep the source language unless asked to translate; handle mixed Chinese/English technical terminology consistently.

## Figures and formatting

Use supplied figures when suitable. If a plot is needed, generate it from the supplied data using reproducible plotting tools, retaining the script and identifying the data source. Label units, axes, legends, uncertainty, and relevant conditions. Do not approximate values from an unavailable source or invent quantitative evidence. Never use image generation to produce scientific results.

Make every figure answer a reader question and interpret its important relationships in the prose. Use reader-facing concepts rather than internal hypothesis IDs or variable codes. The default view should reveal the key comparison; do not hide necessary periods or groups behind interaction, truncate uncertainty, or select only convenient endpoints. Prefer native vector/HTML plots for quantitative evidence; actual interface screenshots are appropriate for demonstrating a product. Identify synthetic demonstrations once clearly and retain accurate captions.

Use local image files where redistribution is permitted, descriptive alternative text, and numbered captions when the text refers to figures. Check that captions actually describe what is visible. Crop only irrelevant margins; do not crop out evidence or qualifications. Check chart labels at phone width. Use separate panels or a larger linked figure when necessary.

For architecture diagrams in product articles, prefer a compact horizontal layout unless the content or the author calls for another arrangement. Show components and information flow rather than illustrating every procedural step. Keep text readable on phones using scrolling within the figure when needed; check that the image actually loads and that the page itself does not overflow.

Use the existing Markdown conventions for headings, KaTeX, language-labelled code fences, tables, and footnotes. Long tables and code should scroll within their containers. Add external-source credits as links in adjacent prose or reviewed figure HTML when captions need clickable attribution. Do not require a decorative thumbnail or cover image.

## Review outcome

Before publication, resolve factual gaps with the author when necessary. Grammar, asset paths, typography, caption formatting, and routine layout fixes do not need repeated approval. Do not publish a draft that still contains unanswered factual placeholders; leave it previewable and state the missing evidence precisely.

Before presenting an article draft, check that it completes the requested scope, contains no writing instructions masquerading as prose, uses the supplied voice appropriately, and does not repeat the same discussion under multiple headings. Revisions should address the user's editorial intent, not just replace the exact words they criticized.
