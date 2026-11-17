import { loadContent } from '../../lib/content.mjs';
export default async () => (await loadContent())
  .filter(entry => ['blog', 'notes'].includes(entry.type) && entry.category !== 'personal')
  .slice(0, 2);
