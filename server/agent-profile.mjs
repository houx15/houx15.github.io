import { createHash } from 'node:crypto';
import { knowledge,localizeAnswer } from '../src/assets/knowledge.js';
import { milestones } from '../src/assets/biography.js';
const approvedIds=new Set(['profile','startup','nonprofits','unicef','consulting','interests','contact','research','projects']);
const facts=knowledge.filter(f=>approvedIds.has(f.id));
export const profileRevision=createHash('sha256').update(JSON.stringify({facts:facts.map(f=>({id:f.id,text:f.text,sources:f.sources,zh:localizeAnswer(f,'zh-CN').text})),milestones})).digest('hex').slice(0,16);
export function createProfileTools() {
  function read_profile({id='profile',language='en'}={}) {
    const fact=facts.find(f=>f.id===id);if(!fact) throw new Error('Unknown profile fact');
    const localized=localizeAnswer(fact,language),source=localized.sources[0];
    return {id:`profile:${id}`,text:localized.text,source:{id:`profile:${id}`,label:source.label,url:source.url},asOf:'2026-10-10',qualification:'Owner-approved public facts; present/current statements are relative to the asOf date.'};
  }
  function query_profile_events({language='en'}={}) {
    return {type:'event_timeline',dateKind:'biography',asOf:'2026-10-10',items:milestones.map(event=>({id:`event:${event.id}`,...event[language],source:{id:`event:${event.id}`,label:language==='zh-CN'?'作者提供的履历':'Owner-provided biography',url:language==='zh-CN'?'/zh/about/#sources':'/about/#sources'}})),qualification:'Periods may overlap. Preserve the supplied period text; do not infer exact dates or use article publication dates.'};
  }
  return {read_profile,query_profile_events};
}
