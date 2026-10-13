// Authored invitations into public sources, not model-inferred personality scores.
export const storyCards = [
  {id:'startup',face:1,en:{title:'Learning by building',text:'Between 2016 and 2022, Yuxin founded a company and worked as CTO. She taught herself programming and led an R&D team of more than 20 people.',follow:'What did she do as CTO?'},'zh-CN':{title:'从自学到动手做',text:'2016—2022 年，煜欣创业并担任 CTO。她自学编程，开发平台、设计算法，也带领过 20 余人的研发团队。',follow:'她担任 CTO 时做了什么？'},url:'/about/#sources'},
  {id:'ssdata',face:2,en:{title:'Research, made executable',text:'SSDataAgent puts survey simulation and evaluation into an agent workflow. The project asks how synthetic records should be generated and assessed.',follow:'Tell me about SSDataAgent'},'zh-CN':{title:'把研究方法写进系统',text:'在 SSDataAgent 中，调查数据的模拟与评估被放进了智能体工作流。合成数据如何生成，又应该如何评估，是这个项目关注的问题。',follow:'介绍一下 SSDataAgent'},url:'/projects/ssdata-agent/'},
  {id:'mind',face:3,en:{title:'A trace of the learning process',text:'Mind Imprint brings reading, writing, thinking cards and research workspaces together. It keeps a record of the process as well as the output.',follow:'Tell me about Mind Imprint'},'zh-CN':{title:'给思考过程留个位置',text:'思维印记把阅读、写作、思维卡片和研究工作区放在一起。除了最后的成果，它也为学习和思考的过程保留记录。',follow:'介绍一下 Mind Imprint'},url:'/projects/mind-imprint/'},
  {id:'nonprofits',face:4,en:{title:'Beyond software',text:'Her experience includes separate internships with 是光诗歌 and PEER. Across them, the work included data collection, technical support, program design and product design.',follow:'Tell me about her nonprofit experience'},'zh-CN':{title:'也在人与项目之间工作',text:'她曾分别在是光诗歌与 PEER 毅恒挚友实习。两段经历涉及数据收集、技术支持、项目设计与产品设计。',follow:'讲讲她的公益机构经历'},url:'/about/#sources'},
  {id:'correlation',face:5,en:{title:'How opinions connect',text:'Her opinion-correlation research compares the structure of policy opinions across societies and data sources, looking at relationships among opinions.',follow:'Tell me about opinion correlation'},'zh-CN':{title:'关心观点之间的关系',text:'意见关联研究比较不同社会与数据来源中的政策观点结构，关注观点之间如何联系。',follow:'介绍一下意见关联研究'},url:'/projects/opinion-correlation/'},
  {id:'evaluation',face:6,en:{title:'Making evaluation conditions explicit',text:'Her SSDataAgent report distinguishes source-only transfer from target-marginal oracle settings, and distributional fidelity from copying records.',follow:'What does the SSDataAgent report evaluate?'},'zh-CN':{title:'把评估条件说清楚',text:'她的 SSDataAgent 报告区分了仅使用源数据的迁移与使用目标边际信息的 oracle 条件，也区分分布保真度和记录复制。',follow:'SSDataAgent 的报告在评估什么？'},url:'/reports/evaluation-and-information-access/'}
];

export function nextStory(seen = [], random = Math.random) {
  const remaining = storyCards.filter(card => !seen.includes(card.id));
  const pool = remaining.length ? remaining : storyCards.filter(card => card.id !== seen.at(-1));
  return pool[Math.min(pool.length - 1, Math.max(0, Math.floor(random() * pool.length)))];
}

export const invitations = {
  'zh-CN':['掷个骰子？让我挑个故事讲给你。','研究、创业、学习。你想先认识哪一面的她？','不知道问什么也没关系。从下面随便选一个。'],
  en:['Roll a die? I’ll pick a story for you.','Research, building, learning. Where shall we begin?','No question yet? Pick something below.']
};

export function chooseOpening({ article = false, random = Math.random } = {}) {
  if (article) return 'read';
  return ['dice','human','story'][Math.min(2,Math.max(0,Math.floor(random()*3)))];
}
export const openingCopy = {
  'zh-CN': {
    dice:{prompt:'不知道从哪里开始？我们可以掷个骰子。',action:'掷个骰子，认识她的一面'},
    human:{prompt:'你可能想问，我和煜欣是什么关系。',action:'你是真人吗？'},
    story:{prompt:'她的经历里，有几条同时发生的线。',action:'带我看看她的经历'},
    read:{prompt:'我们从你正在读的这一篇开始。',action:'一起读这一篇'}
  },
  en:{
    dice:{prompt:'Not sure where to start? We could roll a die.',action:'Roll a die. Meet a side of her.'},
    human:{prompt:'You might be wondering who you’re talking to.',action:'Are you a real person?'},
    story:{prompt:'A few different threads run through her story.',action:'Show me her story'},
    read:{prompt:'Let’s begin with the page you’re reading.',action:'Read this with me'}
  }
};
