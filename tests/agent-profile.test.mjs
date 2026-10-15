import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createProfileTools} from '../server/agent-profile.mjs';

test('biography routes preserve separate nonprofit dates and non-continuous PEER participation',()=>{
 const tools=createProfileTools();
 for(const language of ['en','zh-CN']) {
  const results=[tools.read_profile({id:'profile',language}),tools.read_profile({id:'nonprofits',language}),tools.read_profile({eventId:'shiguang',language}),tools.read_profile({eventId:'peer',language}),tools.query_profile_events({language})];
  for(const result of results) {
   assert.equal(result.dateQualifications.periods.shiguang,'2022–2024');
   assert.equal(result.dateQualifications.periods.peer,'2021; 2023');
   assert.deepEqual(result.dateQualifications.events,['是光诗歌','PEER 毅恒挚友']);
  }
  assert.equal(tools.read_profile({eventId:'startup',language}).dateQualifications,undefined);
 }
});

test('education lookup paths preserve supplied degree years and expected PhD completion',()=>{
 const tools=createProfileTools();
 for(const language of ['en','zh-CN']) {
  for(const result of [tools.read_profile({id:'profile',language}),tools.read_profile({eventId:'tsinghua',language}),tools.query_profile_events({language})]) {
   assert.equal(result.educationDates.admissionYear,2015);
   assert.equal(result.educationDates.bachelorCompletionYear,2021);
   assert.equal(result.educationDates.masterCompletionYear,2024);
  }
  assert.equal(tools.read_profile({eventId:'startup',language}).educationDates,undefined);
 }
});
