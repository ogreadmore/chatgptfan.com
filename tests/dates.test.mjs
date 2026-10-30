import test from 'node:test';
import assert from 'node:assert/strict';
import {dateLabel,readJSON} from '../scripts/lib.mjs';
import {renderHome} from '../scripts/home-page.mjs';
import {renderSafetyPage} from '../scripts/safety-page.mjs';
test('Editorial dates stay fixed while feed timestamps follow daylight and standard time',()=>{
  assert.equal(dateLabel('2026-10-30T01:23:00Z',{timeZone:'America/New_York'}),'Oct 29, 2026');
  assert.equal(dateLabel('2026-12-01T04:30:00Z',{timeZone:'America/New_York'}),'Nov 30, 2026');
  assert.equal(dateLabel('2026-10-30',{timeZone:'Pacific/Kiritimati'}),'Oct 30, 2026');
  assert.equal(dateLabel('2026-10-30',{timeZone:'Pacific/Honolulu'}),'Oct 30, 2026');
});
test('Homepage and Safety feed labels honor the configured publication timezone',async()=>{
  const resources=await readJSON('content/resources.json'), config=await readJSON('content/home.json');
  const social=await readJSON('content/social.json'),socialPosts=await readJSON('content/social-posts.json');
  const item={title:'Timezone boundary',source:'Test source',sourceId:'test',type:'Reporting',topic:'News',publishedAt:'2026-10-30T01:23:00Z',url:'https://example.com/boundary'};
  const news={updatedAt:'2026-10-30T01:23:00Z',items:[item]};
  const html=renderHome({config,resources,news,social,socialPosts,briefs:[],today:'2026-10-30',url:p=>'/'+p,timezone:'America/New_York'});
  assert.match(html,/<time datetime="2026-10-30T01:23:00Z">Oct 29<\/time>/);
  assert.ok(html.includes('Checked Oct 29, 2026'));
  const safety=renderSafetyPage({config:await readJSON('content/safety.json'),resources,news:{...news,items:[{...item,topic:'Safety & Society'}]},url:p=>'/'+p,timezone:'America/New_York'});
  assert.match(safety,/<time datetime="2026-10-30T01:23:00Z">Oct 29, 2026<\/time>/);
  assert.ok(safety.includes('Snapshot refreshed Oct 29, 2026'));
});
