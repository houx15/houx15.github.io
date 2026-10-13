import fs from 'node:fs/promises';
import { inspectAgentConfig } from '../server/agent-config.mjs';
import { createContentTools } from '../src/assets/agent-tools.js';
const config=inspectAgentConfig(process.env),issues=[...config.issues];
try {
  const corpus=JSON.parse(await fs.readFile(config.corpusFile,'utf8'));
  createContentTools(corpus);
  if(!corpus.documents.length || typeof corpus.revision!=='string')throw 0;
} catch {issues.push('AGENT_CORPUS_FILE: build a valid nonempty public corpus first');}
console.log(`Agent activation: ${config.enabled?'enabled':'disabled'}`);
console.log('Offline check only; no credentials are printed and no network requests are made.');
if(issues.length){for(const issue of issues)console.log(`- ${issue}`);process.exitCode=1;}
else console.log('Local configuration shape and public corpus passed. External services and model quality remain unverified.');
