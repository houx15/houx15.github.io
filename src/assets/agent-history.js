import { validateAgentBlock } from './agent-stream.js';
const text=(value,max)=>typeof value==='string' && value.length>0 && value.length<=max;
const url=value=>text(value,1500) && /^\/(?!\/)[^\s\\]*$/.test(value) && !/[\u0000-\u001f]/.test(value);

// Presentation history only: never contains credentials or supplies model messages.
export function validateSavedTurn(value) {
  try {
    if(!value || value.kind!=='agent' || !text(value.question,400) || !Array.isArray(value.events) || value.events.length>50 || JSON.stringify(value).length>100000) return null;
    const events=[],sources=new Set();let answered=false,done=false;
    for(const event of value.events) {
      if(!event || done)return null;
      if(event.type==='source') {
        const source=event.source;
        if(!source || !text(source.id,400) || sources.has(source.id) || !text(source.label,1000) || !url(source.url))return null;
        sources.add(source.id);events.push({type:'source',source:{id:source.id,label:source.label,url:source.url}});
      } else if(event.type==='block') {
        validateAgentBlock(event.block);events.push({type:'block',block:JSON.parse(JSON.stringify(event.block))});
      } else if(event.type==='answer') {
        if(answered || !text(event.text,10000) || !Array.isArray(event.sourceIds) || event.sourceIds.length>10 || event.sourceIds.some(id=>!sources.has(id)))return null;
        answered=true;events.push({type:'answer',text:event.text,sourceIds:[...event.sourceIds]});
      } else if(event.type==='done' && answered) {done=true;events.push({type:'done'});}
      else return null;
    }
    return done?{kind:'agent',question:value.question,events}:null;
  } catch {return null;}
}

// Record prose at its first visible position, without storing every token delta.
// Sources are nonvisual and precede all content so final citations can reference
// evidence discovered after the first sentence. Validate before persistence.
export function recordPresentationEvent(events,event) {
  if(event.type==='source')events.unshift(event);
  else if(event.type==='answer_delta') {
    if(!events.some(item=>item.type==='answer'))events.push({type:'answer',text:'',sourceIds:[]});
  } else if(event.type==='answer') {
    const index=events.findIndex(item=>item.type==='answer');
    if(index<0)events.push(event);else events[index]=event;
  } else if(event.type==='block' || event.type==='done')events.push(event);
}
