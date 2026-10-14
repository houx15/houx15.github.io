// References exist only for sections actually read in this turn. These IDs prove
// quotation provenance, not that a generated interpretation follows from it.
export function createQuoteFragments() {
  const sections=new Map(),quotes=new Map();
  return {
    present(output) {
      return {...output,sections:output.sections.map(({text,...section})=>{
        if(!sections.has(section.id)) {
          const fragments=text.split(/\n+/).map(text=>text.trim()).filter(Boolean).map(text=>{
            if(text.length>400)return {text}; // Retain the entire paragraph; never silently cut a qualifier.
            const quoteId=`q${quotes.size}`;quotes.set(quoteId,{sourceId:section.id,text});
            return {quoteId,text};
          });
          sections.set(section.id,fragments);
        }
        return {...section,fragments:sections.get(section.id)};
      })};
    },
    resolve(quoteId,sourceId) {
      const quote=quotes.get(quoteId);
      if(!quote || quote.sourceId!==sourceId)throw new Error('Invalid concept quotation');
      return quote.text;
    }
  };
}
