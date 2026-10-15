import { loadContent } from '../../lib/content.mjs';
// Legacy locale URLs remain valid, but every article displays the author's original.
export default async () => (await loadContent()).flatMap(entry => entry.zh ? [entry, {...entry, url:entry.zh.url}] : [entry]);
