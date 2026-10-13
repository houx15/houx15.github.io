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
test('chapters progress in authored order with one action and restored heading focus',()=>{
 const changes=[],questions=[];
 const card=createBiographyChapter(document,{language:'zh-CN',onChange:id=>changes.push(id),onQuestion:q=>questions.push(q)});
 for(let i=0;i<milestones.length;i++) {
  const heading=card.children.find(n=>n.tag==='h2');
  assert.equal(heading.textContent,milestones[i]['zh-CN'].title);
  if(i)assert.equal(heading.focused,true);
  assert.equal(card.children.filter(n=>n.tag==='button').length,1);
  card.children.find(n=>n.tag==='button').handlers.click();
 }
 assert.deepEqual(changes,milestones.slice(1).map(e=>e.id));
 assert.deepEqual(questions,['她现在在研究什么？']);
 const restored=createBiographyChapter(document,{eventId:'unicef',language:'en'});
 assert.equal(restored.children.find(n=>n.tag==='h2').textContent,'UNICEF');
});
test('chapter context is identifier-only and cannot inject source text',()=>{
 const context=openingContextFor([{kind:'story',eventId:'peer'}]);
 assert.deepEqual(context,{storyId:'event:peer'});
 assert.equal(resolveOpeningContext(context,'zh-CN').eventId,'peer');
 assert.equal(openingContextFor([{kind:'story',eventId:'peer'}],{article:true}),undefined);
 assert.throws(()=>resolveOpeningContext({storyId:'event:fake'},'en'),/Invalid/);
 assert.throws(()=>resolveOpeningContext({...context,text:'Invented biography'},'en'),/Invalid/);
});
