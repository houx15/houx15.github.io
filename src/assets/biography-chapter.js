import {milestones} from './biography.js';

// One authored chapter at a time. The model receives only its trusted identifier.
export function createBiographyChapter(document,{eventId,language='en',onChange=()=>{},onQuestion=()=>{}}={}) {
  const zh=language==='zh-CN',card=document.createElement('section');
  card.className='comic-story-card comic-biography-chapter';
  let index=Math.max(0,milestones.findIndex(event=>event.id===eventId));
  const add=(tag,text,className='')=>{const node=document.createElement(tag);node.textContent=text;node.className=className;card.append(node);return node;};
  function draw(focus=false) {
    const event=milestones[index],copy=event[language];
    card.replaceChildren();
    add('p',`${String(index+1).padStart(2,'0')} / ${String(milestones.length).padStart(2,'0')} · ${copy.period}`,'comic-chapter-position');
    const heading=add('h2',copy.title);heading.setAttribute('tabindex','-1');
    add('p',copy.description);
    const next=milestones[index+1],button=add('button',next?(zh?`下一段：${next[language].title} →`:`Next: ${next[language].title} →`):(zh?'聊聊她现在的研究 ↗':'Talk about her current research ↗'),'comic-follow');
    button.type='button';
    button.addEventListener('click',()=>{
      if(next){index++;onChange(milestones[index].id);draw(true);}
      else onQuestion(zh?'她现在在研究什么？':'What is she researching now?');
    });
    if(focus){heading.focus({preventScroll:true});card.scrollIntoView({block:'nearest',behavior:'instant'});}
  }
  draw();return card;
}
