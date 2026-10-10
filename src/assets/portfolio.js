import { answerQuestion } from './knowledge.js';
import { assistantOrigin } from './assistant-config.js';
import { createLiveClient, validOrigin } from './assistant-client.js';
const hour = new Date().getHours();
const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
const hellos = ['Ask about Evie’s background or projects.', 'Explore the projects and their sources.', 'What would you like to know about Evie’s work?'];
document.querySelector('#greeting').textContent = `${greeting}! I’m an AI portfolio assistant. ${hellos[Math.floor(Math.random()*hellos.length)]}`;
const form = document.querySelector('#chat-form');
const question = document.querySelector('#question');
const conversation = document.querySelector('#conversation');
const status = document.querySelector('#chat-status');
function message(label, text, sources = []) {
  const box = document.createElement('div'); box.className = `chat-message ${label === 'You' ? 'user' : 'assistant'}`;
  const name = document.createElement('strong'); name.textContent = label;
  const body = document.createElement('p'); body.textContent = text; box.append(name,body);
  for (const source of sources) { const link = document.createElement('a'); link.href = source.url; link.textContent = source.label; box.append(link); }
  conversation.append(box);
  while (conversation.children.length > 12) conversation.firstElementChild.remove();
  conversation.scrollTop = conversation.scrollHeight;
}
let liveRequest = null;
let mode = 'demo';
let busy = false;
const modeLabel = document.querySelector('#assistant-mode');
const livePanel = document.querySelector('#live-options');
const liveConsent = document.querySelector('#live-consent');
const liveButton = document.querySelector('#enable-live');
const demoButton = document.querySelector('#enable-demo');
const controlsToDisable = [...form.elements, ...document.querySelectorAll('[data-question]'), liveButton, demoButton, liveConsent];
function setBusy(value) {
  busy=value;
  form.setAttribute('aria-busy',String(value));
  controlsToDisable.forEach(control=>control.disabled=value);
}
async function ask(text) {
  if (busy) return;
  if (!text.trim()) { question.focus(); return; }
  message('You',text.slice(0,400));
  question.value='';
  setBusy(true);
  status.textContent=mode==='live'?'Asking the model to find relevant public facts…':'Checking the curated portfolio…';
  try {
    const answer=mode==='live' ? await liveRequest({kind:'answer',question:text.slice(0,400)}) : answerQuestion(text);
    message(mode==='live'?'Portfolio guide · live AI selection':'Portfolio guide · local demo',answer.text,answer.sources);
    modeLabel.textContent=mode==='live'?'Live AI':'Local demo';
    status.textContent=mode==='live'?'A live model selected these reviewed facts and source links. AI selection can be mistaken.':'Answered from curated text. Nothing was sent or saved.';
  } catch(error) {
    const reason=error.message==='rate_limit'?'The live assistant has reached its request limit.':error.message==='timeout'?'The live assistant timed out.':'The live assistant is unavailable right now.';
    message('Portfolio guide · service notice',`${reason} No AI answer was produced. Try later, browse the sources, or switch explicitly to the local demo.`,[{label:'Sources & limitations',url:'/about/#sources'}]);
    modeLabel.textContent='Live AI unavailable';
    status.textContent=reason+' Your question was not replaced with a demo answer.';
  } finally {setBusy(false);question.focus();}
}
form.addEventListener('submit', event => {event.preventDefault();ask(question.value);});
document.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click',()=>ask(button.dataset.question)));
if (validOrigin(assistantOrigin)) {
  liveRequest=createLiveClient(assistantOrigin);
  livePanel.hidden=false;
  liveButton.addEventListener('click',async()=>{
    if(!liveConsent.checked){status.textContent='Please agree to send questions to the live service first.';liveConsent.focus();return;}
    mode='live';setBusy(true);modeLabel.textContent='Connecting';
    status.textContent='Requesting a model-selected greeting…';
    try {
      const answer=await liveRequest({kind:'greeting',daypart:hour<12?'morning':hour<18?'afternoon':'evening'});
      document.querySelector('#greeting').textContent=answer.text;
      modeLabel.textContent='Live AI';
      status.textContent='Connected. A live model selects reviewed public facts; only each submitted question is sent, not conversation history.';
    } catch {
      modeLabel.textContent='Live AI unavailable';
      status.textContent='Could not connect to live AI. No model greeting was produced. Try later or switch to the local demo.';
    } finally {setBusy(false);}
  });
  function useDemo() {
    mode='demo';liveConsent.checked=false;modeLabel.textContent='Local demo';
    document.querySelector('#greeting').textContent='Local portfolio assistant. Ask about Evie’s background or projects.';
    status.textContent='Local demo active. New questions will not be sent or saved.';
  }
  demoButton.addEventListener('click',useDemo);
  liveConsent.addEventListener('change',()=>{if(!liveConsent.checked) useDemo();});
}
const svgNS='http://www.w3.org/2000/svg';
const grid=document.querySelector('#radar-grid');
const labels=document.querySelector('#radar-labels');
const controls=[...document.querySelectorAll('[data-domain]')];
const initial=controls.map(input=>input.value);
function point(index, radius){const angle=(index*72-90)*Math.PI/180;return [190+Math.cos(angle)*radius,143+Math.sin(angle)*radius];}
function element(tag,attrs,parent){const node=document.createElementNS(svgNS,tag);Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,value));parent.append(node);return node;}
for(let level=1;level<=5;level++) element('polygon',{points:controls.map((_,i)=>point(i,level*19).join(',')).join(' '),fill:'none',stroke:'#dce1e6','stroke-width':1},grid);
controls.forEach((input,i)=>{const p=point(i,95);element('line',{x1:190,y1:143,x2:p[0],y2:p[1],stroke:'#dce1e6'},grid);const l=point(i,125);const text=element('text',{x:l[0],y:l[1]+4,'text-anchor':'middle',fill:'#636972','font-size':11},labels);text.textContent=input.parentElement.childNodes[0].textContent.trim();});
function draw(){document.querySelector('#radar-shape').setAttribute('points',controls.map((input,i)=>point(i,Number(input.value)*19).join(',')).join(' '));controls.forEach(input=>input.nextElementSibling.textContent=`${input.value}/5`);document.querySelector('#radar-desc').textContent=`Illustrative placeholders, not Evie’s ratings: ${controls.map(input=>`${input.parentElement.childNodes[0].textContent.trim()} ${input.value} of 5`).join(', ')}.`;}
controls.forEach(input=>input.addEventListener('input',draw));
document.querySelector('#reset-radar').addEventListener('click',()=>{controls.forEach((input,i)=>input.value=initial[i]);draw();});draw();
