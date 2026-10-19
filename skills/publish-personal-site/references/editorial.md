# Editorial and figure guidance

## Author's writing preferences

These preferences come from the author's article revisions on 2026-10-13. Apply them to personal product/idea articles; do not impose the same structure on short notes, formal reports, or unrelated writing. New instructions and supplied examples take precedence.

- **Interpret examples by their role.** When the author supplies an opening to demonstrate style, infer the voice and argument, then complete the article already requested. “我先写到这里” in such an example does not by itself cancel the full-article request. Do not merely paste the sample, stop at its endpoint, or expose parenthetical production directions such as “这里可视化” in the reader-facing draft. Implement requested figures as part of the deliverable.
- **Voice can vary within the article.** An introduction may use first person, mixed Chinese/English, long connected sentences, mild frustration, or dry humor when supported by the author's sample. Preserve the line of thought without adding performative casualness, exaggerated analogies, or invented personal experiences. Technical sections should explain the design precisely; discussion sections can be more academic.
- **Use direct titles and informative summaries.** Respect titles and summaries the author explicitly supplies. Prefer a subject title such as “个性化的模型benchmark” over an unsolicited rhetorical question. A summary should explain the idea and its intended use without advertising it.
- **Organize product/idea articles around the idea, technical structure, and outlook.** Explain components, interfaces, design choices, and tradeoffs. Avoid narrating every setup/run step unless the user wants a tutorial. A metaphor used in the introduction need not become a series of playful headings such as “先给自己出一套题” or “然后让新模型来面试”.
- **Remove filler and paternalistic conclusions.** Avoid commentary about how the product's name sounds, forced justifications for making it, and passages telling the reader what they ought to value. State that a prototype is a toy through its implemented scope and unvalidated assumptions, without repeated disclaimers or self-deprecation.
- **Support broader discussion with evidence.** For claims about evaluation, research trends, or general implications, use relevant primary literature rather than concluding slogans. Separate published findings, their scope, the author's interpretation, and the project's untested hypotheses. Academic tone means a precise argument with evidence, not more jargon. Where useful, specify a validation design: comparison baselines, held-out tasks or time periods, outcome measures, controls, and uncertainty. Do not invent findings to fill these slots.
- **Consolidate overlapping discussion.** Limitations, outlook, and validation often belong in one section. Each paragraph should add a claim, evidence, or a design implication; merge repeated statements about reliability, real-world usefulness, or confounding conditions. Preserve meaningful citations and concrete experimental proposals when shortening.

## Projects and products

Explain the concrete problem, what the implemented artifact does, how to use or inspect it, and relevant limits. Inspect the repository/demo before claiming features. Distinguish implemented behavior from planned work. Add source/demo/download links only when they exist. Screenshots should show the actual current artifact; preserve any qualifications or version context.

## Reports and articles

- **Author identity (2026-10-19).** Refer to the author as **Yuxin** in bylines or attribution, and use **我 / 我的** naturally in Chinese narrative. Do not put the author’s full real name in articles, captions, titles, or article metadata, including when adapting the author’s own report. Set `author: Yuxin` for new articles so their rendered page identity also follows this preference. Preserve the names of cited researchers and other people. This article-writing preference does not authorize rewriting unrelated site identity pages.

Choose a structure that fits the material. An empirical report may need question, method, data, results, and limitations; an explanatory article may not. State the main point clearly and define important terms. Keep observations distinct from causal claims. Mark uncertain or missing evidence in the draft instead of filling gaps with plausible statements. Quote or cite sources accurately, preserve the user's original analysis, and never make a reading note appear to be an original experiment.

The title and summary should identify the subject and scope. Avoid promotional adjectives and inflated novelty claims. Do not turn concise notes into long formal prose merely to sound academic. Keep the source language unless asked to translate; handle mixed Chinese/English technical terminology consistently.

## Figures and formatting

Use supplied figures when suitable. If a plot is needed, generate it from the supplied data using reproducible plotting tools, retaining the script and identifying the data source. Label units, axes, legends, uncertainty, and relevant conditions. Do not approximate values from an unavailable source or invent quantitative evidence. Never use image generation to produce scientific results.

Use local image files where redistribution is permitted, descriptive alternative text, and numbered captions when the text refers to figures. Check that captions actually describe what is visible. Crop only irrelevant margins; do not crop out evidence or qualifications. Check chart labels at phone width. Use separate panels or a larger linked figure when necessary.

For architecture diagrams in product articles, prefer a compact horizontal layout unless the content or the author calls for another arrangement. Show components and information flow rather than illustrating every procedural step. Keep text readable on phones using scrolling within the figure when needed; check that the image actually loads and that the page itself does not overflow.

Use the existing Markdown conventions for headings, KaTeX, language-labelled code fences, tables, and footnotes. Long tables and code should scroll within their containers. Add external-source credits as links in adjacent prose or reviewed figure HTML when captions need clickable attribution. Do not require a decorative thumbnail or cover image.

## Review outcome

Before publication, resolve factual gaps with the author when necessary. Grammar, asset paths, typography, caption formatting, and routine layout fixes do not need repeated approval. Do not publish a draft that still contains unanswered factual placeholders; leave it previewable and state the missing evidence precisely.

Before presenting an article draft, check that it completes the requested scope, contains no writing instructions masquerading as prose, uses the supplied voice appropriately, and does not repeat the same discussion under multiple headings. Revisions should address the user's editorial intent, not just replace the exact words they criticized.
