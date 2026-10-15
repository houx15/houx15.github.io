// A non-modal reading companion: moving it never moves or locks the article.
export function clampPanelPosition(x,y,width,height,viewportWidth,viewportHeight) {
  return {x:Math.max(8,Math.min(x,Math.max(8,viewportWidth-width-8))),y:Math.max(8,Math.min(y,Math.max(8,viewportHeight-height-8)))};
}
export function bindCompanionPanel(panel,handle,view=window) {
  let drag;
  const place=(x,y)=>{
    const box=panel.getBoundingClientRect();
    const pos=clampPanelPosition(x,y,box.width,box.height,view.innerWidth,view.innerHeight);
    panel.style.left=`${pos.x}px`;panel.style.top=`${pos.y}px`;panel.style.right='auto';panel.style.bottom='auto';
  };
  handle.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    const box=panel.getBoundingClientRect();drag={id:event.pointerId,x:event.clientX-box.left,y:event.clientY-box.top};
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener('pointermove',event=>{if(drag?.id===event.pointerId)place(event.clientX-drag.x,event.clientY-drag.y);});
  const end=()=>{drag=undefined;};
  handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);handle.addEventListener('lostpointercapture',end);
  handle.addEventListener('keydown',event=>{
    const delta={ArrowLeft:[-24,0],ArrowRight:[24,0],ArrowUp:[0,-24],ArrowDown:[0,24]}[event.key];
    if(!delta)return;event.preventDefault();const box=panel.getBoundingClientRect();place(box.left+delta[0],box.top+delta[1]);
  });
  view.addEventListener('resize',()=>{if(panel.open){const box=panel.getBoundingClientRect();place(box.left,box.top);}});
}
