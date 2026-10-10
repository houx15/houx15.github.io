import fs from 'node:fs';
const portfolio = JSON.parse(fs.readFileSync(new URL('./portfolio.json', import.meta.url), 'utf8'));
function point(index, radius) {
  const angle = (index * 72 - 90) * Math.PI / 180;
  return { x: 190 + Math.cos(angle) * radius, y: 143 + Math.sin(angle) * radius };
}
const points = values => values.map((value, index) => {
  const p = point(index, value * 19);
  return `${p.x},${p.y}`;
}).join(' ');
export default {
  description: portfolio.domains.map((domain, index) => `${domain} ${portfolio.illustrativeScores[index]} of 5`).join(', ') + '. All are placeholders pending Evie’s self-assessment.',
  rings: [1, 2, 3, 4, 5].map(level => ({ level, points: points(portfolio.domains.map(() => level)), y: 143 - level * 19 })),
  axes: portfolio.domains.map((label, index) => ({ label, end: point(index, 95), labelPoint: point(index, 125) })),
  initialPoints: points(portfolio.illustrativeScores)
};
