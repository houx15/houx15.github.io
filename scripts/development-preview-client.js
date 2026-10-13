import {createAgentTurn,agentFailureMessage} from '/assets/agent-view.js';
import {presentAgentEvent} from '/assets/agent-scroll.js';
import {consumeAgentStream} from '/assets/agent-stream.js';

const root=document.querySelector('[data-companion]'),log=root.querySelector('[data-companion-log]');
const form=root.querySelector('form'),input=form.querySelector('textarea'),send=form.querySelector('[type=submit]'),stop=form.querySelector('[data-stop-answer]');
const status=root.querySelector('[data-companion-status]');
const token=document.querySelector('[name=development-preview-token]').content;
root.querySelector('[data-companion-reset]').remove();root.querySelector('[data-play]').remove();
root.querySelector('[data-invitation]').textContent='私有开发联调：真实模型，单次问题，不保留模型上下文。';
status.textContent='开发额度 · 共享每月预算 · 密钥仅在服务器';
let controller;
stop.addEventListener('click',()=>controller?.abort());
form.addEventListener('submit',async event=>{
  event.preventDefault();const question=input.value.trim();if(!question || controller)return;
  controller=new AbortController();const signal=controller.signal;
  root.classList.add('has-conversation');input.disabled=true;send.hidden=true;stop.hidden=false;
  const turn=createAgentTurn(document,{log,question,language:'zh-CN'});turn.row.scrollIntoView({block:'start'});
  input.value='';
  try {
    const response=await fetch('/run',{method:'POST',headers:{'Content-Type':'application/json','X-Development-Preview':token},body:JSON.stringify({question,language:'zh-CN'}),signal});
    if(!response.ok)throw new Error('unavailable');
    await consumeAgentStream(response.body,event=>presentAgentEvent(log,turn,event),signal);
  } catch(error) {turn.interrupt(agentFailureMessage(signal.aborted?'stopped':error.message,'zh-CN'));}
  finally {controller=undefined;input.disabled=false;send.hidden=false;stop.hidden=true;input.focus();}
});
