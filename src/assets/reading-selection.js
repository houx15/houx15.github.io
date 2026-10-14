// Only offer a short selection from one section of the published reading surface.
// This text is a visitor question, never a substitute for server-side source reads.
export function captureReadingSelection(document) {
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
  let reading=[],draft;
  return {
    open(headings) {reading=[...(draft ?? headings)];return [...reading];},
    edit(text) {draft=text.trim()?(draft ?? [...reading]):undefined;}
  };
}
