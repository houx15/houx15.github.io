import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rememberAgentAnswer} from '../server/agent-memory.mjs';
const flow={type:'concept_flow',title:'Method',items:[{title:'Search',description:'The earlier explanation may be mistaken.',source:{id:'doc:1',url:'/note/#one'}},{title:'Filter',description:'The earlier explanation may be mistaken.',source:{id:'doc:2',url:'/note/#two'}}]};
test('concept history retains ordering and source references even when prose does not repeat the diagram',()=>{
 const saved=JSON.parse(rememberAgentAnswer({text:'These stages form a loop.',blocks:[flow]}));
 assert.equal(saved.visuals[0].items[1].position,2);assert.equal(saved.visuals[0].items[1].title,'Filter');assert.equal(saved.visuals[0].items[1].sourceId,'doc:2');
 assert.equal(saved.visuals[0].items[1].description,flow.items[1].description);assert.equal(saved.visuals[0].omittedDescriptions,0);assert.equal(saved.text,'These stages form a loop.');
});
test('visual history remains bounded, explicitly omits older diagrams and retains plain answer compatibility',()=>{
 assert.equal(rememberAgentAnswer({text:'Plain answer.',blocks:[]}), 'Plain answer.');
 const large={...flow,title:'x'.repeat(120),items:Array.from({length:5},(_,i)=>({title:'a'.repeat(100),source:{id:`doc:${i}:`+'s'.repeat(350)}}))};
 const saved=rememberAgentAnswer({text:'"'.repeat(10000),blocks:[large,large,flow]});
 assert.ok(saved.length<=4000);const memory=JSON.parse(saved);assert.ok(memory.omittedVisuals>0);assert.equal(memory.visuals.at(-1).title,'Method');
});

test('remembered source IDs alone cannot authorize an answer in a new turn',async()=>{
 const {runContentAgent}=await import('../server/content-agent.mjs');
 await assert.rejects(runContentAgent({question:'Explain step two',corpus:{schemaVersion:1,revision:'test',documents:[]},history:[{role:'assistant',content:rememberAgentAnswer({text:'A diagram.',blocks:[flow]})}],complete:async()=>({text:'Unsupported claim.',sourceIds:['doc:2']})}),/evidence/);
});


test('plain sourced answers retain bounded canonical references without source payloads',()=>{
 const saved=JSON.parse(rememberAgentAnswer({text:'A biography.',sources:[{id:'profile:profile',label:'not stored',url:'/about/'},{id:'profile:profile'},{id:'event:pku'}]}));
 assert.deepEqual(saved.sourceIds,['profile:profile','event:pku']);
 assert.equal(saved.text,'A biography.');assert.ok(!JSON.stringify(saved).includes('not stored'));
 const large=rememberAgentAnswer({text:'"'.repeat(10000),sources:[1,2,3].map(i=>({id:String(i)+'"'.repeat(399)}))});
 assert.ok(large.length<=4000);assert.doesNotThrow(()=>JSON.parse(large));
});


test('same-titled diagrams retain their own displayed claims, not each other’s descriptions',()=>{
 const later={...flow,items:flow.items.map(item=>({...item,description:'A corrected explanation.'}))};
 const memory=JSON.parse(rememberAgentAnswer({text:'Correction.',blocks:[flow,later]}));
 assert.equal(memory.visuals[0].items[0].description,flow.items[0].description);
 assert.equal(memory.visuals[1].items[0].description,'A corrected explanation.');
});

test('missing description capacity is explicit and never truncates a claim into a different statement',()=>{
 const large={...flow,items:Array.from({length:5},(_,i)=>({title:'Step '+i,description:'\"'.repeat(128),source:{id:'doc:'+i+':'+ 's'.repeat(350)}}))};
 const serialized=rememberAgentAnswer({text:'x'.repeat(1000),blocks:[large]});
 const memory=JSON.parse(serialized),visual=memory.visuals[0];
 assert.ok(serialized.length<=4000);assert.ok(visual.omittedDescriptions>0);
 assert.equal(visual.omittedDescriptions,visual.items.filter(item=>!item.description).length);
 for(const item of visual.items)if(item.description)assert.equal(item.description,large.items[0].description);
 assert.equal(visual.items.length,5);
});

test('truncated prose is explicitly a prefix, including unsourced long answers',()=>{
 for(const sources of [[],[{id:'doc:1'}]]) {
  const text='示例'.repeat(2050)+' 上述内容只是一个假设，并非已观察到的结果。';
  const memory=JSON.parse(rememberAgentAnswer({text,sources}));
  assert.equal(memory.textTruncated,true);assert.ok(text.startsWith(memory.text));
  assert.ok(memory.text.length<text.length);
 }
});

