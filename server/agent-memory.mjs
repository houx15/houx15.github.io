// Server-owned conversational references, not evidence for a new answer.
import {isVisualId} from '../src/assets/agent-visual-id.js';
// Keep the existing 4000-character history limit and never store arbitrary blocks.
export function rememberAgentAnswer(answer) {
  const nextQuestion=(answer.blocks || []).find(block=>block.type==='questions')?.items?.[0];
  const followUp=nextQuestion && typeof nextQuestion.query==='string' && nextQuestion.query.length<=400 && typeof nextQuestion.documentId==='string' && nextQuestion.documentId.length<=400?{question:nextQuestion.query,documentId:nextQuestion.documentId}:undefined;
  const concepts=(answer.blocks || []).filter(block=>block.type==='concept_flow');
  const revisions=(answer.blocks || []).filter(block=>block.type==='concept_revision').flatMap(block=>block.items.map(item=>({visualId:block.visualId,position:item.position,previousDescription:item.previousDescription,description:item.description,sourceId:item.source.id})));
  const sourceIds=[...new Set((answer.sources || []).map(source=>source.id))].filter(id=>typeof id==='string' && id.length<=400).slice(0,3);
  if(!Array.isArray(answer.readSources) && !followUp && !revisions.length && !concepts.length && !sourceIds.length && answer.text.length<=4000)return answer.text;
  const prefix=answer.text.slice(0,1000).replace(/[\uD800-\uDBFF]$/u,'');
  const memory={text:prefix,textTruncated:prefix.length<answer.text.length,sourceIds:[],visuals:[],omittedVisuals:0};
  // Reserve the accepted edit before prose: losing it would resurrect an old claim.
  if(revisions.length)memory.revisions=revisions;
  if(JSON.stringify({...memory,text:''}).length>3900)throw new Error('Revision memory overflow');
  // JSON escaping can expand a character to six bytes of history text. Bound the
  // serialized record itself, including its explicit indication of missing prose.
  while(JSON.stringify(memory).length>3900) {
    memory.text=memory.text.slice(0,-1).replace(/[\uD800-\uDBFF]$/u,'');
    memory.textTruncated=true;
  }
  for(const id of sourceIds) {
    if(JSON.stringify({...memory,sourceIds:[...memory.sourceIds,id]}).length<=3900)memory.sourceIds.push(id);
  }
  if(followUp) {
    if(JSON.stringify({...memory,followUp}).length<=3900)memory.followUp=followUp;
    else memory.omittedFollowUp=true;
  }
  const retained=[];
  for(const block of concepts.slice().reverse()) {
    const visual={type:'concept_flow',...(isVisualId(block.visualId)?{visualId:block.visualId}:{}),title:block.title,items:block.items.map((item,index)=>({position:index+1,title:item.title,sourceId:item.source.id})),omittedDescriptions:block.items.filter(item=>typeof item.description==='string' && item.description.length>0).length};
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
  // Keep an explicit, bounded record of actual reads, separate from citations.
  // Missing legacy metadata means unknown, never an exhaustive list of reads.
  if(Array.isArray(answer.readSources)) {
    const reads=[...new Map(answer.readSources.filter(source=>typeof source.id==='string' && source.id.length<=400 && typeof source.label==='string').map(source=>[source.id,{id:source.id,label:source.label.slice(0,160)}])).values()];
    const record={sources:[],omitted:reads.length};
    if(JSON.stringify({...memory,readRecord:record}).length<=3900) {
      memory.readRecord=record;
      for(const source of reads) {
        const candidate={sources:[...record.sources,source],omitted:record.omitted-1};
        if(JSON.stringify(candidate).length>1200 || JSON.stringify({...memory,readRecord:candidate}).length>3900)break;
        record.sources.push(source);record.omitted--;
      }
    }
  }
  return JSON.stringify(memory);
}
