import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readingHeadings,resolveReadingPosition} from '../src/assets/reading-position.js';
import {validatePageContext} from '../server/agent-page-context.mjs';
const doc={id:'notes/test/en',sections:[{id:'a',heading:'First',url:'/notes/test/#first',text:'First source'},{id:'b',heading:'Second',url:'/notes/test/#second',text:'Second source'}]};
test('reading position uses the last passed public heading, without falling back to the previous chapter at an empty structural heading',()=>{
 const nodes=[['first',-600],['structural',-80],['second',140]].map(([id,top])=>({id,getBoundingClientRect:()=>({top})}));
 const document={querySelectorAll:()=>nodes};
 assert.deepEqual(readingHeadings(document),['structural','first']);
 assert.equal(resolveReadingPosition(doc,readingHeadings(document)),undefined);
 assert.deepEqual(resolveReadingPosition(doc,['first']),{sectionId:'a',anchor:'first',title:'First'});
 nodes[2].getBoundingClientRect=()=>({top:24});
 assert.equal(resolveReadingPosition(doc,readingHeadings(document)).sectionId,'b');
 assert.equal(resolveReadingPosition(doc,[]),undefined);
});
test('page context accepts only a real section belonging to its public document',()=>{
 const corpus={documents:[doc,{id:'other',sections:[{id:'private'}]}]};
 assert.deepEqual(validatePageContext({documentId:doc.id,sectionAnchor:'second'},corpus),{documentId:doc.id,sectionId:'b'});
 assert.throws(()=>validatePageContext({documentId:doc.id,sectionAnchor:'unknown'},corpus),/Invalid page context/);
 assert.throws(()=>validatePageContext({documentId:doc.id,sectionId:'a',sectionAnchor:'second'},corpus),/Invalid page context/);
 assert.deepEqual(validatePageContext({documentId:doc.id,sectionId:'b'},corpus),{documentId:doc.id,sectionId:'b'});
 for(const value of [{documentId:doc.id,sectionId:'private'},{documentId:doc.id,sectionId:'unknown'},{documentId:doc.id,text:'pretend evidence'},{documentId:'missing'},null])assert.throws(()=>validatePageContext(value,corpus),/Invalid page context/);
 assert.deepEqual(validatePageContext({documentId:doc.id},corpus),{documentId:doc.id});
});
