import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readProviderStream } from '../server/agent-provider-stream.mjs';
import { runContentAgent } from '../server/content-agent.mjs';
const frame=value=>new TextEncoder().encode('data: '+(typeof value==='string'?value:JSON.stringify(value))+'\n\n');
const chunk=(content,finish=null)=>({choices:[{index:0,delta:{content},finish_reason:finish}]});
test('provider emits decoded Unicode answer text before upstream completion',async()=>{
  let channel;const response=new Response(new ReadableStream({start(controller){channel=controller;}}),{headers:{'Content-Type':'text/event-stream'}});
  const seen=[];let reveal;const revealed=new Promise(resolve=>reveal=resolve);
  const complete=readProviderStream(response,{onText:(text,ids)=>{seen.push({text,ids});reveal();}});
  channel.enqueue(frame(chunk('{"sourceIds":["s"],"text":"你')));
  await revealed;assert.equal(seen[0].text,'你'); // EOF has not arrived.
  channel.enqueue(frame(chunk('好\\n\\uD83D')));
  channel.enqueue(frame(chunk('\\uDE00"}')));
  channel.enqueue(frame({...chunk('', 'stop'),usage:{prompt_tokens:12,completion_tokens:9,total_tokens:21}}));
  channel.enqueue(frame('[DONE]'));channel.close();
  const result=await complete;
  assert.equal(seen.map(item=>item.text).join(''),'你好\n😀');assert.equal(result.text,'你好\n😀');assert.equal(result.usage.total_tokens,21);
});
test('fragmented tool arguments accumulate without being shown as answer text',async()=>{
  const chunks=[{choices:[{index:0,delta:{tool_calls:[{index:0,id:'r',type:'function',function:{name:'read_content',arguments:'{"id":'}}]},finish_reason:null}]},{choices:[{index:0,delta:{tool_calls:[{index:0,function:{arguments:'"doc"}'}}]},finish_reason:'tool_calls'}]}];
  const bytes=chunks.map(value=>new TextDecoder().decode(frame(value))).join('')+'data: [DONE]\n\n';
  const result=await readProviderStream(new Response(bytes,{headers:{'Content-Type':'text/event-stream'}}),{onText:()=>assert.fail('Tool JSON must stay private')});
  assert.deepEqual(result.toolCalls,[{id:'r',name:'read_content',arguments:{id:'doc'}}]);
});
test('truncated and length-limited streams fail instead of becoming completed answers',async()=>{
  for(const ending of ['',new TextDecoder().decode(frame(chunk('', 'length')))+'data: [DONE]\n\n']) {
    const body=new TextDecoder().decode(frame(chunk('{"sourceIds":[],"text":"hi"}')))+ending;
    await assert.rejects(readProviderStream(new Response(body,{headers:{'Content-Type':'text/event-stream'}})));
  }
});
test('agent blocks streaming prose until its citations have been read',async()=>{
  const corpus={schemaVersion:1,revision:'t',documents:[]},events=[];
  await assert.rejects(runContentAgent({question:'x',corpus,onEvent:event=>events.push(event),complete:async({onText})=>{onText('unsupported',['not-read']);return {text:'unsupported',sourceIds:['not-read']};}}),/evidence/);
  assert.equal(events.length,0);
});

test('duplicate citations use the same canonical list in streamed and final answers',async()=>{
  let round=0;const events=[];
  const result=await runContentAgent({question:'Introduce Yuxin',corpus:{schemaVersion:1,revision:'t',documents:[]},onEvent:event=>events.push(event),complete:async({onText})=>{
    if(++round===1)return {toolCalls:[{id:'p',name:'read_profile',arguments:{id:'profile'}}]};
    onText('A biography.',['profile:profile','profile:profile']);
    return {text:'A biography.',sourceIds:['profile:profile','profile:profile']};
  }});
  assert.deepEqual(events.find(event=>event.type==='answer_delta').sources.map(source=>source.id),['profile:profile']);
  assert.deepEqual(result.sources.map(source=>source.id),['profile:profile']);
});
