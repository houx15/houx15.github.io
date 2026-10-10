export const topicQuestions = {
 en:{ssdata:'Tell me about SSDataAgent',mind:'Tell me about Mind Imprint',attitudes:'Tell me about the AI attitudes pipeline',methods:'How does sociology inform these systems?',profile:'Tell me about Evie',interests:'Show me the radar'},
 'zh-CN':{ssdata:'介绍一下 SSDataAgent',mind:'介绍一下 Mind Imprint',attitudes:'介绍一下 AI attitudes',methods:'社会学如何影响这些 AI 系统？',profile:'介绍一下 Evie 的经历',interests:'看看雷达图'}
};
export function initialQuestion(hash,language='en') {
  const params=new URLSearchParams(hash.replace(/^#/,''));
  const question=params.get('q');
  if(question) return question.trim().slice(0,400);
  const topic=params.get('topic');
  return Object.hasOwn(topicQuestions[language] || topicQuestions.en,topic) ? (topicQuestions[language] || topicQuestions.en)[topic] : '';
}
export function questionFragment(question) { return '#'+new URLSearchParams({q:question.trim().slice(0,400)}).toString(); }
