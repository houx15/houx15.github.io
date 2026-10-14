// Server-owned conversational references, not evidence for a new answer.
// Keep the existing 4000-character history limit and never store arbitrary blocks.
export function rememberAgentAnswer(answer) {
  const concepts=(answer.blocks || []).filter(block=>block.type==='concept_flow');
  const sourceIds=[...new Set((answer.sources || []).map(source=>source.id))].filter(id=>typeof id==='string' && id.length<=400).slice(0,3);
  if(!concepts.length && !sourceIds.length && answer.text.length<=4000)return answer.text;
  const prefix=answer.text.slice(0,1000).replace(/[\uD800-\uDBFF]$/u,'');
  const memory={text:prefix,textTruncated:prefix.length<answer.text.length,sourceIds:[],visuals:[],omittedVisuals:0};
  // JSON escaping can expand a character to six bytes of history text. Bound the
  // serialized record itself, including its explicit indication of missing prose.
  while(JSON.stringify(memory).length>3900) {
    memory.text=memory.text.slice(0,-1).replace(/[\uD800-\uDBFF]$/u,'');
    memory.textTruncated=true;
  }
  for(const id of sourceIds) {
    if(JSON.stringify({...memory,sourceIds:[...memory.sourceIds,id]}).length<=3900)memory.sourceIds.push(id);
  }
  const retained=[];
  for(const block of concepts.slice().reverse()) {
    const visual={type:'concept_flow',title:block.title,items:block.items.map((item,index)=>({position:index+1,title:item.title,sourceId:item.source.id})),omittedDescriptions:block.items.filter(item=>typeof item.description==='string' && item.description.length>0).length};
    const candidate={...memory,visuals:[visual,...memory.visuals]};
    if(JSON.stringify(candidate).length<=3900) {memory.visuals.unshift(visual);retained.push({visual,block});}
    else memory.omittedVisuals++;
  }
  // Keep displayed explanations for follow-up questions and corrections. They are
  // previous AI claims, never evidence. Reserve navigation references first; enrich
  // the newest retained diagrams within the same serialized history bound.
  for(const {visual,block} of retained) {
    for(const [index,item] of block.items.entries()) {
      if(typeof item.description!=='string' || !item.description)continue;
      visual.items[index].description=item.description;
      visual.omittedDescriptions--;
      if(JSON.stringify(memory).length>3900) {delete visual.items[index].description;visual.omittedDescriptions++;}
    }
  }
  return JSON.stringify(memory);
}
