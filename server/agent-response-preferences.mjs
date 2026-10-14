// Deliberately narrow: an explicit final instruction, not a guess at user intent.
// Quoted/embedded examples and negated instructions must not disable visuals.
export function requestsYearOnly(question) {
  return /(?:^|[。！？?!；;,，.]\s*)(?:请\s*)?只(?:答|回答)(?:年份|年)[。！!]?\s*$/u.test(question.trim()) ||
    /(?:^|[.!?;]\s*)(?:please\s+)?(?:answer\s+)?only\s+(?:the\s+)?year[.!]?\s*$/iu.test(question.trim());
}

export const presentationTools = new Set(['show_post_cards','show_visualization','show_reading_map','show_concept_flow','suggest_questions','show_profile_timeline']);
