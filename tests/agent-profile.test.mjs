import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createProfileTools} from '../server/agent-profile.mjs';

test('all biography routes carrying the joint NGO period preserve its missing individual dates',()=>{
 const tools=createProfileTools();
 for(const language of ['en','zh-CN']) {
  const results=[tools.read_profile({id:'profile',language}),tools.read_profile({id:'nonprofits',language}),tools.read_profile({eventId:'shiguang',language}),tools.read_profile({eventId:'peer',language}),tools.query_profile_events({language})];
  for(const result of results) {
   assert.equal(result.dateQualifications.sharedRange,'2020–2023');
   assert.equal(result.dateQualifications.individualStartEnd,null);
   assert.deepEqual(result.dateQualifications.events,['是光诗歌','PEER 毅恒挚友']);
  }
  assert.equal(tools.read_profile({eventId:'startup',language}).dateQualifications,undefined);
 }
});
