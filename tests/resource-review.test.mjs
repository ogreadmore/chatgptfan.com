import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewQueue } from '../scripts/resource-review.mjs';
import { readJSON } from '../scripts/lib.mjs';

test('review queue prioritizes due dates, including shorter tool review cycles, without mutating content',()=>{
  const items=[{id:'course',checkedAt:'2026-09-01',reviewEveryDays:30},{id:'tool',checkedAt:'2026-09-01',reviewEveryDays:14}];
  const original=JSON.stringify(items);
  const queue=reviewQueue(items,'2026-09-15');
  assert.equal(queue[0].id,'tool');
  assert.equal(queue[0].overdueDays,0);
  assert.equal(queue[1].dueAt,'2026-10-01');
  assert.equal(JSON.stringify(items),original);
  assert.throws(()=>reviewQueue(items,'2026-02-30'));
  assert.throws(()=>reviewQueue([{id:'bad',checkedAt:'2026-09-20'}],'2026-09-18'));
});

test('resource metadata supports review, unique destinations, and safe internal anchors',async()=>{
  const items=await readJSON('content/resources.json');
  const urls=new Set();
  for(const r of items){
    assert.match(r.id,/^[a-z0-9-]+$/);
    assert.ok(['learn','tools','projects','money','safety'].includes(r.section));
    assert.ok(!urls.has(r.url),'Duplicate resource URL: '+r.url); urls.add(r.url);
    assert.ok(Number.isInteger(r.reviewEveryDays) && r.reviewEveryDays>0);
    assert.ok(!r.featured || r.status!=='archived');
  }
});
