import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { load } from 'cheerio';

export async function checkSite(output = path.resolve('_site'), { preview = false } = {}) {
  const files = [];
  async function walk(dir) {
    for (const item of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) await walk(full);
      else files.push(full);
    }
  }
  await walk(output);
  const errors = [], htmlFiles = files.filter(file => file.endsWith('.html'));
  const documents = new Map();
  for (const file of htmlFiles) documents.set(file, load(await fs.readFile(file, 'utf8')));
  for (const [file, $] of documents) {
    const label = path.relative(output, file);
    if ($('h1').length !== 1) errors.push(`${label}: expected one h1.`);
    if (!$('html').attr('lang')) errors.push(`${label}: missing page language.`);
    if (!$('title').text().trim() || !$('meta[name="description"]').attr('content')?.trim()) errors.push(`${label}: missing title or description.`);
    if ($('.katex-error').length) errors.push(`${label}: formula error.`);
    if (!preview && ($('.draft-label').length || $('.preview-notice').length)) errors.push(`${label}: draft leaked into production.`);
    const ids = new Set();
    $('[id]').each((_, el) => { const id = $(el).attr('id'); if (ids.has(id)) errors.push(`${label}: duplicate id ${id}`); ids.add(id); });
    $('img').each((_, el) => { if (!$(el).attr('alt')?.trim()) errors.push(`${label}: image lacks alt text.`); });
    const references = $('a[href], img[src], script[src], link[href], video[src], source[src]').toArray();
    for (const el of references) {
      const raw = $(el).attr('href') || $(el).attr('src');
      if (!raw) { errors.push(`${label}: empty link.`); continue; }
      if (/^(https?:|mailto:|tel:|data:|\/\/)/i.test(raw)) continue;
      if (/^[a-z][a-z\d+.-]*:/i.test(raw)) { errors.push(`${label}: unsupported link ${raw}`); continue; }
      const url = new URL(raw, `https://site.test/${label}`);
      let target = path.resolve(output, '.' + decodeURIComponent(url.pathname));
      if (!target.startsWith(output + path.sep) && target !== output) { errors.push(`${label}: link outside site.`); continue; }
      const stat = await fs.stat(target).catch(() => null);
      if (stat?.isDirectory()) target = path.join(target, 'index.html');
      if (!files.includes(target)) { errors.push(`${label}: missing ${raw}`); continue; }
      const chatTopic = /^\/(?:zh\/)?chat\/$/.test(url.pathname) && /^#topic=(ssdata|mind|attitudes|methods|profile|interests)$/.test(url.hash);
      if (url.hash && !chatTopic && documents.has(target)) {
        const targetDoc = documents.get(target), id = decodeURIComponent(url.hash.slice(1));
        if (!targetDoc('[id]').toArray().some(node => targetDoc(node).attr('id') === id)) errors.push(`${label}: missing anchor ${raw}`);
      }
    }
  }
  for (const required of ['index.html', 'projects/index.html', 'reports/index.html', 'about/index.html', '404.html', 'sitemap.xml', 'robots.txt', 'build-info.json']) {
    if (!files.includes(path.join(output, required))) errors.push(`Missing ${required}`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return { pages: htmlFiles.length, files: files.length };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log('Site checks passed:', await checkSite(path.resolve(process.argv[2] || '_site'), { preview: process.env.SITE_DRAFTS === '1' })); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
