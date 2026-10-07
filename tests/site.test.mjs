import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { load } from 'cheerio';
import { loadContent, validate, validDate } from '../lib/content.mjs';
import { checkSite } from '../scripts/check.mjs';

const root = path.resolve('.');
const cli = path.join(root, 'node_modules/@11ty/eleventy/cmd.cjs');
async function workspace(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'personal-site-test-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  for (const item of ['src', 'lib', 'eleventy.config.js', 'package.json']) await fs.cp(path.join(root, item), path.join(dir, item), { recursive: true });
  await fs.symlink(path.join(root, 'node_modules'), path.join(dir, 'node_modules'), 'dir');
  await fs.mkdir(path.join(dir, 'content'), { recursive: true });
  return dir;
}
function build(dir, drafts = false) {
  execFileSync(process.execPath, [cli], { cwd: dir, env: { ...process.env, SITE_DRAFTS: drafts ? '1' : '' }, stdio: 'pipe' });
}
async function writeEntry(dir, type, slug, { draft = false, title = 'A technical test', body = '## Method\n\nA documented method.\n\n## Limitations\n\nThis is a test fixture.', extra = '' } = {}) {
  const folder = path.join(dir, 'content', type, slug);
  await fs.mkdir(folder, { recursive: true });
  await fs.writeFile(path.join(folder, 'index.md'), `---\ntitle: ${JSON.stringify(title)}\nsummary: "A test summary."\ndate: "2026-10-07"\ndraft: ${draft}\n${extra}---\n\n${body}\n`);
  return folder;
}

test('empty site has all routes and no fabricated entries', async t => {
  const dir = await workspace(t); build(dir);
  assert.equal((await checkSite(path.join(dir, '_site'))).pages, 5);
  const $ = load(await fs.readFile(path.join(dir, '_site/index.html'), 'utf8'));
  assert.equal($('.entry').length, 0);
  assert.equal($('.empty-state').length, 2);
});

test('reports and products render and are discoverable; drafts and their files stay out', async t => {
  const dir = await workspace(t);
  const folder = await writeEntry(dir, 'reports', 'test-report', {
    title: 'Methods & Results <2026>', extra: 'lang: zh-CN\n',
    body: '## 方法\n\n这是用于排版验证的文字。 $E=mc^2$\n\n$$\n\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}\n$$\n\n```python\ndef mean(values):\n    return sum(values) / len(values)\n```\n\n| Method | Value |\n| --- | --- |\n| Test | 1 |\n\n![A one-pixel image used only for testing](figure.png "Figure 1. Test fixture; no empirical results.")\n\nA footnote.[^note]\n\n## 局限\n\nThis is not a published report.\n\n[^note]: A test reference.\n',
  });
  await fs.writeFile(path.join(folder, 'figure.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jGhkAAAAASUVORK5CYII=', 'base64'));
  await writeEntry(dir, 'projects', 'test-product', { extra: 'featured: true\nlinks:\n  - label: Source code\n    url: https://github.com/houx15\n' });
  const draft = await writeEntry(dir, 'reports', 'unpublished-report', { draft: true });
  await fs.writeFile(path.join(draft, 'attachment.pdf'), 'draft-only attachment');
  build(dir);
  assert.equal((await checkSite(path.join(dir, '_site'))).pages, 7);
  const $ = load(await fs.readFile(path.join(dir, '_site/reports/test-report/index.html'), 'utf8'));
  assert.equal($('h1').text(), 'Methods & Results <2026>');
  assert.equal($('html').attr('lang'), 'zh-CN');
  assert.ok($('.katex').length >= 2);
  assert.ok($('pre code .hljs-keyword').length);
  assert.equal($('figcaption').text(), 'Figure 1. Test fixture; no empirical results.');
  assert.equal($('.table-scroll table').length, 1);
  assert.equal($('.footnotes').length, 1);
  assert.equal($('.toc a').length, 2);
  assert.ok((await fs.readFile(path.join(dir, '_site/sitemap.xml'), 'utf8')).includes('/reports/test-report/'));
  assert.ok(!(await fs.readFile(path.join(dir, '_site/sitemap.xml'), 'utf8')).includes('unpublished-report'));
  await assert.rejects(fs.access(path.join(dir, '_site/reports/unpublished-report')));
  const home = load(await fs.readFile(path.join(dir, '_site/index.html'), 'utf8'));
  assert.equal(home('.entry').length, 2);
  assert.equal(load(await fs.readFile(path.join(dir, '_site/projects/test-product/index.html'), 'utf8'))('.project-links a').attr('href'), 'https://github.com/houx15');
  build(dir, true);
  assert.equal((await checkSite(path.join(dir, '_preview'), { preview: true })).pages, 8);
  await fs.access(path.join(dir, '_preview/reports/unpublished-report/attachment.pdf'));
  const preview = load(await fs.readFile(path.join(dir, '_preview/reports/unpublished-report/index.html'), 'utf8'));
  assert.equal(preview('meta[name="robots"]').attr('content'), 'noindex, nofollow');
  // A production rebuild also removes stale files left by earlier output.
  await fs.cp(path.join(dir, '_preview/reports/unpublished-report'), path.join(dir, '_site/reports/unpublished-report'), { recursive: true });
  build(dir);
  await assert.rejects(fs.access(path.join(dir, '_site/reports/unpublished-report')));
});

