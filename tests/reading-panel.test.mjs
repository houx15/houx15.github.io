import {test} from 'node:test';
import assert from 'node:assert/strict';
import {clampPanelPosition} from '../src/assets/companion-panel.js';
import {validatePageContext} from '../server/agent-page-context.mjs';

test('dragged reading window remains reachable after a smaller viewport',()=>{
  const moved=clampPanelPosition(1100,900,374,500,390,844);
  assert.deepEqual(moved,{x:8,y:336});
  assert.deepEqual(clampPanelPosition(-600,-300,440,600,1280,720),{x:8,y:8});
});
test('site reading context accepts only known local pages, never arbitrary URLs or source text',()=>{
  const corpus={documents:[]};
  for(const pagePath of ['/','/zh/','/about/','/zh/research/','/projects/','/zh/writing/']) {
    const context=validatePageContext({pagePath},corpus);
    assert.deepEqual(validatePageContext(context,corpus),{pagePath});
  }
  for(const pagePath of ['https://example.com/','//example.com/','/private/','/zh/about/?secret=1','/about/#instructions'])assert.throws(()=>validatePageContext({pagePath},corpus));
  assert.throws(()=>validatePageContext({pagePath:'/about/',text:'invented evidence'},corpus));
});
