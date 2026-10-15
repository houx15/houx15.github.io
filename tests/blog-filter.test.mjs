import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initTagBrowser, selectedTag } from '../src/assets/blog-filter.js';

test('tag URLs decode Chinese labels and safely fall back for unknown values', () => {
  const allowed = new Set(['', 'AI协作', 'Agent']);
  assert.equal(selectedTag('?tag='+encodeURIComponent('AI协作'),allowed),'AI协作');
  assert.equal(selectedTag('?tag=unknown',allowed),'');
  assert.equal(selectedTag('',allowed),'');
});

test('filtering restores history, counts groups, and does not intercept new-tab clicks', () => {
  const listeners = {}, winEvents = {};
  const link = tag => ({dataset:{tag},setAttribute(k,v){this[k]=v;},removeAttribute(k){delete this[k];}});
  const all = link(''), ai = link('AI协作');
  const entries = [{dataset:{entryTags:'AI协作|工作方式'}},{dataset:{entryTags:'工程实践'}}];
  const counters = [{},{}];
  const groups = entries.map((entry,i)=>({querySelectorAll:()=>[entry],querySelector:()=>counters[i]}));
  const status={dataset:{countLabel:'篇文章'}}, empty={};
  const container = {querySelectorAll:s=>s==='[data-tag]'?[all,ai]:s==='[data-entry-tags]'?entries:groups,
    querySelector:s=>s==='[data-filter-status]'?status:empty,
    addEventListener:(type,fn)=>listeners[type]=fn,contains:()=>true};
  const location = {href:'https://example.com/blog/?tag=AI%E5%8D%8F%E4%BD%9C',search:'?tag=AI%E5%8D%8F%E4%BD%9C'};
  let pushes=0;
  const win={location,addEventListener:(type,fn)=>winEvents[type]=fn,history:{pushState(a,b,url){pushes++;location.href=url.href;location.search=url.search;}}};
  initTagBrowser(container,win);
  assert.equal(entries[1].hidden,true);assert.equal(groups[1].hidden,true);assert.equal(counters[0].textContent,'1');assert.equal(status.textContent,'1 篇文章');
  let prevented=false;
  listeners.click({target:{closest:()=>all},button:0,preventDefault(){prevented=true;}});
  assert.equal(prevented,true);assert.equal(pushes,1);assert.equal(entries[1].hidden,false);assert.equal(groups[1].hidden,false);
  location.search='?tag=AI%E5%8D%8F%E4%BD%9C';winEvents.popstate();assert.equal(entries[1].hidden,true);
  listeners.click({target:{closest:()=>all},button:0,ctrlKey:true,preventDefault(){throw Error('new tab intercepted');}});
  assert.equal(pushes,1);
  location.search='?tag=unknown';winEvents.pageshow();assert.equal(entries[1].hidden,false);
});
