import { DatabaseSync } from 'node:sqlite';
import { lstatSync } from 'node:fs';
import { dirname, isAbsolute } from 'node:path';
import { AgentError, initialState } from './agent-state.mjs';

// Single-host durable accounting. Explicit initialization is separate from startup:
// a missing/deleted ledger must never silently reset the spending ceiling.
export class SQLiteAgentStore {
  shared=true;
  constructor({path}) {
    if(!isAbsolute(path))throw new Error('Absolute state path required');
    const parent=lstatSync(dirname(path));
    if(!parent.isDirectory() || parent.isSymbolicLink() || (parent.mode & 0o077))throw new Error('Private state directory required');
    const file=lstatSync(path);
    if(!file.isFile() || file.isSymbolicLink() || (file.mode & 0o077))throw new Error('Private state file required');
    this.db=new DatabaseSync(path,{timeout:4000});
    this.db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=4000;');
  }
  initialize() {
    this.db.exec('CREATE TABLE IF NOT EXISTS ledger (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL)');
    this.db.prepare('INSERT OR IGNORE INTO ledger(id,value) VALUES(1,?)').run(JSON.stringify(initialState()));
  }
  async transaction(fn) {
    let active=false;
    try {
      this.db.exec('BEGIN IMMEDIATE');active=true;
      const row=this.db.prepare('SELECT value FROM ledger WHERE id=1').get();
      if(!row)throw new Error('Missing ledger');
      const state=JSON.parse(row.value);
      if(state.version!==1 || !Number.isSafeInteger(state.spent) || state.spent<0 || !Number.isSafeInteger(state.clock) || ['sessions','rates','replays','leases','reservations'].some(k=>!state[k] || typeof state[k]!=='object' || Array.isArray(state[k])))throw new Error('Invalid ledger');
      const result=fn(state);
      if(result?.then)throw new Error('Synchronous transaction required');
      this.db.prepare('UPDATE ledger SET value=? WHERE id=1').run(JSON.stringify(state));
      this.db.exec('COMMIT');active=false;return result;
    } catch(error) {
      if(active)try{this.db.exec('ROLLBACK');}catch{}
      throw error instanceof AgentError?error:new AgentError(503,'unavailable');
    }
  }
  close(){this.db.close();}
}
