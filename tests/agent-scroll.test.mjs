import {test} from 'node:test';
import assert from 'node:assert/strict';
import {presentAgentEvent} from '../src/assets/agent-scroll.js';

test('a tall new diagram is followed to its start rather than its bottom',()=>{
 const log={scrollTop:200,scrollHeight:600,clientHeight:400,getBoundingClientRect:()=>({top:80})};
 const turn={event(){log.scrollHeight=1500;return {isConnected:true,getBoundingClientRect:()=>({top:400})};}};
 presentAgentEvent(log,turn,{type:'block'});
 assert.equal(log.scrollTop,520);
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
