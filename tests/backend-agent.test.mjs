import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { MemoryAgentStore,RedisAgentStore,createGuard } from '../server/agent-state.mjs';
import { createAgentServer } from '../server/agent-http.mjs';
import { createDeepSeekAgent,createTurnstile } from '../server/agent-provider.mjs';
import { contentInstructions,contentToolDefinitions } from '../server/content-agent.mjs';
const secret='a'.repeat(40),origin='https://houx15.github.io';
const corpus={schemaVersion:1,revision:'fixture',documents:[{id:'notes/cache/en',canonicalId:'notes/cache',title:'KV cache',summary:'Attention',type:'notes',language:'en',date:'2026-10-01',url:'/notes/cache/',tags:[],sections:[{id:'notes/cache/en:0',heading:'Evidence',text:'Keys and values are cached.',url:'/notes/cache/#evidence'}]}]};
const makeGuard=(options={})=>createGuard({store:new MemoryAgentStore(),secret,dailyTokens:1000000,enabled:()=>true,...options});
async function serve(t,options={}) {
  const guard=options.guard || makeGuard();
  let round=0;
  const complete=async()=>++round%2?{toolCalls:[{id:'read',name:'read_content',arguments:{id:'notes/cache/en'}}]}:{text:'Keys and values are cached.',sourceIds:['notes/cache/en:0']};
  const server=createAgentServer({origin,corpus,guard,complete,verifyChallenge:async()=>{},enabled:()=>true,production:false,...options});
  server.listen(0,'127.0.0.1');await once(server,'listening');
  t.after(()=>{server.closeAllConnections();server.close();});
  const base=`http://127.0.0.1:${server.address().port}`;
  const post=(route,data,token)=>fetch(base+route,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(data)});
  return {guard,post,base};
}
const issue=async post=>(await (await post('/v2/sessions',{challengeToken:'test'})).json()).sessionToken;
test('HTTP session, verified page context, SSE order and server-owned multiround history',async t=>{
  const seen=[];let calls=0;
  const {post}=await serve(t,{complete:async args=>{seen.push(args);return ++calls%2?{toolCalls:[{id:'read',name:'read_content',arguments:{id:'notes/cache/en'}}]}:{text:'Cached keys.',sourceIds:['notes/cache/en:0']};}});
  const token=await issue(post);
  const r=await post('/v2/agent',{question:'Explain cache',language:'en',pageContext:{documentId:'notes/cache/en'}},token);
  assert.equal(r.status,200);const text=await r.text();
  const events=text.split('\n').filter(l=>l.startsWith('data: ')).map(l=>JSON.parse(l.slice(6)));
  assert.deepEqual(events.map(e=>e.type),['status','status','status','status','status','status','source','answer','done']);
  assert.equal(new Set(events.map(e=>e.id)).size,events.length);
  assert.equal(events.at(-2).sourceIds[0],'notes/cache/en:0');
  await (await post('/v2/agent',{question:'And why?',language:'en'},token)).text();
  assert.ok(seen[2].messages.some(m=>m.role==='assistant' && JSON.parse(m.content || '{}').text==='Cached keys.'));
  assert.equal((await post('/v2/agent',{question:'x',language:'en',history:[]},token)).status,400);
  assert.equal((await post('/v2/agent',{question:'x',language:'en',pageContext:{documentId:'draft'}},token)).status,400);
  assert.equal((await post('/v2/agent',{question:'x',language:'en'},token+'x')).status,401);
});
test('production rejects memory accounting, missing challenge, disabled mode and wrong origins',async t=>{
  const {post,base}=await serve(t,{production:true});assert.equal((await post('/v2/sessions',{challengeToken:'x'})).status,503);
  assert.equal((await fetch(base+'/v2/agent',{method:'POST'})).status,403);
  const other=await serve(t,{verifyChallenge:undefined});assert.equal((await other.post('/v2/sessions',{challengeToken:'x'})).status,503);
});
test('atomic shared limits, replay, expiry, clock rollback and conservative reservations',async()=>{
  let time=1800000000000;const store=new MemoryAgentStore(),guard=makeGuard({store,now:()=>time,dailyTokens:100});
  await guard.challengeAttempt('ip','token');await assert.rejects(guard.challengeAttempt('ip','token'),/challenge_failed/);
  const {sessionToken}=await guard.issue();await guard.begin(sessionToken,'ip','r');
  await assert.rejects(guard.begin(sessionToken,'ip','other'),/rate_limited/);
  const reservation=await guard.reserve('r',80);await assert.rejects(guard.reserve('r',30),/budget_exhausted/);
  await guard.reconcile(reservation,50);assert.equal(store.state.spent,50);
  const second=await guard.reserve('r',40);await guard.reconcile(second,undefined);assert.equal(store.state.spent,90);
  await guard.finish('r');time+=3600001;await assert.rejects(guard.begin(sessionToken,'ip','r'),/invalid_session/);
  time-=3600002;await assert.rejects(guard.issue(),/unavailable/);
});
test('per-completion quota prevents second paid step and emits terminal error',async t=>{
  const firstRequest={messages:[{role:'system',content:contentInstructions},{role:'user',content:JSON.stringify({question:'cache',language:'en'})}],tools:contentToolDefinitions};
  const firstReservation=Buffer.byteLength(JSON.stringify(firstRequest))+4096+2048;
  let calls=0;const {post}=await serve(t,{guard:makeGuard({dailyTokens:firstReservation}),complete:async()=>{calls++;return {toolCalls:[{id:'r',name:'read_content',arguments:{id:'notes/cache/en'}}]};}});
  const text=await (await post('/v2/agent',{question:'cache',language:'en'},await issue(post))).text();
  assert.equal(calls,1);assert.match(text,/budget_exhausted/);assert.doesNotMatch(text,/event: done/);
});
test('client cancellation aborts upstream and stops later completions',async t=>{
  let calls=0,aborted=false;let started;const ready=new Promise(r=>started=r);
  const {post,base}=await serve(t,{complete:async({signal})=>{calls++;started();await new Promise((resolve,reject)=>{signal.addEventListener('abort',()=>{aborted=true;reject(signal.reason);},{once:true});});}});
  const token=await issue(post),controller=new AbortController();
  const response=await fetch(base+'/v2/agent',{method:'POST',signal:controller.signal,headers:{Origin:origin,'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({question:'cache',language:'en'})});
  await ready;controller.abort();await assert.rejects(response.text());
  await new Promise(r=>setTimeout(r,30));assert.equal(calls,1);assert.equal(aborted,true);
});
test('Turnstile requires correct host, action, freshness and success',async()=>{
  const now=1800000000000,valid={success:true,hostname:'houx15.github.io',action:'agent_session',challenge_ts:new Date(now).toISOString()};
  for(const patch of [{success:false},{hostname:'evil.test'},{action:'other'},{challenge_ts:new Date(now-300001).toISOString()},{challenge_ts:'invalid'}]) {
    const verify=createTurnstile({secret:'private',hostname:'houx15.github.io',now:()=>now,fetchImpl:async()=>Response.json({...valid,...patch})});
    await assert.rejects(verify('token',new AbortController().signal),/challenge_failed/);
  }
  await createTurnstile({secret:'private',hostname:'houx15.github.io',now:()=>now,fetchImpl:async()=>Response.json(valid)})('token',new AbortController().signal);
});
test('provider maps tools, bounds tokens, rejects truncation and sanitizes raw failures',async()=>{
  let body;
  const complete=createDeepSeekAgent({apiKey:'private',model:'configured',fetchImpl:async(url,options)=>{body=JSON.parse(options.body);assert.equal(url,'https://api.deepseek.com/chat/completions');return new Response('data: '+JSON.stringify({choices:[{index:0,finish_reason:'tool_calls',delta:{tool_calls:[{index:0,id:'r',type:'function',function:{name:'read_content',arguments:'{"id":"notes/cache/en"}'}}]}}]})+'\n\ndata: [DONE]\n\n',{headers:{'Content-Type':'text/event-stream'}});}});
  const args={messages:[{role:'system',content:'JSON'}],tools:[],language:'en',signal:new AbortController().signal};
  assert.equal((await complete(args)).toolCalls[0].name,'read_content');assert.equal(body.max_tokens,2048);assert.ok(!JSON.stringify(body).includes('private'));
  const fail=createDeepSeekAgent({apiKey:'private',model:'configured',fetchImpl:async()=>{throw new Error('secret private');}});
  await assert.rejects(fail(args),e=>e.message==='invalid_model_response');
});
test('shared Redis CAS retries conflicts and fails closed on missing state',async()=>{
  let raw=null,conflict=true;
  const store=new RedisAgentStore({url:'https://redis.example',token:'private',fetchImpl:async(url,options)=>{
    const [cmd,...args]=JSON.parse(options.body);let result;
    if(cmd==='SET'){if(raw===null) raw=args[1];result='OK';}
    if(cmd==='GET') result=raw;
    if(cmd==='EVAL'){if(conflict){conflict=false;result=0;}else if(raw===args[3]) {raw=args[4];result=1;}else result=0;}
    return Response.json({result});
  }});
  await assert.rejects(store.transaction(s=>s.spent++),/unavailable/);await store.initialize();
  await store.transaction(s=>s.spent++);assert.equal(JSON.parse(raw).spent,1);
});

test('partial blocks survive only as incomplete and provider failures never save conversation',async t=>{
  let round=0;const guard=makeGuard();
  const {post}=await serve(t,{guard,complete:async()=>{if(++round===1) return {toolCalls:[{id:'cards',name:'show_post_cards',arguments:{ids:['notes/cache/en']}}]};throw new Error('PRIVATE PROVIDER DETAIL');}});
  const token=await issue(post),text=await (await post('/v2/agent',{question:'cache',language:'en'},token)).text();
  assert.match(text,/event: block/);assert.match(text,/"partial":true/);assert.match(text,/event: error/);
  assert.doesNotMatch(text,/PRIVATE|event: answer|event: done/);
  assert.equal(Object.values(guard.store.state.sessions)[0].history.length,0);
  assert.ok(guard.store.state.spent>0);
});

test('unread citations never reach the HTTP answer stream',async t=>{
  const {post}=await serve(t,{complete:async()=>({text:'Invented claim',sourceIds:['notes/cache/en:0']})});
  const text=await (await post('/v2/agent',{question:'cache',language:'en'},await issue(post))).text();
  assert.match(text,/event: error/);assert.doesNotMatch(text,/Invented claim|event: answer|event: source/);
});

test('daily and short-window session quotas and issuance limit persist across guard instances',async()=>{
  let time=1800000000000;const store=new MemoryAgentStore(),g=makeGuard({store,now:()=>time}),g2=makeGuard({store,now:()=>time});
  for(let i=0;i<5;i++) await g.challengeAttempt('ip',`t${i}`);
  await assert.rejects(g2.challengeAttempt('ip','t5'),/rate_limited/);
  const {sessionToken}=await g.issue();
  for(let i=0;i<6;i++){await g.begin(sessionToken,'ip',`r${i}`);await g.finish(`r${i}`);}
  await assert.rejects(g2.begin(sessionToken,'ip','r6'),/rate_limited/);
  for(let i=6;i<20;i++){time+=61000;await g2.begin(sessionToken,'ip',`r${i}`);await g2.finish(`r${i}`);}
  time+=61000;await assert.rejects(g.begin(sessionToken,'ip','over-daily'),/rate_limited/);
});

test('provider rejects truncation, malformed structured answers and oversized payloads',async()=>{
  const args={messages:[{role:'system',content:'JSON'}],tools:[],language:'en',signal:new AbortController().signal};
  for(const data of [
    {choices:[{finish_reason:'length',message:{content:'{"text":"partial","sourceIds":[]}'}}]},
    {choices:[{finish_reason:'stop',message:{content:'{"text":"answer","sourceIds":[],"html":"x"}'}}]},
    {choices:[{finish_reason:'stop',message:{content:'x'.repeat(100001)}}]}
  ]) {
    await assert.rejects(createDeepSeekAgent({apiKey:'private',model:'configured',fetchImpl:async()=>Response.json(data)})(args),/invalid_model_response/);
  }
});

test('HTTP forwards incremental prose before the provider finishes, and finalizes only afterward',async t=>{
  let round=0,release;const gate=new Promise(resolve=>release=resolve);
  const {post}=await serve(t,{complete:async({onText})=>{
    if(++round===1)return {toolCalls:[{id:'r',name:'read_content',arguments:{id:'notes/cache/en'}}]};
    onText('Keys ',['notes/cache/en:0']);await gate;
    onText('are cached.',['notes/cache/en:0']);return {text:'Keys are cached.',sourceIds:['notes/cache/en:0']};
  }});
  const timeout=setTimeout(release,2000);t.after(()=>clearTimeout(timeout));
  const response=await post('/v2/agent',{question:'cache',language:'en'},await issue(post));
  const reader=response.body.getReader(),decoder=new TextDecoder();let text='';
  while(!text.includes('event: answer_delta')){const chunk=await reader.read();assert.equal(chunk.done,false);text+=decoder.decode(chunk.value);}
  assert.doesNotMatch(text,/event: answer\n|event: done/);release();
  while(true){const chunk=await reader.read();if(chunk.done)break;text+=decoder.decode(chunk.value);}
  assert.match(text,/Keys are cached/);assert.match(text,/event: done/);
});

test('challenge adapter rejects absent and oversized tokens before contacting Cloudflare',async()=>{
 let calls=0;const verify=createTurnstile({secret:'private',hostname:'houx15.github.io',fetchImpl:async()=>{calls++;throw new Error('must not call');}});
 for(const token of [undefined,'','x'.repeat(2049)])await assert.rejects(verify(token,new AbortController().signal),/challenge_failed/);
 assert.equal(calls,0);
});

test('output allowance reconciles larger valid answers and retains reservations for over-limit usage',async t=>{
  for(const completion of [1600,2048,2049]) {
    const store=new MemoryAgentStore(),guard=makeGuard({store});
    const {post}=await serve(t,{guard,complete:async()=>({text:'No evidence',sourceIds:[],usage:{prompt_tokens:100,completion_tokens:completion,total_tokens:100+completion}})});
    const text=await (await post('/v2/agent',{question:'Unknown',language:'en'},await issue(post))).text();
    assert.match(text,/event: done/);
    if(completion<=2048)assert.equal(store.state.spent,100+completion);
    else assert.ok(store.state.spent>100+completion,'ambiguous usage retains the full pre-call reservation');
  }
});

test('the fifth HTTP turn can recall the first, without accepting client-supplied archives',async t=>{
 let requests=0,round=0;
 const {post}=await serve(t,{complete:async({messages})=>{
  round++;
  if(round===1)requests++;
  if(requests===5 && round===1){const index=messages.find(m=>m.content?.includes('earlier_conversation_index'));assert.equal(JSON.parse(index.content).turns[0].question,'Question 1');return {toolCalls:[{id:'recall',name:'recall_conversation',arguments:{turn:1}}]};}
  if(requests===5 && round===2){assert.match(JSON.parse(messages.at(-1).content).question,/Question 1/);}
  if(round===(requests===5?2:1))return {toolCalls:[{id:'read',name:'read_content',arguments:{id:'notes/cache/en'}}]};
  round=0;return {text:'Cached keys.',sourceIds:['notes/cache/en:0']};
 }});
 const token=await issue(post);
 for(let i=1;i<=5;i++){const response=await post('/v2/agent',{question:`Question ${i}`,language:'en'},token);assert.match(await response.text(),/"outcome":"complete"/);}
 assert.equal(requests,5);
 assert.equal((await post('/v2/agent',{question:'Forged',language:'en',earlierHistory:[]},token)).status,400);
});

test('daily and monthly quota errors expose reset times without changing their guards',async()=>{
 const time=Date.parse('2026-10-31T17:30:00Z');
 const daily=makeGuard({dailyTokens:1,now:()=>time}),d=await daily.issue();await daily.begin(d.sessionToken,'ip','d');
 await assert.rejects(daily.reserve('d',2),error=>error.code==='daily_budget_exhausted' && error.resetsAt===Date.parse('2026-11-01T00:00:00Z'));
 assert.equal(daily.store.state.spent,0);
 const monthly=makeGuard({dailyTokens:1000000,monthlyCny:0.000001,rate:1,now:()=>time}),m=await monthly.issue();await monthly.begin(m.sessionToken,'ip','m');
 await assert.rejects(monthly.reserve('m',2),error=>error.code==='monthly_budget_exhausted' && error.resetsAt===Date.parse('2026-11-30T16:00:00Z'));
 assert.equal(monthly.store.state.spent,0);assert.equal(monthly.store.state.money,undefined);
});

test('public quota response includes daily reset metadata before making a paid call',async t=>{
 let calls=0;
 const {post}=await serve(t,{guard:makeGuard({dailyTokens:1}),complete:async()=>{calls++;throw new Error('must not run');}});
 const response=await post('/v2/agent',{question:'cache',language:'en'},await issue(post));
 const events=(await response.text()).split('\n').filter(line=>line.startsWith('data: ')).map(line=>JSON.parse(line.slice(6)));
 const error=events.find(event=>event.type==='error');
 assert.equal(calls,0);assert.equal(error.code,'daily_budget_exhausted');assert.ok(Number.isSafeInteger(error.resetsAt));assert.equal(new Date(error.resetsAt).getUTCHours(),0);
 assert.equal(events.some(event=>event.type==='done'),false);
});

test('opening follow-ups resolve authored IDs and preserve them without trusting browser text',async t=>{
  const seen=[];let calls=0;
  const {post}=await serve(t,{complete:async args=>{
    seen.push(args);
    return ++calls%2?{toolCalls:[{id:'read',name:'read_profile',arguments:{id:'startup',language:'en'}}]}:{text:'She founded a company and worked as CTO.',sourceIds:['profile:startup']};
  }});
  const token=await issue(post);
  for(const openingContext of [{storyId:'unknown'},{storyId:'startup',text:'Invented biography'},[],null]) {
    assert.equal((await post('/v2/agent',{question:'Tell me more',language:'en',openingContext},token)).status,400);
  }
  assert.equal(calls,0);
  const result=await post('/v2/agent',{question:'What did she build there?',language:'en',openingContext:{storyId:'startup'}},token);
  assert.match(await result.text(),/event: done/);
  const first=JSON.parse(seen[0].messages.at(-1).content);
  assert.equal(first.question,'What did she build there?');
  assert.equal(first.openingContext.title,'Learning by building');
  assert.equal(first.openingContext.url,'/about/#sources');
  assert.ok(!seen[0].messages.some(m=>m.role==='tool')); // Context itself grants no evidence.
  await (await post('/v2/agent',{question:'And when?',language:'en'},token)).text();
  const userTurns=seen[2].messages.filter(m=>m.role==='user').map(m=>JSON.parse(m.content));
  assert.deepEqual(userTurns[0].openingContext,first.openingContext);
  assert.equal(userTurns.at(-1).openingContext,undefined);
});

test('trusted ingress separates visitor issuance limits while refusing a missing trusted address',async t=>{
 const {base}=await serve(t,{trustLoopbackProxy:true});
 const request=(address,index)=>fetch(base+'/v2/sessions',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(address?{'X-Portfolio-Client-IP':address}:{})},body:JSON.stringify({challengeToken:`ingress-test-${address}-${index}`})});
 for(let i=0;i<5;i++)assert.equal((await request('192.0.2.1',i)).status,201);
 assert.equal((await request('192.0.2.1',5)).status,429);
 assert.equal((await request('192.0.2.2',0)).status,201);
 assert.equal((await request(null,0)).status,503);
});

test('public HTTP cannot select developer accounting with body fields or headers',async t=>{
  let calls=0;const guard=makeGuard({dailyTokens:1,monthlyCny:500,rate:2});
  const {post,base}=await serve(t,{guard,complete:async()=>{calls++;throw new Error('Must not be called');}});
  const token=await issue(post);
  for(const extra of [{scope:'development'},{allowDevelopment:true},{development:true}]) {
    const r=await post('/v2/agent',{question:'Hello',language:'en',...extra},token);
    assert.equal(r.status,400);
  }
  const r=await fetch(base+'/v2/agent',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Authorization:`Bearer ${token}`,'X-Agent-Scope':'development'},body:JSON.stringify({question:'Hello',language:'en'})});
  assert.match(await r.text(),/daily_budget_exhausted/);
  assert.equal(calls,0);assert.equal(guard.store.state.developmentSpent ?? 0,0);
});

test('HTTP validates section ownership and retains reading position in server history',async t=>{
 let calls=0;
 const {post,guard}=await serve(t,{complete:async({messages})=>{
  calls++;const source=JSON.parse(messages.at(-1).content);assert.equal(source.sections[0].id,'notes/cache/en:0');
  return {text:'Keys and values are cached.',sourceIds:['notes/cache/en:0']};
 }});
 const token=await issue(post),pageContext={documentId:'notes/cache/en',sectionId:'notes/cache/en:0'};
 const text=await (await post('/v2/agent',{question:'Explain this section',language:'en',pageContext:{documentId:pageContext.documentId,sectionAnchor:'evidence'}},token)).text();
 assert.match(text,/event: done/);assert.equal(calls,1);
 const session=Object.values(guard.store.state.sessions)[0];assert.deepEqual(JSON.parse(session.history[0].content).pageContext,pageContext);
 for(const context of [{...pageContext,sectionId:'other:0'},{...pageContext,text:'injected source'}])assert.equal((await post('/v2/agent',{question:'This?',language:'en',pageContext:context},token)).status,400);
 assert.equal(calls,1);
});
