import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAgentTurn } from '../src/assets/agent-view.js';

class Element {
  constructor(tag){this.tag=tag;this.children=[];this.className='';this.textContent='';this.attributes={};this.classList={add:name=>{this.className+=' '+name;},remove:name=>{this.className=this.className.split(' ').filter(x=>x!==name).join(' ');},toggle:(name,value)=>{if(value)this.classList.add(name);else this.classList.remove(name);}};}
  append(...nodes){for(const node of nodes){node.parent=this;this.children.push(node);}}
  replaceChildren(...nodes){this.children=[];this.append(...nodes);}
  setAttribute(name,value){this.attributes[name]=value;}
  removeAttribute(name){delete this.attributes[name];}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(node=>node!==this);}
  addEventListener(name,handler){this[name]=handler;}
  querySelectorAll(tag){return this.children.flatMap(node=>[...(node.tag===tag?[node]:[]),...node.querySelectorAll(tag)]);}
  querySelector(selector){return this.querySelectorAll('p').find(node=>node.className.split(' ').includes(selector.slice(1)));}
}
const document={createElement:tag=>new Element(tag)};
test('streamed prose is visible before completion and stays incomplete on interruption',()=>{
  const log=new Element('div'),turn=createAgentTurn(document,{log,question:'x'});
  turn.event({type:'answer_delta',text:'第一句。'});
  assert.equal(log.querySelector('.comic-reply').textContent,'第一句。');
  turn.event({type:'answer_delta',text:'第二句。'});
  assert.equal(log.querySelector('.comic-reply').textContent,'第一句。第二句。');
  turn.interrupt();assert.match(turn.row.className,/is-incomplete/);
});
test('live view presents one suggested next action and only unlocks it after completion',()=>{
  const log=new Element('div'),clicked=[];
  const turn=createAgentTurn(document,{log,question:'A question',language:'zh-CN',onQuestion:q=>clicked.push(q)});
  turn.event({type:'block',block:{id:'b',type:'questions',items:[{documentId:'a',label:'First',query:'one'},{documentId:'b',label:'Second',query:'two'}]}});
  turn.event({type:'block',block:{id:'another',type:'questions',items:[{documentId:'c',label:'Third',query:'three'}]}});
  assert.equal(log.querySelectorAll('button').length,1);assert.equal(log.querySelectorAll('button')[0].disabled,true);
  turn.event({type:'source',source:{id:'s',label:'<script>not executable</script>',url:'/notes/test/'}});
  turn.event({type:'answer',text:'<img src=x onerror=bad>',sourceIds:['s']});
  assert.ok(log.querySelectorAll('p').some(node=>node.textContent==='<img src=x onerror=bad>'));
  turn.event({type:'done'});assert.equal(log.querySelectorAll('button')[0].disabled,false);
  log.querySelectorAll('button')[0].click();assert.deepEqual(clicked,['one']);
  createAgentTurn(document,{log,question:'Next'});assert.equal(log.querySelectorAll('button').length,0);
});
test('interrupted turns keep displayed evidence but never present a completed state',()=>{
  const log=new Element('div'),turn=createAgentTurn(document,{log,question:'x'});
  turn.event({type:'block',block:{id:'b',type:'post_cards',items:[{id:'a',title:'Source',summary:'Summary',url:'/notes/test/',date:'2026-10-12',type:'notes'}]}});
  turn.interrupt();
  assert.match(turn.row.className,/is-incomplete/);assert.equal(log.querySelectorAll('a').length,1);
  turn.event({type:'done'});assert.match(turn.row.className,/is-incomplete/);
});

test('streamed budget failure keeps its actionable message and evidence through the caller catch',async()=>{
  const {consumeAgentStream}=await import('../src/assets/agent-stream.js');
  const log=new Element('div'),turn=createAgentTurn(document,{log,question:'x',language:'zh-CN'});
  const frames=[
    {type:'source',source:{id:'s',label:'Source',url:'/notes/test/'}},
    {type:'answer_delta',text:'已经写出的内容。',sourceIds:['s']},
    {type:'error',code:'budget_exhausted',partial:true}
  ].map((event,index)=>({...event,version:2,requestId:'r',id:String(index)}));
  const wire=frames.map(event=>`id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join('');
  await assert.rejects(consumeAgentStream(new Response(wire).body,event=>turn.event(event)),/budget_exhausted/);
  turn.interrupt('Generic connection error');
  const status=log.querySelectorAll('span').map(node=>node.textContent).join(' ');
  assert.match(status,/额度暂时用完/);assert.match(status,/不是完整回答/);
  assert.doesNotMatch(status,/Generic/);
  assert.equal(log.querySelector('.comic-reply').textContent,'已经写出的内容。');
  assert.match(turn.row.className,/is-incomplete/);
});

test('unknown server error codes never appear in visitor-facing messages',async()=>{
  const {agentFailureMessage}=await import('../src/assets/agent-view.js');
  for(const language of ['en','zh-CN']) {
    const message=agentFailureMessage('private-provider-error-detail',language);
    assert.doesNotMatch(message,/private-provider/);
    assert.ok(message.length>0);
  }
  assert.match(agentFailureMessage('invalid_session'),/expired/);
  assert.match(agentFailureMessage('budget_exhausted'),/allowance/);
});

test('concept diagrams show an interpretation label, one expanded step, and canonical source links',()=>{
  const log=new Element('div'),turn=createAgentTurn(document,{log,question:'Explain',language:'zh-CN'});
  turn.event({type:'block',block:{id:'concept',type:'concept_flow',title:'A mechanism',interpretation:true,items:[
    {title:'First',description:'<script>plain text</script>',source:{id:'s',label:'Evidence',url:'/notes/test/#evidence'}},
    {title:'Second',description:'Next explanation',source:{id:'s',label:'Evidence',url:'/notes/test/#evidence'}}
  ]}});
  const details=log.querySelectorAll('details');
  assert.equal(details[0].open,true);assert.ok(!details[1].open);
  assert.equal(details[0].attributes.name,details[1].attributes.name);
  assert.equal(log.querySelectorAll('a')[0].href,'/notes/test/#evidence');
  assert.ok(log.querySelectorAll('p').some(p=>p.textContent.includes('非作者原图')));
  assert.ok(log.querySelectorAll('p').some(p=>p.textContent==='<script>plain text</script>'));
});
