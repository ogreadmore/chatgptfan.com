import test from 'node:test';
import assert from 'node:assert/strict';
import {ART_CHECKS, imageHash, validateArtReview} from '../scripts/art-review.mjs';

const bytes = Buffer.from('candidate image');
const brief = {date:'2026-10-08', slug:'2026-10-08', image:{src:'briefs/test.png', reviewStatus:'agent-reviewed'}};
const review = () => ({src:brief.image.src, brief:brief.slug, sha256:imageHash(bytes), result:'pass', reviewedAt:'2026-10-08', secondPass:true, notes:'Counted hands and traced limbs; checked all delivered crops.', expectedVisibleHands:0, observedVisibleHands:0, checks:Object.fromEntries(ART_CHECKS.map(k=>[k,true]))});
const policy = r => ({version:1, legacy:[], reviews:r ? [r] : []});

test('New art requires exact-file QA; text-only publication stays available', () => {
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
