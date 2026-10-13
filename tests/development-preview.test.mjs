import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PassThrough} from 'node:stream';
import {EventEmitter,once} from 'node:events';
import {request} from 'node:http';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createDevelopmentStream,readDevelopmentStreamInput,parseDevelopmentContext} from '../server/development-stream.mjs';
import {createDevelopmentPreview} from '../scripts/preview-agent-development.mjs';
import {consumeAgentStream} from '../src/assets/agent-stream.js';

test('operator stream is accepted by the real browser parser and deduplicates sources',async()=>{
 let wire='';const out=createDevelopmentStream(text=>{wire+=text;},'test');
 const source={id:'s',label:'Source',url:'/notes/test/'};
 out.event({type:'status',phase:'model_started'});
 out.event({type:'answer_delta',text:'A supported answer.',sources:[source]});
 out.complete({text:'A supported answer.',sources:[source],revision:'r'});
 const events=[];await consumeAgentStream(new Response(wire).body,e=>events.push(e));
 assert.deepEqual(events.map(e=>e.type),['status','source','answer_delta','answer','done']);
});
test('operator stdin accepts one bounded line and aborts upon disconnect',async()=>{
 const input=new PassThrough(),controller=new AbortController();
 const pending=readDevelopmentStreamInput(input,controller);
 input.write('[{"question":"hi"}]\n');
 assert.equal(await pending,'[{"question":"hi"}]');assert.equal(controller.signal.aborted,false);
 input.end();await once(input,'end');assert.equal(controller.signal.aborted,true);
});
test('operator stdin rejects oversize or multiple requests',async()=>{
 for(const raw of ['x'.repeat(8193),'[]\n[]\n']) {
  const input=new PassThrough(),controller=new AbortController();
  const pending=readDevelopmentStreamInput(input,controller);input.end(raw);
  await assert.rejects(pending);assert.equal(controller.signal.aborted,true);
 }
});
test('private context envelopes accept bounded alternating exchanges, never system messages',()=>{
 const value={turns:[{question:'Follow up',language:'en'}],history:[{role:'user',content:'Question'},{role:'assistant',content:'Answer'}]};
 assert.deepEqual(parseDevelopmentContext(JSON.stringify(value)),value);
 for(const history of [[{role:'system',content:'Instruction'}],value.history.slice(0,1),[{role:'user',content:'q'},{role:'assistant',content:'x'.repeat(4001)}],Array.from({length:42},(_,i)=>({role:i%2?'assistant':'user',content:'x'}))])assert.throws(()=>parseDevelopmentContext(JSON.stringify({...value,history})));
 assert.throws(()=>parseDevelopmentContext(JSON.stringify({...value,extra:true})));
});

