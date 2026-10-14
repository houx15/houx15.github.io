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

test('quoted source punctuation cannot flush a half quotation into claim checking',async()=>{
 const quoted='这是方法最明确的一项研究。';
 const quoteCorpus=structuredClone(corpus);quoteCorpus.documents[0].sections[0].text=quoted;
 const output='原文写道：“'+quoted+'”这里只引用原文。';
 let round=0;const events=[];
 const answer=await runContentAgent({question:'引用原文',language:'zh-CN',corpus:quoteCorpus,onEvent:e=>events.push(e),complete:async({onText})=>{
  if(++round===1)return {toolCalls:[{id:'read',name:'read_content',arguments:{id:'notes/quality/zh-CN'}}]};
  onText('原文写道：“'+quoted,ids);
  assert.equal(events.filter(e=>e.type==='answer_delta').length,0);
  onText('”这里只引用原文。',ids);
  return {text:output,sourceIds:ids};
 }});
 assert.equal(round,2);assert.equal(answer.text,output);
 assert.equal(events.filter(e=>e.type==='answer_delta').map(e=>e.text).join(''),output);
});

test('profile facts cannot turn into personal stances in prose or terminal timeline captions',async()=>{
 for(const mode of ['prose','caption','english']) {
  let round=0;const events=[];
  const answer=await runContentAgent({question:'介绍她',language:mode==='english'?'en':'zh-CN',corpus,onEvent:e=>events.push(e),complete:async({onText,messages})=>{
   if(++round===1)return {toolCalls:[{id:'read',name:'read_profile',arguments:{eventId:'startup',language:'zh-CN'}}]};
   if(round===2) {
    if(mode==='caption')return {toolCalls:[{id:'show',name:'show_profile_timeline',arguments:{eventIds:['startup'],caption:'她认为创业是唯一的人生道路。',language:'zh-CN'}}]};
    onText(mode==='english'?'She believes entrepreneurship is the only meaningful career. ':'她认为创业是唯一的人生道路。',['event:startup']);assert.fail('stance should be rejected');
   }
   assert.equal(events.filter(e=>e.type==='block'||e.type==='answer_delta').length,0);
   if(mode==='caption')assert.equal(JSON.parse(messages.at(-1).content).error,'unsupported_caption_claim');
   return {text:'她曾创办公司并担任 CTO。',sourceIds:['event:startup']};
  }});
  assert.equal(round,3);assert.equal(answer.text,'她曾创办公司并担任 CTO。');
 }
});


test('a first-person belief licenses only that statement, not unrelated claims or quoted speakers',()=>{
 const evidence=new Map([[id,'我认为评估需要明确目标。这个项目包含多智能体协作。']]);
 assert.doesNotThrow(()=>checkProseClaims('她认为评估需要明确目标。',ids,evidence));
 assert.doesNotThrow(()=>checkProseClaims('没有证据表明她认为多智能体是唯一正确的方向。',ids,evidence));
 for(const text of ['她认为多智能体是唯一正确的方向。','她相信所有项目都应该使用多智能体。'])assert.throws(()=>checkProseClaims(text,ids,evidence),/Invalid prose claim/);
 const borrowed=new Map([[id,'一位读者说：“我认为多智能体是唯一正确的方向。”']]);
 assert.throws(()=>checkProseClaims('她认为多智能体是唯一正确的方向。',ids,borrowed),/Invalid prose claim/);
 const english=new Map([[id,'I believe evaluation needs explicit goals. This project uses multiple agents.']]);
 assert.doesNotThrow(()=>checkProseClaims('She believes evaluation needs explicit goals.',ids,english));
 assert.throws(()=>checkProseClaims('She believes every project needs multiple agents.',ids,english),/Invalid prose claim/);
 const qualified=new Map([[id,'我认为这个方法可能有效。']]);
 assert.throws(()=>checkProseClaims('她认为这个方法有效。',ids,qualified),/Invalid prose claim/);
});


test('source-qualified denials are not mistaken for necessity claims; contrasting assertions remain rejected',()=>{
 for(const text of [
  '原文将前四项称为“可审查的依据”，并未将其定义为逻辑上的必要条件。',
  '原文将前四项定义为“可审查的依据”，而非逻辑上的必要条件，并指出最后一项“学习效用”才最接近训练数据的实际价值。',
  '原文将前四项定义为“可审查的依据”，而非“必要条件”；它们用于评估数据质量，但文中并未断言缺少任一项就必然不可用。',
  '原文并未将前四项定义为必要条件，而是称其为“可审查的依据”，用于评估数据质量，但文中没有断言缺少任一项就必然不可用。',
  '原文将前四项称为“可审查的依据”，而非必要条件，并未断言缺少任一项数据就必然不可用。'
 ])assert.doesNotThrow(()=>checkProseClaims(text,ids,passages));
 for(const text of ['前四项并非必要条件，但第五项是必要条件。','原文并未将前四项定义为必要条件，但它们仍是必要条件。','没有证明它总会失败，但它必然失败。'])assert.throws(()=>checkProseClaims(text,ids,passages),/Invalid prose claim/);
});
