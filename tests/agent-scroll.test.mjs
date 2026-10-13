import {test} from 'node:test';
import assert from 'node:assert/strict';
import {presentAgentEvent,followConversationResize} from '../src/assets/agent-scroll.js';

test('resizing keeps the latest answer visible without pulling a reader out of earlier messages',()=>{
 let resize,scroll,disconnected=false;
 const log={clientWidth:700,clientHeight:460,scrollHeight:1200,scrollTop:740,addEventListener(name,fn){scroll=fn;},removeEventListener(name,fn){assert.equal(fn,scroll);}};
 const stop=followConversationResize(log,class {constructor(fn){resize=fn;}observe(target){assert.equal(target,log);}disconnect(){disconnected=true;}});
 resize();assert.equal(log.scrollTop,740);
 log.clientWidth=350;log.clientHeight=330;log.scrollHeight=1700;
 scroll(); // Browser reflow must not replace the prior follow intent.
 resize();assert.equal(log.scrollTop,1700);
 log.scrollTop=300;scroll();
 log.clientWidth=700;log.clientHeight=460;log.scrollHeight=1200;
 resize();assert.equal(log.scrollTop,300);
 stop();assert.equal(disconnected,true);
});

test('a tall new diagram is followed to its start rather than its bottom',()=>{
 const log={scrollTop:200,scrollHeight:600,clientHeight:400,getBoundingClientRect:()=>({top:80})};
 const turn={event(){log.scrollHeight=1500;return {isConnected:true,getBoundingClientRect:()=>({top:400})};}};
 presentAgentEvent(log,turn,{type:'block'});
 assert.equal(log.scrollTop,520);
});
test('revealing an initially empty log does not jump past the first card',()=>{
 let resize;const log={clientWidth:0,clientHeight:0,scrollHeight:0,scrollTop:0,addEventListener(){},removeEventListener(){}};
 followConversationResize(log,class {constructor(fn){resize=fn;}observe(){}disconnect(){}});
 log.clientWidth=350;log.clientHeight=335;log.scrollHeight=700;
 resize();assert.equal(log.scrollTop,0);
});
test('new output leaves a reader who has scrolled up in place',()=>{
 const log={scrollTop:100,scrollHeight:1000,clientHeight:400};let rendered=false;
 presentAgentEvent(log,{event(){rendered=true;log.scrollHeight=1400;}},{type:'answer_delta'});
 assert.equal(rendered,true);assert.equal(log.scrollTop,100);
});
test('incremental prose follows the end when the reader is there',()=>{
 const log={scrollTop:200,scrollHeight:600,clientHeight:400};
 presentAgentEvent(log,{event(){log.scrollHeight=625;}},{type:'answer_delta'});
 assert.equal(log.scrollTop,625); // The browser clamps this to its scrollable range.
});
