import {milestones,biographyGroups} from './biography.js';

// Keep the export for existing imports; the opening now shows the whole biography.
export function createBiographyChapter(document,{language='en',onQuestion=()=>{}}={}) {
  const zh=language==='zh-CN',card=document.createElement('section');
  card.className='biography-overview comic-biography-overview';
  const add=(parent,tag,text,className='')=>{const node=document.createElement(tag);node.textContent=text;node.className=className;parent.append(node);return node;};
  add(card,'h2',zh?'教育、工作与公益探索':'Education, work & community');
  add(card,'p',zh?'几条同时展开的经历。日期按各段经历分别列出。':'Parallel strands of experience, each with its own dates.','biography-caption');
  for(const group of biographyGroups) {
    const section=add(card,'section','','biography-group');add(section,'h3',group[language]);
    const list=add(section,'ol','','biography-rows');
    for(const event of milestones.filter(item=>item.group===group.id)) {
      const copy=event[language],row=add(list,'li','','biography-row');
      add(row,'span',copy.period,'biography-period');
      const body=add(row,'div','','biography-copy');add(body,'h4',copy.title);add(body,'p',copy.description);
    }
  }
  const button=add(card,'button',zh?'聊聊她最近在做什么 ↗':'Talk about what she is doing now ↗','comic-follow');button.type='button';
  button.addEventListener('click',()=>onQuestion(zh?'她最近在做什么？':'What is she working on recently?'));
  return card;
}
