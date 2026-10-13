import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PassThrough} from 'node:stream';
import {EventEmitter,once} from 'node:events';
import {request} from 'node:http';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createDevelopmentStream,readDevelopmentStreamInput} from '../server/development-stream.mjs';
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
