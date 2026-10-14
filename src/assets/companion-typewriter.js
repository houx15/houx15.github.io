// The accessible label already contains the complete greeting. This animation
// only changes the decorative visual text and never delays entering the chat.
export function typeGreeting(line,{
  motion=window.matchMedia('(prefers-reduced-motion: reduce)'),
  schedule=setTimeout,cancel=clearTimeout
}={}) {
  const text=line.textContent;
  if(motion.matches || !text || !line.isConnected)return ()=>{};
  const letters=typeof Intl.Segmenter==='function'
    ?Array.from(new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(text),part=>part.segment)
    :Array.from(text);
  let index=0,timer,finished=false;
  const stop=()=>{
    finished=true;cancel(timer);motion.removeEventListener('change',onMotion);
  };
  const finish=()=>{if(finished)return;stop();if(line.isConnected)line.textContent=text;};
  const onMotion=event=>{if(event.matches)finish();};
  const type=()=>{
    if(finished)return;
    if(!line.isConnected){stop();return;}
    line.textContent+=letters[index++];
    if(index===letters.length)stop();else timer=schedule(type,75);
  };
  line.textContent='';motion.addEventListener('change',onMotion);
  timer=schedule(type,350);
  return finish;
}
