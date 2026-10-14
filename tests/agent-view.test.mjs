import {recordPresentationEvent,validateSavedTurn} from '../src/assets/agent-history.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAgentTurn } from '../src/assets/agent-view.js';

class Element {
  constructor(tag){this.tag=tag;this.children=[];this.className='';this.textContent='';this.attributes={};this.classList={add:name=>{this.className+=' '+name;},remove:name=>{this.className=this.className.split(' ').filter(x=>x!==name).join(' ');},toggle:(name,value)=>{if(value)this.classList.add(name);else this.classList.remove(name);}};}
  contains(node){return this===node || this.children.some(child=>child.contains(node));}
  get lastElementChild(){return this.children.at(-1) ?? null;}
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
    {title:'First',description:'<script>plain text</script>',quote:'<img src=x> stays literal in a quotation.',source:{id:'s',label:'Evidence',url:'/notes/test/#evidence'}},
    {title:'Second',description:'Next explanation',source:{id:'s',label:'Evidence',url:'/notes/test/#evidence'}}
  ]}});
  const details=log.querySelectorAll('details');
  assert.equal(details[0].open,true);assert.ok(!details[1].open);
  assert.equal(details[0].attributes.name,details[1].attributes.name);
  assert.equal(log.querySelectorAll('a')[0].href,'/notes/test/#evidence');
  assert.ok(log.querySelectorAll('p').some(p=>p.textContent.includes('非作者原图')));
  assert.ok(log.querySelectorAll('p').some(p=>p.textContent==='<script>plain text</script>'));
  assert.equal(log.querySelectorAll('blockquote').filter(node=>!node.hidden).length,1);
  assert.ok(log.querySelectorAll('p').some(p=>p.textContent==='<img src=x> stays literal in a quotation.'));
});


test('manual retry replaces only the immediately preceding empty failed question',()=>{
  const log=new Element('div');
  let previous=createAgentTurn(document,{log,question:'Why?'});
  previous.interrupt();
  for(let attempt=0;attempt<3;attempt++) {
    previous=createAgentTurn(document,{log,question:'Why?',retry:previous});
    assert.equal(log.children.length,1);
    assert.equal(log.lastElementChild,previous.row);
    assert.equal(previous.canReplace,false);
    previous.event({type:'error',code:'challenge_failed'});
    assert.equal(previous.canReplace,true);
  }
});

test('retry preserves partial prose, visual evidence, successful and active turns',()=>{
  for(const state of ['text','visual','done','active']) {
    const log=new Element('div'),previous=createAgentTurn(document,{log,question:'Why?'});
    if(state==='text')previous.event({type:'answer_delta',text:'A partial explanation'});
    if(state==='visual')previous.event({type:'block',block:{id:'b',type:'post_cards',items:[{id:'a',title:'Source',summary:'Summary',url:'/notes/test/',date:'2026-10-12',type:'notes'}]}});
    if(state==='done')previous.event({type:'done'});
    if(['text','visual'].includes(state))previous.interrupt();
    createAgentTurn(document,{log,question:'Why?',retry:previous});
    assert.equal(log.children.length,2,state);
    assert.equal(log.children[0],previous.row,state);
    if(state==='text')assert.equal(log.querySelector('.comic-reply').textContent,'A partial explanation');
    if(state==='visual')assert.equal(log.querySelectorAll('a')[0].href,'/notes/test/');
  }
});

test('a different question or intervening interaction never removes an old failure',()=>{
  for(const intervening of [false,true]) {
    const log=new Element('div'),previous=createAgentTurn(document,{log,question:'Why?'});
    previous.interrupt();
    if(intervening)log.append(new Element('article'));
    createAgentTurn(document,{log,question:intervening?'Why?':'What next?',retry:previous});
    assert.equal(log.children[0],previous.row);
    assert.equal(log.children.length,intervening?3:2);
  }
});

test('quota feedback distinguishes daily from monthly and includes a local reset time',async()=>{
 const {agentFailureMessage}=await import('../src/assets/agent-view.js');
 const resetsAt=Date.parse('2026-11-01T00:00:00Z');
 assert.match(agentFailureMessage('daily_budget_exhausted','zh-CN',{resetsAt}),/今日.*下次重置/);
 assert.match(agentFailureMessage('monthly_budget_exhausted','en',{resetsAt}),/month.*Next reset/);
 assert.doesNotMatch(agentFailureMessage('daily_budget_exhausted','en',{resetsAt:'untrusted'}),/untrusted|Invalid Date/);
 const log=new Element('div'),turn=createAgentTurn(document,{log,question:'Continue',language:'zh-CN'});
 turn.event({type:'error',code:'daily_budget_exhausted',partial:false,resetsAt});turn.interrupt('Generic error');
 assert.ok(log.querySelectorAll('span').some(node=>node.textContent.includes('下次重置')));
});

