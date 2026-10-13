let scriptPromise;
function loadWidget(document) {
  if(window.turnstile)return Promise.resolve(window.turnstile);
  if(scriptPromise)return scriptPromise;
  scriptPromise=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
    const timeout=setTimeout(()=>{script.remove();reject(new Error('challenge_unavailable'));},15000);
    script.addEventListener('load',()=>{clearTimeout(timeout);window.turnstile?resolve(window.turnstile):reject(new Error('challenge_unavailable'));},{once:true});
    script.addEventListener('error',()=>{clearTimeout(timeout);script.remove();reject(new Error('challenge_unavailable'));},{once:true});
    document.head.append(script);
  }).catch(error=>{scriptPromise=null;throw error;});
  return scriptPromise;
}

// Loaded only after a visitor submits a real AI question, never on page load or play.
export async function verifyVisitor(document, container, sitekey, signal) {
  if(!sitekey)throw new Error('challenge_unavailable');
  signal?.throwIfAborted();
  const turnstile=await new Promise((resolve,reject)=>{
    const abort=()=>reject(new DOMException('Cancelled','AbortError'));
    signal?.addEventListener('abort',abort,{once:true});
    loadWidget(document).then(resolve,reject).finally(()=>signal?.removeEventListener('abort',abort));
  });
  signal?.throwIfAborted();
  return new Promise((resolve,reject)=>{
    let widget,done=false;
    const cleanup=()=>{clearTimeout(timeout);signal?.removeEventListener('abort',abort);if(widget!==undefined)turnstile.remove(widget);container.replaceChildren();};
    const finish=(error,value)=>{if(done)return;done=true;cleanup();error?reject(error):resolve(value);};
    const abort=()=>finish(new DOMException('Cancelled','AbortError'));
    const timeout=setTimeout(()=>finish(new Error('challenge_timeout')),120000);
    signal?.addEventListener('abort',abort,{once:true});
    try {
      widget=turnstile.render(container,{sitekey,action:'agent_session',theme:'light',appearance:'interaction-only',
        callback:token=>finish(null,token),'error-callback':()=>{finish(new Error('challenge_failed'));return true;},'expired-callback':()=>finish(new Error('challenge_expired'))});
      if(done && widget!==undefined)turnstile.remove(widget);
    } catch {finish(new Error('challenge_unavailable'));}
  });
}
