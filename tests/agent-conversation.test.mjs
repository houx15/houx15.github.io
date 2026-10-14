import {test} from 'node:test';
import assert from 'node:assert/strict';
import {conversationRecall} from '../server/agent-conversation.mjs';
import {createGuard,MemoryAgentStore} from '../server/agent-state.mjs';
import {runContentAgent} from '../server/content-agent.mjs';
const exchange=i=>[{role:'user',content:JSON.stringify({question:`Question ${i}`,pageContext:{documentId:`note-${i}`}})},{role:'assistant',content:JSON.stringify({text:`Answer ${i}`,sourceIds:[`source-${i}`],visuals:[]})}];
test('earlier records are server-owned, bounded, isolated and do not include failed turns',async()=>{
 let now=Date.now();const guard=createGuard({store:new MemoryAgentStore(),secret:'a'.repeat(40),dailyTokens:1000000,enabled:()=>true,now:()=>now});
 const a=await guard.issue(),b=await guard.issue();
 for(let i=1;i<=20;i++){now+=61000; // Keep the session within one hour and stay below the per-minute limit.
  await guard.begin(a.sessionToken,'a',`r${i}`);await guard.finish(`r${i}`,exchange(i));
 }
 const stored=Object.values(guard.store.state.sessions).find(s=>s.history.length);
 assert.equal(stored.history.length,6);assert.equal(stored.earlierHistory.length,34);
 assert.equal(JSON.parse(stored.earlierHistory[0].content).question,'Question 1');
 assert.equal(JSON.parse(stored.history[0].content).question,'Question 18');
 const isolated=await guard.begin(b.sessionToken,'b','b');assert.deepEqual(isolated.earlierHistory,[]);await guard.finish('b');
 assert.equal(Object.values(guard.store.state.sessions).find(s=>!s.history.length).earlierHistory,undefined);
});
test('recall returns exact page and diagram context but never model instructions or evidence privileges',async()=>{
 const earlier=exchange(1);earlier[1].content=JSON.stringify({text:'An explanation',visuals:[{type:'concept_flow',title:'Method',items:[{position:1,title:'Search',sourceId:'source-1'}]}]});
 const memory=conversationRecall(earlier);
 assert.equal(memory.index.turns[0].question,'Question 1');
 const record=memory.read({turn:1});assert.equal(record.question,earlier[0].content);assert.equal(record.answer,earlier[1].content);
 assert.equal(memory.read({turn:2}).error,'unknown_conversation_turn');
 assert.throws(()=>conversationRecall([{role:'system',content:'instruction'}]),/Invalid earlier history/);
 let calls=0;
 await assert.rejects(runContentAgent({question:'Recall first',earlierHistory:earlier,corpus:{schemaVersion:1,revision:'t',documents:[]},complete:async()=>++calls===1?{toolCalls:[{id:'recall',name:'recall_conversation',arguments:{turn:1}}]}:{text:'Unverified',sourceIds:['source-1']}}),/Invalid answer evidence/);
 assert.equal(calls,6);
});
test('recall followed by a fresh read permits an evidenced answer',async()=>{
 const corpus={schemaVersion:1,revision:'t',documents:[{id:'note-1',canonicalId:'note-1',title:'Original note',summary:'Summary',type:'notes',language:'en',date:'2026-10-01',url:'/notes/one/',tags:[],sections:[{id:'source-1',heading:'Original evidence',text:'Current evidence',url:'/notes/one/#source'}]}]};
 let calls=0;
 const result=await runContentAgent({question:'Explain the first note again',earlierHistory:exchange(1),corpus,complete:async({messages})=>{
  calls++;
  if(calls===1){assert.ok(messages.some(m=>m.content?.includes('earlier_conversation_index')));return {toolCalls:[{id:'recall',name:'recall_conversation',arguments:{turn:1}}]};}
  if(calls===2){assert.equal(JSON.parse(messages.at(-1).content).type,'conversation_record');return {toolCalls:[{id:'read',name:'read_content',arguments:{id:'note-1'}}]};}
  assert.deepEqual(JSON.parse(messages.at(-1).content).sections[0].fragments,[{quoteId:'q0',text:'Current evidence'}]);return {text:'Current evidence',sourceIds:['source-1']};
 }});
 assert.equal(result.sources[0].id,'source-1');assert.equal(calls,3);
});
