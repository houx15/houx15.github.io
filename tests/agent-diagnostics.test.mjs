import {test} from 'node:test';
import assert from 'node:assert/strict';
import {agentFailureRecord,providerFailureCategory} from '../server/agent-diagnostics.mjs';
test('diagnostics retain failure categories, never arbitrary exception or request text',()=>{
 const privateText='SECRET-question-token-response';
 const record=agentFailureRecord({requestId:privateText,stage:privateText,modelCalls:Infinity,partial:privateText,error:{message:privateText,code:privateText,diagnosticCategory:privateText,stack:privateText}});
 assert.deepEqual(record,{event:'agent_failure',requestId:'unknown',stage:'unknown',modelCalls:0,partial:false,category:'unexpected'});
 assert.ok(!JSON.stringify(record).includes(privateText));
 assert.equal(providerFailureCategory(new SyntaxError(privateText)),'json_parse');
 assert.equal(providerFailureCategory(new Error('Truncated stream')),'truncated_stream');
 assert.equal(providerFailureCategory(new Error(privateText)),'provider_transport');
 assert.equal(agentFailureRecord({error:{message:'Invalid answer evidence'}}).category,'answer_evidence');
 assert.equal(agentFailureRecord({error:{diagnosticCategory:'json_parse'}}).category,'json_parse');
});

