import { validOrigin } from './assistant-client.js';

const string = (value, max) => typeof value === 'string' && value.length > 0 && value.length <= max;
const sourceURL = value => string(value, 1500) && /^\/(?!\/)[^\s\\]*$/.test(value) && !/[\u0000-\u001f]/.test(value);
const fail = () => { throw new Error('invalid_response'); };
const card = item => item && string(item.id,400) && string(item.title,500) && typeof item.summary === 'string' && item.summary.length <= 4000 && sourceURL(item.url) && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && ['notes','reports','projects'].includes(item.type);

export function validateAgentBlock(block) {
  if (!block || !string(block.id,200) || !Array.isArray(block.items)) return fail();
  if (block.type === 'post_cards' && block.items.length <= 3 && block.items.every(card)) return block;
  if (block.type === 'concept_flow' && block.interpretation===true && string(block.title,120) && block.items.length>=2 && block.items.length<=5 && block.items.every(item=>item && string(item.title,100) && string(item.description,400) && (item.quote===undefined || string(item.quote,400)) && item.source && string(item.source.id,400) && string(item.source.label,1000) && sourceURL(item.source.url))) return block;
  if (block.type === 'reading_map' && string(block.title,500) && string(block.documentId,400) && sourceURL(block.url) && block.items.length>0 && block.items.length<=6 && block.items.every(item=>item && string(item.id,400) && typeof item.title==='string' && item.title.length<=500 && typeof item.excerpt==='string' && item.excerpt.length<=240 && sourceURL(item.url))) return block;
  if (block.type === 'publication_timeline' && block.dateKind === 'publication' && block.items.length <= 12 && block.items.every(card)) return block;
  if (block.type === 'questions' && block.items.length <= 3 && block.items.every(item => item && string(item.documentId,400) && string(item.label,500) && string(item.query,400))) return block;
  if (block.type === 'event_timeline' && block.dateKind === 'biography' && string(block.asOf,20) && block.items.length <= 20 && block.items.every(item => item && string(item.id,400) && string(item.title,500) && string(item.period,200) && string(item.description,3000) && item.source && string(item.source.id,400) && string(item.source.label,1000) && sourceURL(item.source.url))) return block;
  return fail();
}

// Streaming parser has no DOM dependency. Every event is validated before rendering.
export async function consumeAgentStream(body, onEvent, signal) {
  if (!body?.getReader) return fail();
  const reader = body.getReader(), decoder = new TextDecoder('utf-8',{fatal:true});
  let buffer = '', bytes = 0, count = 0, requestId, terminal = false, answered = false, draft='',draftIds;
  const ids = new Set(), sources = new Map();
  function frame(value) {
    if (!value.trim() || value.split('\n').every(line => !line || line.startsWith(':'))) return;
    if (terminal || ++count > 4096) return fail();
    const lines = value.split('\n');
    const field = name => lines.filter(line => line.startsWith(`${name}:`)).map(line => line.slice(name.length + 1).replace(/^ /,'')).join('\n');
    let event; try { event = JSON.parse(field('data')); } catch { return fail(); }
    if (!event || event.version !== 2 || !string(event.requestId,100) || !string(event.id,200) || event.id !== field('id') || event.type !== field('event') || ids.has(event.id)) return fail();
    if (requestId && requestId !== event.requestId) return fail();
    requestId = event.requestId; ids.add(event.id);
    switch(event.type) {
      case 'status':
        if (!['model_started','model_completed','tool_started','tool_completed'].includes(event.phase) || (event.tool !== undefined && !string(event.tool,100))) return fail();
        break;
      case 'block': validateAgentBlock(event.block); break;
      case 'source':
        if (!event.source || !string(event.source.id,400) || !string(event.source.label,1000) || !sourceURL(event.source.url)) return fail();
        if (sources.has(event.source.id) && JSON.stringify(sources.get(event.source.id)) !== JSON.stringify(event.source)) return fail();
        sources.set(event.source.id,event.source);break;
      case 'answer_delta':
        if(answered || !string(event.text,10000) || draft.length+event.text.length>10000 || !Array.isArray(event.sourceIds) || !event.sourceIds.length || event.sourceIds.length>10 || event.sourceIds.some(id=>!sources.has(id)) || (draftIds && JSON.stringify(draftIds)!==JSON.stringify(event.sourceIds)))return fail();
        draft+=event.text;draftIds=event.sourceIds;break;
      case 'answer':
        if (answered || !string(event.text,10000) || !Array.isArray(event.sourceIds) || event.sourceIds.length > 10 || event.sourceIds.some(id => !sources.has(id)) || !string(event.revision,200)) return fail();
        if(draft && (!event.text.startsWith(draft) || JSON.stringify(draftIds)!==JSON.stringify(event.sourceIds)))return fail();
        answered = true;break;
      case 'done':
        if (event.outcome !== 'complete' || !answered) return fail();terminal = true;break;
      case 'error':
        if (!string(event.code,100) || typeof event.partial !== 'boolean' || (event.resetsAt!==undefined && (!['daily_budget_exhausted','monthly_budget_exhausted'].includes(event.code) || !Number.isSafeInteger(event.resetsAt) || event.resetsAt<0 || event.resetsAt>8640000000000000))) return fail();terminal = true;break;
      default: return fail();
    }
    onEvent(event);
    if (event.type === 'error') { const error = new Error(event.code); error.partial = event.partial;error.resetsAt=event.resetsAt; throw error; }
  }
  try {
    while(true) {
      signal?.throwIfAborted();
      const {value,done} = await reader.read();
      if(done) break;
      bytes += value.byteLength;if(bytes > 1024 * 1024) return fail();
      buffer += decoder.decode(value,{stream:true});
      // Do not normalize a trailing CR before the next chunk arrives.
      buffer = buffer.replace(/\r\n/g,'\n');
      let boundary;
      while((boundary = buffer.indexOf('\n\n')) >= 0) {const value = buffer.slice(0,boundary);buffer = buffer.slice(boundary+2);frame(value);}
      if(buffer.length > 65536) return fail();
    }
    buffer += decoder.decode();
    if(buffer.trim() || !terminal) throw new Error('interrupted');
    return {requestId,sources:[...sources.values()]};
  } finally { await reader.cancel().catch(()=>{});reader.releaseLock(); }
}

