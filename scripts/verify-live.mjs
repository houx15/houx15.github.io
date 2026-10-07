import { parseArgs } from 'node:util';
import { load } from 'cheerio';

const { values } = parseArgs({ options: { revision: { type: 'string' }, path: { type: 'string' } } });
const origin = 'https://houx15.github.io';
const suffix = `verification=${Date.now()}`;
async function request(route) {
  const response = await fetch(`${origin}${route}?${suffix}`, { signal: AbortSignal.timeout(20000), cache: 'no-store' });
  if (!response.ok) throw new Error(`${route}: HTTP ${response.status}`);
  return response;
}
try {
  const info = await (await request('/build-info.json')).json();
  if (!values.revision || !/^[a-f0-9]{40}$/.test(values.revision)) throw new Error('Provide --revision with the exact deployed commit SHA.');
  if (info.revision !== values.revision) throw new Error(`Live revision is ${info.revision}; expected ${values.revision}. The CDN may still be updating.`);
  const routes = new Set(['/', '/projects/', '/reports/', '/about/']);
  if (values.path) {
    if (!/^\/(projects|reports)\/[a-z0-9-]+\/$/.test(values.path)) throw new Error('--path must be a project or report URL path.');
    routes.add(values.path);
  }
  for (const route of routes) {
    const $ = load(await (await request(route)).text());
    if ($('h1').length !== 1 || $('.preview-notice,.draft-label').length) throw new Error(`${route}: unexpected page or draft content.`);
    if ($('nav[aria-label="Main navigation"] a').length !== 3 || !$('link[href="/assets/style.css"]').length) throw new Error(`${route}: expected site layout missing.`);
    for (const image of $('img[src]').toArray()) {
      const src = $(image).attr('src');
      const url = new URL(src, `${origin}${route}`);
      if (url.origin === origin) await request(url.pathname);
    }
    console.log(`Verified ${origin}${route}`);
  }
  await request('/assets/style.css');
  console.log(`Live revision verified: ${info.revision}. Browser layout review is still required for new content.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
