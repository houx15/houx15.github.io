import { answerQuestion } from './knowledge.js';
const hour = new Date().getHours();
const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
const hellos = ['Where shall we start?', 'A question is a lovely place to start.', 'Want to explore something together?'];
document.querySelector('#greeting').textContent = `${greeting}! I’m Evie’s portfolio guide. ${hellos[Math.floor(Math.random()*hellos.length)]}`;
const form = document.querySelector('#chat-form');
const question = document.querySelector('#question');
const conversation = document.querySelector('#conversation');
const status = document.querySelector('#chat-status');
function message(label, text, sources = []) {
  const box = document.createElement('div'); box.className = `chat-message ${label === 'You' ? 'user' : 'assistant'}`;
  const name = document.createElement('strong'); name.textContent = label;
  const body = document.createElement('p'); body.textContent = text; box.append(name,body);
  for (const source of sources) { const link = document.createElement('a'); link.href = source.url; link.textContent = `${source.label} ↗`; box.append(link); }
  conversation.append(box);
  while (conversation.children.length > 12) conversation.firstElementChild.remove();
  conversation.scrollTop = conversation.scrollHeight;
}
function ask(text) {
  if (!text.trim()) { question.focus(); return; }
  message('You',text.slice(0,400));
  try { const answer=answerQuestion(text); message('Portfolio guide · local demo',answer.text,answer.sources); status.textContent='Answered from curated text. Nothing was sent or saved.'; }
  catch { message('Portfolio guide · local demo','Sorry, the local guide hit an error. Please try again or use the source links on the About page.'); status.textContent='Unable to show an answer. Please try again.'; }
  question.value='';
}
form.addEventListener('submit', event => {event.preventDefault();ask(question.value);});
document.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click',()=>ask(button.dataset.question)));
const svgNS='http://www.w3.org/2000/svg';
const grid=document.querySelector('#radar-grid');
const labels=document.querySelector('#radar-labels');
const controls=[...document.querySelectorAll('[data-domain]')];
const initial=controls.map(input=>input.value);
function point(index, radius){const angle=(index*72-90)*Math.PI/180;return [190+Math.cos(angle)*radius,143+Math.sin(angle)*radius];}
function element(tag,attrs,parent){const node=document.createElementNS(svgNS,tag);Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,value));parent.append(node);return node;}
for(let level=1;level<=5;level++) element('polygon',{points:controls.map((_,i)=>point(i,level*19).join(',')).join(' '),fill:'none',stroke:'#d5dcc9','stroke-width':1},grid);
controls.forEach((input,i)=>{const p=point(i,95);element('line',{x1:190,y1:143,x2:p[0],y2:p[1],stroke:'#d5dcc9'},grid);const l=point(i,125);const text=element('text',{x:l[0],y:l[1]+4,'text-anchor':'middle',fill:'#53624d','font-size':11},labels);text.textContent=input.parentElement.childNodes[0].textContent.trim();});
function draw(){document.querySelector('#radar-shape').setAttribute('points',controls.map((input,i)=>point(i,Number(input.value)*19).join(',')).join(' '));controls.forEach(input=>input.nextElementSibling.textContent=`${input.value}/5`);document.querySelector('#radar-desc').textContent=`Illustrative placeholders, not Evie’s ratings: ${controls.map(input=>`${input.parentElement.childNodes[0].textContent.trim()} ${input.value} of 5`).join(', ')}.`;}
controls.forEach(input=>input.addEventListener('input',draw));
document.querySelector('#reset-radar').addEventListener('click',()=>{controls.forEach((input,i)=>input.value=initial[i]);draw();});draw();
