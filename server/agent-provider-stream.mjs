// Decode provider SSE incrementally. Only public answer text is forwarded; never reasoning.
function parseProviderJSON(text,stage) {
  try {return JSON.parse(text);}
  catch {throw Object.assign(new SyntaxError('Invalid provider JSON'),{diagnosticDetail:stage});}
}
function visiblePrefix(content) {
  const match=content.match(/^\s*\{\s*"sourceIds"\s*:\s*(\[(?:\s*"(?:[^"\\]|\\.)*"\s*,?)*\s*\])\s*,\s*"text"\s*:\s*"/);
  if(!match)return null;
  let sourceIds;try {sourceIds=JSON.parse(match[1]);}catch{return null;}
  const rest=content.slice(match[0].length);let escaped=false,end=rest.length;
  for(let i=0;i<rest.length;i++) {if(!escaped && rest[i]==='"'){end=i;break;}if(!escaped && rest[i]==='\\')escaped=true;else escaped=false;}
  // Trim an incomplete JSON escape or high surrogate until the next chunk arrives.
  let fragment=rest.slice(0,end);
  while(fragment.length) {
    try {let text=JSON.parse('"'+fragment+'"');if(/[\uD800-\uDBFF]$/.test(text))text=text.slice(0,-1);return {sourceIds,text};}
    catch {fragment=fragment.slice(0,-1);if(rest.length-fragment.length>8)return null;}
  }
  return {sourceIds,text:''};
}
export async function readProviderStream(response,{signal,allowJsonTools=false,requireJsonObject=false,onText=()=>{}}={}) {
  if(!response.ok || !response.headers.get('content-type')?.startsWith('text/event-stream'))throw new Error('Invalid stream');
  const reader=response.body.getReader(),decoder=new TextDecoder('utf-8',{fatal:true});
  let buffer='',content='',sent='',size=0,frames=0,done=false,finish,usage;const calls=new Map();
  function frame(value) {
    const data=value.split('\n').filter(line=>line.startsWith('data:')).map(line=>line.slice(5).trimStart()).join('\n');
    if(!data)return;if(done || ++frames>4096)throw new Error('Invalid stream');
    if(data==='[DONE]'){done=true;return;}
    const part=parseProviderJSON(data,'stream_frame');if(part.usage)usage=part.usage;
    if(!Array.isArray(part.choices) || part.choices.length>1)throw new Error('Invalid choices');
    const choice=part.choices[0];if(!choice)return;
    if(choice.index!==0 || finish)throw new Error('Invalid choice');
    const delta=choice.delta || {};
    if(delta.content) {
      if(typeof delta.content!=='string')throw new Error('Mixed result');
      content+=delta.content;if(content.length>100000)throw new Error('Oversized result');
      // In JSON-object mode a non-object first token can never become a valid
      // answer or action. Cancel now rather than waiting for the output ceiling.
      if(requireJsonObject && content.trimStart() && !content.trimStart().startsWith('{'))throw new Error('Invalid JSON root');
      const prefix=calls.size?null:visiblePrefix(content);
      if(prefix && prefix.text.length>sent.length) {if(!prefix.text.startsWith(sent))throw new Error('Changed result');const addition=prefix.text.slice(sent.length);sent=prefix.text;onText(addition,prefix.sourceIds);}
    }
    // Providers may include a prose preamble alongside tool calls. Keep it private.
    // Once structured answer text has streamed, switching to tools is still invalid.
    if(delta.tool_calls) {
      if(!Array.isArray(delta.tool_calls) || sent)throw new Error('Mixed result');
      for(const call of delta.tool_calls) {
        if(!Number.isInteger(call.index) || call.index<0 || call.index>7)throw new Error('Invalid tool index');
        const item=calls.get(call.index)||{id:'',name:'',arguments:''};
        if(call.type && call.type!=='function')throw new Error('Invalid tool type');
        for(const [key,value] of [['id',call.id],['name',call.function?.name],['arguments',call.function?.arguments]]) {
          if(value!==undefined){if(typeof value!=='string')throw new Error('Invalid tool delta');item[key]+=value;}
        }
        if(item.id.length>100 || item.name.length>100 || item.arguments.length>16000)throw new Error('Oversized tool');calls.set(call.index,item);
      }
    }
    if(choice.finish_reason)finish=choice.finish_reason;
  }
  try {
    while(true) {
      signal?.throwIfAborted();const {value,done:ended}=await reader.read();if(ended)break;
      size+=value.byteLength;if(size>1024*1024)throw new Error('Oversized stream');
      buffer+=decoder.decode(value,{stream:true});buffer=buffer.replace(/\r\n/g,'\n');let boundary;
      while((boundary=buffer.indexOf('\n\n'))>=0){frame(buffer.slice(0,boundary));buffer=buffer.slice(boundary+2);}
      if(buffer.length>100000)throw new Error('Oversized frame');
    }
    buffer+=decoder.decode();if(buffer.trim() || !done)throw new Error('Truncated stream');
    if(finish==='tool_calls' && calls.size && !sent)return {toolCalls:[...calls.entries()].sort((a,b)=>a[0]-b[0]).map(([,call])=>({...call,arguments:parseProviderJSON(call.arguments,'tool_arguments')})),usage};
    if(finish==='length')throw new Error('Output token limit');
    if(finish!=='stop' || calls.size)throw new Error('Invalid finish');
    const result=parseProviderJSON(content,'final_answer');
    if(allowJsonTools && result && Object.hasOwn(result,'toolCalls')) {
      if(sent || Object.keys(result).length!==1 || !Array.isArray(result.toolCalls) || result.toolCalls.length<1 || result.toolCalls.length>8 || result.toolCalls.some(call=>!call || typeof call!=='object' || Object.keys(call).some(key=>!['id','name','arguments'].includes(key)) || typeof call.id!=='string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(call.id) || typeof call.name!=='string' || call.name.length>100 || !call.arguments || typeof call.arguments!=='object' || Array.isArray(call.arguments)) || new Set(result.toolCalls.map(call=>call.id)).size!==result.toolCalls.length)throw new Error('Invalid tool delta');
      return {toolCalls:result.toolCalls,usage};
    }
    const detail=!result || typeof result!=='object' || Array.isArray(result)?'nonobject_result'
      :Object.keys(result).some(key=>!['text','sourceIds'].includes(key))?'additional_fields'
      :typeof result.text!=='string'?'invalid_text_field'
      :!Array.isArray(result.sourceIds)?'invalid_sources_field'
      :!result.text.startsWith(sent)?'changed_stream_text':undefined;
    if(detail)throw Object.assign(new Error('Invalid final'),{diagnosticDetail:detail});
    return {...result,usage};
  } finally {await reader.cancel().catch(()=>{});reader.releaseLock();}
}
