import test from 'node:test';
import assert from 'node:assert/strict';
import {ART_CHECKS, imageHash, validateArtReview, validatePublishedArt} from '../scripts/art-review.mjs';

const bytes = Buffer.from('candidate image');
const brief = {date:'2026-10-08', slug:'2026-10-08', image:{src:'briefs/test.png', reviewStatus:'agent-reviewed'}};
const review = () => ({src:brief.image.src, brief:brief.slug, sha256:imageHash(bytes), result:'pass', reviewedAt:'2026-10-08', secondPass:true, notes:'Counted hands and traced limbs; checked all delivered crops.', expectedVisibleHands:0, observedVisibleHands:0, checks:Object.fromEntries(ART_CHECKS.map(k=>[k,true]))});
const policy = r => ({version:1, legacy:[], reviews:r ? [r] : []});

test('New art requires exact-file QA; historical text-only editions stay intact', () => {
  assert.doesNotThrow(()=>validateArtReview({...brief,image:undefined},bytes,policy()));
  assert.throws(()=>validateArtReview(brief,bytes,policy()), /missing review/);
  assert.doesNotThrow(()=>validateArtReview(brief,bytes,policy(review())));
  assert.throws(()=>validateArtReview(brief,Buffer.from('edited image'),policy(review())), /missing review/);
});
test('Ambiguous anatomy, extra hands, missing second pass and previews cannot publish', () => {
  for (const change of [{result:'uncertain'}, {observedVisibleHands:3}, {secondPass:false}, {checks:{...review().checks,limbConnections:false}}]) {
    assert.throws(()=>validateArtReview(brief,bytes,policy({...review(),...change})), /Artwork blocked/);
  }
  assert.throws(()=>validateArtReview({...brief,image:{...brief.image,reviewStatus:'owner-preview'}},bytes,policy(review())), /preview-only/);
});
test('Historical exemption cannot approve edited historical art or a new edition', () => {
  const frozen = {version:1, legacy:[{src:brief.image.src,sha256:imageHash(bytes)}],reviews:[]};
  assert.doesNotThrow(()=>validateArtReview({...brief,date:'2026-10-07'},bytes,frozen));
  assert.throws(()=>validateArtReview({...brief,date:'2026-10-07'},Buffer.from('changed'),frozen), /missing review/);
  assert.throws(()=>validateArtReview(brief,bytes,frozen), /missing review/);
});

test('Sound anatomy cannot override failed meaning or an owner rejection', () => {
  const meaningless = {...review(), checks:{...review().checks, story:false}};
  assert.throws(()=>validateArtReview(brief,bytes,policy(meaningless)), /failed visual checklist/);
  const rejected = {...review(), result:'reject'};
  assert.throws(()=>validateArtReview(brief,bytes,policy(rejected)), /rejected/);
  assert.doesNotThrow(()=>validateArtReview({...brief,image:undefined},bytes,policy(rejected)));
});

test('November editions cannot publish without art or bypass QA by removing metadata', async () => {
  for (const date of ['2026-11-01', '2026-11-02', '2027-01-01']) {
    const current = {date, slug:date};
    assert.throws(()=>validateArtReview(current,null,policy()), /image is required/);
    await assert.rejects(validatePublishedArt([current],policy()), /image is required/);
  }
  await assert.doesNotReject(validatePublishedArt([{date:'2026-10-31',slug:'2026-10-31'}],policy()));
  const current = {...brief,date:'2026-11-01',slug:'2026-11-01'};
  assert.doesNotThrow(()=>validateArtReview(current,bytes,policy({...review(),brief:current.slug})));
  assert.throws(()=>validateArtReview(current,bytes,policy({...review(),brief:current.slug,checks:{...review().checks,story:false}})), /failed visual checklist/);
});
