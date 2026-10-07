import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'skills/publish-personal-site');
export async function installSkill(target, { update = false } = {}) {
  const exists = await fs.lstat(target).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
  if (exists?.isSymbolicLink()) throw new Error('Refusing to overwrite a symlinked skill installation.');
  if (exists && !update) throw new Error(`Already installed at ${target}. Review changes and pass --update to replace these skill files.`);
  await fs.cp(source, target, { recursive: true, force: Boolean(exists), errorOnExist: !exists });
  return target;
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.slice(2).some(arg => arg !== '--update')) throw new Error('Usage: bun run skill:install [--update]');
    const target = path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'skills/publish-personal-site');
    console.log(`Installed publish-personal-site at ${await installSkill(target, { update: process.argv.includes('--update') })}`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
