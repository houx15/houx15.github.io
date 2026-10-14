import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createConversationQuoteCheck} from '../server/agent-conversation-quote.mjs';
import {runContentAgent} from '../server/content-agent.mjs';
const answer=(text,textTruncated=false)=>({role:'assistant',content:JSON.stringify({text,textTruncated,sourceIds:['s'],visuals:[]})});
test('explicit previous-answer quotations must exist in assistant prose, not visitor text or metadata',()=>{
 const check=createConversationQuoteCheck([{role:'user',content:'不可直接审查'},answer('最难直接审查')]);
 assert.doesNotThrow(()=>check('我上一轮说“最难直接审查”，这超出了原文。'));
 assert.throws(()=>check('我上一轮把“不可直接审查”概括为“最难评估”。'),e=>e.proseIssue.reason==='conversation_quote' && e.proseIssue.retainedAnswers[0].text==='最难直接审查');
 assert.throws(()=>createConversationQuoteCheck([{role:'assistant',content:JSON.stringify({text:'Actual prose',visuals:[{title:'invented quote'}]})}])('I previously said "invented quote".'),/Invalid prose claim/);
});
test('latest references cannot quote an older answer, while earlier references can',()=>{
 const check=createConversationQuoteCheck([answer('Latest answer')],[answer('Earlier answer')]);
 assert.throws(()=>check('I just said "Earlier answer".'),/Invalid prose claim/);
 assert.doesNotThrow(()=>check('I earlier wrote "Earlier answer".'));
 assert.doesNotThrow(()=>check('我之前说「Earlier answer」。'));
});
test('normal source quotes, questions and denials are outside this narrow check',()=>{
 const check=createConversationQuoteCheck([]);
 for(const text of ['原文写的是“可审查的依据”。','我上一轮没有说“最难评估”。','你刚才说“最难评估”吗？','I did not say "always".','I previously did not say "always".','不能声称我之前说“always”。','访客问：“我之前说“always”吗？”'])assert.doesNotThrow(()=>check(text));
});
test('missing and truncated memory is reported as unavailable wording, never disproof',()=>{
 const check=createConversationQuoteCheck([answer('Retained prefix',true)]);
 assert.throws(()=>check('I previously said "missing suffix".'),e=>e.proseIssue.retainedAnswers[0].truncated===true);
 assert.doesNotThrow(()=>check('I previously said "Retained   prefix".'));
});
test('streamed fabricated recollection stays private and repair preserves already displayed prose',async()=>{
 const events=[],source={id:'s',heading:'Evidence',text:'Source wording.',url:'/notes/n/#e'};
 const corpus={schemaVersion:1,revision:'test',documents:[{id:'n',canonicalId:'n',title:'Note',summary:'Note',type:'notes',language:'en',date:'2026-10-01',url:'/notes/n/',tags:[],sections:[source]}]};
 let round=0;
 const result=await runContentAgent({question:'Check your prior answer',history:[answer('Actual earlier wording')],corpus,onEvent:e=>events.push(e),complete:async({messages,onText})=>{
  if(++round===1)return {toolCalls:[{id:'read',name:'read_content',arguments:{id:'n'}}]};
  if(round===2){onText('The note says “Source wording.”. ',['s']);onText('I previously said "Invented wording". ',['s']);throw new Error('unreachable');}
  assert.equal(JSON.parse(messages.at(-1).content).issue.reason,'conversation_quote');
  return {text:'I previously said "Actual earlier wording". That was my earlier wording.',sourceIds:['s']};
 }});
 assert.equal(round,3);assert.ok(result.text.startsWith('The note says'));
 assert.ok(!JSON.stringify(events).includes('Invented wording'));
 assert.ok(result.text.includes('Actual earlier wording'));
});

test('attribution examples are system guidance for follow-ups, not fabricated conversation records',async()=>{
 for(const history of [[],[answer('Earlier answer')]]) {
  let inspected=false;
  await runContentAgent({question:'Thanks',history,corpus:{schemaVersion:1,revision:'test',documents:[]},complete:async({messages})=>{
   inspected=true;
   assert.equal(messages[0].content.includes('FICTIONAL CONTRAST EXAMPLES'),history.length>0);
   assert.ok(messages.slice(1).every(message=>!message.content?.includes('缓存容量有限')));
   return {toolCalls:[{id:'thanks',name:'reply_conversationally',arguments:{reason:'thanks'}}]};
  }});
  assert.equal(inspected,true);
 }
});
