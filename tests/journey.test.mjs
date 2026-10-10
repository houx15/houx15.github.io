import test from 'node:test';
import assert from 'node:assert/strict';
import {setupJourneys} from '../src/assets/journey.js';
class Element extends EventTarget {
  constructor(){super();this.attributes={};this.dataset={};this.children=[];this.hidden=true;}
  setAttribute(name,value){this.attributes[name]=value;}
  getAttribute(name){return this.attributes[name];}
  replaceChildren(...children){this.children=children;}
  focus(){this.dispatchEvent(new Event('focus'));}
}
function fixture(){
  const buttons=Array.from({length:7},()=>new Element());
  const entries=buttons.map((_,i)=>({children:[{cloneNode:()=>({text:`Verified milestone ${i}`})}]}));
  const panel=new Element(),fallback=new Element(),map=new Element(),hint=new Element();
  const journey=new Element();
  journey.querySelectorAll=selector=>selector==='[data-stop]'?buttons:entries;
  journey.querySelector=selector=>({'.journey-detail':panel,'.journey-fallback':fallback,'.journey-map':map,'.journey-hint':hint})[selector];
  return {journey,buttons,panel,fallback,map,hint};
}
const key=(button,name)=>{const event=new Event('keydown',{cancelable:true});Object.defineProperty(event,'key',{value:name});button.dispatchEvent(event);return event;};
const pointer=(button,type)=>{const event=new Event('pointerenter');Object.defineProperty(event,'pointerType',{value:type});button.dispatchEvent(event);};
test('journey supports mouse preview, tap, keyboard boundaries, and isolated repeated instances',()=>{
  const a=fixture(),b=fixture();const all=[a,b];
  const root={querySelectorAll:()=>all.filter(x=>!x.journey.dataset.ready).map(x=>x.journey)};
  setupJourneys(root);
  assert.equal(a.fallback.hidden,true);assert.equal(a.map.hidden,false);
  assert.equal(a.panel.children[0].text,'Verified milestone 1');
  pointer(a.buttons[3],'mouse');assert.equal(a.panel.children[0].text,'Verified milestone 3');
  pointer(a.buttons[5],'touch');assert.equal(a.panel.children[0].text,'Verified milestone 3');
  a.buttons[5].dispatchEvent(new Event('click'));assert.equal(a.panel.children[0].text,'Verified milestone 5');
  assert.equal(key(a.buttons[5],'End').defaultPrevented,true);
  assert.equal(a.panel.children[0].text,'Verified milestone 6');
  key(a.buttons[6],'ArrowRight');assert.equal(a.panel.children[0].text,'Verified milestone 0');
  key(a.buttons[0],'ArrowLeft');assert.equal(a.panel.children[0].text,'Verified milestone 6');
  key(a.buttons[6],'Home');assert.equal(a.panel.children[0].text,'Verified milestone 0');
  assert.equal(key(a.buttons[0],'Tab').defaultPrevented,false);
  assert.equal(a.buttons.filter(x=>x.getAttribute('aria-pressed')==='true').length,1);
  assert.equal(b.panel.children[0].text,'Verified milestone 1');
  assert.notEqual(a.panel.id,b.panel.id);
  assert.ok(a.buttons.every(button=>button.getAttribute('aria-controls')===a.panel.id));
  const original=a.panel.id;setupJourneys(root);assert.equal(a.panel.id,original);
});
