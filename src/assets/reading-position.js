// Snapshot the reading surface before the modal changes layout or scroll position.
export function readingHeadings(document,threshold=120) {
  return [...document.querySelectorAll('main article .prose h2[id],main article .prose h3[id],main article .prose h4[id]')]
    .filter(node=>node.getBoundingClientRect().top<=threshold).map(node=>node.id).reverse();
}
export function resolveReadingPosition(doc,headings) {
  if(!doc)return undefined;
  for(const anchor of headings.slice(0,1)) {
    const section=doc.sections.find(section=>{
      const hash=section.url.split('#')[1];if(!hash)return false;
      try{return decodeURIComponent(hash)===anchor;}catch{return false;}
    });
    if(section)return {sectionId:section.id,anchor,title:section.heading};
  }
}
