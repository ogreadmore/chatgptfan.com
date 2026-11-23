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

import {renderResourceCollection} from '../scripts/resources-page.mjs';

test('Project source publication dates remain distinct from later source checks',()=>{
  const item={id:'sample-project',section:'projects',title:'Sample build',url:'https://example.com/build',provider:'Example',kind:'Guide',description:'An example.',publishedAt:'2026-11-03',checkedAt:'2026-11-23'};
  const render=r=>renderResourceCollection('projects',[r],p=>'/'+p);
  const original=render(item);
  const reviewedAgain=render({...item,checkedAt:'2026-11-24'});
  for(const html of [original,reviewedAgain]) assert.match(html,/Source published <time datetime="2026-11-03">Nov 3, 2026<\/time>/);
  assert.match(original,/Checked <time datetime="2026-11-23">Nov 23, 2026<\/time>/);
  assert.match(reviewedAgain,/Checked <time datetime="2026-11-24">Nov 24, 2026<\/time>/);
  assert.ok(!render({...item,publishedAt:undefined}).includes('Source published'));
});
