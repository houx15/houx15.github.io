import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createModelAgent} from '../server/agent-provider.mjs';
import {modelEndpoint} from '../server/agent-endpoint.mjs';
import {createGuard,MemoryAgentStore} from '../server/agent-state.mjs';
import {inspectAgentConfig} from '../server/agent-config.mjs';

test('Bailian provider uses a trusted endpoint and handles its separate streaming usage chunk',async()=>{
  let body;
  const complete=createModelAgent({provider:'bailian',baseURL:'https://dashscope.aliyuncs.com/compatible-mode/v1',apiKey:'private',model:'qwen-plus',fetchImpl:async(url,options)=>{
    assert.equal(url,'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions');body=JSON.parse(options.body);
    const chunks=[{choices:[{index:0,delta:{content:'{"sourceIds":["s"],"text":"你好"}'},finish_reason:null}]},{choices:[{index:0,delta:{},finish_reason:'stop'}]},{choices:[],usage:{prompt_tokens:20,completion_tokens:10,total_tokens:30}}];
    return new Response(chunks.map(chunk=>'data: '+JSON.stringify(chunk)+'\n\n').join('')+'data: [DONE]\n\n',{headers:{'Content-Type':'text/event-stream'}});
  }});
  const output=await complete({messages:[{role:'system',content:'Help'}],tools:[],language:'zh-CN',signal:new AbortController().signal});
  assert.equal(output.text,'你好');assert.equal(output.usage.total_tokens,30);assert.equal(body.stream,true);assert.equal(body.enable_thinking,false);assert.equal(body.reasoning_effort,undefined);
  assert.throws(()=>modelEndpoint('bailian','https://attacker.test/compatible-mode/v1'));
  assert.throws(()=>modelEndpoint('bailian','https://dashscope.aliyuncs.com.evil.test/compatible-mode/v1'));
  assert.equal(modelEndpoint('bailian','https://workspace-id.cn-beijing.maas.aliyuncs.com/compatible-mode/v1/'),'https://workspace-id.cn-beijing.maas.aliyuncs.com/compatible-mode/v1/chat/completions');
});
test('monthly CNY reservations survive model-price changes and refund at the original price',async()=>{
  const store=new MemoryAgentStore();let time=Date.parse('2026-10-13T00:00:00Z');
  const make=rate=>createGuard({store,secret:'a'.repeat(40),dailyTokens:1000000,monthlyCny:.001,rate,now:()=>time,enabled:()=>true});
  const first=make(10),second=make(20),{sessionToken}=await first.issue();
  await first.begin(sessionToken,'ip','r');const reservation=await first.reserve('r',80);
  assert.equal(store.state.money['2026-10'],800);
  await assert.rejects(second.reserve('r',11),/budget_exhausted/);
  await second.reconcile(reservation,40);assert.equal(store.state.money['2026-10'],400);
  const unknown=await second.reserve('r',30);await second.reconcile(unknown,undefined);assert.equal(store.state.money['2026-10'],1000);
  await assert.rejects(first.reserve('r',1),/budget_exhausted/);
  await first.finish('r');time=Date.parse('2026-10-14T00:00:00Z');
  const next=await first.issue();await first.begin(next.sessionToken,'ip','r2');await assert.rejects(first.reserve('r2',1),/budget_exhausted/);
  await first.finish('r2');time=Date.parse('2026-10-31T16:00:00Z'); // Beijing November 1.
  const november=await first.issue();await first.begin(november.sessionToken,'ip','r3');await first.reserve('r3',1);
  assert.equal(store.state.money['2026-11'],10);assert.equal(store.state.money['2026-10'],1000);
});
test('switching model requires reviewing its price and owner budget cannot exceed 500 CNY',()=>{
  const env={AGENT_MONTHLY_CNY:'501',AGENT_MAX_CNY_PER_MTOKENS:'10',AGENT_MODEL:'new',AGENT_PRICED_MODEL:'old'};
  const issues=inspectAgentConfig(env).issues.join('\n');assert.match(issues,/AGENT_MONTHLY_CNY/);assert.match(issues,/AGENT_PRICED_MODEL/);
});