test('ordinary retained prose is complete and Unicode is not split at the prefix boundary',()=>{
 const short=JSON.parse(rememberAgentAnswer({text:'Complete statement.',sources:[{id:'doc:1'}]}));
 assert.equal(short.textTruncated,false);
 const text='x'.repeat(999)+'😀'+' remainder';
 const memory=JSON.parse(rememberAgentAnswer({text,sources:[{id:'doc:1'}]}));
 assert.equal(memory.text,'x'.repeat(999));assert.equal(memory.textTruncated,true);
});

test('JSON escape expansion cannot overflow the history envelope',()=>{
 const text='\u0001'.repeat(5000);
 const saved=rememberAgentAnswer({text,sources:[{id:'doc:1'}],blocks:[flow]});
 assert.ok(saved.length<=4000);const memory=JSON.parse(saved);
 assert.equal(memory.textTruncated,true);assert.ok(text.startsWith(memory.text));
});


test('model history separates display metadata from final-answer examples without losing recall',async()=>{
 const {modelHistory}=await import('../server/agent-model-history.mjs');
 const saved=rememberAgentAnswer({text:'A prior answer.',sources:[{id:'doc:2'}],blocks:[flow]});
 const history=[{role:'user',content:'Explain this.'},{role:'assistant',content:saved}];
 const original=structuredClone(history),wire=modelHistory(history);
 assert.deepEqual(history,original);
 assert.equal(wire.length,3);assert.equal(wire[1].role,'user');assert.equal(wire[2].role,'assistant');
 const metadata=JSON.parse(wire[1].content),answer=JSON.parse(wire[2].content),memory=JSON.parse(saved);
 assert.deepEqual(Object.keys(answer),['sourceIds','text']);
 assert.deepEqual(answer,{sourceIds:memory.sourceIds,text:memory.text});
 assert.deepEqual(metadata.visuals,memory.visuals);
 assert.equal(metadata.textTruncated,memory.textTruncated);
 assert.equal(metadata.omittedVisuals,memory.omittedVisuals);
 assert.equal(metadata.type,'previous_display_metadata');
 assert.ok(!wire.some(message=>message.role==='system'));
});

test('model history preserves legacy prose and unrecognized records as untrusted assistant content',async()=>{
 const {modelHistory}=await import('../server/agent-model-history.mjs');
 for(const content of ['Plain answer.','null','[]','{"text":"x","sourceIds":[]}', '{"text":"x","sourceIds":[],"visuals":[],"unexpected":"leave intact"}']) {
  const history=[{role:'assistant',content}];assert.deepEqual(modelHistory(history),history);
 }
});

test('same-titled generated diagrams retain distinct stable identities through stream and saved history',async()=>{
 const {runContentAgent}=await import('../server/content-agent.mjs');
 const {createDevelopmentStream}=await import('../server/development-stream.mjs');
 const {consumeAgentStream}=await import('../src/assets/agent-stream.js');
 const {validateSavedTurn}=await import('../src/assets/agent-history.js');
 const {modelHistory}=await import('../server/agent-model-history.mjs');
 const ids=[];
 for(let iteration=0;iteration<2;iteration++) {
  let round=0,wire='';const stream=createDevelopmentStream(text=>{wire+=text;});
  const answer=await runContentAgent({question:'Draw a profile diagram',corpus:{schemaVersion:1,revision:'test',documents:[]},onEvent:e=>stream.event(e),complete:async()=>{
   if(++round===1)return {toolCalls:[{id:'read',name:'read_profile',arguments:{eventId:'startup'}}]};
   if(round===2)return {toolCalls:[{id:'draw',name:'show_concept_flow',arguments:{title:'Same title',labels:['One','Two'],descriptions:['First explanation.','Second explanation.'],sourceIds:['event:startup']}}]};
   return {text:'A diagram.',sourceIds:['event:startup']};
  }});
  stream.complete(answer);
  const events=[];await consumeAgentStream(new Response(wire).body,e=>{if(['source','block','answer','done'].includes(e.type))events.push(e);});
  const saved=validateSavedTurn({kind:'agent',question:'Draw a profile diagram',events});assert.ok(saved);
  const block=saved.events.find(e=>e.type==='block').block;
  const memory=rememberAgentAnswer(answer),visual=JSON.parse(memory).visuals[0];
  assert.match(visual.visualId,/^concept-/);assert.equal(block.visualId,visual.visualId);
  assert.notEqual(block.id,answer.blocks[0].id); // SSE namespace changes, stable identity does not.
  assert.equal(JSON.parse(modelHistory([{role:'assistant',content:memory}])[0].content).visuals[0].visualId,visual.visualId);
  ids.push(visual.visualId);
 }
 assert.notEqual(ids[0],ids[1]);
});

