// Deliberately narrow: an explicit final instruction, not a guess at user intent.
// Quoted/embedded examples and negated instructions must not disable visuals.
export function requestsYearOnly(question) {
  return /(?:^|[。！？?!；;,，.]\s*)(?:请\s*)?只(?:答|回答)(?:年份|年)[。！!]?\s*$/u.test(question.trim()) ||
    /(?:^|[.!?;]\s*)(?:please\s+)?(?:answer\s+)?only\s+(?:the\s+)?year[.!]?\s*$/iu.test(question.trim());
}

export const presentationTools = new Set(['show_post_cards','show_visualization','show_reading_map','show_concept_flow','revise_concept_step','suggest_questions','show_profile_timeline']);

// Only direct recommendation clauses, not quoted examples or negated requests.
export function requestsRecommendation(question) {
  const unquoted=question.replace(/“[^”]*”|「[^」]*」|"[^"]*"/gu,'');
  if(/(?:不要|无需|不需要|不用)(?:显示|展示)?(?:任何)?卡片|\b(?:no|without)\s+(?:any\s+)?cards\b/iu.test(unquoted))return false;
  return unquoted.split(/[，。！？；,.!?;]\s*/u).some(clause=>
    /^(?:请|再|也|并|然后|顺便|同时|给我|帮我|\s)*推荐[^。！？；]{0,60}(?:作品|项目|文章|笔记|报告)/u.test(clause.trim()) ||
    /^(?:(?:please|also|and|then)\s+)*recommend\b[^.!?;]{0,100}\b(?:project|work|article|post|note|report|reading)\b/iu.test(clause.trim()));
}
