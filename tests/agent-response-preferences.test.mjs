import {test} from 'node:test';
import assert from 'node:assert/strict';
import {requestsYearOnly} from '../server/agent-response-preferences.mjs';

test('only explicit terminal year instructions constrain presentation',()=>{
  for(const question of ['她离开公司是哪一年？只答年份。','她哪年入学，只回答年份','只答年','When did she leave? Only the year.','When did she leave? Please answer only the year.'])assert.equal(requestsYearOnly(question),true,question);
  for(const question of ['不要只答年份。','她说“只答年份。”是什么意思？','解释这个句子：只答年份。','When she says "only the year", what does she mean?','Do not answer only the year.','只答年份。然后画时间线。','介绍她的经历'])assert.equal(requestsYearOnly(question),false,question);
});

test('direct recommendation requests keep visual completion from skipping a deliverable',async()=>{
 const {requestsRecommendation}=await import('../server/agent-response-preferences.mjs');
 for(const question of ['简短介绍，用一张图帮我理解，再推荐一个适合先看的作品。','请推荐一篇笔记','Draw her background. Also recommend a project.'])assert.equal(requestsRecommendation(question),true,question);
 for(const question of ['推荐一篇文章，不要卡片','Recommend a project, without cards.','不要推荐作品','不用推荐文章','她说“推荐一篇笔记”是什么意思？','Do not recommend a project.','介绍她的经历','请解释推荐系统的项目架构'])assert.equal(requestsRecommendation(question),false,question);
});
