import {storyCards} from './companion-stories.js';

export function createDiceCard(document,{storyId,seen=[],language='en',onRoll=()=>{},onQuestion=()=>{}}) {
  const story=storyCards.find(item=>item.id===storyId);if(!story)throw new Error('Unknown story');
  const zh=language==='zh-CN',copy=story[language],card=document.createElement('section');
  card.className='comic-story-card comic-dice-card';
  const add=(parent,tag,text,className='')=>{const node=document.createElement(tag);node.textContent=text;node.className=className;parent.append(node);return node;};
  const count=storyCards.filter(item=>item.id===storyId || seen.includes(item.id)).length;
  const top=add(card,'div','','comic-dice-top');
  add(top,'span',zh?`已认识 ${count} / ${storyCards.length} 面`:`${count} of ${storyCards.length} sides discovered`,'comic-card-number');
  const roll=add(top,'button','','comic-reroll');roll.type='button';
  roll.setAttribute('aria-label',zh?'再掷一次，认识她的另一面':'Roll again to meet another side of her');
  const die=add(roll,'span',['⚀','⚁','⚂','⚃','⚄','⚅'][story.face-1],'comic-result-die');die.setAttribute('aria-hidden','true');
  add(roll,'span',zh?'再掷一次':'Roll again');roll.addEventListener('click',onRoll);
  add(card,'h2',copy.title);add(card,'p',copy.text);
  const sources=add(card,'details','','comic-evidence');add(sources,'summary',zh?'翻到原文 ↗':'See the source ↗');
  const link=add(sources,'a',zh?'这段故事的公开资料':'Public source for this story');link.href=zh?`/zh${story.url}`:story.url;
  const follow=add(card,'button',copy.follow+' ↗','comic-follow');follow.type='button';follow.addEventListener('click',()=>onQuestion(copy.follow));
  return card;
}
