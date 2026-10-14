import { test } from 'node:test';
import assert from 'node:assert/strict';
import { consumeAgentStream, createAgentClient, validateAgentBlock } from '../src/assets/agent-stream.js';

function encode(events,crlf=false) {
  return events.map((item,i)=>{const event={version:2,requestId:'request-1',id:`request-1:${i}`, ...item};return `id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;}).join('').replace(/\n/g,crlf?'\r\n':'\n');
}
function stream(text,width=1) {
  const bytes=new TextEncoder().encode(text);let i=0;
  return new ReadableStream({pull(controller){if(i>=bytes.length)return controller.close();controller.enqueue(bytes.slice(i,i+width));i+=width;}});
}
const complete=[{type:'status',phase:'tool_started',tool:'read_content'},
  {type:'source',source:{id:'s1',label:'原文',url:'/notes/test/#section-原文'}},
  {type:'answer',text:'有依据的回答。',sourceIds:['s1'],revision:'r1'},{type:'done',outcome:'complete'}];

test('agent stream preserves UTF-8 and CRLF boundaries and validates sources before answers',async()=>{
  for(const width of [1,3,29,1024]) {const events=[];await consumeAgentStream(stream(encode(complete,true),width),event=>events.push(event));assert.equal(events[2].text,'有依据的回答。');assert.equal(events.length,4);}
});
test('agent stream rejects missing sources, truncated responses and events after completion',async()=>{
  await assert.rejects(consumeAgentStream(stream(encode(complete.filter(e=>e.type!=='source'))),()=>{}),/invalid_response/);
  await assert.rejects(consumeAgentStream(stream(encode(complete.slice(0,-1))),()=>{}),/interrupted/);
  await assert.rejects(consumeAgentStream(stream(encode([...complete,{type:'status',phase:'model_started'}])),()=>{}),/invalid_response/);
});
test('blocks cannot execute HTML or link to external endpoints; partial errors remain failures',async()=>{
  const block={id:'b',type:'post_cards',items:[{id:'d',title:'<img onerror=evil>',summary:'text',url:'https://attacker.test',date:'2026-10-12',type:'notes'}]};
  assert.throws(()=>validateAgentBlock(block),/invalid_response/);
  block.items[0].url='/notes/test/';assert.equal(validateAgentBlock(block).items[0].title,'<img onerror=evil>'); // Renderer must use textContent.
  const events=[];await assert.rejects(consumeAgentStream(stream(encode([{type:'block',block},{type:'error',code:'unavailable',partial:true}])),event=>events.push(event)),/unavailable/);
  assert.deepEqual(events.map(event=>event.type),['block','error']);
});
test('session bearer stays in headers, credentials are omitted, and requests are never retried',async()=>{
  const requests=[];const fetchImpl=async(url,options)=>{requests.push({url,options});if(url.endsWith('/sessions'))return Response.json({sessionToken:'test-token',expiresAt:Date.now()+60000});return new Response(stream(encode(complete)),{headers:{'content-type':'text/event-stream'}});};
  const client=createAgentClient('https://api.example.test',fetchImpl);
  await client.openSession('test-challenge');await client.ask({question:'test',language:'en'});
  assert.equal(requests.length,2);assert.equal(requests[1].options.headers.Authorization,'Bearer test-token');
  assert.equal(requests[1].options.credentials,'omit');assert.ok(!requests[1].url.includes('test-token'));assert.ok(!requests[1].options.body.includes('test-token'));
  client.clearSession();await assert.rejects(client.ask({question:'test',language:'en'}),/invalid_session/);assert.equal(requests.length,2);
});

test('incremental answers require cited evidence and cannot change text at finalization',async()=>{
  const events=[complete[1],{type:'answer_delta',text:'有依据',sourceIds:['s1']},...complete.slice(2)];
  const seen=[];await consumeAgentStream(stream(encode(events)),event=>seen.push(event));
  assert.equal(seen[1].text,'有依据');
  await assert.rejects(consumeAgentStream(stream(encode(events.slice(1))),()=>{}),/invalid_response/);
  await assert.rejects(consumeAgentStream(stream(encode([complete[1],{type:'answer_delta',text:'不一致',sourceIds:['s1']},...complete.slice(2)])),()=>{}),/invalid_response/);
});

const tabStorage=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k),data};};
test('navigation restores only the scoped session bearer, not client model messages',async()=>{
 const sessionStore=tabStorage(),requests=[];
 const backend=async(url,options)=>{requests.push({url,options});return url.endsWith('/sessions')?Response.json({sessionToken:'short-lived-session',expiresAt:Date.now()+60000}):new Response(stream(encode(complete)),{headers:{'content-type':'text/event-stream'}});};
 const first=createAgentClient('https://api.example.test',backend,{sessionStore});await first.openSession('challenge');
 const afterNavigation=createAgentClient('https://api.example.test',backend,{sessionStore});assert.equal(afterNavigation.hasSession(),true);
 await afterNavigation.ask({question:'Continue',language:'en'});
 assert.equal(requests.length,2);assert.equal(requests[1].options.headers.Authorization,'Bearer short-lived-session');assert.equal(JSON.parse(requests[1].options.body).history,undefined);
 assert.equal(createAgentClient('https://other.example.test',backend,{sessionStore}).hasSession(),false);
 afterNavigation.clearSession();assert.equal(createAgentClient('https://api.example.test',backend,{sessionStore}).hasSession(),false);
});
test('expired, malformed, revoked and inaccessible stored sessions fail safely',async()=>{
 const sessionStore=tabStorage(),key='portfolio-agent-session:v1:https://api.example.test';
 for(const raw of ['{','x'.repeat(1001),JSON.stringify({version:1,token:'expired',expiresAt:Date.now()-1}),JSON.stringify({version:1,token:'too-long-lived',expiresAt:Date.now()+86400000})]) {
  sessionStore.setItem(key,raw);assert.equal(createAgentClient('https://api.example.test',fetch,{sessionStore}).hasSession(),false);assert.equal(sessionStore.getItem(key),null);
 }
 sessionStore.setItem(key,JSON.stringify({version:1,token:'revoked',expiresAt:Date.now()+60000}));
 const revoked=createAgentClient('https://api.example.test',async()=>Response.json({error:{code:'invalid_session'}},{status:401}),{sessionStore});
 await assert.rejects(revoked.ask({question:'x',language:'en'}),/invalid_session/);assert.equal(sessionStore.getItem(key),null);
 const unavailable={getItem(){throw new Error('denied');},setItem(){throw new Error('denied');},removeItem(){throw new Error('denied');}};
 const memory=createAgentClient('https://api.example.test',async()=>Response.json({sessionToken:'memory-session',expiresAt:Date.now()+60000}),{sessionStore:unavailable});await memory.openSession('challenge');assert.equal(memory.hasSession(),true);
});

test('concept flow validation rejects executable links and missing interpretation disclosure',()=>{
 const block={id:'b',type:'concept_flow',title:'Mechanism',interpretation:true,items:[{title:'A',description:'Step',source:{id:'s',label:'Source',url:'/notes/test/'}},{title:'B',description:'Step',source:{id:'s',label:'Source',url:'/notes/test/'}}]};
 assert.equal(validateAgentBlock(block),block);
 for(const quote of ['',false,{},'x'.repeat(401)])assert.throws(()=>validateAgentBlock({...block,items:block.items.map(item=>({...item,quote}))}),/invalid_response/);
 assert.ok(validateAgentBlock({...block,items:block.items.map(item=>({...item,quote:'Exact source words.'}))}));
 assert.throws(()=>validateAgentBlock({...block,interpretation:false}),/invalid_response/);
 block.items[1].source.url='javascript:alert(1)';
 assert.throws(()=>validateAgentBlock(block),/invalid_response/);
});

test('quota reset timestamps survive the stream and malformed metadata is rejected',async()=>{
 const resetsAt=Date.parse('2026-11-01T00:00:00Z'),seen=[];
 await assert.rejects(consumeAgentStream(stream(encode([{type:'error',code:'daily_budget_exhausted',partial:false,resetsAt}])),event=>seen.push(event)),error=>error.message==='daily_budget_exhausted' && error.resetsAt===resetsAt);
 assert.equal(seen[0].resetsAt,resetsAt);
 for(const value of ['tomorrow',-1,1e20])await assert.rejects(consumeAgentStream(stream(encode([{type:'error',code:'daily_budget_exhausted',partial:false,resetsAt:value}]))),/invalid_response/);
});
