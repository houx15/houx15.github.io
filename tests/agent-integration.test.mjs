import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createAgentClient } from '../src/assets/agent-stream.js';
import { createAgentServer } from '../server/agent-http.mjs';
import { MemoryAgentStore, createGuard } from '../server/agent-state.mjs';

test('browser client restores a session after navigation and preserves server-owned follow-up context', async t => {
  const origin='https://houx15.github.io';
  const corpus={schemaVersion:1,revision:'fixture',documents:[{id:'notes/cache/en',canonicalId:'notes/cache',title:'KV cache',summary:'Attention',type:'notes',language:'en',date:'2026-10-01',url:'/notes/cache/',tags:[],sections:[{id:'notes/cache/en:0',heading:'Evidence',text:'Keys and values are cached.',url:'/notes/cache/#evidence'}]}]};
  const seen=[];
  const complete=async input=>{
    seen.push(input);
    return seen.length%2
      ? {toolCalls:[{id:'read',name:'read_content',arguments:{id:'notes/cache/en'}},{id:'map',name:'show_reading_map',arguments:{id:'notes/cache/en',sectionIds:['notes/cache/en:0']}}]}
      : {text:'Keys and values are cached.',sourceIds:['notes/cache/en:0']};
  };
  const guard=createGuard({store:new MemoryAgentStore(),secret:'a'.repeat(40),dailyTokens:1000000,enabled:()=>true});
  const server=createAgentServer({origin,corpus,guard,complete,verifyChallenge:async()=>{},enabled:()=>true,production:false});
  server.listen(0,'127.0.0.1'); await once(server,'listening');
  t.after(()=>{server.closeAllConnections();server.close();});
  const saved=new Map(),sessionStore={getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)};
  const makeClient=()=>createAgentClient(`http://localhost:${server.address().port}`, (url,options)=>fetch(url.replace('localhost','127.0.0.1'),{...options,headers:{...options.headers,Origin:origin}}),{sessionStore});
  let client=makeClient();
  await client.openSession('test-challenge'); assert.equal(client.hasSession(),true);
  const events=[];
  await client.ask({question:'Explain this note',language:'en',pageContext:{documentId:'notes/cache/en'}},{onEvent:event=>events.push(event)});
  assert.equal(events.at(-1).type,'done');
  assert.equal(events.find(event=>event.type==='block').block.type,'reading_map');
  assert.equal(events.find(event=>event.type==='block').block.items[0].excerpt,'Keys and values are cached.');
  assert.equal(events.find(event=>event.type==='answer').text,'Keys and values are cached.');
  assert.ok(events.findIndex(event=>event.type==='source')<events.findIndex(event=>event.type==='answer'));
  client=makeClient(); // A newly loaded page has no closure state from the previous page.
  assert.equal(client.hasSession(),true);
  await client.ask({question:'And why?',language:'en'});
  assert.ok(seen[2].messages.some(message=>message.role==='assistant' && message.content==='Keys and values are cached.'));
  client.clearSession();
  await assert.rejects(client.ask({question:'Again',language:'en'}),/invalid_session/);
});
