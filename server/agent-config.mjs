import { modelEndpoint } from './agent-endpoint.mjs';
// Validation returns field names, never supplied values or credentials.
export function inspectAgentConfig(env) {
  const issues=[];
  const requireText=name=>{if(typeof env[name]!=='string' || !env[name].trim())issues.push(`${name}: required`);};
  for(const name of ['AGENT_MODEL_KEY','AGENT_MODEL','AGENT_TURNSTILE_SECRET'])requireText(name);
  if(typeof env.AGENT_SIGNING_SECRET!=='string' || env.AGENT_SIGNING_SECRET.length<32)issues.push('AGENT_SIGNING_SECRET: at least 32 random characters required');
  const origin=env.AGENT_ORIGIN || 'https://houx15.github.io';
  try {const u=new URL(origin);if(u.protocol!=='https:' || u.origin!==origin || u.username || u.password)throw 0;}catch{issues.push('AGENT_ORIGIN: exact HTTPS origin required');}
  const storeKind=env.AGENT_STORE || 'redis';
  if(!['redis','sqlite'].includes(storeKind))issues.push('AGENT_STORE: redis or sqlite required');
  if(storeKind==='sqlite' && (typeof env.AGENT_SQLITE_PATH!=='string' || !env.AGENT_SQLITE_PATH.startsWith('/')))issues.push('AGENT_SQLITE_PATH: absolute private path required');
  if(storeKind==='redis') {
  requireText('AGENT_REDIS_TOKEN');
  try {const u=new URL(env.AGENT_REDIS_URL);if(u.protocol!=='https:' || u.username || u.password || u.hash || u.search)throw 0;}catch{issues.push('AGENT_REDIS_URL: HTTPS endpoint without embedded credentials required');}
  }
  const dailyTokens=Number(env.AGENT_DAILY_TOKENS || 0);
  if(!Number.isSafeInteger(dailyTokens) || dailyTokens<=0)issues.push('AGENT_DAILY_TOKENS: positive integer required');
  const provider=env.AGENT_PROVIDER || 'deepseek',baseURL=env.AGENT_BASE_URL;
  try {modelEndpoint(provider,baseURL);}catch{issues.push('AGENT_PROVIDER / AGENT_BASE_URL: supported provider endpoint required');}
  const monthlyCny=Number(env.AGENT_MONTHLY_CNY || 0),rate=Number(env.AGENT_MAX_CNY_PER_MTOKENS || 0);
  if(!Number.isFinite(monthlyCny) || monthlyCny<=0 || monthlyCny>500 || !Number.isSafeInteger(monthlyCny*1000000))issues.push('AGENT_MONTHLY_CNY: positive amount no greater than the approved 500 CNY required');
  if(!Number.isFinite(rate) || rate<=0 || rate>100000 || env.AGENT_PRICED_MODEL!==env.AGENT_MODEL)issues.push('AGENT_MAX_CNY_PER_MTOKENS / AGENT_PRICED_MODEL: reviewed upper-bound price for the selected model required');
  const port=Number(env.AGENT_PORT || 8788),bind=env.AGENT_BIND || '127.0.0.1';
  if(!Number.isInteger(port) || port<1 || port>65535)issues.push('AGENT_PORT: valid TCP port required');
  if(!['127.0.0.1','0.0.0.0','::1'].includes(bind))issues.push('AGENT_BIND: supported listen address required');
  if(env.AGENT_TRUST_LOOPBACK_PROXY && !['0','1'].includes(env.AGENT_TRUST_LOOPBACK_PROXY))issues.push('AGENT_TRUST_LOOPBACK_PROXY: use 0 or 1');
  if(env.AGENT_TRUST_LOOPBACK_PROXY==='1' && !['127.0.0.1','::1'].includes(bind))issues.push('AGENT_TRUST_LOOPBACK_PROXY: loopback bind required');
  if(env.AGENT_ENABLED && !['0','1'].includes(env.AGENT_ENABLED))issues.push('AGENT_ENABLED: use 0 or 1');
  return {issues,trustLoopbackProxy:env.AGENT_TRUST_LOOPBACK_PROXY==='1',storeKind,provider,baseURL,monthlyCny,rate:Math.ceil(rate),enabled:env.AGENT_ENABLED==='1',origin,dailyTokens,port,bind,corpusFile:env.AGENT_CORPUS_FILE || '_site/assets/agent-corpus.json'};
}