test('legacy diagrams remain readable and malformed visual references are not retained',async()=>{
 const {validateAgentBlock}=await import('../src/assets/agent-stream.js');
 const legacy={...flow,id:'old-block',interpretation:true,items:flow.items.map(item=>({...item,source:{...item.source,label:'Source'}}))};
 assert.equal(validateAgentBlock(legacy),legacy);
 assert.equal(JSON.parse(rememberAgentAnswer({text:'Legacy',blocks:[legacy]})).visuals[0].visualId,undefined);
 assert.throws(()=>validateAgentBlock({...legacy,visualId:'arbitrary-reference'}),/invalid_response/);
 assert.equal(JSON.parse(rememberAgentAnswer({text:'Malformed',blocks:[{...legacy,visualId:'arbitrary-reference'}]})).visuals[0].visualId,undefined);
});

test('button-only follow-ups remain conversational context without becoming evidence',async()=>{
 const {modelHistory}=await import('../server/agent-model-history.mjs');
 const content=rememberAgentAnswer({text:'Success can include mistakes.',sources:[{id:'doc:1'}],blocks:[{type:'questions',items:[{documentId:'notes/a',query:'How could we evaluate each step?'}]},{type:'questions',items:[{documentId:'notes/b',query:'This second button is not displayed.'}]}]});
 const saved=JSON.parse(content);
 assert.deepEqual(saved.followUp,{question:'How could we evaluate each step?',documentId:'notes/a'});
 const messages=modelHistory([{role:'assistant',content}]);
 const context=JSON.parse(messages[0].content);
 assert.deepEqual(context.followUp,saved.followUp);assert.match(context.guidance,/not verified facts/);
 assert.equal(JSON.parse(messages[1].content).text,'Success can include mistakes.');
 const {runContentAgent}=await import('../server/content-agent.mjs');
 await assert.rejects(runContentAgent({question:'Why that question?',history:[{role:'assistant',content}],corpus:{schemaVersion:1,revision:'empty',documents:[]},complete:async()=>({text:'Invented justification.',sourceIds:['doc:1']})}),/evidence/);
});

test('follow-up memory stays within the existing history bound with escaped text',()=>{
 const content=rememberAgentAnswer({text:'"'.repeat(10000),sources:[{id:'s'.repeat(400)}],blocks:[{type:'questions',items:[{documentId:'"'.repeat(400),query:'"'.repeat(400)}]},flow]});
 assert.ok(content.length<=4000);const saved=JSON.parse(content);
 assert.ok(saved.followUp || saved.omittedFollowUp);assert.equal(saved.textTruncated,true);
});

test('actual reading records survive independently of citations without becoming new evidence',async()=>{
 const {runContentAgent}=await import('../server/content-agent.mjs');
 const {modelHistory}=await import('../server/agent-model-history.mjs');
 const answer=await runContentAgent({question:'Explain the source',pageContext:{documentId:'notes/read/en',sectionId:'notes/read/en:0'},corpus:{schemaVersion:1,revision:'read',documents:[{id:'notes/read/en',title:'Read',summary:'Read',tags:[],language:'en',type:'notes',url:'/notes/read/',sections:[{id:'notes/read/en:0',heading:'First',text:'One fact',url:'/notes/read/#first'},{id:'notes/read/en:1',heading:'Second',text:'Another fact',url:'/notes/read/#second'}]}]},complete:async()=>({text:'One fact.',sourceIds:['notes/read/en:0']})});
 const saved=rememberAgentAnswer(answer),memory=JSON.parse(saved);
 assert.deepEqual(memory.sourceIds,['notes/read/en:0']);
 assert.deepEqual(memory.readRecord.sources.map(s=>s.id),['notes/read/en:0','notes/read/en:1']);
 assert.equal(memory.readRecord.omitted,0);
 assert.deepEqual(JSON.parse(modelHistory([{role:'assistant',content:saved}])[0].content).readRecord,memory.readRecord);
 await assert.rejects(runContentAgent({question:'Use the earlier read',corpus:{schemaVersion:1,revision:'empty',documents:[]},history:[{role:'assistant',content:saved}],complete:async()=>({text:'Another fact.',sourceIds:['notes/read/en:1']})}),/evidence/);
});

test('reading records distinguish no reads from unknown legacy reads and bound omitted entries',()=>{
 const empty=JSON.parse(rememberAgentAnswer({text:'Hello.',readSources:[]}));
 assert.deepEqual(empty.readRecord,{sources:[],omitted:0});
 assert.equal(rememberAgentAnswer({text:'Legacy.'}),'Legacy.');
 const reads=Array.from({length:30},(_,i)=>({id:`doc:${i}`,label:'A long section title '.repeat(10)}));
 const saved=rememberAgentAnswer({text:'Short answer.',readSources:reads});
 assert.ok(saved.length<=3900);
 const record=JSON.parse(saved).readRecord;
 assert.equal(record.sources.length+record.omitted,30);
 assert.ok(record.omitted>0);
});
