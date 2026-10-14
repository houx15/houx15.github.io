import {typeGreeting} from './companion-typewriter.js';
import {createBiographyChapter} from './biography-chapter.js';
import {confirmConversationReset} from './companion-reset.js';
import {createDiceCard} from './dice-card.js';
import {captureReadingSelection,selectionQuestion,createReadingDraftContext} from './reading-selection.js';
import { captureReadingAnchor,restoreReadingAnchor,readingHeadings,resolveReadingPosition,waitForReadingContext } from './reading-position.js?v=2';
import { storyCards, nextStory, chooseOpening, openingCopy, chooseGreeting, openingContextFor, createOpeningDraftContext } from './companion-stories.js';
import { answerQuestion } from './knowledge.js';
import { milestones } from './biography.js';
import { createContentTools } from './agent-tools.js';
import { initialQuestion } from './navigation.js';
import { agentOrigin, turnstileSiteKey } from './assistant-config.js';
import { createAgentClient, validateAgentBlock } from './agent-stream.js';
import { createAgentTurn, agentFailureMessage } from './agent-view.js';
import { presentAgentEvent,followConversationResize,bindConversationJump } from './agent-scroll.js?v=3';
import { verifyVisitor } from './visitor-check.js';
import { validateSavedTurn,recordPresentationEvent } from './agent-history.js';

