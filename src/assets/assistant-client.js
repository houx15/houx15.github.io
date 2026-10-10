import { knowledge } from './knowledge.js';
const allowedSources=new Set(knowledge.flatMap(fact=>fact.sources.map(source=>source.url)));
export function validOrigin(origin) {
  if(!origin) return false;
  try {const url=new URL(origin);return url.origin===origin && (url.protocol==='https:' || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin));} catch{return false;}
}
export function createLiveClient(origin, fetchImpl=fetch) {
  if(!validOrigin(origin)) throw new Error('invalid_configuration');
  return async function request(input) {
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
    try {
      const response=await fetchImpl(`${origin}/v1/assistant`,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',signal:controller.signal,body:JSON.stringify(input)});
      if(!response.ok) throw new Error(response.status===429?'rate_limit':'unavailable');
      const result=await response.json();
      if(result.mode!=='live'||result.kind!==input.kind||typeof result.text!=='string'||!result.text.trim()||result.text.length>10000||!Array.isArray(result.sources)||result.sources.length>10||result.sources.some(source=>!allowedSources.has(source.url)||typeof source.label!=='string'||source.label.length>150)) throw new Error('invalid_response');
      return result;
    } catch(error) {
      if(controller.signal.aborted) throw new Error('timeout');
      throw error;
    } finally {clearTimeout(timer);}
  };
}
