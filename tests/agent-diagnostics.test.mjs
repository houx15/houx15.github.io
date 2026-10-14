import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
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

test('agent completion failures distinguish deadline, cancellation and exhausted execution budget',()=>{
 for(const [error,category] of [[new DOMException('private timeout details','TimeoutError'),'request_deadline'],[new DOMException('private abort details','AbortError'),'cancelled'],[new Error('Agent step budget exceeded'),'step_limit'],[new Error('Tool budget exceeded'),'tool_limit']]) {
  const record=agentFailureRecord({stage:'agent',modelCalls:6,error});
  assert.equal(record.category,category);assert.equal(record.modelCalls,6);
  assert.equal(JSON.stringify(record).includes('private'),false);
 }
});

test('private runner reports a bounded failure record without exposing invalid configuration',()=>{
 const privateValue='private-invalid-provider-value';
 const result=spawnSync(process.execPath,['scripts/test-agent-development.mjs'],{cwd:new URL('..',import.meta.url),env:{AGENT_PROVIDER:privateValue},input:'[]',encoding:'utf8'});
 assert.equal(result.status,1);assert.equal(result.stdout,'');
 const records=result.stderr.trim().split('\n').map(line=>JSON.parse(line));
 assert.deepEqual(records,[{event:'development_run_failure',requestId:'unknown',stage:'agent',modelCalls:0,partial:false,category:'unexpected',turn:0},{error:'development_test_failed'}]);
 assert.equal(result.stderr.includes(privateValue),false);
});

