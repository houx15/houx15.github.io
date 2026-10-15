import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fitAgentContext} from '../server/agent-context.mjs';
const source=(id,text)=>({id,heading:'Evidence',url:'/blog/test/',fragments:[{quoteId:`q${id}`,text}]});
const tool=(id,sections)=>({role:'tool',toolCallId:id,content:JSON.stringify({sections})});
test('oversized repeated reads are deduplicated without losing original qualifiers or mutating retained evidence',()=>{
 const passage='可能有效，但尚未验证。'.repeat(400),section=source('s1',passage);
 const messages=[{role:'system',content:'policy'},{role:'user',content:JSON.stringify({question:'Why?',language:'en'})},tool('one',[section]),tool('two',[section])];
 const size=Buffer.byteLength(JSON.stringify({messages,tools:[]})),result=fitAgentContext(messages,[],size-1000);
 assert.ok(Buffer.byteLength(JSON.stringify({messages:result,tools:[]}))<size-1000);
 assert.equal(JSON.parse(result.at(-1).content).sections[0].fragments[0].text,passage);
 assert.match(JSON.parse(result.at(-2).content).sections[0].contentReference,/later/);
 assert.equal(JSON.parse(messages.at(-2).content).sections[0].fragments[0].text,passage);
});
test('old whole passages are explicitly omitted before the freshest evidence; original history remains retrievable',()=>{
 const text='Long original evidence. '.repeat(500);
 const messages=[{role:'system',content:'policy'},{role:'user',content:JSON.stringify({question:'old',language:'en'})},{role:'assistant',content:'answer'},{role:'user',content:JSON.stringify({question:'current',language:'en'})},tool('old',[source('old',text)]),tool('new',[source('new',text)])];
 const result=fitAgentContext(messages,[],14000);
 assert.equal(JSON.parse(result.at(-2).content).sections[0].contentOmitted,true);
 assert.equal(JSON.parse(result.at(-1).content).sections[0].fragments[0].text,text);
 assert.ok(result.some(message=>message.content.includes('current')));
 assert.ok(Buffer.byteLength(JSON.stringify({messages:result,tools:[]}))<=14000);
});

test('200K token context budget is distinct from bytes and still reserves accounting conservatively',async()=>{
 const {MODEL_CONTEXT_TOKENS,MODEL_CONTEXT_INPUT_TOKENS,estimateContextTokens}=await import('../server/agent-limits.mjs');
 const {createPaidCompletion}=await import('../server/agent-paid.mjs');
 assert.equal(MODEL_CONTEXT_TOKENS,200000);assert.ok(MODEL_CONTEXT_INPUT_TOKENS<200000);
 const messages=[{role:'system',content:'policy'},{role:'user',content:'中文'.repeat(20000)}],tools=[];
 const bytes=Buffer.byteLength(JSON.stringify({messages,tools}));assert.ok(bytes>48000);assert.ok(estimateContextTokens(messages,tools)<MODEL_CONTEXT_INPUT_TOKENS);
 let reserved=0,reconciled=0,calls=0;const paid=createPaidCompletion({signal:new AbortController().signal,guard:{reserve:async(id,amount)=>{reserved=amount;return 'reservation';},reconcile:async(id,total)=>{reconciled=total;}},requestId:'request',complete:async()=>{calls++;return {text:'done',usage:{prompt_tokens:100,completion_tokens:10,total_tokens:110}};}});
 await paid({messages,tools});assert.equal(calls,1);assert.ok(reserved>bytes);assert.equal(reconciled,110);
 await assert.rejects(paid({messages:[{role:'user',content:'中'.repeat(100001)}],tools}),/context_limit/);assert.equal(calls,1);
});
