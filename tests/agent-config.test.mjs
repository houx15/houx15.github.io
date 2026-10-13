import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectAgentConfig } from '../server/agent-config.mjs';
const valid={AGENT_MODEL_KEY:'private-model',AGENT_MODEL:'configured',AGENT_REDIS_TOKEN:'private-redis',AGENT_TURNSTILE_SECRET:'private-challenge',AGENT_SIGNING_SECRET:'s'.repeat(40),AGENT_REDIS_URL:'https://redis.example',AGENT_DAILY_TOKENS:'100000',AGENT_MONTHLY_CNY:'500',AGENT_MAX_CNY_PER_MTOKENS:'10',AGENT_PRICED_MODEL:'configured'};
test('deployment validation defaults off and supports explicit container binding',()=>{
  const config=inspectAgentConfig(valid);assert.deepEqual(config.issues,[]);assert.equal(config.enabled,false);assert.equal(config.bind,'127.0.0.1');
  const container=inspectAgentConfig({...valid,AGENT_BIND:'0.0.0.0',AGENT_ENABLED:'1'});assert.deepEqual(container.issues,[]);assert.equal(container.enabled,true);
});
test('bad deployment values are rejected without copying secrets into diagnostics',()=>{
  for(const extra of [{AGENT_DAILY_TOKENS:'NaN'},{AGENT_DAILY_TOKENS:'-1'},{AGENT_PORT:'0'},{AGENT_BIND:'public.example'},{AGENT_ORIGIN:'https://site.example/path'},{AGENT_REDIS_URL:'https://private-token@redis.example'},{AGENT_SIGNING_SECRET:'short-private'},{AGENT_MODEL_KEY:''}]) {
    const config=inspectAgentConfig({...valid,...extra});assert.ok(config.issues.length);
    assert.doesNotMatch(JSON.stringify(config.issues),/private-token|short-private|private-model|private-redis/);
  }
});
