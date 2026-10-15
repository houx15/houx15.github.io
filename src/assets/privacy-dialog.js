export function initPrivacyDialog(document) {
  const dialog=document.querySelector('#privacy-dialog');
  if(!dialog || typeof dialog.showModal!=='function')return;
  let opener;
  for(const link of document.querySelectorAll('[data-privacy-open]')) {
    link.setAttribute('aria-haspopup','dialog');link.setAttribute('aria-controls',dialog.id);
    link.addEventListener('click',event=>{
      if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      event.preventDefault();opener=link;dialog.showModal();dialog.scrollTop=0;
    });
  }
  dialog.querySelector('[data-privacy-close]').addEventListener('click',()=>dialog.close());
  // Native modal dialogs provide focus containment and Escape cancellation.
  dialog.addEventListener('close',()=>{if(opener?.isConnected)opener.focus({preventScroll:true});opener=null;});
}
if(typeof document!=='undefined')initPrivacyDialog(document);
