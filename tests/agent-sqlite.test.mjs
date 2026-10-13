import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync,chmodSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {SQLiteAgentStore} from '../server/agent-sqlite.mjs';
import {createGuard} from '../server/agent-state.mjs';
import {inspectAgentConfig} from '../server/agent-config.mjs';
function fixture(t){const dir=mkdtempSync(join(tmpdir(),'agent-ledger-'));chmodSync(dir,0o700);const path=join(dir,'state.sqlite');writeFileSync(path,'',{mode:0o600});t.after(()=>rmSync(dir,{recursive:true,force:true}));return path;}
test('durable quotas and history survive reopening and initialization cannot reset money',async t=>{
 const path=fixture(t);let store=new SQLiteAgentStore({path});store.initialize();
 const make=()=>createGuard({store,secret:'s'.repeat(40),dailyTokens:100000,monthlyCny:1,rate:100,enabled:()=>true});
 const g=make(),{sessionToken}=await g.issue();await g.begin(sessionToken,'ip','r');await g.reserve('r',9999);await g.finish('r',[{role:'user',content:'Hello'},{role:'assistant',content:'Hi'}]);store.close();
 store=new SQLiteAgentStore({path});t.after(()=>store.close());store.initialize();const next=make();
 const session=await next.begin(sessionToken,'ip','next');assert.equal(session.history.length,2);
 await assert.rejects(next.reserve('next',2),/budget_exhausted/);
});
test('independent connections share atomic state and failed transactions roll back',async t=>{
 const path=fixture(t),a=new SQLiteAgentStore({path}),b=new SQLiteAgentStore({path});t.after(()=>{a.close();b.close();});a.initialize();
 await Promise.all(Array.from({length:20},(_,i)=>(i%2?a:b).transaction(s=>s.spent++)));
 await assert.rejects(a.transaction(s=>{s.spent=0;throw new Error('private diagnostic');}),/unavailable/);
 assert.equal(await b.transaction(s=>s.spent),20);
});
test('missing, uninitialized, corrupt and publicly readable state fail closed',async t=>{
 const path=fixture(t);assert.throws(()=>new SQLiteAgentStore({path:path+'missing'}));
 const store=new SQLiteAgentStore({path});t.after(()=>store.close());await assert.rejects(store.transaction(()=>{}),/unavailable/);store.initialize();
 store.db.prepare('UPDATE ledger SET value=?').run('not json');await assert.rejects(store.transaction(()=>{}),/unavailable/);
 chmodSync(path,0o644);assert.throws(()=>new SQLiteAgentStore({path}),/Private state file/);
});
test('SQLite configuration needs a private absolute path, not Redis credentials',()=>{
 const env={AGENT_STORE:'sqlite',AGENT_SQLITE_PATH:'/private/state.sqlite',AGENT_MODEL_KEY:'test',AGENT_MODEL:'qwen-plus',AGENT_PROVIDER:'bailian',AGENT_BASE_URL:'https://dashscope.aliyuncs.com/compatible-mode/v1',AGENT_TURNSTILE_SECRET:'test',AGENT_SIGNING_SECRET:'s'.repeat(40),AGENT_DAILY_TOKENS:'100000',AGENT_MONTHLY_CNY:'500',AGENT_MAX_CNY_PER_MTOKENS:'2',AGENT_PRICED_MODEL:'qwen-plus'};
 assert.deepEqual(inspectAgentConfig(env).issues,[]);assert.ok(inspectAgentConfig({...env,AGENT_SQLITE_PATH:'relative'}).issues.length);
});
