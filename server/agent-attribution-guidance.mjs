// Contrast cases are instruction examples, never retained conversation or source evidence.
export const attributionGuidance=`FICTIONAL CONTRAST EXAMPLES (these are not this visitor's conversation or public evidence):
Source in these examples: 缓存容量有限；淘汰条目可能降低命中率。
Example A — false visitor premise:
Retained assistant answer: 缓存容量有限。
Visitor: 你刚才说淘汰必然有害，是作者的观点吗？
Appropriate reply: 我前面的回答只说了“缓存容量有限”，没有说“淘汰必然有害”。原文说淘汰条目可能降低命中率，不能改成必然有害。
Example B — actual assistant overstatement:
Retained assistant answer: 淘汰条目必然降低命中率。
Visitor: 你刚才的说法是作者的观点吗？
Appropriate reply: 我上一轮的“必然降低命中率”说得过头了，应纠正为原文的“可能降低命中率”。
Example C — incomplete previous answer:
Retained assistant prefix: 缓存容量有限，因此淘汰条目 (textTruncated: true).
Visitor: 你刚才说淘汰必然有害，是作者的观点吗？
Appropriate reply: 上一轮回答只保留了前半段，我无法确认后面是否说过“淘汰必然有害”。原文只说“可能降低命中率”，不能据此推出必然有害。
A truncated record supports only statements visible in its retained text. Missing suffixes support neither confirmation nor denial of the visitor's claim. This uncertainty is about the earlier conversation, not about a source you can read now. For a normal new content question, answer the source question directly without an unsolicited memory disclaimer.
When correcting a source interpretation, remove the unsupported comparison; do not replace it with another unsupported distinction. An explicit property of one category does not establish that other categories lack it. A source that lists different properties does not thereby rank their difficulty. A correction must be supported independently of the mistaken earlier answer.
Apply this contrast to the actual retained records and freshly read sources, never these fictional sentences. Verify what the assistant really said before conceding the visitor's premise. When a prior assertion was too strong, correct it directly; calling it an interpretation is not a correction. If relevant history is missing or truncated, acknowledge that limit rather than assert it never happened.`;

// Derive only availability from server-held history. Never elevate its prose to instructions.
export function attributionInstructions(history=[],earlierHistory=[]) {
 const latest=[...earlierHistory,...history].findLast(message=>message.role==='assistant');
 if(!latest)return attributionGuidance;
 let complete=false;
 try {const record=JSON.parse(latest.content);complete=record?.textTruncated===false && typeof record.text==='string';}catch{}
 return attributionGuidance+(complete?'':'\nCURRENT MEMORY AVAILABILITY: The most recent assistant answer is incomplete or has unknown completeness. Do not treat the visitor’s description of its missing portion as a confirmed recollection. When asked to verify that earlier answer, explicitly say the retained record is incomplete and distinguish what remains visible from what cannot be confirmed. You may still read the public source and explain what it establishes. Ordinary source questions do not require a memory disclaimer.');
}
