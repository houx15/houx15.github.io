import { createAgentClient } from './agent-stream.js';
import { verifyVisitor } from './visitor-check.js';
import { agentOrigin, turnstileSiteKey } from './assistant-config.js';

// Only text nodes in the existing, reviewed document are mutable. Provider HTML
// is never parsed; links, code, equations, media and heading IDs remain untouched.
export function translationTargets(article, document) {
  const nodes=new Map();
  for(const [id,selector] of [['title','.article-heading h1'],['summary','.article-summary']]) {
    const element=article.querySelector(selector);
    if(element?.textContent.trim())nodes.set(id,{get:()=>element.textContent,set:value=>{element.textContent=value;}});
  }
  const prose=article.querySelector('.prose');
  const walker=document.createTreeWalker(prose,4);let node,index=0;
  while((node=walker.nextNode())) {
    if(!node.data.trim() || node.parentElement.closest('pre,code,.katex,script,style,svg'))continue;
    const target=node;
    nodes.set(`t${index++}`,{get:()=>target.data,set:value=>{target.data=value;}});
  }
  return nodes;
}

export function matchTranslationSource(nodes, supplied) {
  if(nodes.size!==supplied.length)throw new Error('translation_source_changed');
  for(const item of supplied)if(!nodes.has(item.id)||nodes.get(item.id).get()!==item.text)throw new Error('translation_source_changed');
}

export function initArticleTranslation(root, document, win=window) {
  const article=root.closest('article'), prose=article.querySelector('.prose');
  const nodes=translationTargets(article,document), original=new Map([...nodes].map(([id,node])=>[id,node.get()]));
  const button=root.querySelector('[data-translate]'), originalButton=root.querySelector('[data-original]'), cancel=root.querySelector('[data-translation-cancel]');
  const status=root.querySelector('[data-translation-status]'), challenge=root.querySelector('[data-translation-challenge]'), notice=root.querySelector('[data-translation-notice]');
  const zh=root.dataset.uiLanguage==='zh-CN', target=root.dataset.sourceLanguage==='zh-CN'?'en':'zh-CN';
  let controller,translated=null,total=0,received=0;
  const toc=article.querySelector('.toc');
  const originalTOC=toc?[...toc.querySelectorAll('a')].map(link=>[link,link.textContent]):[];
  function display(values,translation) {
    for(const [id,text] of values)nodes.get(id).set(text);
    prose.lang=translation?target:root.dataset.sourceLanguage;
    article.querySelector('.article-heading h1').lang=prose.lang;
    article.querySelector('.article-summary').lang=prose.lang;
    for(const [link,text] of originalTOC) {
      let heading;try{heading=document.getElementById(decodeURIComponent(link.hash.slice(1)));}catch{}
      link.textContent=translation&&heading?heading.textContent:text;
    }
    originalButton.hidden=!translation;notice.hidden=!translation;
    button.textContent=translation?(zh?'重新显示译文':'Show translation'):(zh?`全文翻译 · ${target==='en'?'English':'中文'}`:`Translate full article · ${target==='en'?'English':'中文'}`);
    button.disabled=translation;
    root.dataset.translated=String(translation);
  }
  function busy(value) {button.disabled=value;cancel.hidden=!value;root.setAttribute('aria-busy',String(value));}
  function message(error) {
    if(error==='translation_source_changed')return zh?'文章已更新，请刷新页面后再翻译。':'The article changed. Refresh the page before translating.';
    if(error==='rate_limited'||error.includes('budget'))return zh?'翻译额度暂时用完，请稍后再试。原文仍可阅读。':'Translation is temporarily at its usage limit. The original remains available.';
    if(error.startsWith('challenge'))return zh?'真人验证未完成，请重试。':'Visitor verification did not complete. Please try again.';
    return zh?'翻译未完成，原文保持不变。可以重试，已完成部分会尽量复用。':'Translation did not finish. The original is unchanged. Retry to reuse available cached progress.';
  }
  originalButton.addEventListener('click',()=>{display(original,false);status.textContent='';});
  cancel.addEventListener('click',()=>controller?.abort());
  button.addEventListener('click',async()=>{
    if(translated){display(translated,true);status.textContent=zh?'全文翻译完成。':'Full translation complete.';return;}
    const pending=new Map();controller=new AbortController();const signal=controller.signal;busy(true);total=received=0;
    try {
      let sessionStore;try{if(win.location.protocol==='https:')sessionStore=win.sessionStorage;}catch{}
      const client=createAgentClient(agentOrigin,fetch,{sessionStore});
      if(!client.hasSession()) {
        status.textContent=zh?'确认访客身份，无需登录。':'Verifying this visitor; no login required.';challenge.hidden=false;
        const token=await verifyVisitor(document,challenge,turnstileSiteKey,signal);
        await client.openSession(token,signal);challenge.hidden=true;
      }
      status.textContent=zh?'正在准备全文翻译…':'Preparing the full translation…';
      await client.translate({documentId:root.dataset.documentId,targetLanguage:target},{signal,onEvent:event=>{
        if(event.type==='translation_start') {
          if(event.documentId!==root.dataset.documentId||event.targetLanguage!==target)throw new Error('translation_invalid');
          matchTranslationSource(nodes,event.nodes);total=event.nodes.length;
        } else if(event.type==='translation_node') {pending.set(event.nodeId,event.text);received++;}
        if(event.type==='translation_start'||event.type==='translation_node')status.textContent=zh?`正在翻译 ${received} / ${total} 段；原文可继续阅读。`:`Translating ${received} / ${total} text segments. You can keep reading the original.`;
      }});
      signal.throwIfAborted();translated=pending;busy(false);display(translated,true);
      status.textContent=zh?'全文翻译完成。':'Full translation complete.';
    } catch(error) {
      busy(false);display(original,false);
      status.textContent=signal.aborted?(zh?'已取消翻译。原文保持不变。':'Translation cancelled. The original is unchanged.'):message(error.message||'unavailable');
    } finally {challenge.hidden=true;challenge.replaceChildren();cancel.hidden=true;root.setAttribute('aria-busy','false');controller=null;}
  });
  root.hidden=false;
  win.addEventListener('pagehide',()=>controller?.abort());
}
if(typeof document!=='undefined')document.querySelectorAll('[data-article-translation]').forEach(root=>initArticleTranslation(root,document));
