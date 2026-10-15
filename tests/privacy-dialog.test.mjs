import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initPrivacyDialog} from '../src/assets/privacy-dialog.js';
test('privacy notice enhances a real fallback link and restores focus after native close',()=>{
 const handlers={},link={isConnected:true,setAttribute(){},addEventListener:(name,fn)=>handlers.open=fn,focus(){this.focused=true;}};
 const close={addEventListener:(name,fn)=>handlers.close=fn};
 const dialog={id:'privacy-dialog',showModal(){this.open=true;},close(){this.open=false;handlers.closed();},querySelector:()=>close,addEventListener:(name,fn)=>handlers.closed=fn};
 initPrivacyDialog({querySelector:()=>dialog,querySelectorAll:()=>[link]});
 let prevented=false;handlers.open({button:0,preventDefault(){prevented=true;}});assert.equal(prevented,true);assert.equal(dialog.open,true);
 handlers.close();assert.equal(dialog.open,false);assert.equal(link.focused,true);
 handlers.open({button:0,ctrlKey:true,preventDefault(){throw Error('must retain new-tab navigation');}});assert.equal(dialog.open,false);
});
test('unsupported dialogs preserve ordinary navigation to privacy page',()=>{
 initPrivacyDialog({querySelector:()=>({}),querySelectorAll(){throw Error('must not intercept fallback link');}});
});
