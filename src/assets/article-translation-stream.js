const invalid = () => { throw new Error('translation_invalid'); };
export async function consumeTranslationStream(body, onEvent, signal) {
  if (!body?.getReader) return invalid();
  const reader=body.getReader(), decoder=new TextDecoder('utf-8',{fatal:true});
  let buffer='',bytes=0,started=false,terminal=false,requestId;
  const eventIds=new Set(), nodes=new Map(), translated=new Set();
  function frame(raw) {
    if (!raw.trim() || raw.split('\n').every(line=>!line||line.startsWith(':'))) return;
    if (terminal) return invalid();
    const lines=raw.split('\n');
    const field=name=>lines.filter(line=>line.startsWith(name+':')).map(line=>line.slice(name.length+1).replace(/^ /,'')).join('\n');
    let event;try{event=JSON.parse(field('data'));}catch{return invalid();}
    if (!event || event.version!==2 || typeof event.requestId!=='string' || event.requestId.length>100 || !event.requestId || (requestId && requestId!==event.requestId) || typeof event.id!=='string' || event.id!==field('id') || event.type!==field('event') || eventIds.has(event.id) || eventIds.size>10000) return invalid();
    requestId=event.requestId;eventIds.add(event.id);
    if(event.type==='translation_start') {
      if(started || !Array.isArray(event.nodes) || !event.nodes.length || event.nodes.length>5000 || !['en','zh-CN'].includes(event.targetLanguage) || typeof event.documentId!=='string' || typeof event.revision!=='string' || !event.revision) return invalid();
      for(const node of event.nodes) {
        if(!node || typeof node.id!=='string' || !/^(title|summary|t\d+)$/.test(node.id) || nodes.has(node.id) || typeof node.text!=='string' || !node.text.trim() || node.text.length>100000) return invalid();
        nodes.set(node.id,node.text);
      }
      started=true;
    } else if(event.type==='translation_node') {
      if(!started || !nodes.has(event.nodeId) || translated.has(event.nodeId) || typeof event.text!=='string' || !event.text.trim() || event.text.length>200000 || typeof event.cached!=='boolean')return invalid();
      translated.add(event.nodeId);
    } else if(event.type==='done') {
      if(!started || event.outcome!=='complete' || translated.size!==nodes.size)return invalid();
      terminal=true;
    } else if(event.type==='error') {
      if(typeof event.code!=='string' || typeof event.partial!=='boolean')return invalid();
      terminal=true;
    } else return invalid();
    onEvent(event);
    if(event.type==='error')throw new Error(event.code);
  }
  const abort=()=>{reader.cancel().catch(()=>{});};
  signal?.addEventListener('abort',abort,{once:true});
  try {
    while(true) {
      signal?.throwIfAborted();
      const {value,done}=await reader.read();if(done)break;
      bytes+=value.byteLength;if(bytes>8*1024*1024)return invalid();
      buffer+=decoder.decode(value,{stream:true});buffer=buffer.replace(/\r\n/g,'\n');
      let boundary;while((boundary=buffer.indexOf('\n\n'))>=0){frame(buffer.slice(0,boundary));buffer=buffer.slice(boundary+2);}
      if(buffer.length>1024*1024)return invalid();
    }
    signal?.throwIfAborted();buffer+=decoder.decode();
    if(buffer.trim()||!terminal)throw new Error('interrupted');
  } finally {signal?.removeEventListener('abort',abort);await reader.cancel().catch(()=>{});reader.releaseLock();}
}
