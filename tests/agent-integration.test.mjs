import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createAgentClient } from '../src/assets/agent-stream.js';
import { createAgentServer } from '../server/agent-http.mjs';
import { MemoryAgentStore, createGuard } from '../server/agent-state.mjs';

test('browser client restores a session after navigation and preserves server-owned follow-up context', async t => {
  const origin='https://houx15.github.io';
  const corpus={schemaVersion:1,revision:'fixture',documents:[{id:'notes/cache/en',canonicalId:'notes/cache',title:'KV cache',summary:'Attention',type:'notes',language:'en',date:'2026-10-01',url:'/notes/cache/',tags:[],sections:[{id:'notes/cache/en:0',heading:'Evidence',text:'Keys and values are cached.',url:'/notes/cache/#evidence'}]}]};
  corpus.documents.push({...corpus.documents[0],id:'notes/attention/en',canonicalId:'notes/attention',title:'Attention',url:'/notes/attention/',sections:[]});
  const seen=[];
  const complete=async input=>{
    seen.push(input);
    return seen.length%2
      ? {toolCalls:[{id:'read',name:'read_content',arguments:{id:'notes/cache/en'}},{id:'map',name:'show_reading_map',arguments:{id:'notes/cache/en',sectionIds:['notes/cache/en:0']}}]}
      : {text:'Keys and values are cached.',sourceIds:['notes/cache/en:0']};
  };
  const guard=createGuard({store:new MemoryAgentStore(),secret:'a'.repeat(40),dailyTokens:1000000,enabled:()=>true});
  const server=createAgentServer({origin,corpus,guard,complete,verifyChallenge:async()=>{},enabled:()=>true,production:false});
  server.listen(0,'127.0.0.1'); await once(server,'listening');
  t.after(()=>{server.closeAllConnections();server.close();});
  const saved=new Map(),sessionStore={getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)};
  const makeClient=()=>createAgentClient(`http://localhost:${server.address().port}`, (url,options)=>fetch(url.replace('localhost','127.0.0.1'),{...options,headers:{...options.headers,Origin:origin}}),{sessionStore});
  let client=makeClient();
  await client.openSession('test-challenge'); assert.equal(client.hasSession(),true);
  const events=[];
  await client.ask({question:'Explain this note',language:'en',pageContext:{documentId:'notes/cache/en'}},{onEvent:event=>events.push(event)});
  assert.equal(events.at(-1).type,'done');
  assert.equal(events.find(event=>event.type==='block').block.type,'reading_map');
  assert.equal(events.find(event=>event.type==='block').block.items[0].excerpt,'Keys and values are cached.');
  assert.equal(events.find(event=>event.type==='answer').text,'Keys and values are cached.');
  assert.ok(events.findIndex(event=>event.type==='source')<events.findIndex(event=>event.type==='answer'));
  client=makeClient(); // A newly loaded page has no closure state from the previous page.
  assert.equal(client.hasSession(),true);
  await client.ask({question:'How does the previous note relate to this one?',language:'en',supportsConceptFlow:true,pageContext:{documentId:'notes/attention/en'}});
  assert.ok(seen[2].messages.some(message=>message.role==='assistant' && JSON.parse(message.content || '{}').text==='Keys and values are cached.'));
  const userTurns=seen[2].messages.filter(message=>message.role==='user').map(message=>JSON.parse(message.content));
  assert.deepEqual(userTurns,[
    {question:'Explain this note',language:'en',pageContext:{documentId:'notes/cache/en'}},
    {question:'How does the previous note relate to this one?',language:'en',pageContext:{documentId:'notes/attention/en'}}
  ]);
  assert.ok(!seen[0].tools.some(tool=>tool.name==='show_concept_flow'));
  assert.ok(seen[2].tools.some(tool=>tool.name==='show_concept_flow'));
  client.clearSession();
  await assert.rejects(client.ask({question:'Again',language:'en'}),/invalid_session/);
});

test('failed model calls report only safe diagnostics and a broken logger cannot strand a session',async t=>{
 const origin='https://houx15.github.io',records=[];
 const guard=createGuard({store:new MemoryAgentStore(),secret:'a'.repeat(40),dailyTokens:1000000,enabled:()=>true});
 let calls=0;
 const server=createAgentServer({origin,corpus:{schemaVersion:1,revision:'t',documents:[]},guard,production:false,enabled:()=>true,verifyChallenge:async()=>{},
   complete:async()=>{if(++calls===1)throw new Error('sensitive upstream text');return {text:'No evidence',sourceIds:[]};},
   onDiagnostic:record=>{records.push(record);throw new Error('logger unavailable');}});
 server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>{server.closeAllConnections();server.close();});
 const client=createAgentClient(`http://localhost:${server.address().port}`,(url,options)=>fetch(url.replace('localhost','127.0.0.1'),{...options,headers:{...options.headers,Origin:origin}}));
 await client.openSession('fixture');
 const events=[];
 await assert.rejects(client.ask({question:'private visitor question',language:'en'},{onEvent:e=>events.push(e)}),/unavailable/);
 assert.equal(records.length,1);assert.equal(records[0].requestId,events[0].requestId);assert.equal(records[0].stage,'model');assert.equal(records[0].modelCalls,1);
 assert.ok(!JSON.stringify(records).includes('sensitive'));assert.ok(!JSON.stringify(records).includes('private visitor'));
 await client.ask({question:'Try a different topic',language:'en'});
 assert.equal(calls,3); // The second request gets one bounded uncited-reply correction.
});

