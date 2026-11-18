// Server-only, two small paid translation samples using the existing monetary guard.
import fs from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {inspectAgentConfig} from '../server/agent-config.mjs';
import {createGuard} from '../server/agent-state.mjs';
import {SQLiteAgentStore} from '../server/agent-sqlite.mjs';
import {createModelAgent} from '../server/agent-provider.mjs';
import {createPaidCompletion} from '../server/agent-paid.mjs';
import {translationDocument,runTranslation,createTranslationCache} from '../server/agent-translation.mjs';
const env=process.env,c=inspectAgentConfig(env);
if(c.issues.length || !c.enabled || c.storeKind!=='sqlite') throw Error('Invalid runtime');
const corpus=JSON.parse(await fs.readFile(c.corpusFile,'utf8'));
const ids=process.argv.slice(2);
if(ids.length<1 || ids.length>2) throw Error('Specify one or two public document IDs');
const docs=ids.map(documentId=>translationDocument(corpus,{documentId,targetLanguage:'zh-CN'}));
const store=new SQLiteAgentStore({path:env.AGENT_SQLITE_PATH});
const guard=createGuard({store,secret:env.AGENT_SIGNING_SECRET,dailyTokens:c.dailyTokens,monthlyCny:c.monthlyCny,rate:c.rate,enabled:()=>true,allowDevelopment:true});
const complete=createModelAgent({apiKey:env.AGENT_MODEL_KEY,model:env.AGENT_MODEL,provider:c.provider,baseURL:c.baseURL});
try {
 for(const original of docs) {
  const node=original.translationNodes.find(n=>n.text.trim().length>30 && n.text.length<450);
  if(!node) throw Error('No small sample');
  const doc={...original,translationNodes:[node]},requestId=randomUUID(),signal=AbortSignal.timeout(60000);let calls=0;
  await guard.beginDevelopment(requestId);
  try {
   const paid=createPaidCompletion({guard,requestId,complete,signal,beforeCall:()=>{if(++calls>1) throw Error('Sample call limit');}});
   await runTranslation({corpus,doc,targetLanguage:'zh-CN',cache:createTranslationCache(),complete:paid,signal,emit:(type,data)=>{
    if(type==='translation_node') console.log(JSON.stringify({documentId:doc.id,source:node.text,translation:data.text,calls}));
   }});
  } finally {await guard.finish(requestId);}
 }
} catch {console.error('Translation sample failed; no provider payload or runtime secrets logged.');process.exitCode=1;}
finally {store.close();}
