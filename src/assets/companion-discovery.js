// Select from the published corpus; navigation-language copies count only once.
export function discoveryDocuments(documents, kind, language='en', random=Math.random) {
  const unique=new Map();
  for(const doc of documents) {
    if(kind==='projects' ? doc.type!=='projects' : !['blog','notes','reports'].includes(doc.type))continue;
    const key=doc.canonicalId || doc.id;
    const existing=unique.get(key);
    if(!existing || doc.url.startsWith('/zh/')===(language==='zh-CN'))unique.set(key,doc);
  }
  const sorted=[...unique.values()].sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
  if(kind==='surprise')return sorted.length?[sorted[Math.min(sorted.length-1,Math.max(0,Math.floor(random()*sorted.length)))]]:[];
  return sorted.slice(0,kind==='latest'?1:3);
}
