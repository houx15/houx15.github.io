// Snapshot the reading surface before the modal changes layout or scroll position.
export function captureReadingAnchor(document) {
  const nodes=[...document.querySelectorAll('main article .prose > *')];
  const node=nodes.find(node=>{const rect=node.getBoundingClientRect();return rect.bottom>0 && rect.top<document.documentElement.clientHeight;});
  if(!node)return undefined;
  const rect=node.getBoundingClientRect();
  return {node,width:document.documentElement.clientWidth,top:Math.max(0,rect.top),fraction:rect.height?Math.max(0,-rect.top)/rect.height:0};
}
export function restoreReadingAnchor(anchor,document,view) {
  if(!anchor?.node.isConnected || anchor.width===document.documentElement.clientWidth)return;
  const rect=anchor.node.getBoundingClientRect();
  view.scrollBy({top:rect.top+anchor.fraction*rect.height-anchor.top,behavior:'instant'});
}
export function readingHeadings(document,threshold=120) {
  const nodes=[...document.querySelectorAll('main article .prose h2[id],main article .prose h3[id],main article .prose h4[id]')];
  // A fragment near the page end cannot always scroll up to the reading line.
  // Honor that visible destination only while scrolling is clamped at the end;
  // a stale fragment must not override the reader moving elsewhere.
  const scroll=document.scrollingElement,height=document.documentElement?.clientHeight;
  if(scroll && scroll.scrollHeight-scroll.scrollTop-height<=2) {
    let anchor;try {anchor=decodeURIComponent(document.location?.hash.slice(1) || '');}catch{}
    const target=nodes.find(node=>node.id===anchor);
    const top=target?.getBoundingClientRect().top;
    if(top>threshold && top<height)return [target.id];
  }
  return nodes.filter(node=>node.getBoundingClientRect().top<=threshold).map(node=>node.id).reverse();
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

export function waitForReadingContext(promise,signal) {
  signal.throwIfAborted();
  return new Promise((resolve,reject)=>{
    const stop=()=>reject(signal.reason);
    signal.addEventListener('abort',stop,{once:true});
    promise.then(value=>{signal.removeEventListener('abort',stop);resolve(value);},error=>{signal.removeEventListener('abort',stop);reject(error);});
  });
}