test('provider JSON failures expose a fixed diagnostic category, never the invalid response',async()=>{
 const {createModelAgent}=await import('../server/agent-provider.mjs');
 const secret='private-response-content';
 const body='data: '+JSON.stringify({choices:[{index:0,delta:{content:secret},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n';
 const complete=createModelAgent({apiKey:'not-a-real-key',model:'qwen-plus',provider:'bailian',baseURL:'https://dashscope.aliyuncs.com/compatible-mode/v1',fetchImpl:async()=>new Response(body,{headers:{'Content-Type':'text/event-stream'}})});
 await assert.rejects(complete({messages:[{role:'system',content:'test'}],tools:[],signal:new AbortController().signal,language:'en'}),error=>{
   assert.equal(error.code,'invalid_model_response');assert.equal(error.diagnosticCategory,'json_parse');
   assert.ok(!JSON.stringify(error).includes(secret));return true;
 });
});

test('tool-free synthesis omits provider tool definitions',async()=>{
 const {createModelAgent}=await import('../server/agent-provider.mjs');let wire;
 const complete=createModelAgent({apiKey:'not-a-real-key',model:'qwen-plus',provider:'bailian',baseURL:'https://dashscope.aliyuncs.com/compatible-mode/v1',fetchImpl:async(url,options)=>{
   wire=JSON.parse(options.body);
   return new Response('data: '+JSON.stringify({choices:[{index:0,delta:{content:'{"sourceIds":[],"text":"Insufficient evidence"}'},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n',{headers:{'Content-Type':'text/event-stream'}});
 }});
 await complete({messages:[{role:'system',content:'test'}],tools:[],signal:new AbortController().signal,language:'en'});
 assert.equal(wire.tools,undefined);assert.equal(wire.max_tokens,2048);assert.deepEqual(wire.response_format,{type:'json_object'});
});

test('Bailian JSON actions preserve tool selection, schemas, history and streaming',async()=>{
 const {createModelAgent}=await import('../server/agent-provider.mjs');let wire;
 const complete=createModelAgent({apiKey:'not-a-real-key',model:'qwen-plus',provider:'bailian',baseURL:'https://dashscope.aliyuncs.com/compatible-mode/v1',fetchImpl:async(url,options)=>{
   wire=JSON.parse(options.body);
   return new Response('data: '+JSON.stringify({choices:[{index:0,delta:{content:JSON.stringify({toolCalls:[{id:'p',name:'read_profile',arguments:{}}]})},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n',{headers:{'Content-Type':'text/event-stream'}});
 }});
 const result=await complete({messages:[{role:'system',content:'test'}],tools:[{name:'read_profile',description:'Read',parameters:{type:'object',properties:{}}}],signal:new AbortController().signal,language:'en'});
 assert.deepEqual(wire.response_format,{type:'json_object'});assert.equal(wire.stream,true);assert.equal(wire.enable_thinking,false);assert.equal(wire.tools,undefined);assert.match(wire.messages[0].content,/read_profile/);assert.equal(result.toolCalls[0].name,'read_profile');
});


test('evidence validation failures remain identifiable across the provider stream boundary',async()=>{
 const {createModelAgent}=await import('../server/agent-provider.mjs');
 const failure=new Error('Invalid answer evidence');
 const body='data: '+JSON.stringify({choices:[{index:0,delta:{content:'{"sourceIds":["unread"],"text":"Unsupported claim"}'},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n';
 const complete=createModelAgent({apiKey:'not-a-real-key',model:'qwen-plus',provider:'bailian',baseURL:'https://dashscope.aliyuncs.com/compatible-mode/v1',fetchImpl:async()=>new Response(body,{headers:{'Content-Type':'text/event-stream'}})});
 await assert.rejects(complete({messages:[{role:'system',content:'test'}],tools:[],signal:new AbortController().signal,language:'en',onText:()=>{throw failure;}}),error=>{
   assert.equal(error,failure);assert.equal(agentFailureRecord({error}).category,'answer_evidence');return true;
 });
});

test('JSON-action provider executes source reads before emitting an evidenced streamed answer',async()=>{
 const {createModelAgent}=await import('../server/agent-provider.mjs');
 const {runContentAgent}=await import('../server/content-agent.mjs');
 const events=[],requests=[];
 const complete=createModelAgent({apiKey:'not-a-real-key',model:'qwen-plus',provider:'bailian',baseURL:'https://dashscope.aliyuncs.com/compatible-mode/v1',fetchImpl:async(url,options)=>{
   const wire=JSON.parse(options.body);requests.push(wire);
   const content=requests.length===1?JSON.stringify({toolCalls:[{id:'p',name:'read_profile',arguments:{id:'profile'}}]}):JSON.stringify({sourceIds:['profile:profile'],text:'A sourced introduction.'});
   return new Response('data: '+JSON.stringify({choices:[{index:0,delta:{content},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n',{headers:{'Content-Type':'text/event-stream'}});
 }});
 const result=await runContentAgent({question:'Introduce Yuxin',corpus:{schemaVersion:1,revision:'t',documents:[]},complete,signal:new AbortController().signal,onEvent:event=>events.push(event)});
 assert.equal(result.text,'A sourced introduction.');assert.equal(requests.length,2);
 const action=requests[1].messages.find(message=>message.role==='assistant');
 assert.equal(JSON.parse(action.content).toolCalls[0].name,'read_profile');
 const toolResult=JSON.parse(requests[1].messages.at(-1).content);
 assert.equal(toolResult.type,'tool_result');assert.equal(toolResult.callId,'p');assert.equal(JSON.parse(toolResult.data).source.id,'profile:profile');
 assert.ok(events.findIndex(event=>event.phase==='tool_completed')<events.findIndex(event=>event.type==='answer_delta'));
 assert.equal(events.filter(event=>event.type==='answer_delta').map(event=>event.text).join(''),'A sourced introduction.');
});

test('output truncation has a fixed diagnostic category and is never a completed answer',async()=>{
 const {createModelAgent}=await import('../server/agent-provider.mjs');
 const body='data: '+JSON.stringify({choices:[{index:0,delta:{content:'{"sourceIds":[],"text":"cut'},finish_reason:'length'}]})+'\n\ndata: [DONE]\n\n';
 const complete=createModelAgent({apiKey:'not-a-real-key',model:'qwen-plus',provider:'bailian',baseURL:'https://dashscope.aliyuncs.com/compatible-mode/v1',fetchImpl:async()=>new Response(body,{headers:{'Content-Type':'text/event-stream'}})});
 await assert.rejects(complete({messages:[{role:'system',content:'test'}],tools:[],signal:new AbortController().signal,language:'en'}),error=>{
   assert.equal(agentFailureRecord({error}).category,'output_limit');return true;
 });
});
