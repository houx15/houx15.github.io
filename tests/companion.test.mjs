import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextStory, storyCards, chooseOpening } from '../src/assets/companion-stories.js';

test('dice encounters explore every sourced story before repeating and avoid immediate repeats', () => {
  const seen=[];
  for(let i=0;i<6;i++) seen.push(nextStory(seen,()=>0).id);
  assert.equal(new Set(seen).size,6);
  assert.notEqual(nextStory(seen,()=>.99999).id,seen.at(-1));
  for(const story of storyCards) {
    assert.match(story.url,/^\/(?:about|projects|reports)\//);
    for(const language of ['en','zh-CN']) assert.ok(story[language].title && story[language].text && story[language].follow);
  }
});

test('one opening is selected at a time and article context takes precedence over random games',()=>{
  assert.equal(chooseOpening({random:()=>0}),'dice');
  assert.equal(chooseOpening({random:()=>0.4}),'dice');
  assert.equal(chooseOpening({random:()=>0.99}),'story');
  for(const n of [0,.4,.99])assert.equal(chooseOpening({article:true,random:()=>n}),'read');
});

test('only the latest authored opening supplies follow-up context',async()=>{
  const {openingContextFor}=await import('../src/assets/companion-stories.js');
  assert.deepEqual(openingContextFor([{kind:'dice',id:'startup'}]),{storyId:'startup'});
  assert.deepEqual(openingContextFor([{kind:'story'}]),{storyId:'timeline'});
  assert.equal(openingContextFor([{kind:'dice',id:'startup'},{kind:'agent'}]),undefined);
  assert.equal(openingContextFor([{kind:'dice',id:'unknown'}]),undefined);
  assert.equal(openingContextFor([]),undefined);
  assert.equal(openingContextFor([{kind:'dice',id:'startup'}],{article:true}),undefined);
});

test('a typed story question preserves its original card even if current history changes',async()=>{
 const {createOpeningDraftContext,openingContextFor}=await import('../src/assets/companion-stories.js');
 const history=[{kind:'story',eventId:'tsinghua'}],draft=createOpeningDraftContext();
 draft.edit('这段经历',openingContextFor(history));
 const original=draft.snapshot();history[0].eventId='startup';
 draft.edit('这段经历和现在的研究有什么联系？',openingContextFor(history));
 assert.deepEqual(draft.snapshot(openingContextFor(history)),original);
 const snapshot=draft.snapshot();snapshot.storyId='mutated';assert.deepEqual(draft.snapshot(),original);
 history.length=0;draft.edit('这段经历和现在的研究有什么联系？',openingContextFor(history));
 assert.deepEqual(draft.snapshot(),original);
 history.push({kind:'story',eventId:'startup'});
 draft.edit('');draft.edit('另一段经历',openingContextFor(history));
 assert.deepEqual(draft.snapshot(),{storyId:'event:startup'});
});

test('a draft started without an opening does not acquire later context; retry restores its original context',async()=>{
 const {createOpeningDraftContext}=await import('../src/assets/companion-stories.js'),draft=createOpeningDraftContext();
 draft.edit('A question',undefined);assert.equal(draft.snapshot({storyId:'mind'}),undefined);
 draft.edit('');draft.edit('This project',{storyId:'mind'});const submitted=draft.snapshot();
 draft.edit('');draft.edit('This project',submitted);draft.edit('This project again',{storyId:'startup'});
 assert.deepEqual(draft.snapshot(),{storyId:'mind'});
 draft.edit('');assert.equal(draft.snapshot(),undefined);
});
