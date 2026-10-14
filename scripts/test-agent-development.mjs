import {agentFailureRecord} from '../server/agent-diagnostics.mjs';
import { validatePageContext } from '../server/agent-page-context.mjs';
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
import {createDevelopmentStream,readDevelopmentStreamInput,parseDevelopmentContext} from '../server/development-stream.mjs';
const contextStream=process.argv.includes('--context-stream');
const streaming=contextStream || process.argv.includes('--stream'),disconnect=new AbortController();
const stream=streaming?createDevelopmentStream(text=>process.stdout.write(text)):null;
process.stdout.on('error',()=>disconnect.abort());
let store,currentTurn=0,currentModelCalls=0,currentPartial=false;
try {
  const env=process.env,config=inspectAgentConfig(env);
  if(config.issues.length || !config.enabled) throw new Error('Invalid runtime configuration');
  let raw='';
  if(streaming)raw=await readDevelopmentStreamInput(process.stdin,disconnect,contextStream?1024*1024:8192);
  else for await(const chunk of process.stdin){raw+=chunk;if(Buffer.byteLength(raw)>8192)throw new Error('Input too large');}
  const envelope=contextStream?parseDevelopmentContext(raw):{turns:JSON.parse(raw),history:[]};
  const turns=envelope.turns;
  if(!Array.isArray(turns) || !turns.length || turns.length>6)throw new Error('Expected 1–6 turns');
  if(streaming && turns.length!==1)throw new Error('Streaming accepts one turn');
  const corpus=JSON.parse(await fs.readFile(config.corpusFile,'utf8'));
  for(const input of turns) {
    if(!input || typeof input!=='object' || Object.keys(input).some(k=>!['question','language','pageContext','openingContext'].includes(k)) || typeof input.question!=='string' || !input.question.trim() || input.question.length>400 || !['en','zh-CN'].includes(input.language))throw new Error('Invalid test turn');
    resolveOpeningContext(input.openingContext,input.language);
    input.pageContext=validatePageContext(input.pageContext,corpus);
  }
  store=config.storeKind==='sqlite'
    ?new (await import('../server/agent-sqlite.mjs')).SQLiteAgentStore({path:env.AGENT_SQLITE_PATH})
    :new RedisAgentStore({url:env.AGENT_REDIS_URL,token:env.AGENT_REDIS_TOKEN});
  const guard=createGuard({store,secret:env.AGENT_SIGNING_SECRET,dailyTokens:config.dailyTokens,monthlyCny:config.monthlyCny,rate:config.rate,enabled:()=>env.AGENT_ENABLED==='1',allowDevelopment:true});
  const providerComplete=createModelAgent({apiKey:env.AGENT_MODEL_KEY,model:env.AGENT_MODEL,provider:config.provider,baseURL:config.baseURL});
  // Fixed categories only; includes failures recovered inside the agent loop.
  let attempt=0;
  const complete=async args=>{
    const modelCall=++attempt;
    try {return await providerComplete(args);}
    catch(error) {
      const {category,detail,providerPhase}=agentFailureRecord({error});
      process.stderr.write(JSON.stringify({event:'development_model_failure',modelCall,category,...(detail?{detail}:{}),...(providerPhase?{providerPhase}:{})})+'\n');
      throw error;
    }
  };
  const exchanges=envelope.history;
  for(const [index,input] of turns.entries()) {
    currentTurn=index+1;currentModelCalls=0;currentPartial=false;
    const requestId=randomUUID(),signal=AbortSignal.any([AbortSignal.timeout(45000),disconnect.signal]);let calls=0;
    signal.throwIfAborted();
    await guard.beginDevelopment(requestId);
    try {
      const paid=createPaidCompletion({guard,requestId,complete,signal,beforeCall:()=>{calls++;currentModelCalls=calls;stream?.event({type:'status',phase:'model_started'});}});
      const answer=await runContentAgent({...input,supportsConceptFlow:true,corpus,history:exchanges.slice(-6),earlierHistory:exchanges.slice(0,-6),complete:paid,signal,onEvent:event=>{
        if(stream && ['block','answer_delta'].includes(event.type))currentPartial=true;
        if(stream)stream.event(event);
        else if(event.type==='status')process.stdout.write(JSON.stringify({turn:index+1,...event})+'\n');
      }});
      exchanges.push({role:'user',content:JSON.stringify({...input,openingContext:resolveOpeningContext(input.openingContext,input.language)})},{role:'assistant',content:rememberAgentAnswer(answer)});
      if(stream)stream.complete(answer);
      else process.stdout.write(JSON.stringify({turn:index+1,calls,answer})+'\n');
    } finally {await guard.finish(requestId);}
  }
} catch(error) {
  // Never print provider bodies, configuration, credentials, or arbitrary exception text.
  process.stderr.write(JSON.stringify({...agentFailureRecord({stage:'agent',modelCalls:currentModelCalls,partial:currentPartial,error}),event:'development_run_failure',turn:currentTurn})+'\n');
  if(stream){try{stream.fail(error instanceof AgentError?error.code:'unavailable');}catch{}}
  process.stderr.write(JSON.stringify({error:error instanceof AgentError?error.code:'development_test_failed'})+'\n');process.exitCode=1;
} finally {store?.close?.();if(streaming)process.stdin.destroy();}
