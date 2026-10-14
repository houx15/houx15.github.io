import {rememberAgentAnswer} from './agent-memory.mjs';
import {isVisualId} from '../src/assets/agent-visual-id.js';

// Resolve only server-retained successful exchanges. History is context, not evidence.
export function findConceptStep(history,visualId,position) {
  if(!isVisualId(visualId) || !Number.isInteger(position) || position<1 || position>5)return null;
  let target=null,seen=false,invalid=false;
  for(const message of history) {
    if(message.role!=='assistant')continue;
    let memory;try{memory=JSON.parse(message.content);}catch{continue;}
    if(!memory || !Array.isArray(memory.visuals))continue;
    for(const visual of memory.visuals) {
      if(visual.visualId!==visualId)continue;
      if(seen){invalid=true;continue;}seen=true;
      const item=visual.items?.find(item=>item.position===position);
      if(visual.type==='concept_flow' && typeof visual.title==='string' && item && typeof item.description==='string' && item.description && typeof item.sourceId==='string')target={...item,visualId,diagramTitle:visual.title};
    }
    for(const revision of memory.revisions || []) {
      if(revision.visualId!==visualId || revision.position!==position)continue;
      if(!target || revision.sourceId!==target.sourceId || revision.previousDescription!==target.description || typeof revision.description!=='string' || !revision.description)invalid=true;
      else target={...target,description:revision.description};
    }
  }
  return invalid?null:target;
}

export function reviseConceptStep(args,{history,evidence,passages,quoteFragments,alreadyRevised}) {
  if(alreadyRevised)throw new Error('Revision limit');
  const target=findConceptStep(history,args.visualId,args.position);
  if(!target)throw new Error('Revision target unavailable');
  if(!evidence.has(target.sourceId))throw new Error('Revision source unread');
  if(typeof args.description!=='string' || !args.description.trim() || args.description.length>128 || args.description===target.description)throw new Error('Invalid revision description');
  const normalize=text=>typeof text==='string'?text.replace(/\s+/g,' ').trim():'';
  let quote=args.quote;
  if(args.quoteId!==undefined) {
    if(quote!==undefined)throw new Error('Invalid revision quotation');
    try {quote=quoteFragments.resolve(args.quoteId,target.sourceId);}catch{throw new Error('Invalid revision quotation');}
  }
  if(passages.has(target.sourceId)) {
    if(!normalize(quote) || normalize(quote).length>400 || !normalize(passages.get(target.sourceId)).includes(normalize(quote)))throw new Error('Invalid revision quotation');
  } else if(quote!==undefined)throw new Error('Invalid revision quotation');
  const block={type:'concept_revision',visualId:target.visualId,title:target.diagramTitle,items:[{position:target.position,title:target.title,previousDescription:target.description,description:args.description,...(quote===undefined?{}:{quote:normalize(quote)}),source:{...evidence.get(target.sourceId)}}]};
  rememberAgentAnswer({text:'',blocks:[block]}); // Must fit retained history before display.
  return block;
}