test('streamed diagrams and prose retain their arrival order without inserting above an existing diagram',()=>{
 const card=id=>({type:'block',block:{id,type:'publication_timeline',dateKind:'publication',items:[{id:'a',title:'Source',summary:'Summary',url:'/notes/test/',date:'2026-10-12',type:'notes'}]}});
 for(const diagramFirst of [true,false]) {
  const log=new Element('div'),turn=createAgentTurn(document,{log,question:'Explain'});
  if(diagramFirst)turn.event(card('first'));
  turn.event({type:'answer_delta',text:'A brief takeaway.'});
  if(!diagramFirst)turn.event(card('first'));
  turn.event(card('second'));
  turn.event({type:'answer',text:'A brief takeaway.',sourceIds:[]});
  const content=turn.row.children.filter(n=>['comic-live-body','comic-agent-block'].includes(n.className));
  assert.deepEqual(content.map(n=>n.className),diagramFirst?['comic-agent-block','comic-live-body','comic-agent-block']:['comic-live-body','comic-agent-block','comic-agent-block']);
 }
});


test('quota failures offer one localized reading exit, including admission errors before streaming',()=>{
 for(const language of ['zh-CN','en'])for(const stream of [true,false]) {
  const log=new Element('div'),turn=createAgentTurn(document,{log,question:'x',language});
  if(stream)turn.event({type:'error',code:'daily_budget_exhausted',partial:false});
  else turn.interrupt('Quota unavailable',{code:'monthly_budget_exhausted'});
  turn.interrupt('Duplicate failure',{code:'daily_budget_exhausted'});
  const links=log.querySelectorAll('a');assert.equal(links.length,1);
  assert.equal(links[0].href,language==='zh-CN'?'/zh/notes/':'/notes/');
  assert.equal(log.querySelectorAll('button').length,0);
 }
 for(const code of ['stopped','provider_unavailable','challenge_failed']) {
  const log=new Element('div'),turn=createAgentTurn(document,{log,question:'x'});
  turn.interrupt('Failure',{code});assert.equal(log.querySelectorAll('a').length,0);
 }
});


test('long timelines reveal an ordered preview and keep remaining entries in one disclosure',()=>{
 for(const language of ['zh-CN','en'])for(const count of [1,3,4,8])for(const biography of [true,false]) {
  const items=Array.from({length:count},(_,i)=>biography?{id:`event:${i}`,title:`Chapter ${i}`,period:'2020',description:`Description ${i}`,source:{id:`event:${i}`,label:`Chapter ${i}`,url:'/about/#sources'}}:{id:`post:${i}`,title:`Post ${i}`,summary:'Summary',type:'notes',date:'2020-01-01',url:'/notes/test/'});
  const log=new Element('div'),turn=createAgentTurn(document,{log,question:'Show a timeline',language});
  turn.event({type:'block',block:{id:'timeline',type:biography?'event_timeline':'publication_timeline',dateKind:biography?'biography':'publication',asOf:'2026-10-10',items}});
  const block=turn.row.children.find(node=>node.className.includes('comic-agent-block'));
  const preview=block.children.find(node=>node.tag==='ol'),more=block.children.find(node=>node.tag==='details');
  assert.equal(preview.children.length,count>3?2:count);
  assert.equal(Boolean(more),count>3);
  assert.deepEqual(block.querySelectorAll('h3').map(node=>node.textContent),items.map(item=>item.title));
  assert.equal(block.querySelectorAll('a').length,count);
  if(more){assert.equal(more.open,undefined);assert.equal(more.querySelectorAll('li').length,count-2);assert.equal(more.querySelectorAll('ol')[0].attributes.start,'3');}
 }
});

