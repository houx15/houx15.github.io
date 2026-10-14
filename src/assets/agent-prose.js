// Layout only: retain every word and explicit paragraph break. Long plain-text
// passages get breathing room at complete sentence boundaries, including in streams.
export function readableProse(text) {
  if(typeof text!=='string')return '';
  if(/`|\$|^\s*(?:[-*+] |\d+[.)] |#{1,6} )/m.test(text))return text;
  return text.split(/(\n\s*\n)/).map((part,index)=>{
    if(index%2 || part.length<240)return part;
    const threshold=/[\u3400-\u9fff]/u.test(part)?100:360;
    let start=0,last=0,result='',quote='';
    for(let i=0;i<part.length;i++) {
      const ch=part[i];
      if(!quote && '“「『\"'.includes(ch) && part[i-1]!=='\\')quote={'“':'”','「':'」','『':'』','\"':'\"'}[ch];
      else if(ch===quote)quote='';
      if(!quote && /[。！？!?]/u.test(ch) && i+1-start>=threshold && i+1<part.length) {
        result+=part.slice(last,i+1)+'\n\n';start=last=i+1;
      } else if(!quote && ch==='.' && /\s/.test(part[i+1]||'') && i+1-start>=threshold) {
        result+=part.slice(last,i+1)+'\n\n';start=last=i+1;
      }
    }
    return result+part.slice(last);
  }).join('');
}
