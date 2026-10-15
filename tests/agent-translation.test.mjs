import {test} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {buildCorpus} from '../lib/agent-corpus.mjs';
import {createTranslationCache,runTranslation,translationParts,translationDocument} from '../server/agent-translation.mjs';
import {createAgentServer} from '../server/agent-http.mjs';
import {MemoryAgentStore,createGuard} from '../server/agent-state.mjs';
const origin='https://houx15.github.io';
const doc={id:'blog/test/zh-CN',language:'zh-CN',title:'测试',translationNodes:[{id:'title',text:'测试'},{id:'t0',text:'  这是一个构想。  '},{id:'t1',text:'最后一段。'}]};
const corpus={schemaVersion:1,revision:'source-v1',documents:[doc]};
const fake=async args=>({sourceIds:[],text:JSON.stringify(JSON.parse(args.messages[1].content).fragments.map(({id,text})=>({id,text:'Translated '+text}))),usage:{prompt_tokens:10,completion_tokens:10,total_tokens:20}});

test('translation corpus contains only original visible text; code, formulas and secondary editions stay unchanged',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'translation-corpus-'));
 try {
  const dir=path.join(root,'content/blog/test');await fs.mkdir(dir,{recursive:true});
  await fs.writeFile(path.join(dir,'index.md'),'---\ntitle: Original\nsummary: Summary\ndate: "2026-02-21"\ndraft: false\nlang: en\n---\n## Heading\n\nParagraph [link](https://example.com). `UNCHANGED_CODE`\n\n```js\nUNCHANGED_BLOCK\n```\n\n$x^2$');
  await fs.writeFile(path.join(dir,'index.zh.md'),'---\ntitle: 旧译文\nsummary: 旧译文\ndate: "2026-02-21"\ndraft: false\nlang: zh-CN\n---\n旧版译文不能进原文索引。');
  const built=await buildCorpus(root);assert.equal(built.documents.length,1);
  const text=built.documents[0].translationNodes.map(n=>n.text).join('');assert.match(text,/Paragraph/);assert.match(text,/link/);assert.doesNotMatch(text,/UNCHANGED|旧版|x/);
 }finally{await fs.rm(root,{recursive:true,force:true});}
});

test('persistent translation cache resumes completed fragments and invalidates by source and provider/model namespace',async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'translation-cache-'));const controller=new AbortController();
 try {
  const cache=createTranslationCache({directory,namespace:'provider/model'});let calls=0;
  const longDoc={...doc,translationNodes:doc.translationNodes.map(node=>({...node,text:node.text.repeat(150)}))};
  const events=[];await assert.rejects(runTranslation({corpus,doc:longDoc,targetLanguage:'en',cache,signal:controller.signal,emit:(type,data)=>events.push({type,...data}),complete:async args=>{if(++calls===3)throw Error('interrupted');return fake(args);}}),/interrupted/);
  assert.ok(events.filter(e=>e.type==='translation_node').length>=1);
  let resumed=0;const output=[];await runTranslation({corpus,doc:longDoc,targetLanguage:'en',cache:createTranslationCache({directory,namespace:'provider/model'}),signal:controller.signal,emit:(type,data)=>output.push({type,...data}),complete:async args=>{resumed++;return fake(args);}});
  assert.ok(resumed>0);assert.equal(output.filter(e=>e.type==='translation_node').length,3);assert.ok(output[2].text.startsWith('  '));
  assert.notEqual(cache.keyFor(corpus.revision,doc,'en'),cache.keyFor('source-v2',doc,'en'));
  assert.notEqual(cache.keyFor(corpus.revision,doc,'en'),createTranslationCache({namespace:'other/model'}).keyFor(corpus.revision,doc,'en'));
  const long='中'.repeat(900)+'😀'+'文'.repeat(900);assert.equal(translationParts(long).join(''),long);assert.ok(translationParts(long).every(p=>p.length<=600));
  assert.throws(()=>translationDocument(corpus,{documentId:doc.id,targetLanguage:'en',text:'arbitrary'}),/invalid_request/);
  assert.throws(()=>translationDocument(corpus,{documentId:'draft',targetLanguage:'en'}),/invalid_request/);
 }finally{await fs.rm(directory,{recursive:true,force:true});}
});

