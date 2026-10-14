import {test} from 'node:test';
import assert from 'node:assert/strict';
import {typeGreeting} from '../src/assets/companion-typewriter.js';
function fixture(text,{reduced=false}={}) {
 const timers=new Map(),listeners=new Set();let id=0;
 const line={textContent:text,isConnected:true};
 const motion={matches:reduced,addEventListener:(_,f)=>listeners.add(f),removeEventListener:(_,f)=>listeners.delete(f)};
 const finish=typeGreeting(line,{motion,schedule:(fn,delay)=>{timers.set(++id,{fn,delay});return id;},cancel:key=>timers.delete(key)});
 return {line,timers,listeners,finish,tick(){const [key,{fn}]=timers.entries().next().value;timers.delete(key);fn();},reduce(matches){motion.matches=matches;for(const fn of [...listeners])fn({matches});}};
}
test('a reduced-motion visit keeps the full greeting with no timer or listener',()=>{
 const f=fixture('嗨，我在。',{reduced:true});assert.equal(f.line.textContent,'嗨，我在。');assert.equal(f.timers.size,0);assert.equal(f.listeners.size,0);
});
test('enabling reduced motion during the delay or typing reveals the full greeting and does not replay',()=>{
 for(const ticks of [0,2]) {
  const f=fixture('嗨，我在。');for(let i=0;i<ticks;i++)f.tick();
  f.reduce(true);assert.equal(f.line.textContent,'嗨，我在。');assert.equal(f.timers.size,0);assert.equal(f.listeners.size,0);
  f.reduce(false);assert.equal(f.line.textContent,'嗨，我在。');assert.equal(f.timers.size,0);
 }
});
test('typing preserves complete graphemes and releases its listener on completion',()=>{
 const f=fixture('Hi 👩🏽‍💻!');
 assert.equal([...f.timers.values()][0].delay,350);
 for(const expected of ['H','Hi','Hi ','Hi 👩🏽‍💻','Hi 👩🏽‍💻!']){f.tick();assert.equal(f.line.textContent,expected);}
 assert.equal(f.timers.size,0);assert.equal(f.listeners.size,0);
});
test('removed greetings stop work and explicit cleanup reveals the complete connected greeting',()=>{
 const f=fixture('Hello');f.line.isConnected=false;f.tick();assert.equal(f.timers.size,0);assert.equal(f.listeners.size,0);
 const g=fixture('Hello');g.tick();g.finish();g.finish();assert.equal(g.line.textContent,'Hello');assert.equal(g.timers.size,0);assert.equal(g.listeners.size,0);
});
