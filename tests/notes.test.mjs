import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchesNote } from '../src/assets/notes.js';
test('note search supports Chinese, normalized Latin text, multiple terms and literal symbols', () => {
  assert.ok(matchesNote('Attention 机制 ＡＢＣ', 'abc 机制'));
  assert.ok(matchesNote('Attention 机制', '  ATTENTION  '));
  assert.ok(matchesNote('a [b]', '[b]'));
  assert.ok(matchesNote('any note', '  '));
  assert.ok(!matchesNote('Attention 机制', 'attention missing'));
});

import { initNotes } from '../src/assets/notes.js';
test('archive searches beyond the first page, expands results, clears, and handles no matches', () => {
  class Element extends EventTarget { constructor(){super();this.dataset={};this.hidden=false;this.value='';} focus(){this.focused=true;} }
  const input=new Element(),more=new Element(),clear=new Element(),empty=new Element(),count=new Element(),tools=new Element();
  const items=Array.from({length:65},(_,i)=>{const el=new Element();el.dataset.search=i===64?'最后一篇 unique needle':'普通笔记';el.querySelector=()=>new Element();return el;});
  const year=new Element();year.querySelectorAll=()=>items;
  const root={dataset:{locale:'zh-CN'},querySelectorAll:s=>s==='[data-note]'?items:[year],querySelector:s=>({'input':input,'[data-more]':more,'[data-clear]':clear,'[data-no-results]':empty,'[data-count]':count,'.notes-tools':tools})[s]};
  const oldLocation=globalThis.location,oldHistory=globalThis.history;
  globalThis.location={href:'https://example.com/notes/'};
  globalThis.history={replaceState:(_a,_b,url)=>{globalThis.location.href=String(url);}};
  try {
    initNotes(root);
    assert.equal(items.filter(x=>!x.hidden).length,30);
    more.dispatchEvent(new Event('click'));
    assert.equal(items.filter(x=>!x.hidden).length,60);
    input.value='unique needle';input.dispatchEvent(new Event('compositionend'));
    assert.equal(items.filter(x=>!x.hidden).length,1);assert.equal(items[64].hidden,false);
    assert.equal(new URL(location.href).searchParams.get('q'),'unique needle');
    input.value='不存在';input.dispatchEvent(new Event('compositionend'));
    assert.equal(empty.hidden,false);assert.equal(year.hidden,true);
    clear.dispatchEvent(new Event('click'));
    assert.equal(items.filter(x=>!x.hidden).length,30);assert.equal(year.hidden,false);assert.equal(input.focused,true);
  } finally {globalThis.location=oldLocation;globalThis.history=oldHistory;}
});

test('writing combines full-text, type and topic filters and restores shared URLs on navigation',()=>{
 class Element extends EventTarget {constructor(dataset={}){super();this.dataset=dataset;this.hidden=false;this.value='';}focus(){}setAttribute(k,v){this[k]=v;}removeAttribute(k){delete this[k];}}
 const input=new Element(),more=new Element(),clear=new Element(),empty=new Element(),count=new Element(),tools=new Element();
 const items=[new Element({search:'deep needle',writingEntryType:'blog',entryTags:'AI协作'}),new Element({search:'deep needle',writingEntryType:'notes',entryTags:'AI协作'}),new Element({search:'different',writingEntryType:'reports',entryTags:'工程实践'})];
 const typeLinks=['','blog','notes','reports'].map(writingType=>new Element({writingType})),tagLinks=['','AI协作','工程实践'].map(writingTag=>new Element({writingTag}));
 const year=new Element();year.querySelectorAll=()=>items;
 const root={dataset:{locale:'en'},querySelectorAll:s=>({'[data-note]':items,'[data-year]':[year],'[data-writing-type]':typeLinks,'[data-writing-tag]':tagLinks})[s],querySelector:s=>({'input':input,'[data-more]':more,'[data-clear]':clear,'[data-no-results]':empty,'[data-count]':count,'.notes-tools':tools})[s]};
 const events={},win={location:{href:'https://site.test/writing/?q=needle&type=blog&tag=AI%E5%8D%8F%E4%BD%9C'},addEventListener:(name,fn)=>events[name]=fn};win.history={replaceState:(a,b,url)=>win.location.href=String(url),pushState:(a,b,url)=>win.location.href=String(url)};
 initNotes(root,win);assert.deepEqual(items.map(i=>i.hidden),[false,true,true]);assert.equal(input.value,'needle');
 const click=new Event('click',{cancelable:true});Object.defineProperty(click,'button',{value:0});typeLinks[2].dispatchEvent(click);assert.deepEqual(items.map(i=>i.hidden),[true,false,true]);assert.equal(new URL(win.location.href).searchParams.get('tag'),'AI协作');
 win.location.href='https://site.test/writing/?q=needle';events.popstate();assert.deepEqual(items.map(i=>i.hidden),[false,false,true]);
 win.location.href='https://site.test/writing/?tag=bad';events.pageshow();assert.deepEqual(items.map(i=>i.hidden),[false,false,false]);
});