test('provider JSON failures expose a fixed diagnostic category, never the invalid response',async()=>{
 const {createModelAgent}=await import('../server/agent-provider.mjs');
 const secret='private-response-content';
 const body='data: '+JSON.stringify({choices:[{index:0,delta:{content:'{'+secret},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n';
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
 assert.equal(toolResult.type,'tool_result');assert.equal(toolResult.callId,'p');assert.equal(toolResult.data.source.id,'profile:profile');
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

test('Bailian rejects a primitive early in both tool and tool-free rounds with safe diagnostics',async()=>{
 const {createModelAgent}=await import('../server/agent-provider.mjs');
 for(const tools of [[],[{name:'read_profile',parameters:{type:'object',properties:{}}}]]) {
  let cancelled=false;
  const complete=createModelAgent({apiKey:'private-key',model:'qwen-plus',provider:'bailian',baseURL:'https://dashscope.aliyuncs.com/compatible-mode/v1',fetchImpl:async()=>new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('data: '+JSON.stringify({choices:[{index:0,delta:{content:'2016'},finish_reason:null}]})+'\n\n'));},cancel(){cancelled=true;}}),{headers:{'Content-Type':'text/event-stream'}})});
  await assert.rejects(complete({messages:[{role:'system',content:'test'}],tools,signal:new AbortController().signal,language:'en'}),error=>{
   assert.equal(error.code,'invalid_model_response');assert.equal(error.diagnosticCategory,'json_root');assert.ok(!JSON.stringify(error).includes('2016'));return true;
  });
  assert.equal(cancelled,true);
 }
});

test('native Qwen tools keep provider roles while constraining final prose to JSON',async()=>{
 const {createModelAgent}=await import('../server/agent-provider.mjs');
 for(const action of ['tool','answer']) {
  let wire;const text='A sourced answer.';let streamed='';
  const complete=createModelAgent({provider:'bailian',model:'qwen3.7-plus-2026-05-26',apiKey:'fixture',baseURL:'https://dashscope.aliyuncs.com/compatible-mode/v1',fetchImpl:async(url,options)=>{
   wire=JSON.parse(options.body);
   const delta=action==='tool'?{tool_calls:[{index:0,id:'next',type:'function',function:{name:'read_profile',arguments:'{"id":"profile"}'}}]}:{content:JSON.stringify({sourceIds:['profile:profile'],text})};
   return new Response('data: '+JSON.stringify({choices:[{index:0,delta,finish_reason:action==='tool'?'tool_calls':'stop'}]})+'\n\ndata: [DONE]\n\n',{headers:{'Content-Type':'text/event-stream'}});
  }});
  const result=await complete({messages:[{role:'system',content:'Read first.'},{role:'assistant',toolCalls:[{id:'prior',name:'read_profile',arguments:{id:'profile'}}]},{role:'tool',toolCallId:'prior',content:'{"source":{"id":"profile:profile"}}'}],tools:[{name:'read_profile',description:'Read',parameters:{type:'object',properties:{}}}],language:'en',signal:new AbortController().signal,onText:chunk=>{streamed+=chunk;}});
  assert.deepEqual(wire.response_format,{type:'json_object'});assert.equal(wire.enable_thinking,false);
  assert.equal(wire.tools[0].function.name,'read_profile');assert.equal(wire.messages[1].tool_calls[0].id,'prior');assert.equal(wire.messages[2].role,'tool');assert.equal(wire.messages[2].tool_call_id,'prior');
  if(action==='tool'){assert.equal(result.toolCalls[0].name,'read_profile');assert.equal(streamed,'');}
  else {assert.equal(result.text,text);assert.equal(streamed,text);}
 }
});


test('provider final-shape details survive diagnostics without payloads and keep the repair category',async()=>{
 const {createModelAgent}=await import('../server/agent-provider.mjs');
 const secret='PRIVATE-payload-and-field';
 const cases=[
  [[secret],'nonobject_result'],
  [{text:secret,sourceIds:[],[secret]:secret},'additional_fields'],
  [{text:{private:secret},sourceIds:[]},'invalid_text_field'],
  [{text:secret,sourceIds:secret},'invalid_sources_field']
 ].map(([value,detail])=>[JSON.stringify(value),detail]);
 cases.push(['{"sourceIds":[],"text":"original","text":"changed"}','changed_stream_text']);
 for(const [content,detail] of cases) {
  const body='data: '+JSON.stringify({choices:[{index:0,delta:{content},finish_reason:'stop'}]})+'\n\ndata: [DONE]\n\n';
  const complete=createModelAgent({apiKey:'not-a-real-key',model:'qwen3.8-max-0902',provider:'bailian',baseURL:'https://dashscope.aliyuncs.com/compatible-mode/v1',fetchImpl:async()=>new Response(body,{headers:{'Content-Type':'text/event-stream'}})});
  await assert.rejects(complete({messages:[{role:'system',content:'test'}],tools:[],signal:new AbortController().signal,language:'en'}),error=>{
   const record=agentFailureRecord({error});
   assert.equal(record.category,'final_shape');assert.equal(record.detail,detail);assert.ok(!JSON.stringify(record).includes(secret));return true;
  });
 }
 assert.equal(agentFailureRecord({error:{diagnosticCategory:'final_shape',diagnosticDetail:secret}}).detail,undefined);
 assert.equal(agentFailureRecord({error:{diagnosticCategory:'timeout',diagnosticDetail:'additional_fields'}}).detail,undefined);
});


test('fetch transport diagnostics keep only allowlisted cause categories',async()=>{
 const {createModelAgent}=await import('../server/agent-provider.mjs');
 for(const [code,category] of [['UND_ERR_CONNECT_TIMEOUT','connection_timeout'],['UND_ERR_HEADERS_TIMEOUT','response_timeout'],['UND_ERR_BODY_TIMEOUT','response_timeout'],['UND_ERR_SOCKET','connection_closed'],['ECONNRESET','connection_closed'],['EPIPE','connection_closed'],['ENOTFOUND','dns_failure'],['EAI_AGAIN','dns_failure'],['ECONNREFUSED','connection_refused'],['PRIVATE-unknown-code','provider_transport']]) {
  const cause=Object.assign(new Error('PRIVATE-host-address'),{code});
  const complete=createModelAgent({apiKey:'PRIVATE-key',model:'test',fetchImpl:async()=>{throw new TypeError('PRIVATE-fetch-details',{cause});}});
  await assert.rejects(complete({messages:[{role:'system',content:'test'}],tools:[],signal:new AbortController().signal,language:'en'}),error=>{
   assert.equal(error.diagnosticCategory,category);
   const record=agentFailureRecord({stage:'model',error});assert.equal(record.category,category);
   assert.ok(!JSON.stringify(record).includes('PRIVATE'));assert.ok(!JSON.stringify(error).includes('PRIVATE'));return true;
  });
 }
 assert.equal(providerFailureCategory(Object.assign(new Error('private'),{code:'ECONNRESET'})),'connection_closed');
 assert.equal(providerFailureCategory(Object.assign(new DOMException('private','AbortError'),{cause:{code:'ECONNRESET'}})),'timeout');
});

test('JSON parse diagnostics identify the protocol layer without retaining malformed payloads',async()=>{
 const {createModelAgent}=await import('../server/agent-provider.mjs');
 const secret='PRIVATE-malformed-payload';
 const frame=choice=>'data: '+JSON.stringify({choices:[choice]})+'\n\ndata: [DONE]\n\n';
 const cases=[
  ['data: {'+secret+'\n\ndata: [DONE]\n\n','stream_frame'],
  [frame({index:0,delta:{tool_calls:[{index:0,id:'c1',type:'function',function:{name:'read_profile',arguments:'{'+secret}}]},finish_reason:'tool_calls'}),'tool_arguments'],
  [frame({index:0,delta:{content:'{'+secret},finish_reason:'stop'}),'final_answer']
 ];
 for(const [body,detail] of cases) {
  const complete=createModelAgent({apiKey:'not-a-real-key',model:'qwen3.8-max-0902',provider:'bailian',baseURL:'https://dashscope.aliyuncs.com/compatible-mode/v1',fetchImpl:async()=>new Response(body,{headers:{'Content-Type':'text/event-stream'}})});
  await assert.rejects(complete({messages:[{role:'system',content:'test'}],tools:[],signal:new AbortController().signal,language:'en'}),error=>{
   const record=agentFailureRecord({error});
   assert.equal(record.category,'json_parse');assert.equal(record.detail,detail);
   assert.ok(!JSON.stringify(record).includes(secret));assert.ok(!JSON.stringify(error).includes(secret));return true;
  });
 }
 assert.equal(agentFailureRecord({error:{diagnosticCategory:'json_parse',diagnosticDetail:secret}}).detail,undefined);
 assert.equal(agentFailureRecord({error:{diagnosticCategory:'timeout',diagnosticDetail:'final_answer'}}).detail,undefined);
});

test('provider phases separate header failures from body failures with fixed metadata',async()=>{
 const {createModelAgent}=await import('../server/agent-provider.mjs');
 for(const phase of ['request_headers','response_stream']) {
  const complete=createModelAgent({apiKey:'PRIVATE-key',model:'test',fetchImpl:async()=>{
   if(phase==='request_headers')throw new TypeError('PRIVATE-error');
   return new Response(new ReadableStream({start(controller){controller.error(new TypeError('PRIVATE-body'));}}),{headers:{'Content-Type':'text/event-stream'}});
  }});
  await assert.rejects(complete({messages:[{role:'system',content:'test'}],tools:[],signal:new AbortController().signal,language:'en'}),error=>{
   const record=agentFailureRecord({error});assert.equal(record.providerPhase,phase);assert.equal(record.category,'provider_transport');
   assert.ok(!JSON.stringify(record).includes('PRIVATE'));return true;
  });
 }
 assert.equal(agentFailureRecord({error:{diagnosticPhase:'PRIVATE-arbitrary'}}).providerPhase,undefined);
});

test('provider deadline survives a generic stream abort while caller cancellation keeps identity',async t=>{
 const {createModelAgent}=await import('../server/agent-provider.mjs');
 for(const callerAbort of [false,true]) {
  const deadline=new AbortController(),caller=new AbortController();
  t.mock.method(AbortSignal,'timeout',()=>deadline.signal);
  const reason=new DOMException('PRIVATE-reason',callerAbort?'AbortError':'TimeoutError');
  const complete=createModelAgent({apiKey:'PRIVATE-key',model:'test',fetchImpl:async()=>new Response(new ReadableStream({pull(controller){
   (callerAbort?caller:deadline).abort(reason);controller.error(new TypeError('PRIVATE-generic-stream-error'));
  }}),{headers:{'Content-Type':'text/event-stream'}})});
  await assert.rejects(complete({messages:[{role:'system',content:'test'}],tools:[],signal:caller.signal,language:'en'}),error=>{
   if(callerAbort)assert.equal(error,reason);
   else {const record=agentFailureRecord({error});assert.equal(record.category,'timeout');assert.equal(record.providerPhase,'response_stream');assert.ok(!JSON.stringify(record).includes('PRIVATE'));}
   return true;
  });
  t.mock.restoreAll();
 }
});
