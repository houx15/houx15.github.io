// Client context identifies public material only; it cannot supply source text or evidence.
export function validatePageContext(value,corpus) {
  if(value===undefined)return undefined;
  if(value && typeof value==='object' && !Array.isArray(value) && Object.keys(value).length===1 && typeof value.pagePath==='string') {
    if(!/^\/(?:zh\/)?(?:(?:about|research|projects|writing|blog|notes|reports)\/)?$/.test(value.pagePath))throw new Error('Invalid page context');
    return {pagePath:value.pagePath};
  }
  if(!value || typeof value!=='object' || Array.isArray(value) || Object.keys(value).some(key=>!['documentId','sectionId','sectionAnchor'].includes(key)))throw new Error('Invalid page context');
  const doc=corpus.documents.find(doc=>doc.id===value.documentId);
  if(!doc || (value.sectionId!==undefined && !doc.sections.some(section=>section.id===value.sectionId)))throw new Error('Invalid page context');
  if(value.sectionAnchor!==undefined) {
    if(typeof value.sectionAnchor!=='string' || value.sectionAnchor.length>500 || value.sectionId!==undefined)throw new Error('Invalid page context');
    const section=doc.sections.find(section=>{
      const hash=section.url.split('#')[1];if(!hash)return false;
      try{return decodeURIComponent(hash)===value.sectionAnchor;}catch{return false;}
    });
    if(!section)throw new Error('Invalid page context');
    return {documentId:doc.id,sectionId:section.id};
  }
  return {documentId:doc.id,...(value.sectionId!==undefined?{sectionId:value.sectionId}:{})};
}
