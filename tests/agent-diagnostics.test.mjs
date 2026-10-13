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
 assert.equal(wire.tools,undefined);assert.equal(wire.max_tokens,1024);
});
