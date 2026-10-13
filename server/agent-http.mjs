import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { AgentError } from './agent-state.mjs';
import { runContentAgent } from './content-agent.mjs';
const invalid=()=>{throw new AgentError(400,'invalid_request');};
const object=(v,keys)=>v && typeof v==='object' && !Array.isArray(v) && Object.keys(v).every(k=>keys.includes(k));
async function body(req) {
  if(req.headers['content-type']?.split(';')[0]!=='application/json') invalid();
  let size=0;const parts=[];
  for await(const chunk of req){size+=chunk.length;if(size>8192) invalid();parts.push(chunk);}
  try{return JSON.parse(Buffer.concat(parts));}catch{invalid();}
}
export function createAgentServer({origin,corpus,guard,complete,verifyChallenge,enabled=()=>false,production=true,deadlineMs=45000}) {
  const available=()=>enabled() && (!production || guard.store.shared) && typeof complete==='function' && typeof verifyChallenge==='function';
  const server=createServer(async(req,res)=>{
    const controller=new AbortController(), timer=setTimeout(()=>controller.abort(new Error('deadline')),deadlineMs);
    const signal=controller.signal, requestId=randomUUID(); let admitted=false,sequence=0,partial=false;
    res.on('close',()=>controller.abort()); req.on('aborted',()=>controller.abort());
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
    const emit=(type,data)=>{
      signal.throwIfAborted();if(res.destroyed) throw new Error('Disconnected');
      const id=`${requestId}:${++sequence}`;
      if(!res.write(`id: ${id}\nevent: ${type}\ndata: ${JSON.stringify({version:2,requestId,id,type,...data})}\n\n`)) {controller.abort();throw new Error('Slow consumer');}
    };
    try {
      if(req.url==='/health' && req.method==='GET') {json(available()?200:503,{available:available(),version:2});return;}
      if(req.headers.origin!==origin) throw new AgentError(403,'forbidden');
      res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');
      if(req.method==='OPTIONS') {res.writeHead(204,{'Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'Content-Type, Authorization'});res.end();return;}
      if(!available()) throw new AgentError(503,'unavailable');
      if(req.method!=='POST' || !['/v2/sessions','/v2/agent'].includes(req.url)) throw new AgentError(404,'not_found');
      const input=await body(req);signal.throwIfAborted(); const address=req.socket.remoteAddress || 'unknown';
      if(req.url==='/v2/sessions') {
        if(!object(input,['challengeToken']) || typeof input.challengeToken!=='string' || !input.challengeToken || input.challengeToken.length>2048) invalid();
        await guard.challengeAttempt(address,input.challengeToken);signal.throwIfAborted();
        await verifyChallenge(input.challengeToken,signal);signal.throwIfAborted();
        json(201,await guard.issue());return;
      }
      if(!object(input,['question','language','pageContext']) || typeof input.question!=='string' || !input.question.trim() || input.question.length>400 || !['en','zh-CN'].includes(input.language)) invalid();
      if(input.pageContext!==undefined && (!object(input.pageContext,['documentId']) || !corpus.documents.some(d=>d.id===input.pageContext.documentId))) invalid();
      // Preserve the page that 'this note' referred to, not just the question text.
      const userContext=JSON.stringify({question:input.question,language:input.language,pageContext:input.pageContext});
      if(userContext.length>4000) invalid();
      const token=req.headers.authorization?.match(/^Bearer ([^ ]+)$/)?.[1];
      const session=await guard.begin(token,address,requestId);admitted=true;signal.throwIfAborted();
      res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','X-Accel-Buffering':'no'});res.flushHeaders();
      let step=0;
      const paid=async args=>{
        signal.throwIfAborted();if(!available()) throw new AgentError(503,'unavailable');
        const bytes=Buffer.byteLength(JSON.stringify({messages:args.messages,tools:args.tools}));
        if(bytes>48000) throw new AgentError(400,'context_limit');
        // Extra allowance covers provider wire framing and the language suffix.
        const amount=bytes+4096+1024, reservation=await guard.reserve(requestId,amount);
        signal.throwIfAborted();emit('status',{phase:'model_started',step:++step});
        const result=await complete(args);signal.throwIfAborted();
        const usage=result.usage;
        const valid=Number.isSafeInteger(usage?.prompt_tokens) && usage.prompt_tokens>=0 && Number.isSafeInteger(usage?.completion_tokens) && usage.completion_tokens>=0 && usage.completion_tokens<=1024 && usage.total_tokens===usage.prompt_tokens+usage.completion_tokens;
        await guard.reconcile(reservation,valid?usage.total_tokens:undefined);signal.throwIfAborted();
        emit('status',{phase:'model_completed',step});return result;
      };
      const emittedSources=new Set();
      const answer=await runContentAgent({...input,history:session.history,corpus,complete:paid,signal,onEvent:event=>{
        if(event.type==='answer_delta') {
          for(const source of event.sources)if(!emittedSources.has(source.id)){emit('source',{source});emittedSources.add(source.id);}
          partial=true;emit('answer_delta',{text:event.text,sourceIds:event.sources.map(source=>source.id)});
        }
        if(event.type==='status') {const {type,...data}=event;emit(type,data);}
        if(event.type==='block') {partial=true;emit('block',{block:{...event.block,id:`${requestId}:${event.block.id}`}});}
      }});
      signal.throwIfAborted();
      for(const source of answer.sources)if(!emittedSources.has(source.id))emit('source',{source});
      partial=true;emit('answer',{text:answer.text,sourceIds:answer.sources.map(s=>s.id),revision:answer.revision});
      await guard.finish(requestId,[{role:'user',content:userContext},{role:'assistant',content:answer.text.slice(0,4000)}]);admitted=false;
      emit('done',{outcome:'complete'});res.end();
    } catch(error) {
      if(!res.destroyed) {
        const code=error instanceof AgentError?error.code:signal.aborted?'interrupted':'unavailable';
        if(res.headersSent) {if(!signal.aborted) emit('error',{code,partial});res.end();}
        else json(error instanceof AgentError?error.status:503,{error:{code}});
      }
    } finally {clearTimeout(timer);if(admitted) {try{await guard.finish(requestId);}catch{/* lease expires; no further paid calls */}}}
  });
  server.requestTimeout=10000;server.headersTimeout=10000;
  return server;
}
