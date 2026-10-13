import {milestones} from '../src/assets/biography.js';
import { storyCards } from '../src/assets/companion-stories.js';

// Accept an identifier only. Authored text always comes from this release.
export function resolveOpeningContext(value, language) {
  if(value === undefined)return undefined;
  if(!value || Array.isArray(value) || typeof value !== 'object' || Object.keys(value).length!==1 || typeof value.storyId!=='string')throw new Error('Invalid opening context');
  if(value.storyId==='timeline')return {storyId:'timeline',type:'biography_timeline',topic:'Yuxin’s education and work chronology'};
  const event=milestones.find(item=>`event:${item.id}`===value.storyId);
  if(event)return {storyId:value.storyId,type:'biography_event',eventId:event.id,title:event[language].title,period:event[language].period,url:language==='zh-CN'?'/zh/about/#sources':'/about/#sources'};
  const card=storyCards.find(card=>card.id===value.storyId);
  if(!card)throw new Error('Invalid opening context');
  return {storyId:card.id,type:'story_card',title:card[language].title,text:card[language].text,url:card.url};
}
