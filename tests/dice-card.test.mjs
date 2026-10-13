import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDiceCard} from '../src/assets/dice-card.js';
import {storyCards,nextStory,openingContextFor} from '../src/assets/companion-stories.js';
import {resolveOpeningContext} from '../server/agent-opening.mjs';

class Element {
  constructor(tag){this.tag=tag;this.children=[];this.handlers={};this.attributes={};}
  append(node){this.children.push(node);}
  setAttribute(key,value){this.attributes[key]=value;}
  addEventListener(type,fn){this.handlers[type]=fn;}
}
const document={createElement:tag=>new Element(tag)};
test('a visitor can discover all six sides without invoking AI, while every card retains its own question',()=>{
  for(const language of ['zh-CN','en']) {
    const seen=[],questions=[];let rolls=0;
    for(let i=0;i<storyCards.length;i++) {
      const story=nextStory(seen,()=>0.7);seen.push(story.id);
      const card=createDiceCard(document,{storyId:story.id,seen,language,onRoll:()=>rolls++,onQuestion:q=>questions.push(q)});
      const top=card.children[0],repeat=top.children.find(node=>node.tag==='button');
      assert.ok(top.children[0].textContent.includes(String(i+1)));
      repeat.handlers.click();assert.equal(rolls,i+1);assert.equal(questions.length,i);
      card.children.find(node=>node.tag==='button').handlers.click();
      assert.equal(questions.at(-1),story[language].follow);
      const context=openingContextFor([{kind:'dice',id:story.id}]);
      assert.equal(resolveOpeningContext(context,language).storyId,story.id);
    }
    assert.equal(new Set(seen).size,6);
    assert.notEqual(nextStory(seen,()=>0).id,seen.at(-1));
  }
});
test('restored dice progress counts known unique sides and sources retain the current locale',()=>{
  const card=createDiceCard(document,{storyId:'mind',seen:['mind','mind','startup','unknown'],language:'zh-CN'});
  assert.equal(card.children[0].children[0].textContent,'已认识 2 / 6 面');
  const source=card.children.find(node=>node.tag==='details').children.find(node=>node.tag==='a');
  assert.equal(source.href,'/zh/projects/mind-imprint/');
  assert.throws(()=>createDiceCard(document,{storyId:'unknown'}),/Unknown story/);
});
