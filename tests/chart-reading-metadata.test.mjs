import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {loadContent} from '../lib/content.mjs';
test('chart data stays available without inflating reading metadata or article navigation',async()=>{const root=await fs.mkdtemp(path.join(os.tmpdir(),'chart-reading-'));try{const dir=path.join(root,'content/blog/example');await fs.mkdir(dir,{recursive:true});await fs.writeFile(path.join(dir,'index.md'),`---\ntitle: Example\nsummary: Example\ndate: '2026-10-20'\ndraft: false\n---\n\n## Findings\n\nA short article.\n\n<div data-chart><h3>Panel heading</h3><table><tr><td>${'100 '.repeat(5000)}</td></tr></table></div>\n\n<style>${'/* decoration */'.repeat(500)}</style>`);const [entry]=await loadContent(root);assert.equal(entry.readingTime,1);assert.deepEqual(entry.headings.map(h=>h.title),['Findings']);assert.match(entry.html,/Panel heading/);assert.match(entry.html,/<table>/);}finally{await fs.rm(root,{recursive:true,force:true})}});
