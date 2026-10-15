import { createHash } from 'node:crypto';
import { knowledge,localizeAnswer } from '../src/assets/knowledge.js';
import { milestones } from '../src/assets/biography.js';
export const profileEventIds=milestones.map(event=>event.id);
const approvedIds=new Set(['profile','startup','nonprofits','unicef','consulting','interests','sports','contact','research','projects']);
const facts=knowledge.filter(f=>approvedIds.has(f.id));
const nonprofitDates={events:['是光诗歌','PEER 毅恒挚友'],periods:{shiguang:'2022–2024',peer:'2020; 2021; 2023',unicef:'2023'},qualification:'These are distinct experiences. PEER involvement occurred in separate periods in 2020, 2021 and 2023, not continuously throughout 2020–2023.'};
const educationDates={institution:'Tsinghua University',admissionYear:2015,bachelorCompletionYear:2021,masterCompletionYear:2024,pkuExpectedCompletionYear:2028,princetonVisit:'2026–2027',qualification:'Mechanical engineering: 2015–2021; Institute of Education: 2021–2024. PKU 2024–2028 has an expected, not completed, end year. Princeton 2026–2027 overlaps the PhD.'};
export const profileRevision=createHash('sha256').update(JSON.stringify({facts:facts.map(f=>({id:f.id,text:f.text,sources:f.sources,zh:localizeAnswer(f,'zh-CN').text})),milestones,nonprofitDates,educationDates})).digest('hex').slice(0,16);
export function createProfileTools(corpus) {
  function read_profile({id='profile',eventId,language='en'}={}) {
    if(id==='projects' && !eventId && Array.isArray(corpus?.documents)) {
      const selected=new Map();
      for(const doc of corpus.documents.filter(doc=>doc.type==='projects')) {
        if(!selected.has(doc.canonicalId) || doc.language===language)selected.set(doc.canonicalId,doc);
      }
      const projects=[...selected.values()].map(doc=>({id:doc.id,title:doc.title,url:doc.url,date:doc.date,dateKind:doc.dateKind || 'publication',...(doc.status?{status:doc.status}:{})}));
      return {id:'profile:projects',text:language==='zh-CN'?'公开项目目录。具体设计、动机与范围请查阅对应文章。':'Published project directory. Read each article for its design, motivation and scope.',projects,source:{id:'profile:projects',label:language==='zh-CN'?'项目':'Projects',url:language==='zh-CN'?'/zh/projects/':'/projects/'},qualification:'This directory comes from the current public corpus, not an exhaustive account of personal work. 想法 means concept; 已完成 is owner-reported completion, not verified live availability. Dates preserve dateKind; read article sections before describing capabilities or personal views.'};
    }
    if(eventId) {
      const event=milestones.find(item=>item.id===eventId);if(!event)throw new Error('Unknown profile fact');
      const item=event[language];
      return {id:`event:${event.id}`,text:`${item.period}: ${item.title}. ${item.description}`,source:{id:`event:${event.id}`,label:item.title,url:language==='zh-CN'?'/zh/about/':'/about/'},asOf:'2026-10-15',qualification:'Owner-approved biography. Preserve the exact institution, role and overlapping period.',...(['shiguang','peer'].includes(eventId)?{dateQualifications:nonprofitDates}:{}),...(eventId==='tsinghua'?{educationDates}:{})};
    }
    const fact=facts.find(f=>f.id===id);if(!fact) throw new Error('Unknown profile fact');
    const localized=localizeAnswer(fact,language),source=localized.sources[0];
    return {id:`profile:${id}`,text:localized.text,source:{id:`profile:${id}`,label:source.label,url:source.url},asOf:'2026-10-15',qualification:'Owner-approved public facts; present/current statements are relative to the asOf date.',...(['profile','nonprofits'].includes(id)?{dateQualifications:nonprofitDates}:{}),...(id==='profile'?{educationDates}:{})};
  }
  function query_profile_events({language='en'}={}) {
    return {type:'event_timeline',dateKind:'biography',asOf:'2026-10-15',items:milestones.map(event=>({id:`event:${event.id}`,...event[language],source:{id:`event:${event.id}`,label:language==='zh-CN'?'作者提供的履历':'Owner-provided biography',url:language==='zh-CN'?'/zh/about/':'/about/'}})),dateQualifications:nonprofitDates,educationDates,qualification:'Periods may overlap. Preserve the supplied period text; do not infer exact dates or use article publication dates.'};
  }
  return {read_profile,query_profile_events};
}
