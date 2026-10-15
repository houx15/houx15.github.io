import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createQuoteFragments} from '../server/agent-quote-fragments.mjs';
import {runContentAgent} from '../server/content-agent.mjs';
const id='notes/test/en:0',other='notes/test/en:1';
const section={id,heading:'Risk',text:'A hypothetical example:\n\nThe result may occur.',url:'/notes/test/#risk'};
const corpus={schemaVersion:1,revision:'test',documents:[{id:'notes/test/en',canonicalId:'notes/test',title:'Test',type:'notes',language:'en',url:'/notes/test/',tags:[],sections:[section,{id:other,heading:'Other',text:'Other evidence.',url:'/notes/test/#other'}]}]};
const flow=quoteIds=>({title:'Risk',labels:['Example','Possible result'],descriptions:['A hypothetical example.','The result may occur.'],sourceIds:[id],quoteIds});
test('fragments retain all text, offer only whole bounded paragraphs and keep same-turn source bindings',()=>{
 const registry=createQuoteFragments(),long='x'.repeat(401);
 const output={sections:[section,{id:other,text:long+'\nA short paragraph.'}]};
 const shown=registry.present(output);
 assert.deepEqual(shown.sections[0].fragments,[{quoteId:'q0',text:'A hypothetical example:'},{quoteId:'q1',text:'The result may occur.'}]);
 assert.deepEqual(shown.sections[1].fragments,[{text:long},{quoteId:'q2',text:'A short paragraph.'}]);
 assert.deepEqual(registry.present(output),shown);
 assert.equal(registry.resolve('q1',id),'The result may occur.');
 assert.throws(()=>registry.resolve('q1',other),/quotation/);
 assert.throws(()=>registry.resolve('missing',id),/quotation/);
 assert.throws(()=>createQuoteFragments().resolve('q1',id),/quotation/);
 assert.equal(output.sections[0].text,section.text);
});
for(const mode of ['explicit','page','history'])test(`quote references resolve after ${mode} source reading`,async()=>{
 let calls=0;const events=[];
 const answer=await runContentAgent({question:'Explain',corpus,...(mode==='page'?{pageContext:{documentId:'notes/test/en',sectionId:id}}:{}),...(mode==='history'?{history:[{role:'assistant',content:JSON.stringify({text:'Earlier',sourceIds:[id]})}]}:{}),onEvent:event=>events.push(event),complete:async({messages})=>{
  calls++;
  if(mode!=='page'&&calls===1)return {toolCalls:[{id:'read',name:'read_content',arguments:{id:'notes/test/en',sectionId:id}}]};
  if(calls===(mode!=='page'?2:1)){
   const read=JSON.parse(messages.at(-1).content),ids=read.sections[0].fragments.map(f=>f.quoteId);
   assert.equal(read.sections[0].text,undefined);
   return {toolCalls:[{id:'draw',name:'show_concept_flow',arguments:flow(ids)}]};
  }
  return {text:'A possible result.',sourceIds:[id]};
 }});
 assert.deepEqual(answer.blocks[0].items.map(item=>item.quote),['A hypothetical example:','The result may occur.']);
 assert.equal(events.filter(e=>e.type==='block').length,1);
});
test('invented, cross-source, mismatched and mixed quote inputs are rejected before presentation and can be repaired',async()=>{
 for(const bad of [flow(['q99','q1']),{...flow(['q0','q1']),sourceIds:[other]},flow(['q0']),{...flow(['q0','q1']),quotes:['A hypothetical example:','The result may occur.']}]){
  let calls=0;const events=[];
  const answer=await runContentAgent({question:'Explain',corpus,onEvent:e=>events.push(e),complete:async({messages})=>{
   calls++;
   if(calls===1)return {toolCalls:[{id:'read',name:'read_content',arguments:{id:'notes/test/en'}}]};
   if(calls===2)return {toolCalls:[{id:'bad',name:'show_concept_flow',arguments:bad}]};
   if(calls===3){assert.equal(events.some(e=>e.type==='block'),false);assert.equal(JSON.parse(messages.at(-1).content).error,'invalid_concept_quotation');return {toolCalls:[{id:'fixed',name:'show_concept_flow',arguments:flow(['q0','q1'])}]};}
   return {text:'A possible result.',sourceIds:[id]};
  }});
  assert.equal(answer.blocks.length,1);
 }
});