test('publication metadata and factual placeholders are validated', () => {
  const good = { title: 'Title', date: '2026-10-07', draft: false, summary: 'Summary' };
  assert.ok(validDate('2024-02-29'));
  assert.ok(!validDate('2026-02-29'));
  for (const data of [{ ...good, draft: 'false' }, { ...good, date: '2026-02-30' }, { ...good, updated: '2026-01-01' }, { ...good, summary: '' }, { ...good, links: [{ label: 'demo', url: 'javascript:alert(1)' }] }]) {
    assert.throws(() => validate(data, 'Content', 'test'));
  }
  assert.throws(() => validate(good, 'TODO results', 'test'));
  assert.throws(() => validate(good, '# Duplicate title', 'test'));
});

test('broken assets and anchors fail verification', async t => {
  const dir = await workspace(t);
  await writeEntry(dir, 'reports', 'broken', { body: '## Results\n\n![Result](missing.png)\n\n[Missing section](#missing)' });
  build(dir);
  await assert.rejects(checkSite(path.join(dir, '_site')), /missing.*missing\.png[\s\S]*missing anchor/);
});

test('images without descriptions and invalid math are rejected', async t => {
  const dir = await workspace(t);
  const folder = await writeEntry(dir, 'reports', 'bad-image', { body: '![](image.png)' });
  await assert.rejects(loadContent(dir), /alt text/);
  await fs.rm(folder, { recursive: true });
  await writeEntry(dir, 'reports', 'bad-math', { body: '$\\invalidcommand{x}$' });
  t.mock.method(console, 'error', () => {});
  await assert.rejects(loadContent(dir));
});

test('draft preview survives repeated edits and removes stale entries on rebuild', { timeout: 20000 }, async t => {
  const cleanups = [];
  const dir = await workspace({ after: fn => cleanups.push(fn) });
  const folder = await writeEntry(dir, 'reports', 'watch-test', { draft: true });
  const child = spawn(process.execPath, [cli, '--watch'], {
    cwd: dir, env: { ...process.env, SITE_DRAFTS: '1' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  child.stdout.on('data', data => { log += data; });
  child.stderr.on('data', data => { log += data; });
  t.after(async () => {
    if (child.exitCode === null) {
      await new Promise(resolve => { child.once('exit', resolve); child.kill('SIGTERM'); });
    }
    for (const cleanup of cleanups) await cleanup();
  });
  async function until(predicate) {
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      if (await predicate()) return;
      if (child.exitCode !== null) throw new Error(log);
      await new Promise(resolve => setTimeout(resolve, 40));
    }
    throw new Error(`Watch did not produce the expected output.\n${log}`);
  }
  const output = path.join(dir, '_preview/reports/watch-test/index.html');
  await until(() => log.includes('Watching'));
  // Eleventy logs Watching just before chokidar finishes its initial subscription.
  await new Promise(resolve => setTimeout(resolve, 400));
  for (const text of ['First revision.', 'Second revision.']) {
    const builds = log.match(/Watching/g)?.length || 0;
    await fs.appendFile(path.join(folder, 'index.md'), `\n${text}\n`);
    await until(async () => (log.match(/Watching/g)?.length || 0) > builds && (await fs.readFile(output, 'utf8').catch(() => '')).includes(text));
    await checkSite(path.join(dir, '_preview'), { preview: true });
  }
  const completedBuilds = log.match(/Watching/g)?.length || 0;
  await fs.rm(folder, { recursive: true });
  // Eleventy queues removals until the next change event.
  await fs.appendFile(path.join(dir, 'src/index.njk'), '\n');
  await until(async () => {
    const html = await fs.readFile(path.join(dir, '_preview/reports/index.html'), 'utf8').catch(() => '');
    return (log.match(/Watching/g)?.length || 0) > completedBuilds && html.length > 0 && !html.includes('/reports/watch-test/');
  });
  await assert.rejects(fs.access(output));
  await checkSite(path.join(dir, '_preview'), { preview: true });
  assert.doesNotMatch(log, /ENOENT|Problem writing|Error:/);
});
