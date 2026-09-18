import test from 'node:test';
import assert from 'node:assert/strict';
import { readJSON } from '../scripts/lib.mjs';
import { validateSafety, selectSafetyHeadlines, renderSafetyPage } from '../scripts/safety-page.mjs';

test('safety guide gives every entry one topic, a rationale, and working context anchors',async()=>{
  const config=await readJSON('content/safety.json');
  const resources=await readJSON('content/resources.json');
  validateSafety(config,resources);
  const html=renderSafetyPage({config,resources,news:{items:[]},url:p=>'/project/'+p});
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length);
  for(const [,anchor] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(anchor),anchor);
  assert.ok(html.includes('/project/news/?category=Safety%20%26%20Society'));
  assert.throws(()=>validateSafety({...config,groups:config.groups.slice(1)},resources),/Every safety resource/);
  const missing=structuredClone(resources); delete missing.find(r=>r.section==='safety').safety.why;
  assert.throws(()=>validateSafety(config,missing),/Invalid safety resource/);
});

test('safety feed selection excludes organizational noise and limits repetition while keeping newest first',()=>{
  const item=(sourceId,day,title='Research')=>({sourceId,title,url:`https://example.com/${sourceId}/${day}/${title}`,topic:'Safety & Society',publishedAt:`2026-09-${day}T00:00:00Z`});
  const items=[item('a','11'),item('a','14'),item('a','13'),item('b','12'),item('c','18','We are hiring'),{...item('d','18'),topic:'News'}];
  const copy=JSON.stringify(items);
  const result=selectSafetyHeadlines(items);
  assert.deepEqual(result.map(r=>r.publishedAt.slice(8,10)),['14','13','12']);
  assert.equal(JSON.stringify(items),copy);
  assert.equal(selectSafetyHeadlines([...items,items[1]]).length,3);
});
