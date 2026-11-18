// Publication gate: no credentials and no paid model calls.
const wait = ms => new Promise(r => setTimeout(r, ms));
for (let attempt=0; attempt<24; attempt++) {
  try {
    const [corpus,health] = await Promise.all([
      fetch('https://houx15.github.io/assets/agent-corpus.json', {cache:'no-store',signal:AbortSignal.timeout(15000)}),
      fetch('https://agent.kookat.icu/health', {cache:'no-store',signal:AbortSignal.timeout(15000)})
    ]);
    if(!corpus.ok || !health.ok) throw Error('Public endpoint unavailable');
    const c=await corpus.json(),h=await health.json();
    if(h.available && typeof c.revision==='string' && h.corpusRevision===c.revision) {
      console.log(`Published corpus synchronized: ${c.revision} (${c.documents.length} documents)`); process.exit(0);
    }
  } catch { /* bounded retry allows CDN and the five-minute sync timer to converge */ }
  if(attempt<23) await wait(15000);
}
console.error('Published website and translation backend corpus are not synchronized. Publication verification failed.');
process.exitCode=1;
