import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifyVisitor } from '../src/assets/visitor-check.js';

test('visitor check uses scoped action and removes a successful widget',async()=>{
  let config,cleared=0;const removed=[];
  globalThis.window={turnstile:{render:(container,options)=>{config=options;queueMicrotask(()=>options.callback('verified'));return 7;},remove:id=>removed.push(id)}};
  try {
    assert.equal(await verifyVisitor({}, {replaceChildren:()=>cleared++},'public-key'),'verified');
    assert.equal(config.action,'agent_session');assert.deepEqual(removed,[7]);assert.equal(cleared,1);
  } finally {delete globalThis.window;}
});
test('cancellation removes pending widget and ignores a late verification token',async()=>{
  let config;const removed=[],controller=new AbortController();
  globalThis.window={turnstile:{render:(container,options)=>{config=options;return 8;},remove:id=>removed.push(id)}};
  try {
    const check=verifyVisitor({}, {replaceChildren:()=>{}},'public-key',controller.signal);
    await new Promise(resolve=>setImmediate(resolve));controller.abort();
    await assert.rejects(check,{name:'AbortError'});config.callback('late');assert.deepEqual(removed,[8]);
  } finally {delete globalThis.window;}
});