export function createAgentClient(origin, fetchImpl = fetch, {sessionStore} = {}) {
  if (!validOrigin(origin)) throw new Error('invalid_configuration');
  let token, expiresAt;
  const storageKey=`portfolio-agent-session:v1:${origin}`;
  function clearSession() {token=null;expiresAt=null;try{sessionStore?.removeItem(storageKey);}catch{}}
  function validSession(value) {return value && value.version===1 && string(value.token,300) && /^[A-Za-z0-9._-]+$/.test(value.token) && Number.isFinite(value.expiresAt) && value.expiresAt>Date.now() && value.expiresAt<=Date.now()+3660000;}
  // Optional per-tab storage contains only a short-lived, quota-limited session bearer.
  // It never contains provider credentials or client-supplied model history.
  try {
    const raw=sessionStore?.getItem(storageKey);
    if(raw) {
      if(raw.length>1000)throw new Error('Invalid session record');
      const value=JSON.parse(raw);
      if(!validSession(value))throw new Error('Expired session record');
      token=value.token;expiresAt=value.expiresAt;
    }
  } catch {clearSession();}

  async function request(path, body, signal, authorization = false) {
    return fetchImpl(`${origin}${path}`,{method:'POST',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',signal,
      headers:{'Content-Type':'application/json',...(authorization?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)});
  }
  async function check(response) {
    if(response.ok) return;
    if(response.status === 401) clearSession();
    throw new Error(response.status===429?'rate_limited':response.status===401?'invalid_session':response.status===403?'challenge_failed':'unavailable');
  }
  return {
    clearSession,
    hasSession() {if(token && expiresAt>Date.now())return true;clearSession();return false;},
    async openSession(challengeToken, signal) {
      if (!string(challengeToken,2048)) throw new Error('invalid_challenge');
      const controller = new AbortController(), timer=setTimeout(()=>controller.abort(),15000);
      const combined=signal?AbortSignal.any([signal,controller.signal]):controller.signal;
      try {
        const response=await request('/v2/sessions',{challengeToken},combined);await check(response);
        const result=await response.json();
        const expiry=typeof result.expiresAt==='number'?result.expiresAt:Date.parse(result.expiresAt);
        if(!string(result.sessionToken,4096)||!Number.isFinite(expiry)||expiry<=Date.now()) return fail();
        token=result.sessionToken;expiresAt=expiry;
        try {sessionStore?.setItem(storageKey,JSON.stringify({version:1,token,expiresAt}));} catch { /* Memory-only session still works. */ }
      } finally {clearTimeout(timer);}
    },
    async ask(input,{onEvent,signal} = {}) {
      if(!token||expiresAt<=Date.now()) {clearSession();throw new Error('invalid_session');}
      const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),50000);
      const combined=signal?AbortSignal.any([signal,controller.signal]):controller.signal;
      try {
        const response=await request('/v2/agent',input,combined,true);await check(response);
        if(!response.headers.get('content-type')?.startsWith('text/event-stream')) return fail();
        return await consumeAgentStream(response.body,onEvent||(()=>{}),combined);
      } finally {clearTimeout(timer);}
    }
  };
}
