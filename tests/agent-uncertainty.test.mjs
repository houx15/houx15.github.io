import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {findUncertaintyConflict,checkConceptUncertainty} from '../server/agent-uncertainty.mjs';
import {runContentAgent} from '../server/content-agent.mjs';

test('recorded MASS caption and explanation are rejected despite a qualifier in a different clause',async()=>{
 const fixture=JSON.parse(await fs.readFile(new URL('../evals/companion/concept-caption-certainty.json',import.meta.url),'utf8'));
 for(const text of Object.values(fixture.observedFailure))assert.ok(findUncertaintyConflict(text,fixture.sourceQuote));
 assert.equal(findUncertaintyConflict('整条照搬可能同时强化好坏行为。',fixture.sourceQuote),null);
});
test('narrow prediction check retains qualified claims, negative statements, non-predictions and definite sources',()=>{
 for(const text of ['模型可能会同时学习两者。','模型未必会强化两者。','这不一定会导致失败。','这不是必然。','需要检查数据质量。','社会学习涉及多个步骤。','It may reinforce both.','It will not always work.','It is not guaranteed to work.'])assert.equal(findUncertaintyConflict(text,'It may reinforce both. 整条照搬可能强化两者。'),null,text);
 assert.equal(findUncertaintyConflict('It will run.','This operation runs.'),null);
 assert.equal(findUncertaintyConflict('模型会产生输出。','这个例子不可能发生。'),null);
 assert.ok(findUncertaintyConflict('It will reinforce both.','It might reinforce both.'));
 assert.ok(findUncertaintyConflict('It will not work.','It may not work.'));
 assert.ok(findUncertaintyConflict('这不会导致失败。','这可能导致失败。'));
});
test('concept check inspects titles, captions and individual source associations without mutating text',()=>{
 const passages=new Map([['s','这可能降低质量。'],['certain','系统会产生输出。']]);
 const item={title:'风险',description:'质量可能下降。',source:{id:'s'}};
 for(const bad of [{title:'必然降低质量',items:[item]},{caption:'这会降低质量。',items:[item]},{items:[{...item,description:'这会降低质量。'}]},{items:[{...item,title:'必然降低质量'}]}])assert.throws(()=>checkConceptUncertainty(bad,passages),/certainty conflict/);
 const safe={items:[item,{title:'输出',description:'系统会产生输出。',source:{id:'certain'}}]};
 const original=structuredClone(safe);checkConceptUncertainty(safe,passages);assert.deepEqual(safe,original);
});
test('a conflicting concept is repaired before any visible event without extra review calls',async()=>{
 const sourceId='notes/example/en:0';
 const corpus={schemaVersion:1,revision:'test',documents:[{id:'notes/example/en',canonicalId:'notes/example',title:'Example',summary:'Example',type:'notes',language:'en',url:'/notes/example/',date:'2026-10-01',tags:[],sections:[{id:sourceId,heading:'Risk',text:'It may reinforce both good and bad habits.',url:'/notes/example/#risk'}]}]};
 const events=[];let calls=0;
 const args={title:'Learning risks',labels:['Mixed example','Learning'],descriptions:['An example may contain mixed decisions.','It will reinforce both good and bad habits.'],sourceIds:[sourceId],quoteIds:['q0','q0'],caption:'Success does not guarantee a useful training example.'};
 const answer=await runContentAgent({question:'Explain risks in two steps',corpus,onEvent:event=>events.push(event),complete:async({messages})=>{
  calls++;
  if(calls===1)return {toolCalls:[{id:'r',name:'read_content',arguments:{id:'notes/example/en'}}]};
  if(calls===2)return {toolCalls:[{id:'bad',name:'show_concept_flow',arguments:args}]};
  assert.equal(events.filter(event=>['block','answer_delta','answer'].includes(event.type)).length,0);
  assert.equal(JSON.parse(messages.at(-1).content).error,'source_uncertainty_conflict');
  return {toolCalls:[{id:'fixed',name:'show_concept_flow',arguments:{...args,descriptions:[args.descriptions[0],'It may reinforce both good and bad habits.']}}]};
 }});
 assert.equal(calls,3);assert.equal(answer.blocks.length,1);assert.match(answer.blocks[0].items[1].description,/may/);
});
