import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {buildCorpus} from '../lib/agent-corpus.mjs';
import {createContentTools} from '../src/assets/agent-tools.js';
import {validateAgentBlock} from '../src/assets/agent-stream.js';
import {createProfileTools} from '../server/agent-profile.mjs';
import {contentToolDefinitions,runContentAgent} from '../server/content-agent.mjs';

test('blog and project corpus supports historical provenance, full-text reads, cards and current project directory',async()=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'agent-blog-'));
 try {
  for(const [type,slug,status,dateKind,draft] of [['blog','thinking',null,'authored',false],['projects','orgclaw','想法','project-origin',false],['blog','private',null,'authored',true]]) {
   const dir=path.join(root,'content',type,slug);await fs.mkdir(dir,{recursive:true});
   await fs.writeFile(path.join(dir,'index.md'),`---\ntitle: ${slug}\nsummary: Historical design\ndate: "2026-02-21"\nupdated: "2026-10-15"\ndraft: ${draft}\nlang: zh-CN\ndateKind: ${dateKind}\ntags: [权限设计]\n${status?`status: ${status}\n`:''}privateField: DO-NOT-SERIALIZE\n---\n## Motivation\n\n权限设计是一个构想。\n\n## Detailed architecture\n\n独立执行环境和共享知识库。`);
  }
  const corpus=await buildCorpus(root);assert.equal(corpus.documents.length,2);
  assert.ok(!JSON.stringify(corpus).includes('DO-NOT-SERIALIZE'));
  const tools=createContentTools(corpus),hit=tools.search_content({query:'共享知识库',type:'blog'}).results[0];
  assert.equal(hit.id,'blog/thinking/zh-CN');assert.equal(hit.dateKind,'authored');assert.equal(hit.updated,'2026-10-15');
  assert.equal(tools.search_content({query:'权限设计',type:'projects'}).results[0].status,'想法');
  assert.match(tools.read_content({id:hit.id,sectionId:hit.sectionId}).sections[0].text,/独立执行环境/);
  const cards={...tools.show_post_cards({ids:[hit.id]}),id:'cards'};assert.equal(validateAgentBlock(cards),cards);
  const timeline={...tools.query_timeline({}),id:'timeline'};assert.equal(timeline.dateKind,'content');assert.equal(validateAgentBlock(timeline),timeline);
  const profile=createProfileTools(corpus).read_profile({id:'projects',language:'zh-CN'});
  assert.equal(profile.projects.length,1);assert.equal(profile.projects[0].status,'想法');assert.equal(profile.projects[0].dateKind,'project-origin');
  assert.ok(contentToolDefinitions.find(tool=>tool.name==='search_content').parameters.properties.type.enum.includes('blog'));
  let round=0;
  const answer=await runContentAgent({question:'这篇博客谈什么？',language:'zh-CN',corpus,pageContext:{documentId:hit.id,sectionId:hit.sectionId},complete:async()=>{
   round++;return {sourceIds:[hit.sectionId],text:'文章讨论独立执行环境和共享知识库。'};
  }});
  assert.equal(round,1);assert.equal(answer.sources[0].url,hit.sourceUrl);
 } finally {await fs.rm(root,{recursive:true,force:true});}
});
