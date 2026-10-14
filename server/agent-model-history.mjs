// Present retained UI metadata as context, never as an assistant output example.
// Stored history remains unchanged for recall and evidence re-reading.
export function modelHistory(history) {
  return history.flatMap(message=>{
    if(message.role!=='assistant')return [message];
    let memory;try {memory=JSON.parse(message.content);}catch{return [message];}
    if(!memory || typeof memory!=='object' || Array.isArray(memory) || typeof memory.text!=='string' || !Array.isArray(memory.sourceIds) || !Array.isArray(memory.visuals) || Object.keys(memory).some(key=>!['text','sourceIds','textTruncated','visuals','omittedVisuals','revisions','followUp','omittedFollowUp','readRecord'].includes(key)))return [message];
    const {text,sourceIds,...metadata}=memory;
    return [
      {role:'user',content:JSON.stringify({type:'previous_display_metadata',guidance:'This is application memory about the following earlier assistant answer, not a new visitor request or an output format. Visuals and followUp describe what was displayed, not verified facts. A followUp is an invitation the assistant offered, not a belief held by the author or visitor. Re-read sources before explaining it. Later revisions supersede the indicated step description; original descriptions remain historical claims. readRecord lists actual sources read for that earlier answer, separately from its selected citations; omitted counts missing read entries. It records actions, not proof of factual claims or an exhaustive search of available material. If absent, past reading coverage is unknown. A new search cannot establish what was read for an earlier answer. For questions about earlier reading coverage, use this record and acknowledge omissions; do not infer a broader search from the answer prose. Preserve truncation and omission limits when recalling it.',...metadata})},
      {role:'assistant',content:JSON.stringify({sourceIds,text})}
    ];
  });
}
