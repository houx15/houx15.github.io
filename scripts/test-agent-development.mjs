// Run on the server with its private runtime environment. No HTTP listener or bypass token.
// stdin: JSON array of 1–6 turns, e.g. [{"question":"介绍一下煜欣","language":"zh-CN"}]
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { inspectAgentConfig } from '../server/agent-config.mjs';
import { createGuard,RedisAgentStore,AgentError } from '../server/agent-state.mjs';
import { createModelAgent } from '../server/agent-provider.mjs';
import { createPaidCompletion } from '../server/agent-paid.mjs';
import { runContentAgent } from '../server/content-agent.mjs';
import { rememberAgentAnswer } from '../server/agent-memory.mjs';
import { resolveOpeningContext } from '../server/agent-opening.mjs';
let store;
try {
  const env=process.env,config=inspectAgentConfig(env);
  if(config.issues.length || !config.enabled) throw new Error('Invalid runtime configuration');
  let raw='';for await(const chunk of process.stdin){raw+=chunk;if(Buffer.byteLength(raw)>8192)throw new Error('Input too large');}
  const turns=JSON.parse(raw);
  if(!Array.isArray(turns) || !turns.length || turns.length>6)throw new Error('Expected 1–6 turns');
  const corpus=JSON.parse(await fs.readFile(config.corpusFile,'utf8'));
  for(const input of turns) {
    if(!input || typeof input!=='object' || Object.keys(input).some(k=>!['question','language','pageContext','openingContext'].includes(k)) || typeof input.question!=='string' || !input.question.trim() || input.question.length>400 || !['en','zh-CN'].includes(input.language))throw new Error('Invalid test turn');
    resolveOpeningContext(input.openingContext,input.language);
    if(input.pageContext && !corpus.documents.some(d=>d.id===input.pageContext.documentId))throw new Error('Invalid page');
  }
  store=config.storeKind==='sqlite'
    ?new (await import('../server/agent-sqlite.mjs')).SQLiteAgentStore({path:env.AGENT_SQLITE_PATH})
    :new RedisAgentStore({url:env.AGENT_REDIS_URL,token:env.AGENT_REDIS_TOKEN});
  const guard=createGuard({store,secret:env.AGENT_SIGNING_SECRET,dailyTokens:config.dailyTokens,monthlyCny:config.monthlyCny,rate:config.rate,enabled:()=>env.AGENT_ENABLED==='1',allowDevelopment:true});
  const complete=createModelAgent({apiKey:env.AGENT_MODEL_KEY,model:env.AGENT_MODEL,provider:config.provider,baseURL:config.baseURL});
  const exchanges=[];
  for(const [index,input] of turns.entries()) {
    const requestId=randomUUID(),signal=AbortSignal.timeout(45000);let calls=0;
    await guard.beginDevelopment(requestId);
    try {
      const paid=createPaidCompletion({guard,requestId,complete,signal,beforeCall:()=>{calls++;}});
      const answer=await runContentAgent({...input,corpus,history:exchanges.slice(-6),earlierHistory:exchanges.slice(0,-6),complete:paid,signal,onEvent:event=>{
        if(event.type==='status')process.stdout.write(JSON.stringify({turn:index+1,...event})+'\n');
      }});
      exchanges.push({role:'user',content:JSON.stringify({...input,openingContext:resolveOpeningContext(input.openingContext,input.language)})},{role:'assistant',content:rememberAgentAnswer(answer)});
      process.stdout.write(JSON.stringify({turn:index+1,calls,answer})+'\n');
    } finally {await guard.finish(requestId);}
  }
} catch(error) {
  // Never print provider bodies, configuration, credentials, or arbitrary exception text.
  process.stderr.write(JSON.stringify({error:error instanceof AgentError?error.code:'development_test_failed'})+'\n');process.exitCode=1;
} finally {store?.close?.();}
