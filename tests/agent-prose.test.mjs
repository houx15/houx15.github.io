import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readableProse} from '../src/assets/agent-prose.js';
import {checkProseClaims,repairContinuation} from '../server/agent-prose-check.mjs';
import {runContentAgent} from '../server/content-agent.mjs';
const id='notes/quality/zh-CN:0',ids=[id];
const source='整条照搬可能同时强化有用的补救和前面的坏习惯。前四项是可审查的依据，最后一项最接近训练数据的实际价值。';
const passages=new Map([[id,source]]);
const corpus={schemaVersion:1,revision:'test',documents:[{id:'notes/quality/zh-CN',canonicalId:'notes/quality',title:'数据质量',summary:'数据质量',type:'notes',language:'zh-CN',date:'2026-10-01',url:'/notes/quality/',tags:[],sections:[{id,heading:'质量',text:source,url:'/notes/quality/#quality'}]}]};
test('long prose gains sentence-boundary whitespace without rewriting content; authored structure survives',()=>{
 const text=('这是一个完整的句子，介绍资料中的问题和判断依据。').repeat(16);
 const rendered=readableProse(text);assert.ok(rendered.includes('\n\n'));assert.equal(rendered.replace(/\n/g,''),text);
 assert.equal(readableProse('2022年。'),'2022年。');
 assert.equal(readableProse('第一段。\n\n第二段。'),'第一段。\n\n第二段。');
 const code='```\n'+text+'\n```';assert.equal(readableProse(code),code);
 const quoted='“'+text+'”';assert.equal(readableProse(quoted),quoted);
});
test('source checks reject observed strengthening and invented stance, but allow source wording and explicit correction',()=>{
 for(const text of ['整条照搬会同时强化坏习惯。','前四项是必要条件。','前四项是必要但不充分的筛选标准。','前四项之间是逐层递进的筛选关系。','学习效用才是最终判据。','这一节是理解方法的前提。','这是她在普林斯顿期间的研究。','是否学坏取决于坏习惯与补救的比例。','这是方法最明确的一项研究。','她认为所有成功轨迹都不能训练。','前四项是“必要条件”。'])assert.throws(()=>checkProseClaims(text,ids,passages),/Invalid prose claim/);
 for(const text of [source,'前四项并非必要条件。','整条照搬可能同时强化坏习惯。','原文称“前四项是可审查的依据”。','笔记的表述是“整条照搬可能同时强化有用的补救和前面的坏习惯”，用的是“可能”而非必然。','原文并未断言“只要整条照搬成功轨迹，就一定会让模型重复错误、泛化变差”。'])assert.doesNotThrow(()=>checkProseClaims(text,ids,passages));
});
test('late overstatement is repaired without showing it, duplicating prefix, changing citations, or adding tools',async()=>{
 let round=0;const events=[];const prefix='这篇笔记讨论数据质量。';const corrected=prefix+'前四项是可审查的依据。';
 const answer=await runContentAgent({question:'解释数据质量',language:'zh-CN',corpus,onEvent:e=>events.push(e),complete:async({onText,messages,tools})=>{
  if(++round===1)return {toolCalls:[{id:'read',name:'read_content',arguments:{id:'notes/quality/zh-CN'}}]};
  if(round===2){onText(prefix,ids);onText('前四项是必要',ids);onText('条件。',ids);assert.fail('must reject before display');}
  const repair=JSON.parse(messages.at(-1).content);assert.equal(repair.alreadyShownPrefix,prefix);assert.equal(repair.issue.reason,'logical_strength');assert.deepEqual(tools,[]);
  onText('前四项是',ids);onText('可审查的依据。',ids);return {text:'前四项是可审查的依据。',sourceIds:ids};
 }});
 assert.equal(answer.text,corrected);assert.equal(round,3);
 assert.equal(events.filter(e=>e.type==='answer_delta').map(e=>e.text).join(''),corrected);
});
test('claim repairs are bounded and cannot replay the displayed prefix',async()=>{
 let round=0;const events=[];
 await assert.rejects(runContentAgent({question:'解释',language:'zh-CN',corpus,onEvent:e=>events.push(e),complete:async({onText})=>{
  if(++round===1)return {toolCalls:[{id:'read',name:'read_content',arguments:{id:'notes/quality/zh-CN'}}]};
  if(round===2){onText('这篇笔记讨论质量。',ids);onText('前四项是必要条件。',ids);}
  else onText('这篇笔记讨论质量。重复。',ids);
 }}),/Invalid answer continuation/);
 assert.equal(round,4);assert.equal(events.filter(e=>e.type==='answer_delta').map(e=>e.text).join(''),'这篇笔记讨论质量。');
});
test('final-only providers get the same claim check and correction',async()=>{
 let round=0;
 const answer=await runContentAgent({question:'解释',language:'zh-CN',corpus,complete:async()=>{
  if(++round===1)return {toolCalls:[{id:'read',name:'read_content',arguments:{id:'notes/quality/zh-CN'}}]};
  return {text:round===2?'前四项是必要条件。':'前四项是可审查的依据。',sourceIds:ids};
 }});
 assert.equal(round,3);assert.equal(answer.text,'前四项是可审查的依据。');
});

test('internal continuation drops an exact repeated sentence but retains new content',()=>{
 const prior='这篇笔记讨论数据质量，并指出前四项只是可审查的依据。';
 assert.equal(repairContinuation(prior+'学习效用需要实际评估。',prior),'学习效用需要实际评估。');
});
