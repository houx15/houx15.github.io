import {test} from 'node:test';
import assert from 'node:assert/strict';
import {captureReadingSelection,selectionQuestion,createReadingDraftContext} from '../src/assets/reading-selection.js';

function fixture({text='A possible risk.',start=2,end=2,outside=false,collapsed=false,count=1}={}) {
 const startNode={order:start},endNode={order:end};
 const headings=[1,3].map(order=>({id:`section-${order}`,order,contains:node=>node.order===order,compareDocumentPosition:node=>node.order>order?4:2}));
 const prose={contains:node=>!outside && [startNode,endNode].includes(node),querySelectorAll:()=>headings};
 return {querySelector:()=>prose,getSelection:()=>({isCollapsed:collapsed,rangeCount:count,toString:()=>text,getRangeAt:()=>({startContainer:startNode,endContainer:endNode})})};
}
test('selected passage uses its source section, including a heading selection and the article opening',()=>{
 assert.deepEqual(captureReadingSelection(fixture()),{text:'A possible risk.',headings:['section-1']});
 assert.deepEqual(captureReadingSelection(fixture({start:3,end:4})).headings,['section-3']);
 assert.deepEqual(captureReadingSelection(fixture({start:0,end:0})).headings,[]);
});
test('selection ignores outside content, crossed sections, empty and oversized ranges',()=>{
 for(const options of [{outside:true},{start:2,end:4},{collapsed:true},{count:2},{text:' '},{text:'x'.repeat(281)}])assert.equal(captureReadingSelection(fixture(options)),undefined);
});
test('draft question preserves selected wording and fits the existing request bound in either language',()=>{
 const text='可能\n同时强化 有用的补救';
 const selection=captureReadingSelection(fixture({text}));assert.equal(selection.text,'可能 同时强化 有用的补救');
 for(const lang of ['zh-CN','en']) {
  assert.ok(selectionQuestion(selection.text,lang).includes(selection.text));
  assert.ok(selectionQuestion('x'.repeat(280),lang).length<=400);
 }
});

test('an unsent draft keeps its starting section across reopen and edits, then releases it when cleared',()=>{
 const context=createReadingDraftContext(),headings=['section-81'];
 assert.deepEqual(context.open(headings),['section-81']);context.edit('Explain this sentence');
 headings[0]='mutated';
 const reopened=context.open(['section-82']);assert.deepEqual(reopened,['section-81']);
 reopened[0]='also-mutated';context.edit('Explain it in two sentences');
 assert.deepEqual(context.open(['section-83']),['section-81']);
 context.edit('  ');assert.deepEqual(context.open(['section-83']),['section-83']);
 context.edit('A new question');assert.deepEqual(context.open(['section-84']),['section-83']);
});

test('a draft in the article opening does not silently acquire a later section',()=>{
 const context=createReadingDraftContext();context.open([]);context.edit('Explain this opening');
 assert.deepEqual(context.open(['section-1']),[]);
 context.edit('');assert.deepEqual(context.open(['section-1']),['section-1']);
});