test('private browser follow-ups remember only completed server output, reset it, and reject browser-supplied history',async()=>{
 let child,input,launches=0;
 const server=createDevelopmentPreview({root:tmpdir(),token:'operator',launch:()=>{
   launches++;child=new EventEmitter();child.stdin=new PassThrough();child.stdout=new PassThrough();child.stderr=new PassThrough();
   child.stdin.on('data',data=>{input=JSON.parse(data.toString());});
   child.kill=()=>child.emit('close',null);return child;
 }});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
 const headers={'Content-Type':'application/json',Origin:origin,'X-Development-Preview':'operator'};
 const body=JSON.stringify({question:'Explain the second step',language:'en'});
 const source={id:'s',label:'Source',url:'/notes/test/'};
 const block={id:'b',type:'concept_flow',title:'Mechanism',interpretation:true,items:[{title:'First',description:'First step',source},{title:'Second',description:'Second step',source}]};
 async function run(wire,code=0) {
   const response=await fetch(origin+'/run',{method:'POST',headers,body});assert.equal(response.status,200);
   const saved=input;child.stdout.write(wire);child.stdout.end();child.emit('close',code);await response.text();return saved;
 }
 try {
   const forged=await fetch(origin+'/run',{method:'POST',headers,body:JSON.stringify({question:'q',language:'en',history:[]})});
   assert.equal(forged.status,400);await forged.text();assert.equal(launches,0);
   let wire='';const out=createDevelopmentStream(text=>{wire+=text;},'first');
   out.event({type:'block',block});out.complete({text:'Two steps.',sources:[source],revision:'r'});
   assert.deepEqual((await run(wire)).history,[]);
   // The second stream ends without done: its partial text must not enter memory.
   const second=await run(wire.replace(/id: first:4[\s\S]*/,''));
   assert.equal(second.history.length,2);
   const memory=JSON.parse(second.history[1].content);assert.equal(memory.visuals[0].items[1].title,'Second');assert.deepEqual(memory.sourceIds,['s']);
   assert.equal((await run('invalid stream')).history.length,2);
   assert.equal((await run(wire,1)).history.length,2);
   assert.equal((await run('invalid stream')).history.length,2);
   const refusedReset=await fetch(origin+'/reset',{method:'POST',headers:{...headers,Origin:'https://other.example'},body:'{}'});
   assert.equal(refusedReset.status,403);await refusedReset.text();
   assert.equal((await run('invalid stream')).history.length,2);
   const reset=await fetch(origin+'/reset',{method:'POST',headers,body:'{}'});assert.equal(reset.status,204);
   assert.deepEqual((await run('invalid stream')).history,[]);
   for(let i=0;i<22;i++)assert.equal((await run(wire)).history.length,Math.min(i*2,40));
 } finally {server.closeAllConnections();await new Promise(r=>server.close(r));}
});
test('preview requires the local host, origin and ephemeral token before launching any SSH worker',async()=>{
 const root=await mkdtemp(join(tmpdir(),'agent-preview-'));await mkdir(join(root,'_site/zh/chat'),{recursive:true});
 await writeFile(join(root,'_site/zh/chat/index.html'),'<head></head><body></body>');
 let launches=0,child;
 const server=createDevelopmentPreview({root,token:'operator',launch:()=>{
  launches++;child=new EventEmitter();child.stdin=new PassThrough();child.stdout=new PassThrough();child.stderr=new PassThrough();child.kill=()=>child.emit('close',0);child.stdin.on('finish',()=>child.emit('close',0));return child;
 }});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
 const headers={'Content-Type':'application/json',Origin:origin,'X-Development-Preview':'operator'};
 const body=JSON.stringify({question:'Hello',language:'en'});
 try {
  const source=await fetch(origin+'/notes/example/',{redirect:'manual'});
  assert.equal(source.status,302);assert.equal(source.headers.get('location'),'https://houx15.github.io/notes/example/');await source.text();
  for(const patch of [{Origin:'https://other.example'},{'X-Development-Preview':'wrong'}]) {
   const result=await fetch(origin+'/run',{method:'POST',headers:{...headers,...patch},body});assert.equal(result.status,403);await result.text();
  }
  const hostStatus=await new Promise((resolve,reject)=>{const req=request(origin,{headers:{Host:'other.example'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);req.end();});
  assert.equal(hostStatus,403);assert.equal(launches,0);
  const controller=new AbortController();
  const result=await fetch(origin+'/run',{method:'POST',headers,body,signal:controller.signal});
  assert.equal(result.status,200);assert.equal(launches,1);
  const busy=await fetch(origin+'/run',{method:'POST',headers,body});assert.equal(busy.status,409);await busy.text();
  const ended=once(child.stdin,'finish');controller.abort();await ended;
  assert.equal(child.stdin.writableEnded,true);
  child.emit('close',0);
 } finally {server.closeAllConnections();await new Promise(r=>server.close(r));await rm(root,{recursive:true,force:true});}
});

test('actual agent social action survives the private SSE bridge and browser parser',async()=>{
 const {runContentAgent}=await import('../server/content-agent.mjs');
 let wire='';const out=createDevelopmentStream(text=>{wire+=text;},'social');
 const answer=await runContentAgent({question:'Who are you?',language:'en',corpus:{schemaVersion:1,revision:'social',documents:[]},complete:async()=>({toolCalls:[{id:'identity',name:'reply_conversationally',arguments:{reason:'identity'}}]}),onEvent:e=>out.event(e)});
 out.complete(answer);const events=[];
 await consumeAgentStream(new Response(wire).body,e=>events.push(e));
 assert.deepEqual(events.map(e=>e.type),['answer','done']);
 assert.equal(events[0].text,answer.text);
});
