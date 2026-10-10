// Professional chronology supplied and approved by Evie on 10 October 2026.
// Academic degree details also use the archived public profile; no company names inferred.
export const milestones = [
  {id:'tsinghua', en:{period:'2015',kind:'Education',title:'Entered Tsinghua University',description:'Later earned a B.E. in Mechanical Engineering and an M.A. in Education.'}, 'zh-CN':{period:'2015 年',kind:'教育',title:'进入清华大学',description:'此后获得机械工程学士与教育学硕士学位。'}},
  {id:'startup', en:{period:'2016–2022',kind:'Work',title:'Startup CTO',description:'Started a company and served as CTO. Learned programming independently, developed multiple platforms, designed algorithms, and led an R&D team of more than 20 people. Left the company in 2022.'}, 'zh-CN':{period:'2016–2022 年',kind:'工作',title:'创业与 CTO 工作',description:'创办公司并担任 CTO，自学编程，开发多个平台、设计算法，带领 20 余人的研发团队。2022 年离开公司。'}},
  {id:'nonprofits', en:{period:'2020–2023',kind:'Internships',title:'是光诗歌 · PEER 毅恒挚友',description:'Worked on data collection, technical support, program design, and product design through internships with the two organizations.'}, 'zh-CN':{period:'2020–2023 年',kind:'实习',title:'是光诗歌 · PEER 毅恒挚友',description:'在两家机构实习，参与数据收集、技术支持、项目设计与产品设计。'}},
  {id:'unicef', en:{period:'June–December 2023',kind:'Internship',title:'UNICEF',description:'Led an SEL video resource program during the internship.'}, 'zh-CN':{period:'2023 年 6–12 月',kind:'实习',title:'联合国儿童基金会（UNICEF）',description:'实习期间负责一项 SEL 视频资源项目。'}},
  {id:'pku', en:{period:'September 2024–present',kind:'Education',title:'Peking University',description:'Sociology PhD student at the Center for Social Research; currently in the third year.'}, 'zh-CN':{period:'2024 年 9 月至今',kind:'教育',title:'北京大学',description:'社会研究中心社会学博士生，目前为博士三年级。'}},
  {id:'consulting', en:{period:'2025–2026',kind:'Work',title:'Product and AI consulting',description:'Worked as a product and AI consultant for three companies.'}, 'zh-CN':{period:'2025–2026 年',kind:'工作',title:'产品与 AI 咨询',description:'为三家公司提供产品与 AI 咨询。'}},
  {id:'princeton', en:{period:'Current · alongside the PhD',kind:'Visiting appointment',title:'Princeton University',description:'One-year Visiting Student Research Collaborator (VSRC).'}, 'zh-CN':{period:'目前 · 博士阶段同期',kind:'访问',title:'普林斯顿大学',description:'为期一年的访问学生研究合作者（VSRC）。'}}
];
export const biographyText = (id, language='en') => {
  const item=milestones.find(item=>item.id===id)?.[language];
  return item ? `${item.period} · ${item.title}. ${item.description}` : '';
};
