import { createHash } from 'node:crypto';
import { knowledge,localizeAnswer } from '../src/assets/knowledge.js';
import { milestones } from '../src/assets/biography.js';
export const profileEventIds=milestones.map(event=>event.id);
const approvedIds=new Set(['profile','startup','nonprofits','unicef','consulting','interests','contact','research','projects']);
const facts=knowledge.filter(f=>approvedIds.has(f.id));
const nonprofitDates={events:['是光诗歌','PEER 毅恒挚友'],sharedRange:'2020–2023',individualStartEnd:null,qualification:'Only a shared range was supplied for these two distinct NGO internships. Their individual start/end years and months are not provided. Do not say each/both internship lasted from 2020 through 2023. If asked for separate dates, explicitly state that they are not published.'};
export const profileRevision=createHash('sha256').update(JSON.stringify({facts:facts.map(f=>({id:f.id,text:f.text,sources:f.sources,zh:localizeAnswer(f,'zh-CN').text})),milestones,nonprofitDates})).digest('hex').slice(0,16);
export function createProfileTools() {
  function read_profile({id='profile',eventId,language='en'}={}) {
    if(eventId) {
      const event=milestones.find(item=>item.id===eventId);if(!event)throw new Error('Unknown profile fact');
      const item=event[language];
      return {id:`event:${event.id}`,text:`${item.period}: ${item.title}. ${item.description}`,source:{id:`event:${event.id}`,label:item.title,url:language==='zh-CN'?'/zh/about/#sources':'/about/#sources'},asOf:'2026-10-10',qualification:'Owner-approved biography. Preserve the exact institution, role and overlapping period.',...(['shiguang','peer'].includes(eventId)?{dateQualifications:nonprofitDates}:{})};
    }
    const fact=facts.find(f=>f.id===id);if(!fact) throw new Error('Unknown profile fact');
    const localized=localizeAnswer(fact,language),source=localized.sources[0];
    return {id:`profile:${id}`,text:localized.text,source:{id:`profile:${id}`,label:source.label,url:source.url},asOf:'2026-10-10',qualification:'Owner-approved public facts; present/current statements are relative to the asOf date.',...(['profile','nonprofits'].includes(id)?{dateQualifications:nonprofitDates}:{})};
  }
  function query_profile_events({language='en'}={}) {
    return {type:'event_timeline',dateKind:'biography',asOf:'2026-10-10',items:milestones.map(event=>({id:`event:${event.id}`,...event[language],source:{id:`event:${event.id}`,label:language==='zh-CN'?'作者提供的履历':'Owner-provided biography',url:language==='zh-CN'?'/zh/about/#sources':'/about/#sources'}})),dateQualifications:nonprofitDates,qualification:'Periods may overlap. Preserve the supplied period text; do not infer exact dates or use article publication dates.'};
  }
  return {read_profile,query_profile_events};
}
