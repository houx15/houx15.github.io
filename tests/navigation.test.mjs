import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialQuestion,questionFragment } from '../src/assets/navigation.js';
test('chat handoff uses bounded fragments and preserves the question across languages',()=>{
  const question='你在 SSDataAgent 中做了什么？ & <script>alert(1)</script>';
  const fragment=questionFragment(question);
  assert.ok(fragment.startsWith('#q='));
  assert.equal(initialQuestion(fragment,'en'),question);
  assert.equal(initialQuestion(fragment,'zh-CN'),question);
  assert.equal(initialQuestion(questionFragment('x'.repeat(500))).length,400);
  assert.equal(initialQuestion('#q=%20%20'), '');
  assert.equal(initialQuestion('#topic=not-reviewed'),'');
  assert.equal(initialQuestion('#topic=ssdata','zh-CN'),'介绍一下 SSDataAgent');
  assert.equal(initialQuestion('#topic=mind','en'),'Tell me about Mind Imprint');
});