const safeSource = url => typeof url === 'string' && !/[\\\u0000-\u001f]/.test(url) && (/^\/(?!\/)[^\s]*$/.test(url) || /^https:\/\/github\.com\/houx15(?:\/|$)/.test(url));
export function initCompanion(document) {
  const portal = document.querySelector('.portal-speech');
  if (portal) {
    const greeting = chooseGreeting(document.documentElement.lang);
    portal.querySelector('.portal-words').dataset.fullText = greeting;
    portal.querySelector('[data-typewriter]').textContent = greeting;
    portal.querySelector('.sr-only').textContent = greeting;
  }
  for (const line of document.querySelectorAll('[data-typewriter]')) typeGreeting(line);
  const root = document.querySelector('[data-companion]'); if (!root) return;
  const zh = document.documentElement.lang === 'zh-CN', language = zh ? 'zh-CN' : 'en';
  const log = root.querySelector('[data-companion-log]'), status = root.querySelector('[data-companion-status]');
  followConversationResize(log);
  const form = root.querySelector('form'), input = form.querySelector('textarea');
  const jump=document.createElement('button');jump.type='button';jump.className='comic-jump';jump.hidden=true;
  jump.textContent=zh?'回到最新 ↓':'Back to latest ↓';log.after(jump);
  bindConversationJump(log,jump);
  const draftContext=createReadingDraftContext(),openingDraft=createOpeningDraftContext();
  const currentOpeningContext=()=>openingContextFor(history,{article:root.dataset.article==='true'});
  function updateComposer() {
    const headings=draftContext.edit(input.value);
    if(dialog?.open && JSON.stringify(headings)!==JSON.stringify(readingLookup))loadReadingPosition(headings);
    openingDraft.edit(input.value,currentOpeningContext());
    root.classList.toggle('has-draft',Boolean(input.value.trim()));
    input.style.height='34px';
    input.style.height=`${Math.min(Math.max(34,input.scrollHeight),Math.max(58,Math.min(154,window.innerHeight*.25)))}px`;
    if(readingSection)showReadingPosition();
  }
  input.addEventListener('input',updateComposer);
  window.addEventListener('resize',updateComposer);
  // Back navigation may restore form text after module initialization.
  window.addEventListener('pageshow',()=>window.requestAnimationFrame(updateComposer));
  const mascot = root.querySelector('[data-poke]'), hello = root.querySelector('[data-hello]');
  const dialog = document.querySelector('#companion-dialog'), launcher = document.querySelector('[data-companion-open]');
  const storageKey = `companion-opening-v1:${language}`;
  let sessionStore;try {if(location.protocol==='https:')sessionStore=sessionStorage;}catch{}
  let liveClient;try { if(agentOrigin && turnstileSiteKey)liveClient=createAgentClient(agentOrigin,fetch,{sessionStore}); } catch { /* Invalid public deployment config fails closed. */ }
  const idle = liveClient ? (zh?'AI 会参考公开资料回答，也可能出错。':'AI answers from public sources and can make mistakes.') : (zh ? '开场试玩 · AI 自由对话尚未接通' : 'Opening experience · live AI conversation not yet connected');
  const seen = []; let history = [], busy = false, corpusPromise, activeController, lastLiveTurn, restorationNotice;
  const stopButton=root.querySelector('[data-stop-answer]'), sendButton=form.querySelector('[type=submit]');
  let readingSection,readingReady=Promise.resolve(),readingGeneration=0,readingLookup=[];
  const readingNote=document.createElement('p');readingNote.className='comic-reading-position';readingNote.hidden=true;form.before(readingNote);
  let opening, returnToComposer = false;
  function resetOpening() {
    opening=chooseOpening({article:root.dataset.article==='true'});
    root.querySelector('[data-opening-label]').textContent=openingCopy[language][opening].action;
    root.querySelectorAll('[data-reading-action]').forEach(button=>{button.textContent=openingCopy[language].read.action+' ↗';});
    root.querySelector('.comic-die').style.display=opening==='dice'?'':'none';
    root.querySelector('[data-invitation]').textContent=opening==='read'
      ? (zh?`读到《${root.dataset.pageTitle}》了？我陪你。`:`Reading “${root.dataset.pageTitle}”? I’m here with you.`)
      : chooseGreeting(language);
    if(readingSection)showReadingPosition();
  }
  function loadReadingPosition(headings) {
    readingLookup=[...headings];const generation=++readingGeneration;
    readingSection=undefined;readingNote.hidden=true;resetOpening();
    readingReady=root.dataset.documentId?getTools().then(({corpus})=>{
      const section=resolveReadingPosition(corpus.documents.find(doc=>doc.id===root.dataset.documentId),headings);
      if(generation===readingGeneration){readingSection=section;if(section)showReadingPosition();}
      // A submitted question keeps this promise's own section even when the UI
      // begins resolving a new reading position after its input is cleared.
      return section;
    }).catch(()=>undefined):Promise.resolve();
  }
  function showReadingPosition() {
    readingNote.textContent=(input.value.trim()?(zh?'问题对应：':'Question about: '):(zh?'正在读：':'Reading: '))+readingSection.title;readingNote.hidden=false;
    root.querySelector('[data-invitation]').textContent=input.value.trim()
      ? (zh?`这条问题对应「${readingSection.title}」。`:`This question is about “${readingSection.title}”.`)
      : (zh?`读到「${readingSection.title}」了？我陪你。`:`Reading “${readingSection.title}”? I’m here with you.`);
    root.querySelector('[data-opening-label]').textContent=zh?'一起读这一节':'Read this section with me';
    root.querySelectorAll('[data-reading-action]').forEach(button=>{button.textContent=(zh?'一起读这一节':'Read this section with me')+' ↗';});
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
    busy = value; status.textContent = text;
    root.querySelectorAll('button,textarea').forEach(button => { button.disabled = (value && button!==jump) || Boolean(button.closest('.is-incomplete')); });
    stopButton.hidden=!(value && activeController);stopButton.disabled=false;sendButton.hidden=!stopButton.hidden;
    if(value && returnToComposer && !stopButton.hidden) stopButton.focus({preventScroll:true});
    if(!value) {
      // Restore only focus we displaced; never interrupt reading or reopen a closed dialog.
      if(restore && (!dialog || dialog.open)) input.focus({preventScroll:true});
      returnToComposer=false;
    }
  }
  const restorationCopy=continuing=>continuing?(zh?'已恢复本次对话，较早的内容可按需回顾。':'This conversation is restored; earlier exchanges can be recalled when needed.'):(zh?'这些是上次的记录，仅供回看；新会话不会自动读取。':'These are previous records for review; a new session will not automatically read them.');
  function sources(parent, items) {
    if (!items?.length) return;
    const details = add(parent,'details','','comic-evidence');add(details,'summary',zh?'翻到原文 ↗':'See the sources ↗');
    for(const source of items.slice(0,5)) if(safeSource(source.url)) {const link = add(details,'a',source.label);link.href = source.url;}
  }
  function render(item, remember = true) {
    const focusChapter=remember && item.kind==='story' && root.contains(document.activeElement) && document.activeElement.tagName==='BUTTON';
    if(item.kind==='story' && !milestones.some(event=>event.id===item.eventId))item.eventId=milestones[0].id;
    if (remember) { history.push(item);history = history.slice(-10);save(); }
    root.classList.add('has-conversation');
    // A completed turn is history, not another competing set of calls to action.
    log.querySelectorAll('button').forEach(button => button.remove());
    if(item.kind==='agent') {
      const turn=createAgentTurn(document,{log,question:item.question,language,onQuestion:ask,restored:true});
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
      row.append(createDiceCard(document,{storyId:story.id,seen,language,onRoll:roll,onQuestion:ask}));
    } else if(item.kind === 'story') {
      add(row,'p',zh?'我们一段一段看。想问哪一段，随时打断我。':'One chapter at a time. Ask about any of them as we go.','comic-reply');
      row.append(createBiographyChapter(document,{eventId:item.eventId,language,onChange:eventId=>{item.eventId=eventId;save();},onQuestion:ask}));
      sources(row,[{label:zh?'完整经历与资料来源':'Full biography and sources',url:local('/about/#sources')}]);
    } else {
      add(row,'p',item.text,'comic-reply');sources(row,item.sources);
      if(root.dataset.article!=='true' && item.sources?.length) {
        const next = add(row,'button',zh?'再认识她的另一面 ↗':'Meet another side of her ↗','comic-follow');
        next.type='button';next.addEventListener('click',roll);
      }
    }
    while(log.children.length > 10) log.firstElementChild.remove();
    if(remember && item.kind==='dice')row.querySelector('.comic-dice-card').scrollIntoView({block:'start',behavior:'instant'});
    else if(remember) row.scrollIntoView({block:'nearest',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    if(focusChapter && (!dialog || dialog.open))row.querySelector('.comic-biography-chapter h2').focus({preventScroll:true});
    return row;
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
    corpusPromise ||= fetch(root.dataset.index,{credentials:'omit',signal:AbortSignal.timeout(10000)}).then(response=>{if(!response.ok)throw new Error('Unavailable');return response.json();})
      .then(corpus=>({corpus,tools:createContentTools(corpus)})).catch(error=>{corpusPromise=null;throw error;});
    return corpusPromise;
  }
  async function readPage() {
    const generation=readingGeneration;
    await readingReady;
    if(generation!==readingGeneration || (dialog && !dialog.open))return;
    if(liveClient && readingSection)return ask(zh?'陪我读这一节：解释它的核心意思，再给出一个值得继续讨论的问题。':'Read this section with me: explain its main point, then suggest one question worth exploring.');
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
    const openingContext=question===input.value.trim()?openingDraft.snapshot(currentOpeningContext()):currentOpeningContext();
    const readingSnapshot={ready:readingReady,headings:draftContext.snapshot()};
    input.value='';updateComposer();
    if(/^(掷骰子|roll(?: a die)?)$/i.test(question)){await roll();return;}
    if(/^(带我看看她的经历|看看她的经历|show me her story)[。.!?？]?$/i.test(question)){render({kind:'story',question});return;}
    if(liveClient) { await askLive(question,openingContext,readingSnapshot);return; }
    const answer=answerQuestion(question,language);
    if(answer.id !== 'empty') {
      render({kind:'text',question,text:answer.text,sources:answer.sources});
      status.textContent=zh?'这条来自预先整理的公开资料 · 自由对话尚未接通':'From authored public-source notes · live conversation is not connected';return;
    }
    render({kind:'text',question,text:zh?'这个问题需要真正的 AI 对话，我现在还接不上。你可以先掷个骰子，或者让我带你看看她的经历；等模型接通，我们再展开聊。':'That needs a live conversation, which isn’t connected yet. For now, roll the die or explore her story; we can go further when the model is ready.'});
  }
  async function askLive(question,openingContext,readingSnapshot) {
    activeController=new AbortController();const controller=activeController;
    setBusy(true);
    root.classList.add('has-conversation');
    log.querySelectorAll('button').forEach(button=>button.remove());
    const turn=createAgentTurn(document,{log,question,language,onQuestion:ask,retry:lastLiveTurn});
    lastLiveTurn=turn;
    turn.row.scrollIntoView({block:'start',behavior:'instant'});
    const challenge=root.querySelector('[data-visitor-check]');
    const savedEvents=[];
    const positionReady=readingSnapshot.ready;
    try {
      const questionSection=await waitForReadingContext(positionReady,controller.signal);controller.signal.throwIfAborted();
      const pageContext=root.dataset.documentId?{documentId:root.dataset.documentId,...(questionSection?{sectionAnchor:questionSection.anchor}:{})}:undefined;
      if(!liveClient.hasSession()) {
        if(restorationNotice)restorationNotice.textContent=restorationCopy(false);
        turn.connectionPhase('verification');
        challenge.hidden=false;
        const token=await verifyVisitor(document,challenge,turnstileSiteKey,controller.signal);
        turn.connectionPhase('connecting');
        await liveClient.openSession(token,controller.signal);challenge.hidden=true;
      }
      await liveClient.ask({question,language,supportsConceptFlow:true,supportsConceptRevisions:true,...(openingContext?{openingContext}:{}),...(pageContext?{pageContext}:{})},
        {signal:controller.signal,onEvent:event=>{
          presentAgentEvent(log,turn,event);
          recordPresentationEvent(savedEvents,event);
        }});
      const saved=validateSavedTurn({kind:'agent',question,events:savedEvents});
      if(saved){history.push(saved);history=history.slice(-10);save();}
    } catch(error) {
      const message=agentFailureMessage(controller.signal.aborted?'stopped':error.message,language,{partial:savedEvents.length>0,resetsAt:error.resetsAt});
      turn.interrupt(message,{code:controller.signal.aborted?'stopped':error.message});
      // Stopping is also an opportunity to revise the question. Preserve its
      // source context, just as for transport failures; never auto-resubmit it.
      input.value=question;draftContext.restore(readingSnapshot.headings);
      openingDraft.edit('');openingDraft.edit(question,openingContext);updateComposer();
    } finally {challenge.hidden=true;challenge.replaceChildren();activeController=null;setBusy(false);}
  }
  form.addEventListener('submit',event=>{event.preventDefault();ask(input.value);});
  input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();form.requestSubmit();}});
  root.querySelector('[data-opening]').addEventListener('click',()=>{
    if(opening==='dice')roll();else if(opening==='read')readPage();
    else render({kind:'story',question:openingCopy[language].story.action});
  });
  stopButton.addEventListener('click',()=>activeController?.abort());
  window.addEventListener('pagehide',()=>activeController?.abort());
  root.querySelector('[data-companion-reset]').addEventListener('click',async()=>{
    if(busy || !await confirmConversationReset(document,{language,hasDraft:Boolean(input.value.trim())}))return;
    // Keep the retained draft's original card reference. updateComposer clears it only for an empty draft.
    liveClient?.clearSession();lastLiveTurn=null;restorationNotice?.remove();restorationNotice=null;history=[];seen.length=0;updateComposer();save();log.replaceChildren();root.classList.remove('has-conversation');status.textContent=idle;hello.textContent=zh?'嗨，我们重新认识一下。':'Hello. A fresh page.';resetOpening();
    // The reset button just disappeared. Keep keyboard navigation in this conversation.
    if(input.value.trim())input.focus({preventScroll:true});
    else {hello.setAttribute('tabindex','-1');hello.focus({preventScroll:true});}
  });
  try {
    const stored=JSON.parse(sessionStorage.getItem(storageKey)||'[]');
    if(Array.isArray(stored)) for(const item of stored.slice(-10)) {
      if(!item||typeof item!=='object')continue;
      if(item.kind==='dice'&&storyCards.some(card=>card.id===item.id)){history.push(item);seen.push(item.id);render(item,false);}
      else if(item.kind==='story'){const safe={kind:'story',eventId:milestones.some(event=>event.id===item.eventId)?item.eventId:milestones[0].id};history.push(safe);render(safe,false);}
      else if(item.kind==='agent'){const safe=validateSavedTurn(item);if(safe){history.push(safe);render(safe,false);}}
      else if(item.kind==='reading' && item.block?.type==='reading_map') {
        try {validateAgentBlock(item.block);const safe={kind:'reading',block:item.block};history.push(safe);render(safe,false);} catch { /* Ignore invalid stored outlines. */ }
      }
      else if(item.kind==='text'&&typeof item.text==='string'&&item.text.length<=10000&&(!item.question||typeof item.question==='string'&&item.question.length<=400)) {
        const safe={kind:'text',text:item.text,question:item.question,sources:Array.isArray(item.sources)?item.sources.filter(source=>source&&typeof source.label==='string'&&safeSource(source.url)).slice(0,5):[]};history.push(safe);render(safe,false);
      }
    }
  } catch { /* The companion remains usable when storage is blocked or corrupt. */ }
  if(history.some(item=>item.kind==='agent')) {
    restorationNotice=add(root,'p',restorationCopy(Boolean(liveClient?.hasSession())),'comic-session-note');
    log.before(restorationNotice);
  }
  if(root.dataset.article==='true' && history.length) {
    // Carry the conversation across pages, but make the CURRENT article the next focus.
    log.querySelectorAll('button').forEach(button=>button.remove());
    const context = add(log,'article','','comic-message comic-context');
    add(context,'p',zh?`现在翻到《${root.dataset.pageTitle}》了。`:`We’ve opened “${root.dataset.pageTitle}”.`,'comic-reply');
    const next=add(context,'button',openingCopy[language].read.action+' ↗','comic-follow');next.type='button';next.dataset.readingAction='';next.addEventListener('click',readPage);
  }
  if(dialog&&launcher) {
    let returnAnchor,pointerSelection;
    const launcherLabel=launcher.querySelector('span'),defaultLabel=launcherLabel.textContent,defaultAria=launcher.getAttribute('aria-label');
    const selectedPassage=()=>root.dataset.documentId && !input.value.trim()?captureReadingSelection(document):undefined;
    const updateSelectionInvitation=()=>{
      if(dialog.open)return;
      const selected=selectedPassage(),label=zh?'解释选中这段':'Explain this passage';
      launcher.classList.toggle('has-selection',Boolean(selected));
      launcherLabel.textContent=selected?label:defaultLabel;
      launcher.setAttribute('aria-label',selected?label:defaultAria);
    };
    document.addEventListener('selectionchange',updateSelectionInvitation);
    launcher.addEventListener('pointerdown',()=>{pointerSelection=selectedPassage();});
    launcher.addEventListener('pointercancel',()=>{pointerSelection=undefined;});
    launcher.addEventListener('keydown',()=>{pointerSelection=undefined;});
    log.addEventListener('click',event=>{
      if(event.defaultPrevented || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)return;
      const link=event.target.closest('a');if(!link)return;
      const destination=new URL(link.href,location.href);
      if(destination.origin!==location.origin || destination.pathname!==location.pathname)return;
      let target;try {target=destination.hash?document.getElementById(decodeURIComponent(destination.hash.slice(1))):document.querySelector('main article');}catch{return;}
      if(!target || dialog.contains(target))return;
      event.preventDefault();returnAnchor=undefined;dialog.close();
      requestAnimationFrame(()=>{historyReplaceHash(destination.hash);target.scrollIntoView({block:'start'});target.setAttribute('tabindex','-1');target.focus({preventScroll:true});});
    });
    launcher.addEventListener('click',()=>{
      const selected=!input.value.trim()?(pointerSelection || selectedPassage()):undefined;pointerSelection=undefined;
      returnAnchor=captureReadingAnchor(document);
      const headings=draftContext.open(selected?selected.headings:readingHeadings(document));
      loadReadingPosition(headings);
      dialog.showModal();document.body.classList.add('comic-open');log.scrollTop=log.scrollHeight;
      if(selected)input.value=selectionQuestion(selected.text,language);
      updateComposer();
      // Resume an unfinished question without moving its caret or the reading page.
      // Keep the normal welcome focus when there is no draft to continue.
      if(input.value.trim())input.focus({preventScroll:true});
    });
    document.querySelector('[data-companion-close]').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('close',()=>{
      readingGeneration++;activeController?.abort();document.body.classList.remove('comic-open');
      restoreReadingAnchor(returnAnchor,document,window);returnAnchor=undefined;
      launcher.focus({preventScroll:true});
      updateSelectionInvitation();
    });
    dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}});
  }
  if(document.body.classList.contains('chat-page')) {log.scrollTop=log.scrollHeight;const initial=initialQuestion(location.hash,language);if(initial){input.value=initial;input.focus();updateComposer();}}
}

function historyReplaceHash(hash) {window.history.replaceState(window.history.state,'',location.pathname+location.search+hash);}
