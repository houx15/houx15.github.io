// Present retained UI metadata as context, never as an assistant output example.
// Stored history remains unchanged for recall and evidence re-reading.
export function modelHistory(history) {
  return history.flatMap(message=>{
    if(message.role!=='assistant')return [message];
    let memory;try {memory=JSON.parse(message.content);}catch{return [message];}
    if(!memory || typeof memory!=='object' || Array.isArray(memory) || typeof memory.text!=='string' || !Array.isArray(memory.sourceIds) || !Array.isArray(memory.visuals) || Object.keys(memory).some(key=>!['text','sourceIds','textTruncated','visuals','omittedVisuals','revisions','followUp','omittedFollowUp'].includes(key)))return [message];
    const {text,sourceIds,...metadata}=memory;
    return [
      {role:'user',content:JSON.stringify({type:'previous_display_metadata',guidance:'This is application memory about the following earlier assistant answer, not a new visitor request or an output format. Visuals and followUp describe what was displayed, not verified facts. A followUp is an invitation the assistant offered, not a belief held by the author or visitor. Re-read sources before explaining it. If asked why you offered this follow-up, identify your own conversational reason separately from what the source actually states. A useful question can explore an open issue; it does not imply that the source ranks it as hardest, most important, missing, or unmeasurable. Do not turn your reason for asking into an attributed source conclusion. Cite what the section says, then explain your invitation without inventing a missing capability or measurement obstacle. Later revisions supersede the indicated step description; original descriptions remain historical claims. Preserve truncation and omission limits when recalling it.',...metadata})},
      {role:'assistant',content:JSON.stringify({sourceIds,text})}
    ];
  });
}