test('connection phases share one progress label and cannot overwrite a completed failure',()=>{
 for(const language of ['en','zh-CN']) {
  const log=new Element('div'),turn=createAgentTurn(document,{log,question:'Hello',language});
  const label=log.querySelectorAll('span')[0];
  turn.connectionPhase('verification');assert.match(label.textContent,/无需注册|No account/);
  turn.connectionPhase('arbitrary provider text');assert.match(label.textContent,/无需注册|No account/);
  turn.connectionPhase('connecting');assert.match(label.textContent,/正在连接|Connecting/);
  turn.event({type:'status',phase:'tool_started',tool:'read_profile'});assert.match(label.textContent,/公开经历|public biography/);
  turn.event({type:'answer_delta',text:'A partial answer'});assert.match(label.textContent,/正在回答|Writing/);
  turn.interrupt('Stopped for this test');
  turn.connectionPhase('verification');assert.equal(label.textContent,'Stopped for this test');
 }
});

test('successful revisions update one stable target only after done and replay identically',()=>{
 const visualId='concept-00000000-0000-0000-0000-000000000001',otherId='concept-00000000-0000-0000-0000-000000000002';
 const source={id:'s',label:'Source',url:'/notes/test/'};
 const flow={id:'first',type:'concept_flow',visualId,title:'Same title',interpretation:true,items:[{title:'One',description:'Will happen',source},{title:'Two',description:'Unchanged',source}]};
 const revision={id:'edit',type:'concept_revision',visualId,title:'Same title',items:[{position:1,title:'One',previousDescription:'Will happen',description:'May happen',quote:'Possibly',source}]};
 for(const restored of [false,true]) {
  const log=new Element('div');
  const original=createAgentTurn(document,{log,question:'Draw',restored});original.event({type:'block',block:flow});original.event({type:'done'});
  const other=createAgentTurn(document,{log,question:'Another',restored});other.event({type:'block',block:{...flow,id:'other',visualId:otherId}});other.event({type:'done'});
  const turn=createAgentTurn(document,{log,question:'Correct',restored});turn.event({type:'block',block:revision});
  assert.ok(original.row.querySelectorAll('p').some(node=>node.textContent==='Will happen'));
  turn.event({type:'done'});
  assert.ok(original.row.querySelectorAll('p').some(node=>node.textContent==='May happen'));
  assert.ok(other.row.querySelectorAll('p').some(node=>node.textContent==='Will happen'));
  assert.ok(turn.row.querySelectorAll('summary').some(node=>node.textContent.includes('updated in the original')));
 }
});

test('failed, stale or absent diagram revisions never claim to update an original',()=>{
 const visualId='concept-00000000-0000-0000-0000-000000000001',source={id:'s',label:'Source',url:'/notes/test/'};
 for(const scenario of ['failed','absent','stale']) {
  const log=new Element('div'),original=createAgentTurn(document,{log,question:'Draw'});
  original.event({type:'block',block:{id:'f',type:'concept_flow',visualId,title:'Flow',interpretation:true,items:[{title:'One',description:'Will happen',source},{title:'Two',description:'Unchanged',source}]}});original.event({type:'done'});
  if(scenario==='absent')log.replaceChildren();
  const turn=createAgentTurn(document,{log,question:'Correct'});
  turn.event({type:'block',block:{id:'r',type:'concept_revision',visualId,title:'Flow',items:[{position:1,title:'One',previousDescription:scenario==='stale'?'Wrong previous':'Will happen',description:'May happen',source}]}});
  if(scenario==='failed')turn.interrupt();else turn.event({type:'done'});
  assert.ok(original.row.querySelectorAll('p').some(node=>node.textContent==='Will happen'));
  assert.ok(!turn.row.querySelectorAll('summary').some(node=>node.textContent.includes('updated in the original')));
 }
});

test('prose sources appear with the first text and survive interruption',()=>{
 const log=new Element('div'),turn=createAgentTurn(document,{log,question:'Explain this',language:'zh-CN'});
 turn.event({type:'source',source:{id:'used',label:'Original section',url:'/notes/test/#section'}});
 turn.event({type:'source',source:{id:'unused',label:'Other lookup',url:'/notes/other/'}});
 assert.equal(log.querySelectorAll('a').length,0);
 turn.event({type:'answer_delta',text:'A partial claim',sourceIds:['used']});
 const disclosure=log.querySelectorAll('details')[0];
 assert.ok(!disclosure.open);
 assert.deepEqual(log.querySelectorAll('a').map(a=>a.href),['/notes/test/#section']);
 disclosure.open=true;
 turn.event({type:'answer_delta',text:' continues',sourceIds:['used']});
 turn.interrupt();
 assert.equal(log.querySelectorAll('details')[0],disclosure);
 assert.equal(disclosure.open,true);
 assert.equal(log.querySelectorAll('a').length,1);
 assert.match(turn.row.className,/is-incomplete/);
});

