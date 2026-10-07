import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { load } from 'cheerio';
import { markdown } from './markdown.mjs';

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function validate(data, body, label, { publication = false } = {}) {
  const fail = message => { throw new Error(`${label}: ${message}`); };
  if (typeof data.draft !== 'boolean') fail('draft must be true or false.');
  if (typeof data.title !== 'string' || !data.title.trim()) fail('title is required.');
  if (!validDate(data.date)) fail('date must be a quoted YYYY-MM-DD string.');
  if (data.updated && (!validDate(data.updated) || data.updated < data.date)) fail('updated must be a valid date on or after date.');
  if (data.lang && !['en', 'zh-CN'].includes(data.lang)) fail('lang must be en or zh-CN.');
  if (data.featured !== undefined && typeof data.featured !== 'boolean') fail('featured must be a boolean.');
  if (data.links !== undefined) {
    if (!Array.isArray(data.links)) fail('links must be a list of label/url objects.');
    for (const link of data.links) {
      if (!link || typeof link.label !== 'string' || !link.label.trim() ||
          typeof link.url !== 'string' || !/^https:\/\/[^\s]+$/.test(link.url)) fail('each project link needs a label and an HTTPS URL.');
    }
  }
  if (!data.draft || publication) {
    if (typeof data.summary !== 'string' || !data.summary.trim()) fail('summary is required before publication.');
    if (!body.trim()) fail('body is required before publication.');
    if (/\b(?:TODO|TBD|FIXME)\b|\[待补充\]/i.test(body + data.title + data.summary)) fail('resolve unfinished placeholders before publication.');
    if (/^#\s/m.test(body)) fail('start body headings at ##; the page already provides its title.');
  }
}

export async function loadContent(root = process.cwd(), { drafts = process.env.SITE_DRAFTS === '1' } = {}) {
  const entries = [];
  for (const type of ['projects', 'reports']) {
    const base = path.join(root, 'content', type);
    const folders = await fs.readdir(base, { withFileTypes: true }).catch(error => {
      if (error.code === 'ENOENT') return [];
      throw error;
    });
    for (const folder of folders) {
      if (folder.name.startsWith('.')) continue;
      if (!folder.isDirectory() || !slugPattern.test(folder.name)) throw new Error(`Invalid content folder: ${type}/${folder.name}`);
      const directory = path.join(base, folder.name);
      const filename = path.join(directory, 'index.md');
      const { data, content } = matter(await fs.readFile(filename, 'utf8'));
      validate(data, content, `${type}/${folder.name}`);
      if (data.draft && !drafts) continue;
      const html = markdown.render(content);
      const $ = load(html);
      if ($('.katex-error').length) throw new Error(`${filename}: invalid formula.`);
      if ($('img').toArray().some(img => !$(img).attr('alt')?.trim())) throw new Error(`${filename}: images require descriptive alt text.`);
      const headings = $('h2, h3').toArray().map(el => ({ title: $(el).text(), id: $(el).attr('id'), level: el.tagName }));
      const words = $.text().match(/[\p{Script=Han}]|[\p{L}\p{N}]+/gu)?.length || 0;
      entries.push({ ...data, type, slug: folder.name, directory, html, headings,
        lang: data.lang || 'en', url: `/${type}/${folder.name}/`,
        readingTime: Math.max(1, Math.ceil(words / 220)) });
    }
  }
  return entries.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export async function copyPublishedAssets(entries, output) {
  async function copyFolder(source, target) {
    for (const item of await fs.readdir(source, { withFileTypes: true })) {
      if (item.name.startsWith('.') || item.name === 'index.md') continue;
      if (item.isSymbolicLink()) throw new Error(`Symlinks are not supported in content: ${source}/${item.name}`);
      const from = path.join(source, item.name), to = path.join(target, item.name);
      if (item.isDirectory()) await copyFolder(from, to);
      else {
        // Only explicit public attachments are copied. Notes, source files, and credentials stay out.
        if (!/\.(png|jpe?g|webp|gif|avif|svg|pdf|csv|json|zip|mp4|webm)$/i.test(item.name)) continue;
        await fs.mkdir(path.dirname(to), { recursive: true });
        await fs.copyFile(from, to);
      }
    }
  }
  for (const entry of entries) await copyFolder(entry.directory, path.join(output, entry.type, entry.slug));
}
