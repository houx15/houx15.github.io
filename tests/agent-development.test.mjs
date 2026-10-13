import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGuard,MemoryAgentStore} from '../server/agent-state.mjs';
const setup=()=>{
  const store=new MemoryAgentStore();let time=Date.parse('2026-10-13T12:00:00Z');
  const make=(extra={})=>createGuard({store,secret:'x'.repeat(40),dailyTokens:100,monthlyCny:1,rate:2,enabled:()=>true,now:()=>time,...extra});
  return {store,visitor:make(),dev:make({allowDevelopment:true}),make,advance:ms=>{time+=ms;}};
};
test('exhausted visitor quota does not stop SSH tests or receive their charges',async()=>{
  const {store,visitor,dev}=setup();const {sessionToken}=await visitor.issue();
  await visitor.begin(sessionToken,'visitor','v');const old=await visitor.reserve('v',100);
  const rates=structuredClone(store.state.rates),sessions=structuredClone(store.state.sessions);
  await assert.rejects(visitor.beginDevelopment('bad'),/forbidden/);
  await dev.beginDevelopment('d');const r=await dev.reserve('d',1000);
  assert.equal(store.state.spent,100);assert.equal(store.state.developmentSpent,1000);
  assert.deepEqual(store.state.rates,rates);assert.deepEqual(store.state.sessions,sessions);
  await dev.reconcile(r,250);assert.equal(store.state.spent,100);assert.equal(store.state.developmentSpent,250);
  assert.equal(store.state.money['2026-10'],700);
  await assert.rejects(visitor.reserve('v',1),/daily_budget_exhausted/);
  // Legacy reservations without a scope retain visitor accounting.
  await visitor.reconcile(old,40);assert.equal(store.state.spent,40);assert.equal(store.state.developmentSpent,250);
  await dev.finish('d');await visitor.finish('v');assert.equal(Object.keys(store.state.leases).length,0);
});
test('both paths share money cap; unknown usage and price changes preserve accounting',async()=>{
  const {store,visitor,dev,make}=setup();await dev.beginDevelopment('d');
  const r=await dev.reserve('d',1000);await make({allowDevelopment:true,rate:10}).reconcile(r,500);
  assert.equal(store.state.money['2026-10'],1000);
  const unknown=await dev.reserve('d',100);await dev.reconcile(unknown,undefined);
  assert.equal(store.state.developmentSpent,600);assert.equal(store.state.money['2026-10'],1200);
  // Simulate spending by other requests in the same shared ledger.
  store.state.money['2026-10']=1000000;
  await assert.rejects(dev.reserve('d',1),/monthly_budget_exhausted/);
  const {sessionToken}=await visitor.issue();await visitor.begin(sessionToken,'v','v');
  await assert.rejects(visitor.reserve('v',1),/monthly_budget_exhausted/);
  assert.equal(store.state.spent,0);assert.equal(store.state.developmentSpent,600);
});
test('development remains bounded per run, globally concurrent, expiring, and opt-in',async()=>{
  const {store,visitor,dev,advance,make}=setup();await dev.beginDevelopment('d');
  await assert.rejects(visitor.reserve('d',1),/forbidden/);
  await assert.rejects(make({allowDevelopment:true,monthlyCny:undefined}).beginDevelopment('no-money'),/forbidden/);
  const r=await dev.reserve('d',325000);await dev.reconcile(r,0);
  await assert.rejects(dev.reserve('d',1),/development_run_limit/);
  await dev.beginDevelopment('d2');await assert.rejects(dev.beginDevelopment('d3'),/rate_limited/);
  advance(60001);await assert.rejects(dev.reserve('d',1),/unavailable/);
  await dev.beginDevelopment('d3');assert.equal(Object.keys(store.state.leases).length,1);
});
test('cross-midnight reconciliation never subtracts from either new daily counter',async()=>{
  const {store,dev,advance}=setup();await dev.beginDevelopment('d');const r=await dev.reserve('d',1000);
  advance(13*3600000);await dev.reconcile(r,100);
  assert.equal(store.state.spent,0);assert.equal(store.state.developmentSpent,0);
  assert.equal(store.state.money['2026-10'],200);
});
