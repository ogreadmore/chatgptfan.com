import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';

export const ART_CHECKS = ['limbCount', 'limbConnections', 'hands', 'poseAndProps', 'face', 'framing', 'story', 'desktop', 'mobile', 'sharingCard'];
export const imageHash = bytes => createHash('sha256').update(bytes).digest('hex');
// Owner policy effective November 1; preserve earlier text-only editions.
export const REQUIRED_ART_FROM = '2026-11-01';

// This enforces recorded visual QA, not computer-vision detection of bad anatomy.
export function validateArtReview(brief, bytes, policy) {
  const fail = reason => { throw new Error(`Artwork blocked for ${brief.slug}: ${reason}. Complete and review the artwork before publishing; keep unfinished editions in draft.`); };
  if (!brief.image) {
    if (brief.date >= REQUIRED_ART_FROM) fail('a reviewed story-specific image is required');
    return;
  }
  if (policy?.version !== 1) fail('invalid review policy');
  const sha256 = imageHash(bytes);
  // Frozen migration snapshot: historical art is preserved, not newly approved.
  if (brief.date < '2026-10-08' && policy.legacy?.some(r => r.src === brief.image.src && r.sha256 === sha256)) return;
  const review = policy.reviews?.find(r => r.src === brief.image.src && r.sha256 === sha256 && r.brief === brief.slug);
  if (!review) fail('missing review for these exact image bytes');
  if (review.result !== 'pass' || !['agent-reviewed', 'owner-approved'].includes(brief.image.reviewStatus)) fail('art is rejected, uncertain or preview-only');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(review.reviewedAt ?? '') || !review.notes?.trim() || review.secondPass !== true) fail('missing completed second visual pass');
  if (ART_CHECKS.some(check => review.checks?.[check] !== true)) fail('incomplete or failed visual checklist');
  if (![0, 1, 2].includes(review.expectedVisibleHands) || review.observedVisibleHands !== review.expectedVisibleHands) fail('hand count does not match planned composition');
}

export async function validatePublishedArt(briefs, policy) {
  for (const brief of briefs) {
    if (!brief.image) {
      validateArtReview(brief, null, policy);
      continue;
    }
    if (!/^briefs\/[a-z0-9-]+\.png$/.test(brief.image.src)) throw new Error(`Invalid brief art path: ${brief.slug}`);
    validateArtReview(brief, await readFile('public/assets/' + brief.image.src), policy);
  }
}
