import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { execFileSync } from 'node:child_process';
import matter from 'gray-matter';
import { loadContent, slugPattern, validate, validDate } from '../lib/content.mjs';
import { checkSite } from './check.mjs';

const help = `Content commands (run from the website repository):
  bun run content new report <slug> --title "Title" [--lang en|zh-CN] [--date YYYY-MM-DD]
  bun run content new project <slug> --title "Title"
  bun run content list
  bun run content ready report <slug> [--date YYYY-MM-DD]

Aliases: article → report; product → project.
New entries are drafts. ready validates and builds locally; it does not commit or push.
For an existing published entry, ready preserves its publication date and sets updated.
`;
const kinds = { report: 'reports', article: 'reports', project: 'projects', product: 'projects' };
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const root = process.cwd();
function build() {
  execFileSync(process.execPath, [path.join(root, 'node_modules/@11ty/eleventy/cmd.cjs')], {
    cwd: root, env: { ...process.env, SITE_DRAFTS: '' }, stdio: 'pipe',
  });
}

try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    title: { type: 'string' }, lang: { type: 'string' }, date: { type: 'string' },
    summary: { type: 'string' }, help: { type: 'boolean', short: 'h' },
  } });
  const [command, kind, slug] = positionals;
  if (values.help || !command) { console.log(help); process.exit(0); }
  if (JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8')).name !== 'yuxin-hou-personal-site') throw new Error('Run this command from the personal website repository.');
  if (command === 'list') {
    const entries = await loadContent(root, { drafts: true });
    for (const entry of entries) console.log(`${entry.draft ? 'draft' : 'public'}\t${entry.type}/${entry.slug}\t${entry.title}`);
    if (!entries.length) console.log('No content entries.');
    process.exit(0);
  }
  if (!['new', 'ready'].includes(command)) throw new Error(help);
  if (!kinds[kind] || !slugPattern.test(slug || '') || positionals.length !== 3) throw new Error('Provide a content type and a lowercase hyphenated slug.\n' + help);
  if (values.date && !validDate(values.date)) throw new Error('Use a valid YYYY-MM-DD date.');
  const dir = path.join(root, 'content', kinds[kind], slug);
  const filename = path.join(dir, 'index.md');
  if (command === 'new') {
    const data = { title: values.title || '', summary: values.summary || '', date: values.date || today(), draft: true, lang: values.lang || 'en' };
    if (kind === 'project' || kind === 'product') { data.featured = false; data.links = []; }
    validate(data, '', slug);
    await fs.mkdir(path.dirname(dir), { recursive: true });
    await fs.mkdir(dir); // Refuse collisions rather than overwrite an existing entry.
    await fs.writeFile(filename, matter.stringify('\n', data), { flag: 'wx' });
    console.log(`Created draft: ${path.relative(root, filename)}\nPreview: bun run preview`);
  } else {
    if (values.title || values.lang || values.summary) throw new Error('Edit title, summary, and language in the Markdown file before ready.');
    const original = await fs.readFile(filename, 'utf8');
    const { data, content } = matter(original);
    if (data.draft === false) data.updated = values.date || today();
    else data.date = values.date || today();
    data.draft = false;
    validate(data, content, slug, { publication: true });
    try {
      await fs.writeFile(filename, matter.stringify(content, data));
      build();
      await checkSite(path.join(root, '_site'));
    } catch (error) {
      await fs.writeFile(filename, original);
      try { build(); } catch { /* The original diagnostic remains the useful error. */ }
      throw error;
    }
    console.log(`Validated for publication: /${kinds[kind]}/${slug}/\nSource: ${path.relative(root, filename)}\nNo commit or push was made. Review the page before publishing.`);
  }
} catch (error) {
  console.error(error.stderr?.toString().trim() || error.message);
  process.exitCode = 1;
}
