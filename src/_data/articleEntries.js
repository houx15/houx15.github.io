import { loadContent } from '../../lib/content.mjs';
export default async () => (await loadContent()).flatMap(entry=>entry.zh?[entry,entry.zh]:[entry]);
