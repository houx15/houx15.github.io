// Only offer a short selection from one section of the published reading surface.
// This text is a visitor question, never a substitute for server-side source reads.
export function captureReadingSelection(document) {
  // A machine translation is not an exact quotation from the author. Keep the
  // ordinary reading-section context, but do not prefill translated quotations.
  if(document.querySelector('[data-article-translation][data-translated="true"]'))return;
  const prose=document.querySelector('main article .prose'),selection=document.getSelection();
  if(!prose || !selection || selection.isCollapsed || selection.rangeCount!==1)return;
  const range=selection.getRangeAt(0);
  if(!prose.contains(range.startContainer) || !prose.contains(range.endContainer))return;
  const text=selection.toString().replace(/\s+/g,' ').trim();
  if(!text || text.length>280)return;
  const headings=[...prose.querySelectorAll('h2[id],h3[id],h4[id]')];
  const headingFor=node=>headings.filter(heading=>heading===node || heading.contains(node) || (heading.compareDocumentPosition(node)&4)).at(-1)?.id;
  const anchor=headingFor(range.startContainer);
  if(anchor!==headingFor(range.endContainer))return;
  return {text,headings:anchor?[anchor]:[]};
}

export function selectionQuestion(text,language) {
  return language==='zh-CN'?`请结合原文解释这段话：\n「${text}」`:`Please explain this passage in its original context:\n“${text}”`;
}

// A question belongs to the passage where it was started, even if the reader
// closes the dialog and scrolls elsewhere before sending it.
export function createReadingDraftContext() {
  let reading=[],latest=[],draft;
  return {
    open(headings) {latest=[...headings];reading=[...(draft ?? latest)];return [...reading];},
    edit(text) {
      if(text.trim())draft=draft ?? [...reading];
      else {draft=undefined;reading=[...latest];}
      return [...reading];
    },
    snapshot() {return [...reading];},
    restore(headings) {draft=[...headings];reading=[...headings];}
  };
}
