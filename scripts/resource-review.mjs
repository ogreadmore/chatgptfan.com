import { readJSON } from './lib.mjs';
import { pathToFileURL } from 'node:url';

const DAY = 86400000;
export function reviewQueue(resources, date) {
  const now = Date.parse(date + 'T00:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(now) || new Date(now).toISOString().slice(0,10)!==date) throw new Error('Use a valid YYYY-MM-DD review date');
  return resources.map(r => {
    const checked = Date.parse(r.checkedAt + 'T00:00:00Z');
    const interval = r.reviewEveryDays ?? 30;
    if (!Number.isFinite(checked) || new Date(checked).toISOString().slice(0,10)!==r.checkedAt || checked > now || !Number.isInteger(interval) || interval < 1) throw new Error('Invalid review metadata: '+r.id);
    const dueAt = new Date(checked + interval * DAY).toISOString().slice(0,10);
    return {id:r.id,section:r.section,title:r.title,url:r.url,checkedAt:r.checkedAt,dueAt,overdueDays:Math.floor((now-checked)/DAY)-interval};
  }).sort((a,b)=>b.overdueDays-a.overdueDays || a.checkedAt.localeCompare(b.checkedAt) || a.id.localeCompare(b.id));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const site=await readJSON('content/site.json');
  const date=process.argv[2] || new Intl.DateTimeFormat('en-CA',{timeZone:site.timezone}).format(new Date());
  const queue=reviewQueue(await readJSON('content/resources.json'),date);
  const rotation=['safety','learn','tools','projects','money','safety','all'];
  const focus=rotation[new Date(date+'T00:00:00Z').getUTCDay()];
  const due=queue.filter(r=>r.overdueDays>=0);
  const next=queue.filter(r=>r.overdueDays<0 && (focus==='all'||r.section===focus));
  console.log(`Resource review · ${date}\nFocus: ${focus} · ${due.length} due\nRead 3–5 original sources; overdue entries take priority. This report changes no content.\n`);
  for (const r of [...due,...next].slice(0,5)) console.log(`${r.overdueDays>=0?'DUE':'ROTATION'} | ${r.section} | ${r.id} | last checked ${r.checkedAt} | due ${r.dueAt}\n${r.title}\n${r.url}\n`);
}
