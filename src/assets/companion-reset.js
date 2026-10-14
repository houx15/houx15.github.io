// Clearing a conversation is deliberate; Escape or cancellation preserves it.
export function confirmConversationReset(document,{language='en',hasDraft=false}={}) {
  const zh=language==='zh-CN',dialog=document.createElement('dialog');
  dialog.className='comic-reset-confirm';
  dialog.setAttribute('role','alertdialog');
  dialog.setAttribute('aria-labelledby','companion-reset-title');
  dialog.setAttribute('aria-describedby','companion-reset-description');
  const title=document.createElement('h2');title.id='companion-reset-title';
  title.textContent=zh?'重新开始？':'Start over?';
  const description=document.createElement('p');description.id='companion-reset-description';
  description.textContent=zh
    ? `这次对话会被清空。${hasDraft?'未发送的问题会保留。':''}`
    : `This conversation will be cleared.${hasDraft?' Your unsent question will be kept.':''}`;
  const actions=document.createElement('div');actions.className='comic-reset-actions';
  const cancel=document.createElement('button');cancel.type='button';cancel.autofocus=true;
  cancel.textContent=zh?'继续聊天':'Keep chatting';
  const clear=document.createElement('button');clear.type='button';clear.className='comic-reset-clear';
  clear.textContent=zh?'清空对话':'Clear conversation';
  cancel.addEventListener('click',()=>dialog.close('cancel'));
  clear.addEventListener('click',()=>dialog.close('clear'));
  actions.append(cancel,clear);dialog.append(title,description,actions);
  return new Promise(resolve=>{
    dialog.addEventListener('close',()=>{const confirmed=dialog.returnValue==='clear';dialog.remove();resolve(confirmed);},{once:true});
    document.body.append(dialog);dialog.showModal();
  });
}