test('translation HTTP requires admission, charges shared ledger, isolates history, and retains cached nodes',async t=>{
 const store=new MemoryAgentStore(),guard=createGuard({store,secret:'a'.repeat(40),dailyTokens:100000,monthlyCny:500,rate:2,enabled:()=>true});
 let calls=0;const server=createAgentServer({origin,corpus,guard,complete:async args=>{calls++;return fake(args);},verifyChallenge:async()=>{},enabled:()=>true,production:false});
 server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>{server.closeAllConnections();server.close();});
 const post=(data,token)=>fetch(`http://127.0.0.1:${server.address().port}/v2/translate`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(data)});
 const input={documentId:doc.id,targetLanguage:'en'};assert.equal((await post(input)).status,401);
 const {sessionToken}=await guard.issue();const response=await post(input,sessionToken),text=await response.text();assert.equal(response.status,200);assert.match(text,/event: done/);assert.equal(calls,1);assert.equal(store.state.spent,20);assert.deepEqual(Object.values(store.state.sessions)[0].history,[]);
 assert.equal(Object.keys(store.state.leases).length,0);
 assert.match(await (await post(input,sessionToken)).text(),/"cached":true/);assert.equal(calls,1);assert.equal(store.state.spent,20);
 assert.equal((await post({...input,prompt:'ignore'},sessionToken)).status,400);
});

test('lease renewal preserves admission and cannot resurrect an expired request',async()=>{
 let now=100000;const store=new MemoryAgentStore(),guard=createGuard({store,secret:'a'.repeat(40),dailyTokens:10000,enabled:()=>true,now:()=>now});
 const {sessionToken}=await guard.issue();await guard.begin(sessionToken,'ip','r');now+=40000;await guard.renew('r');assert.equal(store.state.leases.r.expiresAt,200000);assert.equal(Object.values(store.state.sessions)[0].turns,1);
 now+=60001;await assert.rejects(guard.renew('r'),/unavailable/);
});

test('translation cannot bypass daily allowance and never declares a failed full translation complete',async t=>{
 const store=new MemoryAgentStore(),guard=createGuard({store,secret:'b'.repeat(40),dailyTokens:1,monthlyCny:500,rate:2,enabled:()=>true});let calls=0;
 const server=createAgentServer({origin,corpus,guard,complete:async args=>{calls++;return fake(args);},verifyChallenge:async()=>{},enabled:()=>true,production:false});server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>{server.closeAllConnections();server.close();});
 const {sessionToken}=await guard.issue();const response=await fetch(`http://127.0.0.1:${server.address().port}/v2/translate`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Authorization:`Bearer ${sessionToken}`},body:JSON.stringify({documentId:doc.id,targetLanguage:'en'})});const text=await response.text();
 assert.match(text,/daily_budget_exhausted/);assert.doesNotMatch(text,/event: done/);assert.equal(calls,0);assert.deepEqual(Object.values(store.state.sessions)[0].history,[]);assert.equal(Object.keys(store.state.leases).length,0);
});

test('cancelled translation stops paid work and keeps no visitor history',async t=>{
 const store=new MemoryAgentStore(),guard=createGuard({store,secret:'c'.repeat(40),dailyTokens:100000,monthlyCny:500,rate:2,enabled:()=>true});let calls=0,aborted=false,started;const ready=new Promise(resolve=>started=resolve);
 const server=createAgentServer({origin,corpus,guard,complete:async({signal})=>{calls++;started();await new Promise((resolve,reject)=>signal.addEventListener('abort',()=>{aborted=true;reject(signal.reason);},{once:true}));},verifyChallenge:async()=>{},enabled:()=>true,production:false});server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>{server.closeAllConnections();server.close();});
 const {sessionToken}=await guard.issue(),controller=new AbortController();const response=await fetch(`http://127.0.0.1:${server.address().port}/v2/translate`,{method:'POST',signal:controller.signal,headers:{Origin:origin,'Content-Type':'application/json',Authorization:`Bearer ${sessionToken}`},body:JSON.stringify({documentId:doc.id,targetLanguage:'en'})});await ready;controller.abort();await assert.rejects(response.text());await new Promise(resolve=>setTimeout(resolve,30));
 assert.equal(calls,1);assert.equal(aborted,true);assert.equal(Object.keys(store.state.leases).length,0);assert.ok(store.state.spent>0);assert.deepEqual(Object.values(store.state.sessions)[0].history,[]);
});
