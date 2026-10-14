import {proseSentences} from './agent-prose-boundaries.mjs';
import {findUncertaintyConflict} from './agent-uncertainty.mjs';
// A first-person statement elsewhere in the sources cannot authorize a new
// personal belief. Accept an explicit attribution only when its statement matches
// a direct first-person sentence; other paraphrases can be presented as note text.
const ownerStance = /(?:她|煜欣|侯煜欣)\s*(?:认为|主张|坚信|相信|倡导|强调)|\b(?:she|Yuxin|Evie)\s+(?:believes|advocates|insists|argues|maintains)\b/iu;
const firstPersonStance = /^(?:我(?:认为|主张|相信|倡导|坚信|强调)|I\s+(?:believe|think|advocate|argue|maintain|insist)\b)/iu;
const stanceWords = text => text.trim().replace(/^[，,:：\s]+|[。.!！?？\s]+$/gu,'').replace(/\s+/gu,' ').toLowerCase();
function unsupportedPersonalStance(sentence,source) {
  const match=ownerStance.exec(sentence);
  if(!match)return false;
  // An explicit refusal to infer a belief does not assert that belief.
  if(/(?:不能说|不能据此认为|没有依据说|没有证据表明|不足以说明)\s*$/u.test(sentence.slice(0,match.index)) && !ownerStance.test(sentence.slice(match.index+match[0].length)))return false;
  const statement=stanceWords(sentence.slice(match.index+match[0].length));
  if(!statement)return true;
  return !proseSentences(source).some(part=>{
    const direct=part.trim(),author=firstPersonStance.exec(direct);
    return author && stanceWords(direct.slice(author[0].length))===statement;
  });
}

// Narrow output checks for observed overstatements. They are not semantic proof.
export function checkProseClaims(text,ids,passages) {
  const source=ids.map(id=>passages.get(id)).filter(Boolean).join('\n');
  if(!source)return;
  for(const sentence of proseSentences(text)) {
    if(!sentence.trim() || source.includes(sentence.trim()))continue;
    const assertion=sentence.replace(/(?:并未|没有|未曾|并不|不能|不应)(?:断言|声称|说|说明|认为|推出|证明|意味着)(?:过|是)?[：:\s]*[“「][^”」]*[”」]/gu,'');
    const positive=assertion.replace(/“[^”]*”|「[^」]*」|『[^』]*』/gu,quote=>source.includes(quote.slice(1,-1))?'':quote);
    let reason;
    if(findUncertaintyConflict(positive,source))reason='certainty';
    for(const term of ['必要条件','充分条件','必要前提','最终判断标准','唯一标准','最终判据','最终标准','基本条件','基础条件','逐层递进','递进的筛选关系','前提']) {
      if(positive.includes(term) && !source.includes(term) && !new RegExp(`(?:不是|并非|不构成|不能视为|不能说是|不代表|未必是)[^，。；]{0,12}${term}`).test(positive))reason='logical_strength';
    }
    if(/必要(?:但不充分)?(?:的)?(?:筛选)?(?:标准|条件|前提)/u.test(positive) && !/必要/.test(source) && !/(?:并非|不是|不构成|不能视为|不代表|未必是)[^，。；]{0,12}必要/.test(positive))reason='logical_strength';
    if(positive.includes('取决于') && !source.includes('取决于') && !/(?:不|并非)取决于/.test(positive))reason='unsupported_dependency';
    if(/(?:最具体|最明确|最适合|唯一的|最重要的)/u.test(positive) && !source.includes(positive.trim()))reason='unsupported_comparison';
    if(ownerStance.test(positive) && unsupportedPersonalStance(assertion,source))reason='personal_stance';
    if(/(?:并非|不是|不呈|并不)[^。！？]{0,12}线性/u.test(positive) && !source.includes('线性'))reason='unsupported_relation';
    if(/学习效用才是[^。！？]{0,12}实际价值所在/u.test(positive) && source.includes('最接近') && !source.includes('实际价值所在'))reason='logical_strength';
    if(!ids.some(id=>id.startsWith('profile:') || id.startsWith('event:')) && [...positive.matchAll(/普林斯顿|VSRC|北京大学|清华大学/gu)].some(match=>!source.includes(match[0])))reason='unsupported_biography_context';
    if(reason)throw Object.assign(new Error('Invalid prose claim'),{proseIssue:{reason,clause:sentence.trim().slice(0,400)}});
  }
}
export const proseRepairGuidance='Correct the rejected claim using only the already-read sources. Preserve possibility, conditions, and scope. Reviewable criteria are not prerequisites, necessary/sufficient conditions, a sequential screening hierarchy, or the final standard unless explicitly stated. Do not invent dependence on ratios, causal factors, weights, or ordering. If a relation is not stated, quote the actual source sentence and say the source does not establish a stronger relation. Recommend using the selected work’s concrete topic, not unsupported rankings such as most specific/best/only. Do not attribute personal beliefs to her from a technical note. For a rejected personal_stance, use the exact relevant first-person statement if the source contains one; otherwise describe what the note discusses without claiming it is her belief. A different first-person sentence elsewhere in the source is not support. Remove unsupported assertions rather than merely adding a vague disclaimer. Return {sourceIds,text}; no tools. The reader already sees alreadyShownPrefix: NEVER repeat, replace, summarize, or include it in text. Return ONLY the remaining corrected continuation in text, using the same sourceIds when a prefix is shown. The application appends your continuation. This prefix is historical displayed text, not new evidence. Use short paragraphs separated by JSON-escaped \\n\\n.';

// Repair output may repeat earlier accepted sentences despite continuation instructions.
// Remove exact repetitions only in internal repairs, never in an ordinary answer.
export function repairSentenceRepeated(sentence,prefix) {
  const trimmed=sentence.trim();return trimmed.length>20 && prefix.includes(trimmed);
}
export function repairContinuation(text,prefix) {
  return proseSentences(text).filter(sentence=>!repairSentenceRepeated(sentence,prefix)).join('');
}
