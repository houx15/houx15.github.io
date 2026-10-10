import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { generate, validateInput, PublicError } from './assistant.mjs';
import { createLimiter, openBudget } from './budget.mjs';

export function readConfig(env=process.env) {
  const origin=env.PORTFOLIO_ORIGIN || 'https://houx15.github.io';
  const parsed=new URL(origin);
  if(parsed.origin!==origin || (parsed.protocol!=='https:' && !/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))) throw new Error('Invalid PORTFOLIO_ORIGIN');
  const dailyLimit=Number(env.PORTFOLIO_DAILY_REQUESTS || 0);
  if(!Number.isInteger(dailyLimit)||dailyLimit<0||dailyLimit>1000) throw new Error('Invalid daily limit');
  const model=env.PORTFOLIO_MODEL || '';
  if(model && !/^[a-zA-Z0-9._-]{1,100}$/.test(model)) throw new Error('Invalid model');
  return {origin, model, apiKey:env.DEEPSEEK_API_KEY || '', dailyLimit, budgetFile:env.PORTFOLIO_BUDGET_FILE || '', host:env.PORTFOLIO_BIND || '127.0.0.1', port:Number(env.PORT || 8787)};
}
async function readBody(request) {
  let bytes=0;const chunks=[];
  for await(const chunk of request) { bytes+=chunk.length;if(bytes>2048) throw new PublicError(413,'request_too_large');chunks.push(chunk); }
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new PublicError(400,'invalid_json');}
}
export function createAssistantServer(config, { budget, generateImpl=generate, limiter=createLimiter() }={}) {
  const ready=Boolean(config.apiKey && config.model && config.dailyLimit>0 && budget);
  const server=http.createServer(async(request,response)=>{
    const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Vary':'Origin'};
    if(request.headers.origin===config.origin) headers['Access-Control-Allow-Origin']=config.origin;
    function send(status,data){response.writeHead(status,headers);response.end(JSON.stringify(data));}
    let release;
    try {
      if(request.url==='/health' && request.method==='GET') return send(ready?200:503,{available:ready,mode:ready?'configured':'disabled',provider:'DeepSeek'});
      if(request.url!=='/v1/assistant') throw new PublicError(404,'not_found');
      if(request.headers.origin!==config.origin) throw new PublicError(403,'origin_denied');
      if(request.method==='OPTIONS') {
        headers['Access-Control-Allow-Methods']='POST';headers['Access-Control-Allow-Headers']='Content-Type';headers['Access-Control-Max-Age']='600';
        response.writeHead(204,headers);return response.end();
      }
      if(request.method!=='POST') throw new PublicError(405,'method_not_allowed');
      if(!/^application\/json(?:;|$)/i.test(request.headers['content-type']||'')) throw new PublicError(415,'json_required');
      if(Number(request.headers['content-length'])>2048) throw new PublicError(413,'request_too_large');
      if(!ready) throw new PublicError(503,'not_configured');
      // Deliberately ignore spoofable X-Forwarded-For. A proxy shares its limit.
      release=limiter.enter(request.socket.remoteAddress || 'unknown');
      const input=validateInput(await readBody(request));
      budget.reserve(); // Count attempts before making paid calls; never retry automatically.
      const result=await generateImpl(input,{apiKey:config.apiKey,model:config.model});
      send(200,result);
    } catch(error) {
      const safe=error instanceof PublicError ? error : new PublicError(500,'service_error');
      if(safe.status===429) headers['Retry-After']=safe.code==='daily_limit'?'3600':'60';
      if(!response.headersSent && !response.destroyed) send(safe.status,{error:safe.code});
    } finally { release?.(); }
  });
  server.requestTimeout=10000;server.headersTimeout=5000;server.timeout=20000;server.maxHeadersCount=30;server.maxRequestsPerSocket=50;
  return server;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const config=readConfig();let budget;
  if(config.apiKey && config.model && config.dailyLimit>0 && config.budgetFile) {
    try{budget=openBudget(config.budgetFile,config.dailyLimit);}catch{console.error('Budget unavailable; service remains disabled. Check the persistent ledger and single-process lock.');}
  }
  const server=createAssistantServer(config,{budget});
  server.listen(config.port,config.host,()=>console.log(`Portfolio service listening on ${config.host}:${config.port}; ${budget?'configured':'disabled'}.`));
  const stop=()=>server.close(()=>{budget?.close();process.exit(0);});
  process.once('SIGINT',stop);process.once('SIGTERM',stop);
}
