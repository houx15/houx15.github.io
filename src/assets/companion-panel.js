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

// A tap opens the companion; a deliberate drag only changes its position.
export function bindCompanionLauncher(launcher,view=window) {
  let drag, suppressClick=false;
  const place=(x,y)=>{
    const box=launcher.getBoundingClientRect();
    const pos=clampPanelPosition(x,y,box.width,box.height,view.innerWidth,view.innerHeight);
    Object.assign(launcher.style,{left:`${pos.x}px`,top:`${pos.y}px`,right:'auto',bottom:'auto'});
  };
  launcher.addEventListener('pointerdown',event=>{
    if(event.button!==0 || event.isPrimary===false)return;
    suppressClick=false;
    const box=launcher.getBoundingClientRect();
    drag={id:event.pointerId,startX:event.clientX,startY:event.clientY,x:event.clientX-box.left,y:event.clientY-box.top,moved:false};
    launcher.setPointerCapture(event.pointerId);
  });
  launcher.addEventListener('pointermove',event=>{
    if(!drag || drag.id!==event.pointerId)return;
    if(!drag.moved && Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)<6)return;
    drag.moved=true;suppressClick=true;event.preventDefault();
    launcher.classList.add('is-dragging');
    place(event.clientX-drag.x,event.clientY-drag.y);
  });
  const end=()=>{drag=undefined;launcher.classList.remove('is-dragging');};
  launcher.addEventListener('pointerup',end);
  launcher.addEventListener('pointercancel',end);
  launcher.addEventListener('lostpointercapture',end);
  launcher.addEventListener('click',event=>{
    if(suppressClick && event.detail!==0){event.preventDefault();event.stopImmediatePropagation();}
    suppressClick=false;
  },true);
  view.addEventListener('resize',()=>{
    if(launcher.style.left){const box=launcher.getBoundingClientRect();place(box.left,box.top);}
  });
}
