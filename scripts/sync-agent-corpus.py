#!/usr/bin/env python3
"""Run only on the agent host. Pull published corpus, atomically swap, restart, verify.
No credentials, source checkout, draft content, or model calls are involved.
"""
import json, os, pathlib, subprocess, tempfile, urllib.request, fcntl
ROOT = pathlib.Path.home() / 'apps/portfolio-agent'

def fetch(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={'Cache-Control':'no-cache'}), timeout=30) as r:
        data = r.read(10_000_001)
    if len(data)>10_000_000: raise ValueError('Corpus exceeds size limit')
    return data

def validate(data):
    c=json.loads(data)
    assert isinstance(c.get('revision'),str) and len(c['revision'])==16
    assert isinstance(c.get('documents'),list) and len(c['documents'])>0
    ids=set()
    for d in c['documents']:
        assert isinstance(d.get('id'),str) and d['id'] not in ids
        ids.add(d['id'])
        assert isinstance(d.get('sections'),list)
        for n in d.get('translationNodes',[]):
            assert isinstance(n.get('id'),str) and isinstance(n.get('text'),str)
    return c

def atomic(file,data):
    fd,name=tempfile.mkstemp(dir=file.parent,prefix='.corpus-')
    try:
        with os.fdopen(fd,'wb') as f: f.write(data); f.flush(); os.fsync(f.fileno())
        os.replace(name,file)
    finally:
        if os.path.exists(name): os.unlink(name)

def main():
    with open(ROOT/'corpus-sync.lock','w') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        # Respect a configured corpus override without exposing any other runtime fields.
        configured=None
        for line in (pathlib.Path.home()/'.config/portfolio-agent/runtime.env').read_text().splitlines():
            if line.startswith('AGENT_CORPUS_FILE='): configured=line.split('=',1)[1].strip().strip('\"\'')
        target=pathlib.Path(configured) if configured else ROOT/'current/_site/assets/agent-corpus.json'
        if not target.is_absolute(): target=ROOT/'current'/target
        data=fetch('https://houx15.github.io/assets/agent-corpus.json')
        corpus=validate(data); old=target.read_bytes(); validate(old)
        if json.loads(old)==corpus:
            print('Corpus already synchronized:',corpus['revision']); return
        atomic(target.with_suffix('.json.previous'),old)
        atomic(target,data)
        try:
            subprocess.run(['systemctl','--user','restart','portfolio-agent'],check=True)
            import time
            for _ in range(20):
                try:
                    health=json.loads(fetch('https://agent.kookat.icu/health'))
                    if health.get('available') and health.get('corpusRevision')==corpus['revision']: break
                except Exception: pass
                time.sleep(1)
            else: raise RuntimeError('Live corpus verification failed')
        except Exception:
            atomic(target,old)
            subprocess.run(['systemctl','--user','restart','portfolio-agent'],check=True)
            raise
        print('Synchronized and verified:',corpus['revision'],'documents:',len(corpus['documents']))
if __name__=='__main__': main()
