import { storyCards, nextStory, chooseOpening, openingCopy } from './companion-stories.js';
import { answerQuestion } from './knowledge.js';
import { milestones } from './biography.js';
import { createContentTools } from './agent-tools.js';
import { initialQuestion } from './navigation.js';
import { agentOrigin, turnstileSiteKey } from './assistant-config.js';
import { createAgentClient, validateAgentBlock } from './agent-stream.js';
import { createAgentTurn, agentFailureMessage } from './agent-view.js';
import { verifyVisitor } from './visitor-check.js';
import { validateSavedTurn } from './agent-history.js';

const safeSource = url => typeof url === 'string' && !/[\\\u0000-\u001f]/.test(url) && (/^\/(?!\/)[^\s]*$/.test(url) || /^https:\/\/github\.com\/houx15(?:\/|$)/.test(url));
export function initCompanion(document) {
  for (const line of document.querySelectorAll('[data-typewriter]')) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) continue;
    const text = line.textContent; line.textContent=''; let count=0;
    const type = () => { if (!line.isConnected) return;line.textContent=text.slice(0,++count);if(count<text.length)setTimeout(type,95); };
    setTimeout(type,450);
  }
  const root = document.querySelector('[data-companion]'); if (!root) return;
  const zh = document.documentElement.lang === 'zh-CN', language = zh ? 'zh-CN' : 'en';
  const log = root.querySelector('[data-companion-log]'), status = root.querySelector('[data-companion-status]');
  const form = root.querySelector('form'), input = form.querySelector('textarea');
  const mascot = root.querySelector('[data-poke]'), hello = root.querySelector('[data-hello]');
  const dialog = document.querySelector('#companion-dialog'), launcher = document.querySelector('[data-companion-open]');
  const storageKey = `companion-opening-v1:${language}`;
  let sessionStore;try {if(location.protocol==='https:')sessionStore=sessionStorage;}catch{}
  let liveClient;try { if(agentOrigin && turnstileSiteKey)liveClient=createAgentClient(agentOrigin,fetch,{sessionStore}); } catch { /* Invalid public deployment config fails closed. */ }
  const idle = liveClient ? (zh?'AI 会参考公开资料回答，也可能出错。':'AI answers from public sources and can make mistakes.') : (zh ? '开场试玩 · AI 自由对话尚未接通' : 'Opening experience · live AI conversation not yet connected');
  const seen = []; let history = [], busy = false, corpusPromise, activeController, lastLiveTurn;
  const stopButton=root.querySelector('[data-stop-answer]'), sendButton=form.querySelector('[type=submit]');
  let opening, returnToComposer = false;
  function resetOpening() {
    opening=chooseOpening({article:root.dataset.article==='true'});
    root.querySelector('[data-opening-label]').textContent=openingCopy[language][opening].action;
    root.querySelector('.comic-die').style.display=opening==='dice'?'':'none';
    root.querySelector('[data-invitation]').textContent=opening==='read'
      ? (zh?`读到《${root.dataset.pageTitle}》了？我陪你。`:`Reading “${root.dataset.pageTitle}”? I’m here with you.`)
      : openingCopy[language][opening].prompt;
  }
  resetOpening();
  status.textContent = idle;
  const local = url => zh && url.startsWith('/') && !url.startsWith('/zh/') ? `/zh${url}` : url;
  const el = (tag, text, className = '') => {const node = document.createElement(tag);node.textContent = text;node.className = className;return node;};
  const add = (parent, tag, text, className) => { const node = el(tag,text,className);parent.append(node);return node; };
  const save = () => { try { sessionStorage.setItem(storageKey,JSON.stringify(history.slice(-10))); } catch { /* Storage is optional. */ } };
  const animate = name => { mascot.classList.remove('is-poked','is-rolling');void mascot.offsetWidth;mascot.classList.add(name); };
  mascot.addEventListener('animationend', () => mascot.classList.remove('is-poked','is-rolling'));
  function setBusy(value, text = idle) {
    const focused=document.activeElement;
    if(value) returnToComposer=Boolean(activeController) && root.contains(focused) && ['BUTTON','TEXTAREA'].includes(focused.tagName);
    const restore=returnToComposer && (focused===stopButton || focused===document.body);
    busy = value; root.setAttribute('aria-busy',String(value));status.textContent = text;
    root.querySelectorAll('button,textarea').forEach(button => { button.disabled = value || Boolean(button.closest('.is-incomplete')); });
    stopButton.hidden=!(value && activeController);stopButton.disabled=false;sendButton.hidden=!stopButton.hidden;
    if(value && returnToComposer && !stopButton.hidden) stopButton.focus({preventScroll:true});
    if(!value) {
      // Restore only focus we displaced; never interrupt reading or reopen a closed dialog.
      if(restore && (!dialog || dialog.open)) input.focus({preventScroll:true});
      returnToComposer=false;
    }
  }
  function sources(parent, items) {
    if (!items?.length) return;
    const details = add(parent,'details','','comic-evidence');add(details,'summary',zh?'翻到原文 ↗':'See the sources ↗');
    for(const source of items.slice(0,5)) if(safeSource(source.url)) {const link = add(details,'a',source.label);link.href = source.url;}
  }
  function render(item, remember = true) {
    if (remember) { history.push(item);history = history.slice(-10);save(); }
    root.classList.add('has-conversation');
    // A completed turn is history, not another competing set of calls to action.
    log.querySelectorAll('button').forEach(button => button.remove());
    if(item.kind==='agent') {
      const turn=createAgentTurn(document,{log,question:item.question,language,onQuestion:ask,restored:true,continuing:Boolean(liveClient?.hasSession())});
      for(const event of item.events)turn.event(event);
      return;
    }
    if(item.kind==='reading') {
      const turn=createAgentTurn(document,{log,question:zh?'陪我读这一篇':'Read this with me',language});
      turn.event({type:'answer',text:zh?'这是根据原文整理的阅读导览，还不是 AI 解读。先看开篇，再沿着章节读下去。':'This is an outline from the source, not an AI interpretation. Start with the opening, then explore its sections.',sourceIds:[]});
      turn.event({type:'block',block:item.block});turn.event({type:'done'});
      while(log.children.length>10)log.firstElementChild.remove();
      if(remember)turn.row.scrollIntoView({block:'start',behavior:'instant'});
      return;
    }
    const row = add(log,'article','','comic-message');
    if(item.question) add(row,'p',item.question,'comic-visitor');
    if(item.kind === 'dice') {
      const story = storyCards.find(card => card.id === item.id); if(!story){row.remove();return;}
      const copy = story[language];
      add(row,'p',zh?'好，这次是这一面。':'Here’s the side we landed on.','comic-reply');
      const card = add(row,'div','','comic-story-card');
      add(card,'span',`0${story.face} / 06`,'comic-card-number');add(card,'span',['⚀','⚁','⚂','⚃','⚄','⚅'][story.face-1],'comic-result-die');
      add(card,'h2',copy.title);add(card,'p',copy.text);
      sources(card,[{label:zh?'这段故事的公开资料':'Public source for this story',url:local(story.url)}]);
      const follow = add(card,'button',copy.follow+' ↗','comic-follow');follow.type='button';follow.addEventListener('click',()=>ask(copy.follow));
    } else if(item.kind === 'story') {
      add(row,'p',zh?'这些经历有时重叠。我把她公开写过的时间，画在这里。':'Some of these chapters overlap. Here are the dates she has shared.','comic-reply');
      const list = add(row,'ol','','comic-life-line');
      for(const event of milestones) {const copy=event[language];const li=add(list,'li','');add(li,'span',copy.period);add(li,'h3',copy.title);add(li,'p',copy.description);}
      sources(row,[{label:zh?'个人经历与资料来源':'Biography and sources',url:local('/about/#sources')}]);
    } else {
      add(row,'p',item.text,'comic-reply');sources(row,item.sources);
      if(root.dataset.article!=='true' && (item.sources?.length || /^(你是真人吗|Are you a real person)/.test(item.question || ''))) {
        const next = add(row,'button',zh?'再认识她的另一面 ↗':'Meet another side of her ↗','comic-follow');
        next.type='button';next.addEventListener('click',roll);
      }
    }
    while(log.children.length > 10) log.firstElementChild.remove();
    if(remember) row.scrollIntoView({block:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    return row;
  }
  function human() {
    if(busy)return;
    animate('is-poked');
    render({kind:'text',question:zh?'你是真人吗？':'Are you a real person?',text:liveClient
      ? (zh?'不是本人。我是住在这个网站里的 AI 角色，陪你认识煜欣、读她的作品和笔记。我会根据公开资料回答；没有依据的地方，也会告诉你。':'Not a person. I’m an AI character here to explore Yuxin’s work and notes with you. I’ll use public sources and tell you when I don’t have enough evidence.')
      : (zh?'不是本人。我是住在这个网站里的 AI 角色，负责陪你认识煜欣、读她的作品和笔记。现在这段见面互动是预先写好的；接通模型以后，我才能和你自由聊。':'Not a person. I’m an AI character here to help you explore Yuxin’s work and notes. This first meeting is authored in advance; open-ended conversation will arrive when the model is connected.')});
  }
  async function roll() {
    if(busy)return;
    const focusStory=root.contains(document.activeElement);
    setBusy(true,zh?'骰子落下之后，会是哪一面？':'Which side will the die land on?');animate('is-rolling');
    const story = nextStory(seen);seen.push(story.id);
    // This is the physical dice animation, not simulated model reasoning.
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches) await new Promise(resolve => setTimeout(resolve,460));
    const row=render({kind:'dice',id:story.id});setBusy(false);
    if(focusStory && document.activeElement===document.body && (!dialog || dialog.open)) {
      const heading=row.querySelector('h2');heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});
    }
  }
  async function getTools() {
    corpusPromise ||= fetch(root.dataset.index,{credentials:'omit'}).then(response=>{if(!response.ok)throw new Error('Unavailable');return response.json();})
      .then(corpus=>({corpus,tools:createContentTools(corpus)})).catch(error=>{corpusPromise=null;throw error;});
    return corpusPromise;
  }
  async function readPage() {
    if(liveClient && root.dataset.documentId)return ask(zh?'陪我读这篇文章：先解释它的核心问题，再给出一个值得继续讨论的问题。':'Read this article with me: explain its central question, then suggest one question worth exploring.');
    if(busy)return;setBusy(true,zh?'正在打开这一篇的原文…':'Opening this article…');
    try {
      const {corpus,tools} = await getTools(), doc = corpus.documents.find(item=>item.url===root.dataset.pageUrl);
      if(!doc) {render({kind:'text',text:zh?'这篇还没有进入公开资料。我不会把未发布的内容发给模型。':'This page is not in the published collection. Unpublished content is not sent to a model.'});return;}
      const block={...tools.show_reading_map({id:doc.id,sectionIds:doc.sections.slice(0,6).map(section=>section.id)}),id:'article-outline'};
      render({kind:'reading',block});
    } catch {render({kind:'text',text:zh?'这次没能打开资料。你可以继续读文章，稍后再叫我。':'I couldn’t open the source just now. Keep reading, and try me again later.'});}
    finally {setBusy(false);}
  }
  async function ask(value) {
    const question=value.trim().slice(0,400);if(!question||busy)return;
    input.value='';
    if(/^(你是真人吗[？?]?|are you (?:a )?real person[?]?)$/i.test(question)){human();return;}
    if(/^(掷骰子|roll(?: a die)?)$/i.test(question)){await roll();return;}
    if(/^(带我看看她的经历|看看她的经历|show me her story)[。.!?？]?$/i.test(question)){render({kind:'story',question});return;}
    if(liveClient) { await askLive(question);return; }
    const answer=answerQuestion(question,language);
    if(answer.id !== 'empty') {
      render({kind:'text',question,text:answer.text,sources:answer.sources});
      status.textContent=zh?'这条来自预先整理的公开资料 · 自由对话尚未接通':'From authored public-source notes · live conversation is not connected';return;
    }
    render({kind:'text',question,text:zh?'这个问题需要真正的 AI 对话，我现在还接不上。你可以先掷个骰子，或者让我带你看看她的经历；等模型接通，我们再展开聊。':'That needs a live conversation, which isn’t connected yet. For now, roll the die or explore her story; we can go further when the model is ready.'});
  }
  async function askLive(question) {
    activeController=new AbortController();const controller=activeController;
    setBusy(true,zh?'正在连接…':'Connecting…');
    root.classList.add('has-conversation');
    const turn=createAgentTurn(document,{log,question,language,onQuestion:ask,retry:lastLiveTurn});
    lastLiveTurn=turn;
    const challenge=root.querySelector('[data-visitor-check]');
    const savedEvents=[];
    try {
      if(!liveClient.hasSession()) {
        status.textContent=zh?'确认访客身份，无需注册或登录。':'Checking the visitor session. No account or login needed.';
        challenge.hidden=false;
        const token=await verifyVisitor(document,challenge,turnstileSiteKey,controller.signal);
        await liveClient.openSession(token,controller.signal);challenge.hidden=true;
      }
      await liveClient.ask({question,language,supportsConceptFlow:true,...(root.dataset.documentId?{pageContext:{documentId:root.dataset.documentId}}:{})},
        {signal:controller.signal,onEvent:event=>{
          const follow=log.scrollHeight-log.scrollTop-log.clientHeight<100;
          turn.event(event);
          if(follow)log.scrollTop=log.scrollHeight;
          if(event.type==='status')status.textContent=zh?'正在查阅资料并组织回答…':'Checking sources and preparing an answer…';
          if(['source','block','answer','done'].includes(event.type))savedEvents.push(event);
        }});
      const saved=validateSavedTurn({kind:'agent',question,events:savedEvents});
      if(saved){history.push(saved);history=history.slice(-10);save();}
    } catch(error) {
      const message=agentFailureMessage(controller.signal.aborted?'stopped':error.message,language,{partial:savedEvents.length>0});
      turn.interrupt(message);
      if(!controller.signal.aborted) input.value=question;
    } finally {challenge.hidden=true;challenge.replaceChildren();activeController=null;setBusy(false);}
  }
  form.addEventListener('submit',event=>{event.preventDefault();ask(input.value);});
  input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();form.requestSubmit();}});
  root.querySelector('[data-opening]').addEventListener('click',()=>{
    if(opening==='dice')roll();else if(opening==='human')human();else if(opening==='read')readPage();
    else render({kind:'story',question:openingCopy[language].story.action});
  });
  stopButton.addEventListener('click',()=>activeController?.abort());
  window.addEventListener('pagehide',()=>activeController?.abort());
  root.querySelector('[data-companion-reset]').addEventListener('click',()=>{liveClient?.clearSession();lastLiveTurn=null;history=[];seen.length=0;save();log.replaceChildren();root.classList.remove('has-conversation');status.textContent=idle;hello.textContent=zh?'嗨，我们重新认识一下。':'Hello. A fresh page.';resetOpening();});
  try {
    const stored=JSON.parse(sessionStorage.getItem(storageKey)||'[]');
    if(Array.isArray(stored)) for(const item of stored.slice(-10)) {
      if(!item||typeof item!=='object')continue;
      if(item.kind==='dice'&&storyCards.some(card=>card.id===item.id)){history.push(item);seen.push(item.id);render(item,false);}
      else if(item.kind==='story'){history.push({kind:'story'});render({kind:'story'},false);}
      else if(item.kind==='agent'){const safe=validateSavedTurn(item);if(safe){history.push(safe);render(safe,false);}}
      else if(item.kind==='reading' && item.block?.type==='reading_map') {
        try {validateAgentBlock(item.block);const safe={kind:'reading',block:item.block};history.push(safe);render(safe,false);} catch { /* Ignore invalid stored outlines. */ }
      }
      else if(item.kind==='text'&&typeof item.text==='string'&&item.text.length<=10000&&(!item.question||typeof item.question==='string'&&item.question.length<=400)) {
        const safe={kind:'text',text:item.text,question:item.question,sources:Array.isArray(item.sources)?item.sources.filter(source=>source&&typeof source.label==='string'&&safeSource(source.url)).slice(0,5):[]};history.push(safe);render(safe,false);
      }
    }
  } catch { /* The companion remains usable when storage is blocked or corrupt. */ }
  if(root.dataset.article==='true' && history.length) {
    // Carry the conversation across pages, but make the CURRENT article the next focus.
    log.querySelectorAll('button').forEach(button=>button.remove());
    const context = add(log,'article','','comic-message comic-context');
    add(context,'p',zh?`现在翻到《${root.dataset.pageTitle}》了。`:`We’ve opened “${root.dataset.pageTitle}”.`,'comic-reply');
    const next=add(context,'button',openingCopy[language].read.action+' ↗','comic-follow');next.type='button';next.addEventListener('click',readPage);
  }
  if(dialog&&launcher) {
    log.addEventListener('click',event=>{
      if(event.defaultPrevented || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)return;
      const link=event.target.closest('a');if(!link)return;
      const destination=new URL(link.href,location.href);
      if(destination.origin!==location.origin || destination.pathname!==location.pathname)return;
      let target;try {target=destination.hash?document.getElementById(decodeURIComponent(destination.hash.slice(1))):document.querySelector('main article');}catch{return;}
      if(!target || dialog.contains(target))return;
      event.preventDefault();dialog.close();
      requestAnimationFrame(()=>{historyReplaceHash(destination.hash);target.scrollIntoView({block:'start'});target.setAttribute('tabindex','-1');target.focus({preventScroll:true});});
    });
    launcher.addEventListener('click',()=>{dialog.showModal();document.body.classList.add('comic-open');log.scrollTop=log.scrollHeight;});
    document.querySelector('[data-companion-close]').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('close',()=>{activeController?.abort();document.body.classList.remove('comic-open');launcher.focus({preventScroll:true});});
    dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}});
  }
  if(document.body.classList.contains('chat-page')) {log.scrollTop=log.scrollHeight;const initial=initialQuestion(location.hash,language);if(initial){input.value=initial;input.focus();}}
}

function historyReplaceHash(hash) {window.history.replaceState(window.history.state,'',location.pathname+location.search+hash);}
