import {createAgentTurn,agentFailureMessage} from '/assets/agent-view.js';
import {presentAgentEvent,followConversationResize} from '/assets/agent-scroll.js?v=3';
import {consumeAgentStream} from '/assets/agent-stream.js';

const root=document.querySelector('[data-companion]'),log=root.querySelector('[data-companion-log]');
followConversationResize(log);
const form=root.querySelector('form'),input=form.querySelector('textarea'),send=form.querySelector('[type=submit]'),stop=form.querySelector('[data-stop-answer]');
const status=root.querySelector('[data-companion-status]');
const token=document.querySelector('[name=development-preview-token]').content;
const reset=root.querySelector('[data-companion-reset]');root.querySelector('[data-play]').remove();
root.querySelector('[data-invitation]').textContent='私有开发联调：真实模型，可以连续追问。重新开始会清除本次上下文。';
status.textContent='开发额度 · 共享每月预算 · 密钥仅在服务器';
let controller,ready=false;
async function resetConversation() {
  if(controller)return;
  ready=false;reset.disabled=true;input.disabled=true;send.disabled=true;
  try {
    const response=await fetch('/reset',{method:'POST',headers:{'Content-Type':'application/json','X-Development-Preview':token},body:'{}'});
    if(!response.ok)throw new Error('unavailable');
    log.replaceChildren();root.classList.remove('has-conversation');input.value='';ready=true;
    status.textContent='新的开发对话 · 可以连续追问 · 共享每月预算';
  } catch {root.classList.add('has-conversation');status.textContent='暂时无法开始新对话，请稍后点击重新开始。';}
  finally {reset.disabled=false;input.disabled=!ready;send.disabled=!ready;}
}
reset.addEventListener('click',resetConversation);
resetConversation();
stop.addEventListener('click',()=>controller?.abort());
form.addEventListener('submit',async event=>{
  event.preventDefault();const question=input.value.trim();if(!question || controller || !ready)return;
  controller=new AbortController();const signal=controller.signal;
  let chunks=0;
  status.textContent='开发联调 · 正在连接 · 0 段文字流';
  root.classList.add('has-conversation');input.disabled=true;reset.disabled=true;send.hidden=true;stop.hidden=false;
  const turn=createAgentTurn(document,{log,question,language:'zh-CN',onQuestion:q=>{input.value=q;form.requestSubmit();}});turn.row.scrollIntoView({block:'start'});
  input.value='';
  try {
    const response=await fetch('/run',{method:'POST',headers:{'Content-Type':'application/json','X-Development-Preview':token},body:JSON.stringify({question,language:'zh-CN'}),signal});
    if(!response.ok)throw new Error('unavailable');
    await consumeAgentStream(response.body,event=>{
      presentAgentEvent(log,turn,event);
      if(event.type==='answer_delta')chunks++;
      status.textContent=`开发联调 · 已收到 ${chunks} 段文字流`;
    },signal);
  } catch(error) {turn.interrupt(agentFailureMessage(signal.aborted?'stopped':error.message,'zh-CN'));}
  finally {status.textContent=`开发联调 · ${signal.aborted?'已停止':'请求结束'} · ${chunks} 段文字流`;controller=undefined;input.disabled=false;reset.disabled=false;send.hidden=false;stop.hidden=true;input.focus();}
});
