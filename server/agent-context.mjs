import {MODEL_CONTEXT_INPUT_TOKENS,estimateContextTokens} from './agent-limits.mjs';
// The server retains full evidence and conversation records. Only the model's
// request projection is compacted; original passages are never cut mid-sentence.
export function fitAgentContext(messages,tools,maxBytes) {
 const projected=structuredClone(messages);
 const withinBudget=()=>maxBytes===undefined
   ?estimateContextTokens(projected,tools)<=MODEL_CONTEXT_INPUT_TOKENS
   :Buffer.byteLength(JSON.stringify({messages:projected,tools}))<=maxBytes;
 const outputs=[];
 for(const message of projected)if(message.role==='tool'){
  try {const value=JSON.parse(message.content);if(value && typeof value==='object')outputs.push({message,value});}catch{}
 }
 const sections=[];
 for(const output of outputs) {
  for(const read of [output.value,...(Array.isArray(output.value.includedReads)?output.value.includedReads:[])]) {
   if(Array.isArray(read.sections))for(const section of read.sections)if(typeof section.id==='string' && (typeof section.text==='string' || Array.isArray(section.fragments)))sections.push({output,section});
  }
 }
 const write=()=>{for(const {message,value} of outputs)message.content=JSON.stringify(value);};
 const seen=new Set();
 for(const {section} of sections.slice().reverse()) {
  if(seen.has(section.id)) {
   delete section.text;delete section.fragments;
   section.contentReference='The same original section appears in a later tool result in this request.';
  }else seen.add(section.id);
 }
 write();if(withinBudget())return projected;
 // Search snippets are navigation aids, not source evidence. The exact source
 // paragraphs stay available below; avoid repeating them in every search hit.
 for(const {value} of outputs)if(Array.isArray(value.results))for(const result of value.results) {
  delete result.excerpt;delete result.score;
 }
 write();if(withinBudget())return projected;
 const retained=sections.filter(({section})=>section.text!==undefined || section.fragments!==undefined);
 // Keep the freshest full passage. Older ones remain addressable for a fresh
 // read, with an explicit omission marker instead of an invented summary.
 for(const {section} of retained.slice(0,-1)) {
  delete section.text;delete section.fragments;
  section.contentOmitted=true;
  section.guidance='Earlier evidence text omitted for request size. This record only proves it was read; read_content with this section id again before relying on its wording.';
  write();if(withinBudget())return projected;
 }
 // Full exact exchanges remain accessible to recall_conversation. Remove only
 // prior conversation, never the current visitor question or current tool pairs.
 let current=-1;
 for(let i=0;i<projected.length;i++)if(projected[i].role==='user')try{const data=JSON.parse(projected[i].content);if(typeof data.question==='string' && typeof data.language==='string')current=i;}catch{}
 if(current>1) {
  projected.splice(1,current-1,{role:'user',content:JSON.stringify({type:'earlier_context_omitted',guidance:'Earlier conversation was omitted from this request for space. Use recall_conversation for exact retained exchanges. Do not infer that something was never said or read.'})});
 }
 return projected;
}
