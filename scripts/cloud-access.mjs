import { execFileSync } from 'node:child_process';
const run = (...args) => execFileSync(args[0], args.slice(1), { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 20000 }).trim();
try {
  const remote = run('git', 'remote', 'get-url', 'origin');
  if (!/github\.com[:/]houx15\/houx15\.github\.io(?:\.git)?$/.test(remote)) throw new Error('The current checkout is not the personal website repository.');
  console.log('Repository identity: OK');
  run('gh', '--version');
  let repo;
  try { repo = JSON.parse(run('gh', 'api', 'repos/houx15/houx15.github.io')); }
  catch { throw new Error('Cloud GitHub API access is unavailable. Connect the intended GitHub account in this environment; do not paste credentials into chat.'); }
  if (!repo.permissions?.push) throw new Error('GitHub API does not confirm write access for this identity. Repository download alone is insufficient for publication.');
  console.log('GitHub API reports repository write permission.');
  run('gh', 'api', 'repos/houx15/houx15.github.io/actions/workflows/pages.yml');
  console.log('Deployment workflow visibility: OK');
  console.log('Read-only preflight passed. A real checked branch push/merge/deploy must still be verified in the cloud; this check does not prove git transport or main-branch write access.');
} catch (error) {
  console.error(error.code === 'ENOENT' ? 'Install Git and GitHub CLI in the cloud environment, then retry.' : error.message.startsWith('Command failed:') ? 'A GitHub or Git check failed. Verify environment access and network policy without printing credentials.' : error.message);
  process.exitCode = 1;
}
