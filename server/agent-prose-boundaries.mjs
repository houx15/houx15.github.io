// Return only complete sentence boundaries outside quoted spans. The same
// boundaries drive incremental checking, final checking, and repair deduplication.
export function proseSentenceEnds(text) {
  const ends=[],quotes=[];
  const closing={'“':'”','「':'」','『':'』','"':'"'};
  let escaped=false;
  for(let i=0;i<text.length;i++) {
    const ch=text[i];
    if(escaped){escaped=false;continue;}
    if(ch==='\\'){escaped=true;continue;}
    if(quotes.at(-1)===ch)quotes.pop();
    else if(Object.hasOwn(closing,ch))quotes.push(closing[ch]);
    if(!quotes.length && (/[。！？!?\n]/u.test(ch) || (ch==='.' && /\s/.test(text[i+1]||''))))ends.push(i+1);
  }
  return ends;
}
export function proseSentences(text) {
  let start=0;const parts=[];
  for(const end of proseSentenceEnds(text)){parts.push(text.slice(start,end));start=end;}
  if(start<text.length)parts.push(text.slice(start));
  return parts;
}
