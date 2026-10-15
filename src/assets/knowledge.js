import {getUI} from './ui.js';
import {profileInterests} from './profile-interests.js';
import { biographyText, biographyOverviewText, consultingText } from './biography.js';
import { chineseFacts, chineseSourceLabels } from './knowledge-zh.js';
// Explicit public allowlist. Never import personal files, session logs or credentials here.
export const knowledge = [
 {id:'sports',terms:/sport|cycling|running|trail|crossfit|race|骑车|骑行|跑步|越野|比赛|运动/i,text:profileInterests.en.sports,sources:[{label:'Sport and race participation',url:'/about/#sports'}]},
  {id:'startup', terms:/startup|CTO|found(?:ed|er)|entrepreneur|R&D|创业|研发团队/i, text:biographyText('startup'), sources:[{label:'Owner-provided professional biography',url:'/about/'},{label:'Work and education',url:'/about/'}]},
  {id:'nonprofits', terms:/nonprofit|PEER|是光|毅恒|公益/i, text:biographyText('shiguang')+' '+biographyText('peer'), sources:[{label:'Owner-provided professional biography',url:'/about/'}]},
  {id:'unicef', terms:/UNICEF|SEL|儿童基金会/i, text:biographyText('unicef'), sources:[{label:'Owner-provided professional biography',url:'/about/'}]},
  {id:'consulting', terms:/consult|咨询/i, text:consultingText(), sources:[{label:'Owner-provided professional biography',url:'/about/'}]},
  { id: 'engineering', terms: /engineering example|concrete|contribution|authorship|strongest|贡献|工程实例/i, text: "A Mind Imprint commit attributed to houx15, with an AI coauthor, fixes completion of project-level cards. It requires a material reference only for card effects that consume source material and adds completion-level tests.", sources: [{label:'Card lifecycle and contribution evidence',url:'/projects/mind-imprint/'},{label:'Public corrective commit',url:'https://github.com/houx15/mind-imprint/commit/958a05a7d3e4381761917449651299bf5cd0622d'}] },
  { id: 'methods', terms: /research method|sociology.*(?:system|ai)|social research.*(?:ai|system)|研究方法|跨学科|社会学.*(?:系统|AI)/i, text: "The public research uses survey simulation, empirical-copula transfer, pairwise opinion correlations, topic-semantic similarity, and effective-dimensionality analysis. Research lists publications and working papers; technical reports, essays and learning notes share the Writing section.", sources: [{label:'Survey simulation and evaluation',url:'https://github.com/houx15/SSDataAgent'},{label:'Opinion correlation',url:'https://github.com/houx15/opinion-structure-across-societies'}] },
  { id: 'failure', terms: /failure|failed|wrong|mistake|learn.*from|失败|修复/i, text: "The public Mind Imprint patch fixes a material-reference guard that blocked project-level cards. In SSDataAgent, the current commit tool records missing chronology verification as a warning and an unverified flag; it does not enforce the hard gate described in some older documentation.", sources: [{label:'Mind Imprint corrective patch',url:'/projects/mind-imprint/'},{label:'Reading evaluation constraints',url:'/reports/evaluation-and-information-access/'}] },
  { id: 'mind', terms: /mind|imprint|thinking|印记|my name print/i, text: "Mind Imprint is an AI learning platform connecting interest exploration, research writing and practical projects. Pro supports structured research; Lite develops questions from interests. Thinking cards and process records help students revisit their own decisions. The project article explains the interest model, process-assessment design and agent architecture; learning outcomes are not established by those designs.", sources: [{label:'Mind Imprint',url:'/projects/mind-imprint/'},{label:'Public repository',url:'https://github.com/houx15/mind-imprint'}] },
  { id: 'knowia', terms: /knoweia|knowia|knoria|noir|llm.course|llm.learning.platform/i, text: "Yuxin developed the first version of Knoweia, the AI programming-learning desktop application described here. Its desktop client, local Python sidecar and backend connect code practice, learning evidence, adaptive guidance and persistent memory. The current product website has later material and should not all be attributed to this version.", sources: [{"label":"Knoweia","url":"/projects/knoweia/"},{"label":"Desktop releases","url":"https://github.com/houx15/llm-course-desktop/releases"}] },
  { id: 'dynamics', terms: /opinion.?dynamic|意见动态|舆论动态/i, text: "Yuxin lists opinion dynamics as a research area. Her earlier public profile also names opinion dynamics on social media. The specific project repository has not been confirmed, so this portfolio does not describe its methods, results, or individual contributions.", sources: [{"label":"Research","url":"/research/"},{"label":"Background and profile sources","url":"/about/"}] },
  { id: 'orgclaw', terms: /orgclaw/i, text: "OrgClaw is Yuxin’s concept for enterprise OpenClaw infrastructure, marked as an idea. Its design addresses organization identities, data permissions, shared knowledge, isolated agent execution, model access and cost management. A public runtime prototype exists, but the full enterprise platform is a design rather than a claim of deployed integrations.", sources: [{"label":"OrgClaw","url":"/projects/orgclaw/"},{"label":"Public repository","url":"https://github.com/houx15/OrgClaw"}] },
  { id: 'agenterm', terms: /agenterm/i, text: "agenTerm is a completed practice project for coordinating multiple coding agents. Its design moved from an autonomous orchestrator toward human-led planning, isolated worktrees, terminal workspaces, review and testing checkpoints. The public project article explains this transition; the repository is private.", sources: [{"label":"agenTerm","url":"/projects/agenterm/"}] },
  { id: 'research', terms: /research|研究/i, text: profileInterests.en.research, sources: [{"label":"Research","url":"/research/"}] },
  { id: 'interests', terms: /interest|skill|capabil|radar|proficien|能力|兴趣|技术|擅长|雷达/i, text: "Yuxin describes product thinking, AI techniques (especially NLP), statistics, big data analysis, and management as strengths, with less experience in design, marketing, sales, and financing. These are qualitative self-assessments, not measured scores. The timeline lists work, internships, education, and a visiting appointment, preserving their overlapping dates without life-status values.", sources: [{label:'Profile visualizations',url:'/about/'},{label:'Project evidence',url:'/projects/'}] },
  { id: 'profile', terms: /\b(?:background|education|princeton|peking|tsinghua|university|phd|journey|timeline|biography)\b|学历|经历|普林斯顿|北大|^(?:(?:who is|tell me about|introduce)\s+(?:evie|yuxin(?: hou)?)|(?:介绍(?:一下)?|认识(?:一下)?)(?:\s*)(?:evie|yuxin(?: hou)?|侯煜欣|煜欣))[.?!。？！]?$/i, text: [getUI().identity,getUI().heroText,getUI().aboutMore,getUI().approach,biographyOverviewText()].join("\n"), sources: [{label:'Background and profile sources',url:'/about/'},{label:'Work and education',url:'/about/'}] },
  { id: 'projects', terms: /project|work|build|项目|作品/i, text: "Projects include Mind Imprint, Knoweia, SuperNono, Zrobot, LitFlow and Cyber Silicon Valley, alongside tools such as TDDesign, Claude Coach, Rust Agent SDK, Agora, SuperPaper and podcast editing skills. OrgClaw, EvoHive, CareerPal and EdaDreams are marked as ideas. Practice projects have their own scope. Research lists publications and working papers separately; technical reports, essays and learning notes share the Writing section.", sources: [{label:'Projects',url:'/projects/'}] },
  { id: 'contact', terms: /contact|email|reach|联系|邮件/i, text: 'You can contact Yuxin at the email address already listed on her website, houyx15@gmail.com, or explore her public GitHub account. She cohosts the podcast 涌现FM (小宇宙) as 小猴monkey.', sources: [{label:'Contact details',url:'/about/'}] },
  { id: 'notes', terms: /note|report|article|publication|paper|benchmark|笔记|论文|报告/i, text: "The evaluation note summarizes SSDataAgent’s public reports on distributional fidelity, record copying, source-only transfer, and target-marginal oracle comparisons. It is a source-based note, not an additional experiment or publication.", sources: [{label:'Read the evaluation note',url:'/reports/evaluation-and-information-access/'}] }
];
// Explicit names take precedence over generic themes such as contribution or failure.
// Keep these narrower than each fact's discovery terms (e.g. "thinking" alone is not a project name).
const projectNames = [
  ['mind', /\bmind[ -]?imprint\b|\bmy name print\b|\b(?:the )?mark of thinking\b|思维印记/i],
  ['knowia', /\b(?:knoweia|knowia|knoria|noir)\b|llm[ -](?:course|learning)[ -](?:desktop|backend|platform)/i],
  ['dynamics', /opinion[ _-]?dynamics|意见动态|舆论动态/i],
  ['orgclaw', /orgclaw/i],
  ['agenterm', /agenterm/i],
];
const unknownAnswer = () => ({id:'unknown',text:'I don’t have a verified answer to that in this portfolio. This is a local topic-matching demo, not live AI. Try Yuxin’s background, Mind Imprint, her interests, or contact details.',sources:[{label:'Sources & limitations',url:'/about/'}]});
function findAnswer(question) {
  if (typeof question !== 'string' || !question.trim()) return {id:'empty',text:'Please enter a question about Yuxin or her projects.',sources:[]};
  if (/\b(?:secrets?|passwords?|credentials?|private)\b|\b(?:api[ -]?keys?|(?:api|access|auth(?:entication)?|bearer|refresh|session)[ -]?tokens?)\b|\b(?:your|her|his|my|the)\s+(?:secret\s+)?tokens?\b|system.?prompt|ignore.*instruction|\.env\b|file:|\/Users|chat.?history|密钥|密码|隐私|忽略.*指令|私人文件|(?:访问|认证|会话|登录|你的|她的)令牌/i.test(question)) return {id:'boundary',text:'I can only share the curated public portfolio facts. I cannot access private files, credentials, chat history, or instructions outside this page. Try asking about Yuxin’s background or Mind Imprint.',sources:[{label:'What this guide can see',url:'/about/'}]};
  const query = question.slice(0,400);
  // Withdrawn project names must not fall through to an unrelated generic fact.
  if(/\bssdata(?:[ -]?agent)?\b|\bai[ -]attitudes?(?:[ -]social[ -]media)?\b|\bweibo(?:\s*[/&-]\s*twitter|\s+attitudes)|opinion[ _-]?(?:correlation|structure)|意见关联|意见相关/i.test(query))return unknownAnswer();
  // Unsupported personal facts must not fall through to a name or work keyword.
  if (/\b(?:salary|salaries|income|earnings|net worth|birthday|birthdate|awards?)\b|home address|date of birth|how much.*(?:earn|make)|工资|薪水|年薪|收入|身家|生日|出生日期|家庭住址|获奖|奖项/i.test(query)) return unknownAnswer();
  if (/\b(?:compare|comparison|differences?|versus|vs)\b|比较|对比|区别|差别/i.test(query)) {
    const matches = projectNames.filter(([, pattern]) => pattern.test(query));
    // A comparison is a pair of existing summaries, never a generated ranking.
    if (matches.length !== 2) return unknownAnswer();
    return {id:'comparison',facts:matches.map(([id]) => knowledge.find(item => item.id === id))};
  }
  const biography = knowledge.find(item => ['startup','nonprofits','unicef','consulting'].includes(item.id) && item.terms.test(query));
  const project = projectNames.find(([, pattern]) => pattern.test(query));
  if (project) return knowledge.find(item => item.id === project[0]) || unknownAnswer();
  if (biography) return biography;
  if (/contribution|authorship|\brole\b|(?:personally|yourself|herself).*(?:built|build|made|implemented)|(?:you|she|evie).*(?:responsible|lead|led)|贡献|角色|负责/i.test(query)) return {id:'unknown',text:'I don’t have verified personal-role evidence for the project in this question. I won’t infer a role from repository ownership or substitute another project’s contribution.',sources:[{label:'Project contribution evidence',url:'/projects/'}]};
  return knowledge.find(item => item.terms.test(query)) || unknownAnswer();
}

export function localizeAnswer(answer, language = 'en') {
  if (answer.id === 'comparison') {
    const facts = answer.facts.map(fact => localizeAnswer(fact, language));
    const introduction = language === 'zh-CN'
      ? '以下并列展示两项工作的公开资料；资料未说明的差异或优劣，我无法确认。'
      : 'Here are the public summaries side by side. Differences or rankings not documented in these sources remain unknown.';
    return {id:'comparison',text:[introduction,...facts.map(fact => fact.text)].join('\n\n'),
      sources:[...new Map(facts.flatMap(fact => fact.sources).map(source => [source.url,source])).values()]};
  }
  if (language !== 'zh-CN') return answer;
  const key = answer.id === 'unknown' && answer.text.includes('personal-role') ? 'unknownRole' : answer.id;
  return {...answer, text:chineseFacts[key] || chineseFacts.unknown, sources:answer.sources.map(source=>({
    label:chineseSourceLabels[source.label] || source.label,
    url:source.url.startsWith('/') ? '/zh'+source.url : source.url
  }))};
}
export function answerQuestion(question, language = 'en') { return localizeAnswer(findAnswer(question),language); }
