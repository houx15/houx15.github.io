import {test} from 'node:test';
import assert from 'node:assert/strict';
import {consumeTranslationStream} from '../src/assets/article-translation-stream.js';
import {matchTranslationSource, translationTargets} from '../src/assets/article-translation.js';
import {createAgentClient} from '../src/assets/agent-stream.js';
const nodes=[{id:'title',text:'原文'},{id:'t0',text:' 正文。'}];
const events=[{type:'translation_start',documentId:'blog/test/zh-CN',targetLanguage:'en',revision:'r1',nodes},...nodes.map(node=>({type:'translation_node',nodeId:node.id,text:'Translation <script>not executable</script>',cached:false})),{type:'done',outcome:'complete'}];
function stream(items,width=1){const encoded=new TextEncoder().encode(items.map((item,i)=>{const event={version:2,id:`r:${i}`,requestId:'r',...item};return `id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;}).join(''));let pos=0;return new ReadableStream({pull(c){if(pos>=encoded.length)return c.close();c.enqueue(encoded.slice(pos,pos+width));pos+=width;}});}
test('full translation requires every node, including cached nodes, before completion',async()=>{
 const seen=[];await consumeTranslationStream(stream(events),e=>seen.push(e));assert.equal(seen.length,4);
 await assert.rejects(consumeTranslationStream(stream([events[0],events[1],events[3]]),()=>{}),/translation_invalid/);
 await assert.rejects(consumeTranslationStream(stream(events.slice(0,-1)),()=>{}),/interrupted/);
 await assert.rejects(consumeTranslationStream(stream([...events,events[1]]),()=>{}),/translation_invalid/);
 await assert.rejects(consumeTranslationStream(stream([events[0],events[1],events[1],events[2],events[3]]),()=>{}),/translation_invalid/);
});
test('source matching rejects outdated article text and preserves literal whitespace',()=>{
 const targets=new Map(nodes.map(node=>[node.id,{get:()=>node.text}]));matchTranslationSource(targets,nodes);
 assert.throws(()=>matchTranslationSource(targets,[nodes[0],{id:'t0',text:'正文。'}]),/source_changed/);
 assert.throws(()=>matchTranslationSource(targets,nodes.slice(0,1)),/source_changed/);
});
test('DOM translation targets exclude code and equations; replacement uses plain text only',()=>{
 const title={textContent:'Title'},summary={textContent:'Summary'},prose={};
 const text=(data,excluded)=>({data,parentElement:{closest:()=>excluded?{}:null}});
 const parts=[text(' Body ',false),text('const value = 1',true),text('x = y',true),text('  ',false),text('Link label',false)];let index=0;
 const article={querySelector:selector=>selector==='.prose'?prose:selector.includes('h1')?title:summary};
 const document={createTreeWalker:()=>({nextNode:()=>parts[index++]})};
 const targets=translationTargets(article,document);assert.deepEqual([...targets.keys()],['title','summary','t0','t1']);
 targets.get('t0').set('<img onerror=evil>');assert.equal(parts[0].data,'<img onerror=evil>');assert.equal(parts[1].data,'const value = 1');assert.equal(parts[2].data,'x = y');
});
test('translation uses the existing authenticated session endpoint and header',async()=>{
 const requests=[];const fetcher=async(url,options)=>{requests.push({url,options});return url.endsWith('/sessions')?Response.json({sessionToken:'test-token',expiresAt:Date.now()+60000}):new Response(stream(events,200),{headers:{'content-type':'text/event-stream'}});};
 const client=createAgentClient('https://api.example.test',fetcher);await client.openSession('challenge');await client.translate({documentId:'blog/test/zh-CN',targetLanguage:'en'});
 assert.equal(requests[1].url,'https://api.example.test/v2/translate');assert.equal(requests[1].options.headers.Authorization,'Bearer test-token');assert.equal(requests[1].options.credentials,'omit');assert.doesNotMatch(requests[1].options.body,/test-token/);
});
