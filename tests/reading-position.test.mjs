import {test} from 'node:test';
import assert from 'node:assert/strict';
import {captureReadingAnchor,restoreReadingAnchor,readingHeadings,resolveReadingPosition,waitForReadingContext} from '../src/assets/reading-position.js';
import {validatePageContext} from '../server/agent-page-context.mjs';
const doc={id:'notes/test/en',sections:[{id:'a',heading:'First',url:'/notes/test/#first',text:'First source'},{id:'b',heading:'Second',url:'/notes/test/#second',text:'Second source'}]};
test('return to reading follows the same content through width reflow, without moving unchanged pages',()=>{
 let rect={top:-100,bottom:300,height:400};
 const node={isConnected:true,getBoundingClientRect:()=>rect};
 const document={documentElement:{clientWidth:1200,clientHeight:800},querySelectorAll:()=>[{getBoundingClientRect:()=>({bottom:-50})},node]};
 const movements=[],view={scrollBy:value=>movements.push(value)};
 const anchor=captureReadingAnchor(document);
 restoreReadingAnchor(anchor,document,view);assert.equal(movements.length,0);
 document.documentElement.clientWidth=390;rect={top:2000,bottom:2800,height:800};
 restoreReadingAnchor(anchor,document,view);assert.deepEqual(movements,[{top:2200,behavior:'instant'}]);
 // Explicit source navigation clears the saved position; removed content cannot restore it.
 restoreReadingAnchor(undefined,document,view);node.isConnected=false;
 restoreReadingAnchor(anchor,document,view);assert.equal(movements.length,1);
});
test('a heading visible below the viewport top retains that offset after reflow',()=>{
 let rect={top:30,bottom:70,height:40};
 const node={isConnected:true,getBoundingClientRect:()=>rect};
 const document={documentElement:{clientWidth:390,clientHeight:600},querySelectorAll:()=>[node]};
 const anchor=captureReadingAnchor(document);document.documentElement.clientWidth=1200;
 rect={top:-200,bottom:-160,height:40};
 restoreReadingAnchor(anchor,document,{scrollBy:({top})=>assert.equal(top,-230)});
 assert.equal(captureReadingAnchor({querySelectorAll:()=>[]}),undefined);
 rect={top:900,bottom:940,height:40};
 assert.equal(captureReadingAnchor(document),undefined);
});
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

test('stopping while source context is loading rejects immediately without waiting for that load',async()=>{
 const stop=new AbortController();let finish;
 const loading=new Promise(resolve=>{finish=resolve;});
 const waiting=waitForReadingContext(loading,stop.signal);
 stop.abort(new DOMException('Stopped','AbortError'));
 await assert.rejects(waiting,{name:'AbortError'});
 finish('late context');
 assert.equal(await waitForReadingContext(Promise.resolve('ready'),new AbortController().signal),'ready');
});
