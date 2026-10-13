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
