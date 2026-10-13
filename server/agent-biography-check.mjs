// Narrow checks for mistakes observed in real answers, not a general fact checker.
// Reject a candidate for correction; never silently rewrite a visitor's answer.
export function usesBiographyEvidence(ids) {
  return ids.some(id=>id.startsWith('profile:') || id.startsWith('event:'));
}
export function checkBiographySentence(text) {
  const compact=text.replace(/\s+/g,' ');
  if(/(?:北京大学|北大)[^。！？\n]{0,60}(?:社会学系|中国社会研究中心)/u.test(compact) || /(?:department of sociology[^.!?\n]{0,60}(?:peking|pku)|(?:peking|pku)[^.!?\n]{0,60}department of sociology)/i.test(compact)) throw new Error('Invalid biography identity');
  if(/普林斯顿[^。！？\n]{0,60}访问学者/u.test(compact) || /(?:princeton[^.!?\n]{0,60}visiting scholar|visiting scholar[^.!?\n]{0,60}princeton)/i.test(compact)) throw new Error('Invalid biography identity');
}
export const biographyRepairGuidance='Preserve the supplied academic identity exactly: 北京大学社会研究中心社会学博士生 / Sociology PhD student at the Center for Social Research, Peking University; 普林斯顿大学访问学生研究合作者（VSRC） / Visiting Student Research Collaborator (VSRC) at Princeton University. Do not invent 社会学系, 中国社会研究中心, Department of Sociology or Visiting Scholar. State the approved identity positively rather than repeating an incorrect title.';
