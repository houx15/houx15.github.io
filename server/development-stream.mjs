import {randomUUID} from 'node:crypto';

// Streaming operator input keeps stdin open as a cancellation channel.
// Closing the SSH client's stdin aborts the request on the model host.
export function readDevelopmentStreamInput(input,controller,maxBytes=8192) {
  return new Promise((resolve,reject)=>{
    let buffer='',accepted=false;
    const fail=()=>{controller.abort();reject(new Error('Invalid development input'));};
    input.setEncoding('utf8');
    input.on('data',chunk=>{
      if(accepted){if(chunk.length)fail();return;}
      buffer+=chunk;
      if(Buffer.byteLength(buffer)>maxBytes){fail();return;}
      const end=buffer.indexOf('\n');if(end<0)return;
      if(buffer.slice(end+1).trim()){fail();return;}
      accepted=true;resolve(buffer.slice(0,end));buffer='';
    });
    input.on('end',()=>{controller.abort();if(!accepted)reject(new Error('Incomplete development input'));});
    input.on('error',fail);
  });
}

// Only the SSH operator can supply this envelope. Public HTTP accepts no history.
export function parseDevelopmentContext(raw) {
  const value=JSON.parse(raw);
  if(!value || Object.keys(value).some(key=>!['turns','history'].includes(key)) || !Array.isArray(value.turns) || value.turns.length!==1 || !Array.isArray(value.history) || value.history.length>40 || value.history.length%2 || value.history.some((item,index)=>!item || Object.keys(item).some(key=>!['role','content'].includes(key)) || item.role!==(index%2?'assistant':'user') || typeof item.content!=='string' || item.content.length>4000))throw new Error('Invalid development context');
  return value;
}

// Emit the same validated SSE vocabulary consumed by the website. No credentials,
// provider responses, stderr or development counters enter this stream.
export function createDevelopmentStream(write,requestId=randomUUID()) {
  const sources=new Set();let sequence=0,partial=false,finished=false;
  const emit=(type,data)=>{
    if(finished)return;
    const id=`${requestId}:${++sequence}`;
    if(write(`id: ${id}\nevent: ${type}\ndata: ${JSON.stringify({version:2,requestId,id,type,...data})}\n\n`)===false)throw new Error('Development consumer too slow');
  };
  const addSources=items=>{for(const source of items)if(!sources.has(source.id)){emit('source',{source});sources.add(source.id);}};
  return {
    event(event) {
      if(event.type==='status'){const {type,...data}=event;emit(type,data);}
      if(event.type==='block'){partial=true;emit('block',{block:{...event.block,id:`${requestId}:${event.block.id}`}});}
      if(event.type==='answer_delta'){addSources(event.sources);partial=true;emit('answer_delta',{text:event.text,sourceIds:event.sources.map(s=>s.id)});}
    },
    complete(answer) {
      addSources(answer.sources);
      emit('answer',{text:answer.text,sourceIds:answer.sources.map(s=>s.id),revision:answer.revision});
      emit('done',{outcome:'complete'});finished=true;
    },
    fail(code='unavailable') {emit('error',{code,partial});finished=true;}
  };
}
