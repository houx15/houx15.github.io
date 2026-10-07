import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import matter from 'gray-matter';
import { installSkill } from '../scripts/install-skill.mjs';

const root = path.resolve('.');
async function workspace(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'publishing-test-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  for (const item of ['src', 'lib', 'scripts', 'eleventy.config.js', 'package.json']) await fs.cp(path.join(root, item), path.join(dir, item), { recursive: true });
  await fs.symlink(path.join(root, 'node_modules'), path.join(dir, 'node_modules'), 'dir');
  return dir;
}
function run(dir, ...args) {
  return execFileSync(process.execPath, ['scripts/content.mjs', ...args], { cwd: dir, encoding: 'utf8', stdio: 'pipe', env: { ...process.env, SITE_DRAFTS: '' } });
}
async function fill(file, body = '## 方法\n\n这里是已经核实的说明。\n\n## 局限\n\n仅用于本地工作流测试。') {
  const { data } = matter(await fs.readFile(file, 'utf8'));
  data.summary = 'A precise summary of the supplied material.';
  await fs.writeFile(file, matter.stringify(body, data));
}

test('documented report workflow creates a draft, validates publication, and preserves URLs on update', async t => {
  const dir = await workspace(t);
  run(dir, 'new', 'article', 'test-report', '--title', '方法与结果: "A & B"', '--lang', 'zh-CN', '--date', '2026-10-01');
  const file = path.join(dir, 'content/reports/test-report/index.md');
  assert.equal(matter(await fs.readFile(file, 'utf8')).data.draft, true);
  assert.match(run(dir, 'list'), /draft\treports\/test-report/);
  await fill(file);
  run(dir, 'ready', 'report', 'test-report', '--date', '2026-10-07');
  let entry = matter(await fs.readFile(file, 'utf8'));
  assert.equal(entry.data.draft, false);
  assert.equal(entry.data.date, '2026-10-07');
  await fs.access(path.join(dir, '_site/reports/test-report/index.html'));
  assert.match(run(dir, 'list'), /public\treports\/test-report/);
  run(dir, 'ready', 'article', 'test-report', '--date', '2026-10-08');
  entry = matter(await fs.readFile(file, 'utf8'));
  assert.equal(entry.data.date, '2026-10-07');
  assert.equal(entry.data.updated, '2026-10-08');
  await fs.access(path.join(dir, '_site/reports/test-report/index.html'));
  assert.match(entry.content, /这里是已经核实的说明/);
});

test('product workflow supports real links; duplicate or unsafe slugs do not overwrite content', async t => {
  const dir = await workspace(t);
  run(dir, 'new', 'product', 'test-tool', '--title', 'Test tool');
  const file = path.join(dir, 'content/projects/test-tool/index.md');
  await fill(file, '## Usage\n\nUse the documented tool.\n\n## Limitations\n\nLocal workflow test only.');
  const entry = matter(await fs.readFile(file, 'utf8'));
  entry.data.links = [{ label: 'Source code', url: 'https://github.com/houx15' }];
  await fs.writeFile(file, matter.stringify(entry.content, entry.data));
  const original = await fs.readFile(file, 'utf8');
  assert.throws(() => run(dir, 'new', 'project', 'test-tool', '--title', 'Overwrite'));
  assert.equal(await fs.readFile(file, 'utf8'), original);
  assert.throws(() => run(dir, 'new', 'project', '../escape', '--title', 'Invalid'));
  assert.throws(() => run(dir, 'new', 'report', 'invalid-date', '--title', 'Invalid', '--date', '2026-02-30'));
  run(dir, 'ready', 'product', 'test-tool', '--date', '2026-10-07');
  assert.match(await fs.readFile(path.join(dir, '_site/projects/test-tool/index.html'), 'utf8'), /Source code/);
});

test('failed publication restores the draft and removes partial production output', async t => {
  const dir = await workspace(t);
  run(dir, 'new', 'report', 'incomplete', '--title', 'Incomplete');
  const file = path.join(dir, 'content/reports/incomplete/index.md');
  assert.throws(() => run(dir, 'ready', 'report', 'incomplete'));
  await fill(file, '## Result\n\n![Missing figure](missing.png)');
  const original = await fs.readFile(file, 'utf8');
  assert.throws(() => run(dir, 'ready', 'report', 'incomplete'), /missing/);
  assert.equal(await fs.readFile(file, 'utf8'), original);
  await assert.rejects(fs.access(path.join(dir, '_site/reports/incomplete/index.html')));
});

test('skill installs complete references and refuses accidental replacement', async t => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'skill-install-test-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const target = path.join(dir, 'publish-personal-site');
  await installSkill(target);
  assert.equal(await fs.readFile(path.join(target, 'SKILL.md'), 'utf8'), await fs.readFile(path.join(root, 'skills/publish-personal-site/SKILL.md'), 'utf8'));
  await fs.access(path.join(target, 'references/editorial.md'));
  await fs.access(path.join(target, 'agents/openai.yaml'));
  await assert.rejects(installSkill(target), /Already installed/);
  await installSkill(target, { update: true });
});
