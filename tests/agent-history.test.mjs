import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSavedTurn,recordPresentationEvent } from '../src/assets/agent-history.js';
const sample=()=>({kind:'agent',question:'What should I read?',events:[
  {type:'block',block:{id:'card',type:'post_cards',items:[{id:'note',title:'A note',summary:'About attention',date:'2026-10-12',type:'notes',url:'/notes/attention/'}]}},
  {type:'source',source:{id:'s',label:'Attention',url:'/notes/attention/'}},
  {type:'answer',text:'Start with this note.',sourceIds:['s']},
  {type:'done'}
]});
test('saved conversation retains sourced cards and prose without credentials or transient progress',()=>{
  const input=sample();input.sessionToken='must-not-survive';input.events[2].requestId='transient';
  const safe=validateSavedTurn(input);
  assert.equal(safe.events[0].block.items[0].url,'/notes/attention/');
  assert.equal(safe.events[2].text,'Start with this note.');
  assert.equal(safe.sessionToken,undefined);assert.equal(safe.events[2].requestId,undefined);
  input.events[0].block.items[0].title='Changed';assert.equal(safe.events[0].block.items[0].title,'A note');
});
test('stored turns reject unfinished streams, missing sources, unsafe links and unbounded input',()=>{
  const incomplete=sample();incomplete.events.pop();assert.equal(validateSavedTurn(incomplete),null);
  const uncited=sample();uncited.events.splice(1,1);assert.equal(validateSavedTurn(uncited),null);
  const unsafe=sample();unsafe.events[0].block.items[0].url='//evil.test';assert.equal(validateSavedTurn(unsafe),null);
  const credential=sample();credential.events.push({type:'status',phase:'model_started'});assert.equal(validateSavedTurn(credential),null);
  const huge=sample();huge.question='x'.repeat(401);assert.equal(validateSavedTurn(huge),null);
});

test('recording long streams stays bounded and never saves incomplete prose',()=>{
 const events=[];
 recordPresentationEvent(events,{type:'source',source:{id:'s',label:'Source',url:'/notes/attention/'}});
 for(let i=0;i<1000;i++)recordPresentationEvent(events,{type:'answer_delta',text:'part',sourceIds:['s']});
 assert.equal(events.length,2);
 assert.equal(validateSavedTurn({kind:'agent',question:'Explain',events:[...events,{type:'done'}]}),null);
 recordPresentationEvent(events,{type:'answer',text:'Final answer.',sourceIds:['s']});
 recordPresentationEvent(events,{type:'done'});
 assert.ok(validateSavedTurn({kind:'agent',question:'Explain',events}));
});