test('completion preserves the open source disclosure instead of replacing it',()=>{
 const log=new Element('div'),turn=createAgentTurn(document,{log,question:'Explain this'});
 turn.event({type:'source',source:{id:'s',label:'Original section',url:'/notes/test/#section'}});
 turn.event({type:'answer_delta',text:'First part',sourceIds:['s']});
 const disclosure=log.querySelectorAll('details')[0];disclosure.open=true;
 turn.event({type:'answer',text:'First part and conclusion.',sourceIds:['s']});
 turn.event({type:'done'});
 assert.equal(log.querySelectorAll('details')[0],disclosure);
 assert.equal(disclosure.open,true);
 assert.equal(log.querySelectorAll('a').length,1);
 assert.equal(log.querySelector('.comic-reply').textContent,'First part and conclusion.');
});

test('recommendations arrive after the explanation, regardless of tool emission order',()=>{
 const log=new Element('div'),turn=createAgentTurn(document,{log,question:'Show and recommend'});
 const card={type:'post_cards',id:'card',items:[{id:'projects/demo/en',title:'Demo',summary:'A public project.',url:'/projects/demo/',date:'2026-10-10',type:'projects'}]};
 const pending=turn.event({type:'block',block:card});
 assert.equal(log.contains(pending),false);
 assert.equal(log.querySelectorAll('a').length,0);
 turn.event({type:'block',block:{id:'timeline',type:'publication_timeline',dateKind:'publication',items:[{id:'projects/demo/en',title:'Demo',summary:'A public project.',url:'/projects/demo/',date:'2026-10-10',type:'projects'}]}});
 turn.event({type:'answer_delta',text:'A brief introduction.'});
 const body=turn.row.children.find(node=>node.className==='comic-live-body');
 assert.ok(body);
 const revealed=turn.event({type:'done'});
 assert.equal(revealed,pending);
 assert.ok(turn.row.children.indexOf(revealed)>turn.row.children.indexOf(body));
 assert.equal(log.querySelectorAll('a').length,2);
 turn.event({type:'done'});
 assert.equal(log.querySelectorAll('a').length,2);
});

test('an interrupted response retains valid pending recommendation cards',()=>{
 const log=new Element('div'),turn=createAgentTurn(document,{log,question:'Recommend'});
 const card=turn.event({type:'block',block:{type:'post_cards',id:'card',items:[{id:'projects/demo/en',title:'Demo',summary:'A public project.',url:'/projects/demo/',date:'2026-10-10',type:'projects'}]}});
 assert.equal(log.contains(card),false);
 turn.interrupt('Stopped');
 assert.equal(log.contains(card),true);
 assert.match(turn.row.className,/is-incomplete/);
 assert.equal(turn.canReplace,false);
});

test('restored turns preserve the first visible prose position and later citations',()=>{
 for(const diagramFirst of [false,true]) {
  const timeline={type:'block',block:{id:'timeline',type:'publication_timeline',dateKind:'publication',items:[{id:'note',title:'A note',summary:'About attention',url:'/notes/attention/',date:'2026-10-12',type:'notes'}]}};
  const source=id=>({type:'source',source:{id,label:id,url:'/notes/attention/'}});
  const events=[source('s1')];
  if(diagramFirst)events.push(timeline);
  events.push({type:'answer_delta',text:'First sentence.',sourceIds:['s1']});
  if(!diagramFirst)events.push(timeline);
  events.push(source('s2'),{type:'answer_delta',text:' More detail.',sourceIds:['s2']},{type:'answer',text:'First sentence. More detail.',sourceIds:['s1','s2']},{type:'done'});
  const saved=[],live=createAgentTurn(document,{log:new Element('div'),question:'Explain'});
  for(const event of events){live.event(event);recordPresentationEvent(saved,event);}
  const safe=validateSavedTurn({kind:'agent',question:'Explain',events:saved});assert.ok(safe);
  const restored=createAgentTurn(document,{log:new Element('div'),question:'Explain',restored:true});
  for(const event of safe.events)restored.event(event);
  const order=turn=>turn.row.children.filter(n=>['comic-live-body','comic-agent-block'].includes(n.className)).map(n=>n.className);
  assert.deepEqual(order(restored),order(live));
  assert.equal(restored.row.querySelector('.comic-reply').textContent,'First sentence. More detail.');
  assert.equal(restored.row.querySelectorAll('a').length,3);
  assert.equal(safe.events.filter(e=>e.type==='answer').length,1);
  assert.equal(safe.events.some(e=>e.type==='answer_delta'),false);
 }
});
