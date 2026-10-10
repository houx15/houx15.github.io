import fs from 'node:fs';
import path from 'node:path';
import { createHmac, randomBytes } from 'node:crypto';
import { PublicError } from './assistant.mjs';

// One process, one persistent volume. Lock prevents accidentally multiplying limits.
export function openBudget(file, limit, { now = () => Date.now() } = {}) {
  const lock = `${file}.lock`;
  fs.mkdirSync(lock, { mode:0o700 });
  let poisoned = false;
  function read() {
    const state=JSON.parse(fs.readFileSync(file,'utf8'));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(state.date) || !Number.isSafeInteger(state.used) || state.used<0) throw new Error('Invalid ledger');
    return state;
  }
  try { read(); } catch (error) { fs.rmdirSync(lock); throw error; }
  return {
    reserve() {
      if (poisoned) throw new PublicError(503,'budget_unavailable');
      try {
        const state=read(); const today=new Date(now()).toISOString().slice(0,10);
        // A future date fails closed rather than resetting on clock rollback.
        if (state.date > today) throw new Error('Clock rollback');
        if (state.date < today) { state.date=today; state.used=0; }
        if (state.used >= limit) throw new PublicError(429,'daily_limit');
        state.used++;
        const fd=fs.openSync(`${file}.next`,'w',0o600);
        try { fs.writeFileSync(fd,JSON.stringify(state)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
        fs.renameSync(`${file}.next`,file);
        const dirfd=fs.openSync(path.dirname(file),'r');
        try { fs.fsyncSync(dirfd); } finally { fs.closeSync(dirfd); }
      } catch(error) {
        if (error instanceof PublicError) throw error;
        poisoned=true; throw new PublicError(503,'budget_unavailable');
      }
    },
    close() { fs.rmdirSync(lock); }
  };
}
export function createLimiter({ now = () => Date.now(), maxClients=10000 } = {}) {
  const clients=new Map(); const salt=randomBytes(32); let active=0;
  return {
    enter(address) {
      const time=now();
      for(const [key,value] of clients) if(time-value.start>=60000) clients.delete(key);
      const key=createHmac('sha256',salt).update(address).digest('hex');
      if(!clients.has(key) && clients.size>=maxClients) throw new PublicError(429,'busy');
      const entry=clients.get(key)||{start:time,count:0};
      if(entry.count>=6 || active>=2) throw new PublicError(429,'rate_limit');
      entry.count++;clients.set(key,entry);active++;
      let done=false; return ()=>{if(!done){active--;done=true;}};
    }
  };
}
