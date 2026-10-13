// Follow new output only while the reader is already at the end. A tall card
// should enter at its beginning, rather than scroll straight past its contents.
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
