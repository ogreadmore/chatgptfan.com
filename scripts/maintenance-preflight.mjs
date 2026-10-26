import {readFileSync,existsSync,statfsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {hostname,homedir} from 'node:os';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

export const fingerprint = () => createHash('sha256').update(hostname()+'\0'+homedir()).digest('hex');
export function validateRunner(f) {
  const errors=[];
  if (!f.owner?.activeRunnerId || f.runner?.id!==f.owner.activeRunnerId || f.runner?.machineFingerprint!==f.machineFingerprint) errors.push('This computer is not the designated maintenance runner. Do not enroll it or publish without an owner-authorized handoff.');
  if (resolve(f.root)!==resolve(f.gitRoot)) errors.push('The checkout root is not the publication directory.');
  return errors;
}
export function validatePreflight(f, {publishing=false}={}) {
  const errors=validateRunner(f);
  if ((publishing || f.publishing?.enabled) && (!f.publishing?.enabled || f.remote!==f.publishing.repository || f.branch!==f.publishing.branch)) errors.push('Publishing configuration does not match the enabled repository and branch.');
  if (f.behind>0 || (!publishing && f.ahead>0) || (publishing && f.ahead>1)) errors.push('Unreconciled upstream/local commits; inspect before continuing.');
  if (!publishing && f.dirty) errors.push('The checkout has in-progress changes. Preserve and inspect them before a daily run.');
  if (f.nodeMajor<24) errors.push('Node.js 24 or newer is required.');
  if (!Number.isFinite(f.freeBytes) || f.freeBytes<1073741824) errors.push('Less than 1 GiB free disk space; resolve before generating or building.');
  if (f.missingFiles.length) errors.push('Required source/assets missing: '+f.missingFiles.join(', '));
  return errors;
}

export function inspectPreflight(root) {
  const read = p => JSON.parse(readFileSync(resolve(root,p),'utf8'));
  const git = (...args) => execFileSync('git',args,{cwd:root,encoding:'utf8',env:{...process.env,GIT_OPTIONAL_LOCKS:'0'}}).trim();
  const owner=read('docs/maintenance-owner.json');
  const runner=existsSync(resolve(root,'.maintenance/runner.json'))?read('.maintenance/runner.json'):null;
  const publishing=read('content/publishing.json');
  const briefs=read('content/briefs.json');
  const required=['public/assets/briefs/2026-09-18-altman-purple.png','content/art-reviews.json','docs/daily-update.md',...briefs.filter(b=>b.status==='published').flatMap(b=>['content/briefs/'+b.file,...(b.image?['public/assets/'+b.image.src]:[])])];
  const disk=statfsSync(root);
  const [ahead,behind]=git('rev-list','--left-right','--count','HEAD...origin/'+publishing.branch).split(/\s+/).map(Number);
  return {root,gitRoot:git('rev-parse','--show-toplevel'),owner,runner,machineFingerprint:fingerprint(),publishing,remote:git('remote','get-url','origin'),branch:git('branch','--show-current'),ahead,behind,dirty:!!git('status','--porcelain'),nodeMajor:Number(process.versions.node.split('.')[0]),freeBytes:disk.bavail*disk.bsize,missingFiles:required.filter(p=>!existsSync(resolve(root,p))),latestEdition:briefs.filter(b=>b.status==='published').map(b=>b.date).sort().at(-1)};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  try {
    const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
    const facts=inspectPreflight(root);
    const errors=process.argv.includes('--owner-only')?validateRunner(facts):validatePreflight(facts,{publishing:process.argv.includes('--publish')});
    console.log(JSON.stringify({ok:!errors.length,errors,branch:facts.branch,ahead:facts.ahead,behind:facts.behind,freeGiB:Math.round(facts.freeBytes/1073741824),latestEdition:facts.latestEdition},null,2));
    if(errors.length)process.exitCode=1;
  }catch(error){console.error('Maintenance preflight failed: '+error.message);process.exitCode=1;}
}
