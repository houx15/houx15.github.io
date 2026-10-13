// Server-owned conversational references, not evidence for a new answer.
// Keep the existing 4000-character history limit and never store arbitrary blocks.
export function rememberAgentAnswer(answer) {
  const concepts=(answer.blocks || []).filter(block=>block.type==='concept_flow');
  const sourceIds=[...new Set((answer.sources || []).map(source=>source.id))].filter(id=>typeof id==='string' && id.length<=400).slice(0,3);
  if(!concepts.length && !sourceIds.length)return answer.text.slice(0,4000);
  const memory={text:answer.text.slice(0,1000),sourceIds:[],visuals:[],omittedVisuals:0};
  for(const id of sourceIds) {
    if(JSON.stringify({...memory,sourceIds:[...memory.sourceIds,id]}).length<=3900)memory.sourceIds.push(id);
  }
  for(const block of concepts.slice().reverse()) {
    const visual={type:'concept_flow',title:block.title,items:block.items.map((item,index)=>({position:index+1,title:item.title,sourceId:item.source.id}))};
    const candidate={...memory,visuals:[visual,...memory.visuals]};
    if(JSON.stringify(candidate).length<=3900)memory.visuals.unshift(visual);
    else memory.omittedVisuals++;
  }
  return JSON.stringify(memory);
}
