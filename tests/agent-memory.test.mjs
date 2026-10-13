import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rememberAgentAnswer} from '../server/agent-memory.mjs';
const flow={type:'concept_flow',title:'Method',items:[{title:'Search',description:'not stored',source:{id:'doc:1',url:'/note/#one'}},{title:'Filter',description:'not stored',source:{id:'doc:2',url:'/note/#two'}}]};
test('concept history retains ordering and source references even when prose does not repeat the diagram',()=>{
 const saved=JSON.parse(rememberAgentAnswer({text:'These stages form a loop.',blocks:[flow]}));
 assert.equal(saved.visuals[0].items[1].position,2);assert.equal(saved.visuals[0].items[1].title,'Filter');assert.equal(saved.visuals[0].items[1].sourceId,'doc:2');
 assert.ok(!JSON.stringify(saved).includes('not stored'));assert.equal(saved.text,'These stages form a loop.');
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
