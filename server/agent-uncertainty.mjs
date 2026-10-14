// A lexical tripwire for explicit predictions, not an entailment/translation judge.
// Never rewrite the visitor-visible claim: ask the model to repair it before display.
const possible = /可能|或许|也许|\b(?:may|might|could)\b/iu;
const qualified = /可能|或许|也许|未必|不一定|不必然|不保证|\b(?:may|might|could|not necessarily|not guaranteed)\b/iu;
const prediction = /必然|必定|一定会|肯定会|总会|(?<!社|协|机|学|大|聚|体|领|误)会(?=同时|把|将|导致|造成|强化|降低|削弱|影响|破坏|损害|限制|提高|增加|减少|产生|使|学到|学习|变成|出现|带来)|\b(?:will|always|necessarily|inevitably)\b/iu;
export function findUncertaintyConflict(text,sourceText) {
  if(typeof text!=='string' || typeof sourceText!=='string')return null;
  // A statement of impossibility is not a statement of uncertain possibility.
  const source=sourceText.replace(/不可能|没有可能/gu,'');
  if(!possible.test(source))return null;
  for(const clause of text.split(/[，。！？；,;.!?\n]/u)) {
    if(prediction.test(clause) && !qualified.test(clause) && !/并非必然|不是必然|而非必然|而不是必然|不代表必然|不意味着必然|不必定|不会总是|\bnot always\b/iu.test(clause))return clause.trim();
  }
  return null;
}

export function checkConceptUncertainty({title,items,caption},passages) {
  const checks=items.flatMap((item,index)=>[
    {field:`step_${index+1}_title`,text:item.title,source:item.quote || passages.get(item.source.id),sourceId:item.source.id},
    {field:`step_${index+1}_description`,text:item.description,source:item.quote || passages.get(item.source.id),sourceId:item.source.id}
  ]);
  const sourceText=[...new Set(items.map(item=>passages.get(item.source.id)).filter(Boolean))].join('\n');
  checks.push({field:'title',text:title,source:sourceText},{field:'caption',text:caption,source:sourceText});
  for(const check of checks) {
    const clause=findUncertaintyConflict(check.text,check.source);
    if(clause) {
      const error=new Error('Possible source certainty conflict');
      error.conflict={field:check.field,clause,...(check.sourceId?{sourceId:check.sourceId}:{})};
      throw error;
    }
  }
}
