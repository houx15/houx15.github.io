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

test('launcher distinguishes a drag from a tap and suppresses only the drag click',async()=>{
  const {bindCompanionLauncher}=await import('../src/assets/companion-panel.js');
  const listeners={},style={};
  const launcher={style,classList:{add(){},remove(){}},setPointerCapture(){},
    getBoundingClientRect:()=>({left:100,top:100,width:68,height:68}),
    addEventListener:(name,fn)=>{listeners[name]=fn;}};
  bindCompanionLauncher(launcher,{innerWidth:800,innerHeight:600,addEventListener(){}});
  const pointer={button:0,pointerId:1,clientX:120,clientY:120};
  listeners.pointerdown(pointer);
  listeners.pointermove({...pointer,clientX:123,preventDefault(){}});
  assert.equal(style.left,undefined);
  listeners.pointerup();
  let blocked=false;
  const click={detail:1,preventDefault(){blocked=true;},stopImmediatePropagation(){}};
  listeners.click(click);assert.equal(blocked,false);
  listeners.pointerdown(pointer);
  listeners.pointermove({...pointer,clientX:320,clientY:220,preventDefault(){}});
  assert.equal(style.left,'300px');assert.equal(style.top,'200px');
  listeners.pointerup();listeners.lostpointercapture();
  listeners.click(click);assert.equal(blocked,true);
  blocked=false;listeners.click({...click,detail:0});assert.equal(blocked,false);
  listeners.pointerdown(pointer);listeners.pointerup();listeners.click(click);assert.equal(blocked,false);
});