test('cross-page follow-up keeps the actual concept step order in server-owned history',async t=>{
 const origin='https://houx15.github.io',seen=[];
 const guard=createGuard({store:new MemoryAgentStore(),secret:'a'.repeat(40),dailyTokens:1000000,enabled:()=>true});
 const complete=async args=>{
   seen.push(args);
   if(seen.length===1)return {toolCalls:[{id:'read',name:'read_profile',arguments:{id:'profile'}},{id:'draw',name:'show_concept_flow',arguments:{title:'Two aspects',labels:['First aspect','Second aspect'],descriptions:['First interpretation','Second interpretation'],sourceIds:['profile:profile','profile:profile']}}]};
   if(seen.length===2)return {text:'Two aspects are shown.',sourceIds:['profile:profile']};
   if(seen.length===3){
     const prior=JSON.parse(args.messages.find(message=>message.role==='assistant').content);
     assert.equal(prior.visuals[0].items[1].title,'Second aspect');assert.equal(prior.visuals[0].items[1].position,2);
     assert.equal(prior.visuals[0].items[1].sourceId,'profile:profile');
     return {toolCalls:[{id:'reread',name:'read_profile',arguments:{id:'profile'}}]};
   }
   return {text:'A freshly sourced explanation.',sourceIds:['profile:profile']};
 };
 const server=createAgentServer({origin,corpus:{schemaVersion:1,revision:'fixture',documents:[]},guard,complete,verifyChallenge:async()=>{},enabled:()=>true,production:false});
 server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>{server.closeAllConnections();server.close();});
 const storage=new Map(),sessionStore={getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
 const client=()=>createAgentClient(`http://localhost:${server.address().port}`,(url,options)=>fetch(url.replace('localhost','127.0.0.1'),{...options,headers:{...options.headers,Origin:origin}}),{sessionStore});
 const first=client();await first.openSession('fixture');await first.ask({question:'Draw two aspects',language:'en',supportsConceptFlow:true});
 const events=[];await client().ask({question:'Explain the second aspect',language:'en',supportsConceptFlow:true},{onEvent:event=>events.push(event)});
 assert.equal(seen.length,4);assert.equal(events.at(-1).type,'done');assert.equal(events.find(event=>event.type==='answer').text,'A freshly sourced explanation.');
});

test('stopping a partial streamed answer aborts work, retains its reservation and allows the next turn', {timeout:5000}, async t=>{
  const origin='https://houx15.github.io',store=new MemoryAgentStore();
  const corpus={schemaVersion:1,revision:'fixture',documents:[]};
  const guard=createGuard({store,secret:'a'.repeat(40),dailyTokens:1000000,monthlyCny:500,rate:2,enabled:()=>true});
  let released;
  const cleanup=new Promise(resolve=>released=resolve),finish=guard.finish;
  guard.finish=async(...args)=>{const result=await finish(...args);released();return result;};
  let calls=0,aborted=false;
  const complete=async({signal,onText})=>{
    calls++;
    if(calls%2)return {toolCalls:[{id:'read',name:'read_profile',arguments:{id:'startup',language:'en'}}]};
    if(calls===2) {
      const stopped=new Promise((resolve,reject)=>signal.addEventListener('abort',()=>{aborted=true;reject(signal.reason);},{once:true}));
      onText('She founded a company. ',['profile:startup']);
      await stopped;
    }
    return {text:'She worked as CTO.',sourceIds:['profile:startup']};
  };
  const server=createAgentServer({origin,corpus,guard,complete,verifyChallenge:async()=>{},enabled:()=>true,production:false});
  server.listen(0,'127.0.0.1');await once(server,'listening');
  t.after(()=>{server.closeAllConnections();server.close();});
  const client=createAgentClient(`http://localhost:${server.address().port}`,(url,options)=>fetch(url.replace('localhost','127.0.0.1'),{...options,headers:{...options.headers,Origin:origin}}));
  await client.openSession('local-cancellation-fixture');
  const controller=new AbortController(),events=[];
  let reservedAtStop;
  await assert.rejects(client.ask({question:'Tell me about her startup',language:'en'},{signal:controller.signal,onEvent:event=>{
    events.push(event);
    if(event.type==='answer_delta'){reservedAtStop=store.state.spent;controller.abort();}
  }}));
  await cleanup;
  assert.equal(aborted,true);assert.equal(calls,2);
  assert.equal(events.find(e=>e.type==='answer_delta').text,'She founded a company.');
  assert.ok(!events.some(e=>e.type==='done'));
  assert.equal(Object.keys(store.state.leases).length,0);
  assert.ok(reservedAtStop>0);assert.equal(store.state.spent,reservedAtStop);
  assert.equal(Object.values(store.state.sessions)[0].history.length,0);
  assert.equal(client.hasSession(),true);
  const next=[];
  await client.ask({question:'What was her role?',language:'en'},{onEvent:e=>next.push(e)});
  assert.equal(next.at(-1).type,'done');assert.equal(calls,4);
  assert.equal(Object.values(store.state.sessions)[0].history.length,2);
});
