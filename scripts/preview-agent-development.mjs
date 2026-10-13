// Private local preview. SSH credentials and model keys never enter the browser.
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {consumeAgentStream} from '../src/assets/agent-stream.js';
import {rememberAgentAnswer} from '../server/agent-memory.mjs';

export function createDevelopmentPreview({root,launch,token=randomBytes(32).toString('hex')}) {
  let active,history=[];
  const server=createServer(async(req,res)=>{
    const origin=`http://127.0.0.1:${server.address().port}`;
    const fail=status=>{res.writeHead(status,{'Content-Type':'text/plain'});res.end('Development preview unavailable');};
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    if(req.headers.host!==new URL(origin).host)return fail(403);
    const path=new URL(req.url,origin).pathname;
    try {
      if(req.method==='GET' && path==='/') {
        let html=await readFile(resolve(root,'_site/zh/chat/index.html'),'utf8');
        html=html.replace(/<script type="module" src="[^"]+"><\/script>/g,'');
        html=html.replace('</head>',`<meta name="development-preview-token" content="${token}"></head>`);
        html=html.replace('</body>','<script type="module" src="/preview-client.js"></script></body>');
        res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);return;
      }
      if(req.method==='GET' && (path==='/preview-client.js' || /^\/assets\/[\w.-]+\.(js|css|woff2)$/.test(path))) {
        const file=path==='/preview-client.js'?resolve(root,'scripts/development-preview-client.js'):resolve(root,'_site'+path);
        const data=await readFile(file);
        res.writeHead(200,{'Content-Type':path.endsWith('.css')?'text/css':path.endsWith('.woff2')?'font/woff2':'text/javascript'});res.end(data);return;
      }
      if(req.method==='GET' && /^\/(?:zh\/)?(?:notes|projects|reports|research|about|chat)\//.test(path)) {
        res.writeHead(302,{Location:`https://houx15.github.io${path}`});res.end();return;
      }
      if(req.method==='GET' && path==='/zh/') {res.writeHead(302,{Location:'https://houx15.github.io/zh/'});res.end();return;}
      if(req.method!=='POST' || !['/run','/reset'].includes(path))return fail(404);
      if(req.headers.origin!==origin || req.headers['x-development-preview']!==token || req.headers['content-type']!=='application/json')return fail(403);
      let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>8192)return fail(413);}
      if(path==='/reset') {
        if(raw!=='{}')return fail(400);
        if(active)return fail(409);
        history=[];res.writeHead(204);res.end();return;
      }
      let input;try{input=JSON.parse(raw);}catch{return fail(400);}
      if(!input || typeof input!=='object' || Array.isArray(input) || Object.keys(input).some(k=>!['question','language','pageContext'].includes(k)) || typeof input.question!=='string' || !input.question.trim() || input.question.length>400 || !['zh-CN','en'].includes(input.language))return fail(400);
      if(active)return fail(409);
      const child=launch();active=child;
      res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8'});res.flushHeaders();
      let cancelled=false,settled=false,bytes=0;const chunks=[];
      const cancel=()=>{if(cancelled)return;cancelled=true;child.stdin.end();};
      const deadline=setTimeout(()=>{cancel();child.kill('SIGTERM');},60000);
      res.on('close',cancel);
      child.stdin.on('error',()=>{});
      child.stdout.on('data',chunk=>{
        bytes+=chunk.length;
        if(bytes>1024*1024){cancel();child.kill('SIGTERM');return;}
        chunks.push(Buffer.from(chunk));
        if(!res.destroyed && !res.write(chunk))cancel();
      });
      // Never forward SSH stderr or server environment details to the browser.
      child.stderr.resume();
      const finish=async code=>{
        if(settled)return;settled=true;clearTimeout(deadline);
        if(code===0 && !cancelled && !res.destroyed) {
          try {
            let answer;const blocks=[];
            const result=await consumeAgentStream(new Response(Buffer.concat(chunks)).body,event=>{
              if(event.type==='block')blocks.push(event.block);
              if(event.type==='answer')answer=event;
            });
            if(!cancelled && !res.destroyed && answer) {
              const sources=result.sources.filter(source=>answer.sourceIds.includes(source.id));
              history=[...history,{role:'user',content:JSON.stringify(input)},{role:'assistant',content:rememberAgentAnswer({...answer,sources,blocks})}].slice(-40);
            }
          } catch { /* Incomplete or invalid streams never become conversation memory. */ }
        }
        if(active===child)active=undefined;if(!res.destroyed)res.end();
      };
      child.once('error',finish);child.once('close',finish);
      child.stdin.write(JSON.stringify({turns:[input],history})+'\n');
    } catch {if(!res.headersSent)fail(503);else res.end();}
  });
  server.on('close',()=>{active?.stdin.end();active?.kill('SIGTERM');});
  return server;
}

if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
  const host=process.env.AGENT_DEV_SSH_HOST || 'kookat';
  if(!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(host))throw new Error('Invalid SSH host alias');
  const args=['-T','-o','BatchMode=yes','-o','ConnectTimeout=10','-o','StrictHostKeyChecking=yes'];
  if(process.env.AGENT_DEV_KNOWN_HOSTS)args.push('-o',`UserKnownHostsFile=${process.env.AGENT_DEV_KNOWN_HOSTS}`);
  const remote="cd /home/monkey/apps/portfolio-agent/current && /home/monkey/.nvm/versions/node/v24.14.1/bin/node --env-file=/home/monkey/.config/portfolio-agent/runtime.env scripts/test-agent-development.mjs --context-stream";
  const server=createDevelopmentPreview({root,launch:()=>spawn('ssh',[...args,host,remote],{stdio:['pipe','pipe','pipe']})});
  server.listen(0,'127.0.0.1',()=>console.log(`Private development preview: http://127.0.0.1:${server.address().port}/`));
  const stop=()=>{server.close();server.closeAllConnections();};
  process.once('SIGINT',stop);process.once('SIGTERM',stop);
}
