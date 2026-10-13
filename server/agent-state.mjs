import { createHmac, randomUUID, timingSafeEqual, createHash } from 'node:crypto';
export class AgentError extends Error { constructor(status, code) { super(code); this.status=status; this.code=code; } }
const fail = (status,code) => { throw new AgentError(status,code); };
export const initialState = () => ({version:1,clock:0,day:'',spent:0,sessions:{},rates:{},replays:{},leases:{},reservations:{}});
export class MemoryAgentStore {
  shared=false;
  state=initialState();
  async transaction(fn) { const copy=structuredClone(this.state); const result=fn(copy); this.state=copy; return result; }
}
// CAS compares the entire versioned value, so callbacks must be synchronous and side-effect free.
export class RedisAgentStore {
  shared=true;
  constructor({url,token,key='portfolio:agent:v2',fetchImpl=fetch}) {
    if(new URL(url).protocol!=='https:') throw new Error('HTTPS required');
    Object.assign(this,{url,token,key,fetchImpl});
  }
  async command(command) {
    const r=await this.fetchImpl(this.url,{method:'POST',redirect:'error',signal:AbortSignal.timeout(4000),headers:{Authorization:`Bearer ${this.token}`,'Content-Type':'application/json'},body:JSON.stringify(command)});
    if(!r.ok) fail(503,'unavailable');
    const data=await r.json(); if(data.error) fail(503,'unavailable'); return data.result;
  }
  async initialize() { await this.command(['SET',this.key,JSON.stringify(initialState()),'NX']); }
  async transaction(fn) {
    for(let i=0;i<12;i++) {
      const raw=await this.command(['GET',this.key]); if(typeof raw!=='string') fail(503,'unavailable');
      const state=JSON.parse(raw); if(state.version!==1 || (!Number.isSafeInteger(state.spent) || state.spent<0) || !state.sessions || !state.reservations) fail(503,'unavailable');
      const result=fn(state);
      const changed=await this.command(['EVAL',"if redis.call('GET',KEYS[1]) == ARGV[1] then redis.call('SET',KEYS[1],ARGV[2]); return 1 else return 0 end",'1',this.key,raw,JSON.stringify(state)]);
      if(changed===1) return result;
    }
    fail(503,'unavailable');
  }
}
export function createGuard({store,secret,dailyTokens=0,monthlyCny,rate,enabled=()=>false,now=Date.now}) {
  if(typeof secret!=='string' || secret.length<32) throw new Error('Signing secret must be at least 32 characters');
  const moneyEnabled=monthlyCny!==undefined,monthlyLimit=monthlyCny*1000000;
  if(moneyEnabled && (!Number.isSafeInteger(monthlyLimit) || monthlyLimit<=0 || monthlyLimit>500000000 || !Number.isSafeInteger(rate) || rate<=0 || rate>100000))throw new Error('Invalid money budget');
  const mac = text=>createHmac('sha256',secret).update(text).digest('base64url');
  const addressKey = address=>mac(`address:${address}`);
  const tx=fn=>store.transaction(s=>{
    const t=now(), day=new Date(t).toISOString().slice(0,10);
    if(!enabled() || !Number.isSafeInteger(dailyTokens) || dailyTokens<=0 || t<s.clock) fail(503,'unavailable');
    s.clock=t;
    if(s.day!==day) {s.day=day;s.spent=0;}
    for(const map of ['sessions','rates','replays','leases','reservations']) for(const [key,value] of Object.entries(s[map])) if(value.expiresAt<=t) delete s[map][key];
    return fn(s,t);
  });
  const rateLimit=(s,key,max,window,t)=>{
    const r=s.rates[key] ||= {used:0,expiresAt:t+window};
    if(r.used>=max) fail(429,'rate_limited'); r.used++;
  };
  function parse(token) {
    if(typeof token!=='string' || token.length>300) fail(401,'invalid_session');
    const [id,expires,signature,...rest]=token.split('.'), expected=mac(`${id}.${expires}`);
    if(rest.length || !signature || signature.length!==expected.length || !timingSafeEqual(Buffer.from(signature),Buffer.from(expected)) || Number(expires)<=now()) fail(401,'invalid_session');
    return id;
  }
  return {store, addressKey,
    async challengeAttempt(address,token) {return tx((s,t)=>{
      rateLimit(s,`issue:${addressKey(address)}`,5,3600000,t); rateLimit(s,'issue:global',100,86400000,t);
      const key=createHash('sha256').update(token).digest('hex'); if(s.replays[key]) fail(403,'challenge_failed'); s.replays[key]={expiresAt:t+300000};
    });},
    async issue() {const id=randomUUID(); return tx((s,t)=>{
      const expiresAt=t+3600000; s.sessions[id]={expiresAt,history:[],day:s.day,turns:0};
      return {sessionToken:`${id}.${expiresAt}.${mac(`${id}.${expiresAt}`)}`,expiresAt};
    });},
    async begin(token,address,requestId) {const id=parse(token); return tx((s,t)=>{
      const session=s.sessions[id]; if(!session) fail(401,'invalid_session');
      if(Object.values(s.leases).some(l=>l.sessionId===id) || Object.keys(s.leases).length>=2) fail(429,'rate_limited');
      rateLimit(s,`turn:${id}`,6,60000,t); rateLimit(s,`address:${addressKey(address)}`,12,60000,t);
      if(session.day!==s.day) {session.day=s.day;session.turns=0;}
      if(session.turns>=20) fail(429,'rate_limited'); session.turns++;
      s.leases[requestId]={sessionId:id,expiresAt:t+60000}; return {sessionId:id,history:session.history};
    });},
    async finish(requestId,exchange) {return tx(s=>{
      const lease=s.leases[requestId]; if(exchange && lease && s.sessions[lease.sessionId]) s.sessions[lease.sessionId].history=[...s.sessions[lease.sessionId].history,...exchange].slice(-6);
      delete s.leases[requestId];
    });},
    async reserve(requestId,amount) {const id=randomUUID(); return tx((s,t)=>{
      if(!s.leases[requestId] || !Number.isSafeInteger(amount) || amount<1) fail(503,'unavailable');
      if(s.spent+amount>dailyTokens) fail(429,'budget_exhausted');
      const moneyMonth=new Date(t+8*3600000).toISOString().slice(0,7),money=amount*rate;
      if(moneyEnabled) {
        s.money ||= {};
        const spent=s.money[moneyMonth] ?? 0;
        if(!Number.isSafeInteger(spent) || spent<0 || !Number.isSafeInteger(money))fail(503,'unavailable');
        if(spent+money>monthlyLimit)fail(429,'budget_exhausted');
        s.money[moneyMonth]=spent+money;
      }
      s.spent+=amount; s.reservations[id]={amount,day:s.day,...(moneyEnabled?{moneyMonth,money,rate}:{}),expiresAt:t+86400000}; return id;
    });},
    async reconcile(id,actual) {return tx(s=>{
      const r=s.reservations[id]; if(!r) fail(503,'unavailable');
      if(Number.isSafeInteger(actual) && actual>=0 && actual<=r.amount && r.day===s.day) s.spent-=r.amount-actual;
      if(r.moneyMonth && Number.isSafeInteger(actual) && actual>=0 && actual<=r.amount) {
        const spent=s.money?.[r.moneyMonth];
        if(!Number.isSafeInteger(spent) || spent<r.money)fail(503,'unavailable');
        s.money[r.moneyMonth]-=(r.amount-actual)*r.rate;
      }
      delete s.reservations[id];
    });}
  };
}
