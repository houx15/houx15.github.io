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

test('provider tool-call preambles stay private while valid calls and usage are preserved',async()=>{
  const parts=[chunk('I will look that up.'),{choices:[{index:0,delta:{content:' Checking sources.',tool_calls:[{index:0,id:'read',type:'function',function:{name:'read_content',arguments:'{"id":"doc"}'}}]},finish_reason:'tool_calls'}]},{choices:[],usage:{prompt_tokens:10,completion_tokens:20,total_tokens:30}}];
  const body=parts.map(p=>new TextDecoder().decode(frame(p))).join('')+'data: [DONE]\n\n';
  const result=await readProviderStream(new Response(body,{headers:{'Content-Type':'text/event-stream'}}),{onText:()=>assert.fail('Preamble must never become an answer')});
  assert.deepEqual(result.toolCalls,[{id:'read',name:'read_content',arguments:{id:'doc'}}]);assert.equal(result.usage.total_tokens,30);
});

test('tool calls after a streamed structured answer remain invalid',async()=>{
  const parts=[chunk('{"sourceIds":["s"],"text":"Answer'),{choices:[{index:0,delta:{tool_calls:[{index:0,id:'read',function:{name:'read_content',arguments:'{"id":"doc"}'}}]},finish_reason:'tool_calls'}]}];
  const body=parts.map(p=>new TextDecoder().decode(frame(p))).join('')+'data: [DONE]\n\n';
  await assert.rejects(readProviderStream(new Response(body,{headers:{'Content-Type':'text/event-stream'}})),/Mixed result/);
});


test('JSON actions stay private and are accepted only in explicitly enabled tool rounds',async()=>{
 const action={toolCalls:[{id:'read1',name:'read_content',arguments:{id:'doc'}}]};
 const response=value=>new Response(new TextDecoder().decode(frame(chunk(JSON.stringify(value),'stop')))+'data: [DONE]\n\n',{headers:{'Content-Type':'text/event-stream'}});
 assert.deepEqual((await readProviderStream(response(action),{allowJsonTools:true,onText:()=>assert.fail('Action text must stay private')})).toolCalls,action.toolCalls);
 await assert.rejects(readProviderStream(response(action)),/Invalid final/);
 for(const value of [{...action,text:'answer'}, {toolCalls:[]}, {toolCalls:[...action.toolCalls,...action.toolCalls]}, {toolCalls:[{id:'r',name:'read_content',arguments:[]}]}, {toolCalls:[{id:'r',name:'read_content',arguments:{},extra:'x'}]}]) {
   await assert.rejects(readProviderStream(response(value),{allowJsonTools:true}));
 }
});

test('JSON object mode rejects a non-object prefix before EOF and cancels upstream', {timeout:1000},async()=>{
 for(const prefix of ['2016','[','"','true','null','```json']) {
  let channel,cancelled=false;
  const response=new Response(new ReadableStream({start(c){channel=c;},cancel(){cancelled=true;}}),{headers:{'Content-Type':'text/event-stream'}});
  const result=readProviderStream(response,{requireJsonObject:true,onText:()=>assert.fail('Invalid root must remain private')});
  channel.enqueue(frame(chunk(' \n')));channel.enqueue(frame(chunk(prefix)));
  await assert.rejects(result,/Invalid JSON root/);
  assert.equal(cancelled,true); // No finish frame or EOF was supplied.
 }
});
test('JSON object mode tolerates leading whitespace and fragmented valid objects',async()=>{
 const body=[chunk(' \n'),chunk('{'),chunk('"sourceIds":["s"],"text":"Valid"}','stop')].map(p=>new TextDecoder().decode(frame(p))).join('')+'data: [DONE]\n\n';
 const deltas=[];
 const result=await readProviderStream(new Response(body,{headers:{'Content-Type':'text/event-stream'}}),{requireJsonObject:true,onText:text=>deltas.push(text)});
 assert.equal(result.text,'Valid');assert.equal(deltas.join(''),'Valid');
});

test('translation fragments accept a bounded array only in the translation adapter',async()=>{
  const make=(text,sourceIds=[])=>new Response([chunk(JSON.stringify({sourceIds,text})),chunk('','stop'),'[DONE]'].map(x=>new TextDecoder().decode(frame(x))).join(''),{headers:{'Content-Type':'text/event-stream'}});
  const fragments=[{id:'title:0',text:'A translated title'}];
  await assert.rejects(readProviderStream(make(fragments)));
  const result=await readProviderStream(make(fragments),{allowTranslationArray:true});
  assert.deepEqual(JSON.parse(result.text),fragments);
  const echoed=await readProviderStream(make(fragments,['title:0']),{allowTranslationArray:true});assert.deepEqual(echoed.sourceIds,[]);
  await assert.rejects(readProviderStream(make(fragments,['unrecognized']),{allowTranslationArray:true}));
  await assert.rejects(readProviderStream(make([{id:'x',text:'x',extra:'invalid'}]),{allowTranslationArray:true}));
});
