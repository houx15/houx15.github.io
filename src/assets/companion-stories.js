import {milestones,biographyText} from './biography.js';
// Authored invitations into public sources, not model-inferred personality scores.
export const storyCards = [
  {id:'startup',face:1,en:{title:'Learning by building',text:biographyText('startup'),follow:'What did she do as CTO?'},'zh-CN':{title:'从自学到动手做',text:biographyText('startup','zh-CN'),follow:'她担任 CTO 时做了什么？'},url:'/about/#sources'},
  {id:'knoweia',face:2,en:{title:'Learning with AI',text:'Knoweia explores AI-supported learning and teaching.',follow:'Tell me about Knoweia'},'zh-CN':{title:'和 AI 一起学习',text:'Knoweia 探索 AI 支持的学习与教学。',follow:'介绍一下 Knoweia'},url:'/projects/knoweia/'},
  {id:'mind',face:3,en:{title:'A trace of the learning process',text:'Mind Imprint brings reading, writing, thinking cards and research workspaces together. It keeps a record of the process as well as the output.',follow:'Tell me about Mind Imprint'},'zh-CN':{title:'给思考过程留个位置',text:'思维印记把阅读、写作、思维卡片和研究工作区放在一起。除了最后的成果，它也为学习和思考的过程保留记录。',follow:'介绍一下 Mind Imprint'},url:'/projects/mind-imprint/'},
  {id:'nonprofits',face:4,en:{title:'Beyond software',text:biographyText('shiguang')+' '+biographyText('peer'),follow:'Tell me about her nonprofit experience'},'zh-CN':{title:'也在人与项目之间工作',text:biographyText('shiguang','zh-CN')+' '+biographyText('peer','zh-CN'),follow:'讲讲她的公益机构经历'},url:'/about/#sources'},
  {id:'csv',face:5,en:{title:'People and opportunities',text:'Cyber Silicon Valley is an AI talent and company matching platform.',follow:'Tell me about Cyber Silicon Valley'},'zh-CN':{title:'人才与机会',text:'Cyber Silicon Valley 是一个 AI 人才与企业匹配平台。',follow:'介绍一下 Cyber Silicon Valley'},url:'/projects/cybersiliconvalley/'},
  {id:'evaluation',face:6,en:{title:'Making evaluation conditions explicit',text:'Her SSDataAgent report distinguishes source-only transfer from target-marginal oracle settings, and distributional fidelity from copying records.',follow:'What does the SSDataAgent report evaluate?'},'zh-CN':{title:'把评估条件说清楚',text:'她的 SSDataAgent 报告区分了仅使用源数据的迁移与使用目标边际信息的 oracle 条件，也区分分布保真度和记录复制。',follow:'SSDataAgent 的报告在评估什么？'},url:'/reports/evaluation-and-information-access/'}
];

export function nextStory(seen = [], random = Math.random) {
  const remaining = storyCards.filter(card => !seen.includes(card.id));
  const pool = remaining.length ? remaining : storyCards.filter(card => card.id !== seen.at(-1));
  return pool[Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)))];
}

export function openingContextFor(history, {article = false} = {}) {
  if(article)return undefined;
  const last=history.at(-1);
  if(last?.kind==='story')return {storyId:'timeline'};
  if(last?.kind==='dice' && storyCards.some(card=>card.id===last.id))return {storyId:last.id};
  return undefined;
}

export const greetings = {
  'zh-CN': [
    '她可能在和 AI 吵架，有什么问题先找我说说吧。',
    '她大概率睡着了，我还醒着。聊聊？',
    '她可能正忙着做梦，我先陪你聊。',
    '她可能正在敲键盘，有什么想问她的，先问我吧。',
    '她可能在健身房，我在这里。',
    '我是 Monkey 煜欣的 AI 分身，随时来找我聊天！'
  ],
  en: [
    'She might be arguing with an AI. Want to talk to me instead?',
    'She’s probably asleep. I’m still here. Want to chat?',
    'She might be busy dreaming. I’ll keep you company.',
    'She might be typing away. Anything you wanted to ask her?',
    'She might be at the gym. I’m here.',
    'I’m Monkey Yuxin’s AI counterpart. Come chat anytime!'
  ]
};

export function chooseGreeting(language = 'en', random = Math.random) {
  const lines = greetings[language] || greetings.en;
  return lines[Math.min(lines.length - 1, Math.max(0, Math.floor(random() * lines.length)))];
}

export function chooseOpening({ article = false, random = Math.random } = {}) {
  if (article) return 'read';
  return ['dice','story'][Math.min(1,Math.max(0,Math.floor(random()*2)))];
}
export const openingCopy = {
  'zh-CN': {
    dice:{prompt:'不知道从哪里开始？我们可以掷个骰子。',action:'掷个骰子，认识她的一面'},
    story:{prompt:'求学、工作、公益探索，一起看看。',action:'看看她的经历总览'},
    read:{prompt:'我们从你正在读的这一篇开始。',action:'一起读这一篇'}
  },
  en:{
    dice:{prompt:'Not sure where to start? We could roll a die.',action:'Roll a die. Meet a side of her.'},
    story:{prompt:'Education, work and community, together.',action:'See her experience at a glance'},
    read:{prompt:'Let’s begin with the page you’re reading.',action:'Read this with me'}
  }
};

// Resolve “this experience” against the card visible when typing began.
// A locked undefined value also matters: later cards cannot attach new context.
export function createOpeningDraftContext() {
  let locked=false,context;
  const copy=value=>value?{...value}:undefined;
  return {
    edit(text,current) {
      if(!text.trim()){locked=false;context=undefined;}
      else if(!locked){locked=true;context=copy(current);}
    },
    snapshot(current) {return copy(locked?context:current);}
  };
}
