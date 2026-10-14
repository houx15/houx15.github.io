import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findConceptStep,reviseConceptStep} from '../server/agent-concept-revision.mjs';
import {rememberAgentAnswer} from '../server/agent-memory.mjs';
import {modelHistory} from '../server/agent-model-history.mjs';
import {createQuoteFragments} from '../server/agent-quote-fragments.mjs';
import {runContentAgent} from '../server/content-agent.mjs';
import {createDevelopmentStream} from '../server/development-stream.mjs';
import {consumeAgentStream,validateAgentBlock} from '../src/assets/agent-stream.js';
import {validateSavedTurn} from '../src/assets/agent-history.js';
const visualId='concept-00000000-0000-0000-0000-000000000001';
const source={id:'doc:1',label:'Source',url:'/notes/test/#one'};
const flow={id:'old',type:'concept_flow',visualId,title:'A mechanism',interpretation:true,items:[{title:'One',description:'It will happen.',source},{title:'Two',description:'Another step.',source}]};
const message=block=>({role:'assistant',content:rememberAgentAnswer({text:'Explanation.',blocks:[block]})});
function context(history=[message(flow)]) {
 const quoteFragments=createQuoteFragments();quoteFragments.present({sections:[{id:source.id,text:'It may happen.'}]});
 return {history,evidence:new Map([[source.id,source]]),passages:new Map([[source.id,'It may happen.']]),quoteFragments};
}
const args={visualId,position:1,description:'It may happen.',quoteId:'q0'};
test('revision resolves the exact retained step, rereads its source and persists successive corrections',()=>{
 const ctx=context(),original=structuredClone(ctx.history),revision=reviseConceptStep(args,ctx);
 assert.equal(revision.items[0].previousDescription,'It will happen.');assert.equal(revision.items[0].quote,'It may happen.');
 const history=[...ctx.history,message(revision)];
 assert.equal(findConceptStep(history,visualId,1).description,'It may happen.');
 assert.deepEqual(ctx.history,original);
 const next=reviseConceptStep({...args,description:'Possibly; the source gives no guarantee.'},context(history));
 assert.equal(next.items[0].previousDescription,'It may happen.');
 assert.equal(findConceptStep([...history,message(next)],visualId,1).description,next.items[0].description);
 assert.ok(JSON.parse(modelHistory([message(revision)])[0].content).revisions.length);
});
test('missing, duplicate, legacy, truncated and stale revision targets cannot authorize an edit',()=>{
 for(const history of [[],[message({...flow,visualId:undefined})],[message(flow),message(flow)],[message({...flow,items:flow.items.map(item=>({...item,description:undefined}))})]])assert.equal(findConceptStep(history,visualId,1),null);
 for(const position of [0,6,1.5])assert.equal(findConceptStep([message(flow)],visualId,position),null);
 const revision=reviseConceptStep(args,context());revision.items[0].previousDescription='Unrelated text';
 assert.equal(findConceptStep([message(flow),message(revision)],visualId,1),null);
 assert.throws(()=>reviseConceptStep(args,context([])),/target unavailable/);
});
test('revision needs fresh original evidence, matching exact quotation and a changed description',()=>{
 assert.throws(()=>reviseConceptStep(args,{...context(),evidence:new Map()}),/source unread/);
 for(const changed of [{quoteId:'wrong'},{quoteId:undefined,quote:'It will happen.'},{quoteId:undefined},{quote:'It may happen.'},{description:'It will happen.'}])assert.throws(()=>reviseConceptStep({...args,...changed},context()),/Invalid revision/);
 assert.throws(()=>reviseConceptStep(args,{...context(),alreadyRevised:true}),/Revision limit/);
});
test('revision memory takes priority over long prose while retaining whole claims',()=>{
 const revision=reviseConceptStep(args,context());
 const serialized=rememberAgentAnswer({text:'\u0001'.repeat(5000),blocks:[revision]});
 assert.ok(serialized.length<=3900);const memory=JSON.parse(serialized);
 assert.equal(memory.textTruncated,true);assert.equal(memory.revisions[0].previousDescription,'It will happen.');assert.equal(memory.revisions[0].description,'It may happen.');
});
test('agent revision travels through server history, SSE and saved-turn validation',async()=>{
 const biography={...flow,items:flow.items.map(item=>({...item,source:{...source,id:'event:startup'}}))};
 let round=0,wire='';const stream=createDevelopmentStream(text=>{wire+=text;});
 const answer=await runContentAgent({question:'Correct the first step',supportsConceptRevisions:true,history:[message(biography)],corpus:{schemaVersion:1,revision:'test',documents:[]},onEvent:event=>stream.event(event),complete:async({tools})=>{
  assert.ok(tools.some(tool=>tool.name==='revise_concept_step'));
  if(++round===1)return {toolCalls:[{id:'read',name:'read_profile',arguments:{eventId:'startup'}}]};
  if(round===2)return {toolCalls:[{id:'edit',name:'revise_concept_step',arguments:{visualId,position:1,description:'A corrected explanation.'}}]};
  return {text:'I corrected the explanation.',sourceIds:['event:startup']};
 }});
 stream.complete(answer);
 const events=[];await consumeAgentStream(new Response(wire).body,event=>{if(['source','block','answer','done'].includes(event.type))events.push(event);});
 const saved=validateSavedTurn({kind:'agent',question:'Correct the first step',events});assert.ok(saved);
 const revision=saved.events.find(event=>event.type==='block').block;assert.equal(revision.visualId,visualId);assert.equal(revision.type,'concept_revision');
 assert.equal(findConceptStep([message(biography),{role:'assistant',content:rememberAgentAnswer(answer)}],visualId,1).description,'A corrected explanation.');
 for(const invalid of [{visualId:'unknown'},{items:[{...revision.items[0],position:0}]},{items:[{...revision.items[0],source:{...source,url:'https://evil.test/'}}]}])assert.throws(()=>validateAgentBlock({...revision,...invalid}),/invalid_response/);
});
test('legacy clients are not offered a revision tool',async()=>{
 await runContentAgent({question:'hello',corpus:{schemaVersion:1,revision:'test',documents:[]},complete:async({tools})=>{
  assert.ok(!tools.some(tool=>tool.name==='revise_concept_step'));
  return {toolCalls:[{id:'greet',name:'reply_conversationally',arguments:{reason:'greeting'}}]};
 }});
});
