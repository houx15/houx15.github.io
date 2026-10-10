import { setupJourneys } from './journey.js';
import { answerQuestion } from './knowledge.js';
import { assistantOrigin } from './assistant-config.js';
import { createLiveClient, validOrigin } from './assistant-client.js';
import { getUI } from './ui.js';
import { initialQuestion, questionFragment, topicQuestions } from './navigation.js';
setupJourneys(document);
const language=document.documentElement.lang==='zh-CN'?'zh-CN':'en';
const ui=getUI(language);
const languageLink=document.querySelector('#language-switch');
if(languageLink && (/^#(?:q|topic)=/.test(window.location.hash) || ['#main','#interests','#research','#projects'].includes(window.location.hash))) languageLink.hash=window.location.hash;
const heroForm=document.querySelector('#hero-form');
if(heroForm) {
  heroForm.addEventListener('submit',event=>{
    event.preventDefault();
    const value=document.querySelector('#hero-question').value.trim();
    if(value) window.location.assign(`${ui.prefix}/chat/${questionFragment(value)}`);
  });
  heroForm.querySelector('fieldset').disabled=false;
  // Preserve previously shared project entry links without executing arbitrary queries.
  const legacyTopic=new URLSearchParams(window.location.search).get('topic');
  if(Object.hasOwn(topicQuestions[language],legacyTopic)) window.location.replace(`${ui.prefix}/chat/#topic=${legacyTopic}`);
}
const form=document.querySelector('#chat-form');
if(form) setupChat();
function setupChat() {
  const hour=new Date().getHours();
  const daypart=hour<12?'morning':hour<18?'afternoon':'evening';
  const greeting=language==='zh-CN'?{morning:'早上好',afternoon:'下午好',evening:'晚上好'}[daypart]:{morning:'Good morning',afternoon:'Good afternoon',evening:'Good evening'}[daypart];
  const introductions=language==='zh-CN'?['我是 AI 作品集助手。可以一起看看项目和背后的资料。','我是 AI 作品集助手。你对哪一段经历或工作感兴趣？']:['I’m the AI portfolio assistant. Let’s explore the work and its sources.','I’m the AI portfolio assistant. Which project or part of Evie’s path interests you?'];
  document.querySelector('#greeting').textContent=`${greeting}${language==='zh-CN'?'。':'. '} ${introductions[Math.floor(Math.random()*introductions.length)]}`;
  const question=document.querySelector('#question');
  const conversation=document.querySelector('#conversation');
  const status=document.querySelector('#chat-status');
  const modeLabel=document.querySelector('#assistant-mode');
  const livePanel=document.querySelector('#live-options');
  const liveConsent=document.querySelector('#live-consent');
  const liveButton=document.querySelector('#enable-live');
  const demoButton=document.querySelector('#enable-demo');
  let liveRequest=null, mode='demo', busy=false;
  const controlsToDisable=[...form.elements,...document.querySelectorAll('[data-question]'),liveButton,demoButton,liveConsent];
  function setBusy(value) {
    busy=value;form.setAttribute('aria-busy',String(value));
    document.querySelector('.assistant-panel').classList.toggle('is-thinking',value);
    controlsToDisable.forEach(control=>control.disabled=value);
  }
  function message(label,text,sources=[],ids=[]) {
    const box=document.createElement('div');box.className=`chat-message ${label===ui.you?'user':'assistant'}`;
    const name=document.createElement('strong');name.textContent=label;
    const body=document.createElement('p');body.textContent = text;box.append(name,body);
    const links=document.createElement('div');links.className='answer-sources';
    for(const source of sources){const link=document.createElement('a');link.href=source.url;link.textContent=source.label;links.append(link);}
    box.append(links);
    const mapped={engineering:'mind',methods:'ssdata',failure:'mind'};
    const visual=ids.map(id=>document.getElementById(`visual-${mapped[id] || id}`)).find(Boolean);
    if(visual) box.append(document.importNode(visual.content,true));
    conversation.append(box);
    setupJourneys(box);
    while(conversation.children.length>12) conversation.firstElementChild.remove();
  }
  async function ask(text,{focus=true}={}) {
    if(busy || !text.trim()) return;
    text=text.trim().slice(0,400);
    message(ui.you,text);question.value='';setBusy(true);status.textContent=ui.working;
    if(languageLink) languageLink.hash=questionFragment(text);
    try {
      const answer=mode==='live'?await liveRequest({kind:'answer',question:text,language}):answerQuestion(text,language);
      message(mode==='live'?ui.liveGuide:ui.assistantLabel,answer.text,answer.sources,answer.factIds || [answer.id]);
      modeLabel.textContent=mode==='live'?ui.liveLabel:ui.demo;
      status.textContent=mode==='live'?ui.liveAnswered:ui.answered;
    } catch(error) {
      const reason=error.message==='rate_limit'?ui.limit:error.message==='timeout'?ui.timeout:ui.unavailable;
      message(ui.service,reason,[{label:ui.sourceTitle,url:`${ui.prefix}/about/#sources`}]);
      modeLabel.textContent=ui.liveUnavailable;status.textContent=reason;
    } finally {setBusy(false);if(focus) question.focus();}
  }
  form.addEventListener('submit',event=>{event.preventDefault();ask(question.value);});
  document.querySelectorAll('[data-question]').forEach(button=>button.addEventListener('click',()=>ask(button.dataset.question)));
  if(validOrigin(assistantOrigin)) {
    liveRequest=createLiveClient(assistantOrigin);livePanel.hidden=false;
    liveButton.addEventListener('click',async()=>{
      if(!liveConsent.checked){status.textContent=ui.consentRequired;liveConsent.focus();return;}
      mode='live';setBusy(true);modeLabel.textContent=ui.connecting;status.textContent=ui.connecting;
      try {const answer=await liveRequest({kind:'greeting',daypart,language});document.querySelector('#greeting').textContent=answer.text;modeLabel.textContent=ui.liveLabel;status.textContent=ui.liveAnswered;}
      catch {modeLabel.textContent=ui.liveUnavailable;status.textContent=ui.unavailable;}
      finally {setBusy(false);}
    });
    function useDemo(){mode='demo';liveConsent.checked=false;modeLabel.textContent=ui.demo;document.querySelector('#greeting').textContent=ui.chatIntro;status.textContent=ui.chatReady;}
    demoButton.addEventListener('click',useDemo);
    liveConsent.addEventListener('change',()=>{if(!liveConsent.checked) useDemo();});
  }
  const initial=initialQuestion(window.location.hash,language);
  // Navigation submits only to the local demo. Live mode always needs separate opt-in.
  if(initial) ask(initial,{focus:false});
}
