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
  assert.equal((await checkSite(path.join(dir, '_site'))).pages, 20);
  const $ = load(await fs.readFile(path.join(dir, '_site/index.html'), 'utf8'));
  assert.equal($('.home-ai-stage').length,1);
  assert.equal($('.home-introduction').length,1);
  assert.equal($('.home-research .publication-list>li').length,3);
  assert.equal($('.home-updates').length,1);
  assert.equal($('.home-updates .home-update-grid>li').length,0);
  assert.equal($('[data-companion-open]').length,1);
  assert.equal($('#companion-dialog').length,1);
  assert.equal($('section.screen,#radar,.biography-row').length,0);
});

test('assistant updates invalidate the entry script and all imported modules', async t => {
  const dir = await workspace(t);
  async function versionAfterBuild() {
    build(dir);
    const $ = load(await fs.readFile(path.join(dir, '_site/index.html'), 'utf8'));
    const entry = $('script[type="module"]').attr('src');
    assert.match(entry, /^\/assets\/portfolio\.js\?v=[a-f0-9]{12}$/);
    const version = entry.split('?v=')[1];
    for (const name of (await fs.readdir(path.join(dir,'src/assets'))).filter(name=>name.endsWith('.js'))) {
      const output = await fs.readFile(path.join(dir,'_site/assets',name),'utf8');
      const imports = [...output.matchAll(/from ['"]\.\/([\w-]+\.js)([^'"]*)['"]/g)];
      for (const [,dependency,query] of imports) {
        assert.equal(query,`?v=${version}`);
        await fs.access(path.join(dir,'_site/assets',dependency));
      }
    }
    return version;
  }
  const before = await versionAfterBuild();
  await fs.appendFile(path.join(dir,'src/assets/biography-chapter.js'),'\n// Updated chapter behavior.\n');
  assert.notEqual(await versionAfterBuild(),before);
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
  assert.equal((await checkSite(path.join(dir, '_site'))).pages, 22);
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
  const listing=load(await fs.readFile(path.join(dir,'_site/writing/index.html'),'utf8'));
  assert.equal(listing('[data-note]').length,1);
  const projects=load(await fs.readFile(path.join(dir,'_site/projects/index.html'),'utf8'));
  assert.equal(projects('.product-tile').length,1);
  assert.equal(load(await fs.readFile(path.join(dir, '_site/projects/test-product/index.html'), 'utf8'))('.project-links a').attr('href'), 'https://github.com/houx15');
  build(dir, true);
  assert.equal((await checkSite(path.join(dir, '_preview'), { preview: true })).pages, 23);
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
    cwd: dir, env: { ...process.env, SITE_DRAFTS: '1', CHOKIDAR_USEPOLLING: '1', CHOKIDAR_INTERVAL: '100' }, stdio: ['ignore', 'pipe', 'pipe'],
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

test('locale routes preserve original article language without duplicating listings',async t=>{
  const dir=await workspace(t);
  const folder=await writeEntry(dir,'projects','translated-project',{title:'English project'});
  await fs.writeFile(path.join(folder,'index.zh.md'),'---\ntitle: 中文项目\nsummary: 中文摘要。\n---\n\n## 实现\n\n完整中文正文。');
  build(dir);
  const english=load(await fs.readFile(path.join(dir,'_site/projects/translated-project/index.html'),'utf8'));
  const chinese=load(await fs.readFile(path.join(dir,'_site/zh/projects/translated-project/index.html'),'utf8'));
  assert.equal(english('#language-switch').attr('href'),'/zh/projects/translated-project/');
  assert.equal(chinese('#language-switch').attr('href'),'/projects/translated-project/');
  assert.equal(chinese('html').attr('lang'),'en');
  assert.match(chinese('.prose').text(),/A documented method/);
  assert.doesNotMatch(chinese('.prose').text(),/完整中文正文/);
  assert.equal(chinese('.toc a').length,2); // The original has two sections.
  const home=load(await fs.readFile(path.join(dir,'_site/zh/index.html'),'utf8'));
  assert.equal(home('.companion-portal').attr('href'),'/zh/chat/');
  assert.equal(home('.comic-home button, .comic-home form').length,0);
  assert.equal(home('#chat-form').length,0);
  assert.equal(home('.home-introduction').length,1);
  assert.equal(home('section.screen').length,0);
  const projectListing=load(await fs.readFile(path.join(dir,'_site/zh/projects/index.html'),'utf8'));
  assert.match(projectListing('.product-copy h2').text(),/English project/);
  assert.equal((await checkSite(path.join(dir,'_site'))).pages, 22);
  const chat=load(await fs.readFile(path.join(dir,'_site/zh/chat/index.html'),'utf8'));
  assert.equal(chat('[data-companion-form]').length,1);
  assert.equal(chat('[data-opening]').length,1);
  assert.equal(chat('[data-content-explorer]').length,0);
  assert.match(chat('[data-companion-status]').text(),/自由对话尚未接通/);
});

test('research is discoverable separately from products and legacy article URLs stay valid',async t=>{
  const dir=await workspace(t);
  await writeEntry(dir,'projects','ssdata-agent',{title:'SSDataAgent',extra:'category: research\n'});
  await writeEntry(dir,'projects','mind-imprint',{title:'Mind Imprint'});
  await writeEntry(dir,'projects','ai-attitudes',{title:'AI attitudes',extra:'category: research-software\n'});
  build(dir);
  const research=load(await fs.readFile(path.join(dir,'_site/research/index.html'),'utf8'));
  const projects=load(await fs.readFile(path.join(dir,'_site/projects/index.html'),'utf8'));
  const article=load(await fs.readFile(path.join(dir,'_site/projects/ssdata-agent/index.html'),'utf8'));
  assert.equal(research('a[href="/projects/ssdata-agent/"]').length,0);
  assert.equal(research('a[href="/projects/ai-attitudes/"]').length,0);
  assert.ok(projects('a[href="/projects/ssdata-agent/"]').length);
  assert.ok(projects('a[href="/projects/ai-attitudes/"]').length);
  assert.ok(projects('a[href="/projects/mind-imprint/"]').length);
  assert.equal(article('.back-link').attr('href'),'/projects/');
  assert.equal(research('#language-switch').attr('href'),'/zh/research/');
  const chinese=load(await fs.readFile(path.join(dir,'_site/zh/research/index.html'),'utf8'));
  assert.equal(chinese('h1').text(),'研究');
  assert.ok(projects('.product-main-link[href="/projects/mind-imprint/"]').length);
  await checkSite(path.join(dir,'_site'));
});

test('work and education timeline retains every overlapping period in both languages',async t=>{
  const dir=await workspace(t);build(dir);
  const {milestones}=await import('../src/assets/biography.js');
  const en=load(await fs.readFile(path.join(dir,'_site/about/index.html'),'utf8'));
  const zh=load(await fs.readFile(path.join(dir,'_site/zh/about/index.html'),'utf8'));
  for(const entry of milestones) {
    for(const [$,language] of [[en,'en'],[zh,'zh-CN']]) {
      const row=$(`[data-milestone="${entry.id}"]`);assert.equal(row.length,1);
      assert.ok(row.text().includes(entry[language].period));assert.ok(row.text().includes(entry[language].description));
    }
  }
  assert.match(en('[data-milestone="startup"]').text(),/2016–2022/);
  assert.match(en('[data-milestone="shiguang"]').text(),/2022–2024/);
  assert.match(en('[data-milestone="consulting"]').text(),/2025/);
  assert.match(en('.timeline-figure figcaption').text(),/parallel/);
  for(const $ of [en,zh]) {
    assert.equal($('.biography-group').length,3);
    assert.ok($('[data-milestone=peer]').text().includes('2021') && $('[data-milestone=peer]').text().includes('2023'));
    assert.equal($('[data-domain]').length,0);
    assert.equal($('.journey-map').length,0);
    assert.equal($('.biography-row[hidden]').length,0);
    assert.equal($('.journey-detail').length,0);
    assert.ok($('.journey-map button').toArray().every(button=>$(button).attr('aria-label')));
  }
  const chat=load(await fs.readFile(path.join(dir,'_site/chat/index.html'),'utf8'));
  assert.equal(chat('[data-companion-log]').length,1);
  const about=load(await fs.readFile(path.join(dir,'_site/about/index.html'),'utf8'));
  assert.match(about('.prose').text(),/supplied on 15 October 2026/);
});

test('learning notes are dated, searchable across languages, and exclude draft text', async t => {
  const dir = await workspace(t);
  await writeEntry(dir, 'notes', 'first-note', { title:'中文学习笔记', body:'## 概念\n\n正文检索 attention mechanism', extra:'lang: zh-CN\n' });
  await writeEntry(dir, 'notes', 'private-note', { draft:true, body:'private-search-needle' });
  build(dir);
  for (const route of ['notes', 'zh/notes']) {
    const html = await fs.readFile(path.join(dir,'_site',route,'index.html'),'utf8');
    const $ = load(html);
    assert.equal($('[data-note]').length, 1);
    assert.match($('[data-note]').attr('data-search'), /正文检索 attention mechanism/);
    assert.equal($('[data-note] a').attr('href'), '/notes/first-note/');
    assert.equal($('[data-year] h2').text(), '2026');
    assert.ok(!html.includes('private-search-needle'));
  }
  const article=load(await fs.readFile(path.join(dir,'_site/notes/first-note/index.html'),'utf8'));
  assert.equal(article('html').attr('lang'),'zh-CN');
  assert.equal(article('.site-name').text(),'侯煜欣');
  assert.equal(article('.site-name').attr('href'),'/zh/');
  assert.equal(article('.back-link').text(),'文章');
  assert.equal(article('.back-link').attr('href'),'/zh/writing/');
  assert.match(article('.article-meta time').text(),/2026年/);
  assert.equal(article('#language-switch').attr('hreflang'),'en');
  assert.equal(article('#language-switch').attr('href'),'/notes/');
  assert.match(article('[data-companion-open]').attr('aria-label'),/一起读/);
  assert.equal(article('[data-companion] textarea').attr('placeholder'),'或者，直接问我……');
  assert.equal(article('link[rel=canonical]').attr('href'),'https://houx15.github.io/notes/first-note/');
  await checkSite(path.join(dir,'_site'));
  build(dir,true);
  assert.match(await fs.readFile(path.join(dir,'_preview/notes/index.html'),'utf8'), /private-search-needle/);
});

test('papers are localized, abstracts collapsed, and private working abstracts stay out of release builds',async t=>{
 const dir=await workspace(t);
 await fs.mkdir(path.join(dir,'.verification/profile-review'),{recursive:true});
 await fs.writeFile(path.join(dir,'.verification/profile-review/working-abstracts.json'),JSON.stringify({'opinion-structures':{en:'PRIVATE_REVIEW_ABSTRACT', 'zh-CN':'PRIVATE_REVIEW_ABSTRACT'}}));
 build(dir);
 const en=load(await fs.readFile(path.join(dir,'_site/research/index.html'),'utf8'));
 const zh=load(await fs.readFile(path.join(dir,'_site/zh/research/index.html'),'utf8'));
 assert.equal(en('.publication-list>li').length,10);
 assert.match(en('#talent-policy .paper-title').text(),/Policy Diffusion/);
 assert.match(zh('#talent-policy .paper-title').text(),/人才强国/);
 assert.match(en('#talent-policy').text(),/in Chinese/);
 assert.equal(en('details[open]').length,0);
 assert.equal(en('#opinion-structures details').length,0);
 assert.doesNotMatch(en('body').text(),/PRIVATE_REVIEW_ABSTRACT/);
 assert.equal(en('#trust-imputation .paper-authors').text().trim(),'Feng Yang, Yuxin Hou, Xun Pang.');
 assert.equal(en('#trust-imputation .paper-year').text(),'2025.');
 assert.match(en('#trust-imputation .paper-venue').text(),/10\(4\), 1–31/);
 assert.match(en('#trust-imputation').text(),/online: 2026/);
 execFileSync(process.execPath,[cli],{cwd:dir,env:{...process.env,SITE_DRAFTS:'1'},stdio:'pipe'});
 const preview=load(await fs.readFile(path.join(dir,'_preview/research/index.html'),'utf8'));
 assert.match(preview('#opinion-structures details').text(),/PRIVATE_REVIEW_ABSTRACT/);
 assert.equal(preview('#opinion-structures details[open]').length,0);
 assert.doesNotMatch(await fs.readFile(path.join(dir,'_preview/assets/agent-corpus.json'),'utf8'),/PRIVATE_REVIEW_ABSTRACT/);
});


test('writing archive merges article types with dates, tags, full text and draft exclusion', async t => {
  const dir = await workspace(t);
  await writeEntry(dir, 'blog', 'public-essay', {title:'An original essay', extra:'lang: zh-CN\ntags:\n  - AI协作\n  - 工作方式\n'});
  const draft = await writeEntry(dir, 'blog', 'private-essay', {draft:true});
  await fs.writeFile(path.join(draft, 'private.png'), 'private');
  build(dir);
  for (const route of ['writing','zh/writing','blog','zh/blog','reports','zh/reports','notes','zh/notes']) {
    const $ = load(await fs.readFile(path.join(dir, '_site', route, 'index.html'),'utf8'));
    assert.equal($('[data-entry-tags]').length,1);
    assert.equal($('[data-entry-tags]').attr('data-entry-tags'),'AI协作|工作方式');
    assert.equal($('[data-entry-tags] [hidden]').length,0);
    assert.equal($('[data-entry-tags] h3 a').attr('href'),'/blog/public-essay/');
    assert.equal($('nav a[data-writing-tag="AI协作"]').attr('href'),'?tag='+encodeURIComponent('AI协作'));
  }
  const article = load(await fs.readFile(path.join(dir,'_site/blog/public-essay/index.html'),'utf8'));
  assert.equal(article('.article-tags a').length,3);
  assert.equal(article('time').first().attr('datetime'),'2026-10-07');
  const reports = await fs.readFile(path.join(dir,'_site/reports/index.html'),'utf8');
  assert.match(reports,/An original essay/);
  await assert.rejects(fs.access(path.join(dir,'_site/blog/private-essay/private.png')));
  await checkSite(path.join(dir,'_site'));
});

test('writing includes all three article kinds in date order, original language, and body search',async t=>{
 const dir=await workspace(t);
 for(const type of ['blog','reports','notes']) {
  const folder=await writeEntry(dir,type,`sample-${type}`,{title:`Title ${type}`,extra:'lang: zh-CN\n',body:`## 正文\n\nOnlyInBody_${type}`});
  const file=path.join(folder,'index.md');
  await fs.writeFile(file,(await fs.readFile(file,'utf8')).replace('2026-10-07',type==='notes'?'2026-10-14':type==='reports'?'2026-01-01':'2025-11-01'));
 }
 await writeEntry(dir,'projects','excluded-product');build(dir);
 for(const route of ['writing','zh/writing','blog','reports','notes']) {
  const $=load(await fs.readFile(path.join(dir,'_site',route,'index.html'),'utf8'));
  assert.deepEqual($('[data-note]').toArray().map(el=>$(el).attr('data-writing-entry-type')),['notes','notes','ideas']);
  assert.ok($('[data-note]').toArray().every(el=>$(el).attr('lang')==='zh-CN'));
  for(const type of ['blog','reports','notes'])assert.match($(`[data-note] a[href="/${type}/sample-${type}/"]`).closest('[data-note]').attr('data-search'),new RegExp('OnlyInBody_'+type));
  assert.equal($('.page-heading .eyebrow,.page-heading p').length,0);
  assert.equal($('.site-header nav a[href$="/writing/"]').length,1);
  assert.equal($('.site-header nav a[href$="/reports/"],.site-header nav a[href$="/blog/"],.site-header nav a[href$="/notes/"]').length,0);
 }
});

test('homepage keeps Mind Imprint and CyberSiliconValley plus only two latest notes or blogs',async t=>{
 const dir=await workspace(t);
 for(const slug of ['mind-imprint','cybersiliconvalley','unrelated-project'])await writeEntry(dir,'projects',slug);
 for(const [type,slug,date] of [['notes','newest','2026-10-15'],['blog','second','2026-10-14'],['notes','third','2026-10-13'],['reports','excluded-report','2026-10-16']]){
  const folder=await writeEntry(dir,type,slug);const file=path.join(folder,'index.md');await fs.writeFile(file,(await fs.readFile(file,'utf8')).replace('2026-10-07',date));
 }
 build(dir);
 for(const route of ['index.html','zh/index.html']){
  const $=load(await fs.readFile(path.join(dir,'_site',route),'utf8'));
  assert.equal($('.home-update-grid>li').length,4);
  assert.deepEqual($('.home-update-link').toArray().map(el=>$(el).attr('href')),['/projects/mind-imprint/','/projects/cybersiliconvalley/','/notes/newest/','/blog/second/']);
  assert.equal($('.home-ai-stage').length,1);assert.equal($('[data-companion-open]').length,1);
 }
});
