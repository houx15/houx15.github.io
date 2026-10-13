// Follow new output only while the reader is already at the end. A tall card
// should enter at its beginning, rather than scroll straight past its contents.
export function followConversationResize(log,Observer=globalThis.ResizeObserver) {
  if(!Observer)return ()=>{};
  let width=log.clientWidth,height=log.clientHeight;
  let following=log.scrollHeight-log.scrollTop-height<100;
  const track=()=>{
    // A reflow may itself emit scroll. Preserve the pre-resize reading intent.
    if(width===log.clientWidth && height===log.clientHeight)following=log.scrollHeight-log.scrollTop-height<100;
  };
  const observer=new Observer(()=>{
    if(width===log.clientWidth && height===log.clientHeight)return;
    if(following && height>0 && log.clientHeight>0)log.scrollTop=log.scrollHeight;
    width=log.clientWidth;height=log.clientHeight;track();
  });
  log.addEventListener('scroll',track,{passive:true});observer.observe(log);
  return ()=>{observer.disconnect();log.removeEventListener('scroll',track);};
}

export function presentAgentEvent(log,turn,event) {
  const previousTop=log.scrollTop;
  const following=log.scrollHeight-previousTop-log.clientHeight<100;
  const added=turn.event(event);
  if(!following)return;
  if(added?.isConnected) {
    const top=previousTop+added.getBoundingClientRect().top-log.getBoundingClientRect().top;
    log.scrollTop=Math.min(Math.max(previousTop,top),Math.max(0,log.scrollHeight-log.clientHeight));
  } else log.scrollTop=log.scrollHeight;
}
