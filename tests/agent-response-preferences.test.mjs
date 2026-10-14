import {test} from 'node:test';
import assert from 'node:assert/strict';
import {requestsYearOnly} from '../server/agent-response-preferences.mjs';

test('only explicit terminal year instructions constrain presentation',()=>{
  for(const question of ['她离开公司是哪一年？只答年份。','她哪年入学，只回答年份','只答年','When did she leave? Only the year.','When did she leave? Please answer only the year.'])assert.equal(requestsYearOnly(question),true,question);
  for(const question of ['不要只答年份。','她说“只答年份。”是什么意思？','解释这个句子：只答年份。','When she says "only the year", what does she mean?','Do not answer only the year.','只答年份。然后画时间线。','介绍她的经历'])assert.equal(requestsYearOnly(question),false,question);
});
