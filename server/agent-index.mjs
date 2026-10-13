import fs from 'node:fs/promises';
import { RedisAgentStore,createGuard } from './agent-state.mjs';
import { createModelAgent,createTurnstile } from './agent-provider.mjs';
import { createAgentServer } from './agent-http.mjs';
import { inspectAgentConfig } from './agent-config.mjs';
// Runtime secrets only. No env files are loaded and configuration is never logged.
const env=process.env, enabled=()=>env.AGENT_ENABLED==='1';
try {
  const config=inspectAgentConfig(env);
  if(config.issues.length)throw new Error('Invalid configuration');
  const {origin}=config;
  const store=config.storeKind==='sqlite'
    ? new (await import('./agent-sqlite.mjs')).SQLiteAgentStore({path:env.AGENT_SQLITE_PATH})
    : new RedisAgentStore({url:env.AGENT_REDIS_URL,token:env.AGENT_REDIS_TOKEN});
  if(env.AGENT_INITIALIZE==='1') await store.initialize();
  const guard=createGuard({store,secret:env.AGENT_SIGNING_SECRET,dailyTokens:config.dailyTokens,monthlyCny:config.monthlyCny,rate:config.rate,enabled});
  const corpus=JSON.parse(await fs.readFile(config.corpusFile,'utf8'));
  if(!env.AGENT_TURNSTILE_SECRET) throw new Error('Missing challenge configuration');
  const server=createAgentServer({origin,corpus,guard,enabled,onDiagnostic:record=>process.stderr.write(JSON.stringify(record)+'\n'),complete:createModelAgent({apiKey:env.AGENT_MODEL_KEY,model:env.AGENT_MODEL,provider:config.provider,baseURL:config.baseURL}),verifyChallenge:createTurnstile({secret:env.AGENT_TURNSTILE_SECRET,hostname:new URL(origin).hostname})});
  server.on('error',()=>{process.stderr.write('Agent unavailable: listener failed.\n');process.exitCode=1;});
  server.listen(config.port,config.bind);
  process.once('SIGTERM',()=>{env.AGENT_ENABLED='0';server.close();server.closeAllConnections();});
} catch {process.stderr.write('Agent unavailable: check runtime configuration and state.\n');process.exitCode=1;}
