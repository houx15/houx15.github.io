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
