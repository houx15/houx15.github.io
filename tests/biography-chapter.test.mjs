import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createBiographyChapter} from '../src/assets/biography-chapter.js';
import {milestones} from '../src/assets/biography.js';
import {openingContextFor} from '../src/assets/companion-stories.js';
import {resolveOpeningContext} from '../server/agent-opening.mjs';

class Element {
 constructor(tag){this.tag=tag;this.children=[];this.handlers={};}
 append(node){this.children.push(node);}
 replaceChildren(){this.children=[];}
 setAttribute(){}
 addEventListener(type,fn){this.handlers[type]=fn;}
 focus(){this.focused=true;}
 scrollIntoView(){this.scrolled=true;}
}
const document={createElement:tag=>new Element(tag)};
test('whole biography shows all three parallel groups without stepping through cards',()=>{
 const questions=[],card=createBiographyChapter(document,{language:'zh-CN',onQuestion:q=>questions.push(q)});
 const walk=node=>[node,...node.children.flatMap(walk)];const nodes=walk(card);
 assert.deepEqual(nodes.filter(n=>n.tag==='h3').map(n=>n.textContent),['教育与访问','工作','公益探索']);
 for(const event of milestones)assert.ok(nodes.some(n=>n.tag==='h4' && n.textContent===event['zh-CN'].title));
 assert.equal(nodes.filter(n=>n.tag==='button').length,1);
 nodes.find(n=>n.tag==='button').handlers.click();assert.deepEqual(questions,['她最近在做什么？']);
});
test('chapter context is identifier-only and cannot inject source text',()=>{
 const context=openingContextFor([{kind:'story',eventId:'peer'}]);
 assert.deepEqual(context,{storyId:'timeline'});
 assert.equal(resolveOpeningContext(context,'zh-CN').type,'biography_timeline');
 assert.equal(openingContextFor([{kind:'story',eventId:'peer'}],{article:true}),undefined);
 assert.throws(()=>resolveOpeningContext({storyId:'event:fake'},'en'),/Invalid/);
 assert.throws(()=>resolveOpeningContext({...context,text:'Invented biography'},'en'),/Invalid/);
});
