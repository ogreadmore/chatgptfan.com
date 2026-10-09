# Editorial cartoons

The owner approved the modern editorial cartoon direction and the September 18 illustration on September 18, 2026. The approved style reference is `public/assets/briefs/2026-09-18-altman-purple.png`: Sam Altman looking for a bug with a magnifying glass. This artwork approval does not enable remote publishing.

## Keep fixed

- Contemporary editorial cartoon: expressive figures, decisive dark outlines, simple shapes, flat colors, minimal shading.
- Muted purple backdrop, charcoal outlines, warm skin tones, lavender accents, and a small apricot accent. Preserve subject/background contrast; the pale desk can ground the scene.
- One clear subject, one action, one meaningful prop; a minimal supporting setting. Fill the frame, keeping head, hands, and important props inside safe margins.
- Wide 16:9 composition that remains readable at thumbnail size. No text within the artwork. The sharing card supplies the headline separately.
- Curious, lively, approachable tone. No shiny 3D, generic AI cubes, gradients, fake interfaces, distressed paper, decorative networks, or stock corporate figures.

## Change with the story

Match the expression to the story: curious or upbeat by default; shocked, confused, worried, or serious when the news warrants it. On an especially bad day, Sam can look shocked or confused. Keep the approachable drawing style without forcing a cheerful reaction to harm or failure.

Choose the subject and action from the actual lead. Sam is not a mascot for every topic: use the relevant person or an ordinary user where appropriate. Summarize the visual idea in one sentence before generating. A conceptual cartoon must not imply that someone performed an action described in reporting; label it as conceptual. A positive drawing does not soften criticism or change the article's evidence.

Inspect the approved September 18 reference and supply it as a style reference in future image-generation requests. Preserve its palette, line treatment, proportions, and level of detail; change the subject and story action. Keep the exact prompt and provenance with each image.

## Simpler compositions

Default to a single chest-up figure, with both hands outside the frame and a separate story prop. Expression carries the story. Avoid hands near faces, overlapping forearms, pointing while holding something, intertwined fingers, multiple people, or reflections that can look like extra limbs. If a hand is necessary, use one plainly visible hand and one simple action; the prop stands on its own. Specify the expected number of visible hands before generating. Do not rescue a defective scene by hiding a stray hand with a crop.

Prompt constraint: “One figure, simple chest-up composition. No visible hands or forearms. Story prop sits separately. Clear shoulders and natural anatomy. Complete head with generous safe margins. Flat purple editorial style matching the reference.” Adapt only when a visible hand is essential to the story.

## Mandatory visual gate

An image is optional; a weak image is never preferable to the clean typography fallback. “Probably fine,” an obscured attachment, ambiguous anatomy, or a model's own reassurance is a failure. Do not infer quality from the prompt, dimensions, or a passing build.

Inspect the actual final file at full resolution, then make a separate second pass after putting aside the generation prompt. On that pass:
- Count every visible hand and limb. Trace every arm from shoulder through elbow and wrist; reject extra limbs, floating hands or attachments that cannot be explained.
- Inspect each visible hand for fingers, joints, orientation and a plausible grip. Simplified cartoon fingers still need a coherent hand.
- Check the pose, prop contact, face/eyes, complete head, safe margins, and story relevance. Reject cropped anatomy defects, malformed props, or ambiguous silhouettes.
- Inspect the delivered homepage on desktop and about 390px mobile, the article, and the actual sharing card. A defect at any size is a failure.

Allow at most one focused revision, then repeat the entire review from the final pixels. If any check fails or remains uncertain, remove the brief's `image` object. That publishes text and a typography-only sharing card, excluding the rejected art from deployment. Log the rejection; do not advance an image to approved to satisfy a daily quota. Ask for owner feedback on a new style or ambiguous visual meaning. Do not claim owner approval from agent inspection.

## Build enforcement

Normal build, `npm run verify`, and GitHub Pages require a completed exact-file record in `content/art-reviews.json` for every new or changed brief illustration. `reviewStatus` alone is insufficient. SHA-256 binds the record to the final PNG: even a small edit requires a new review. A frozen legacy hash snapshot preserves pre-October 8 historical illustrations without claiming a new anatomy review; never extend that exemption or use it for new art.

For local candidate inspection only, run `node scripts/build.mjs --art-preview`, then serve the local site. This bypasses the gate solely to inspect candidates, not to approve them. Its output must never be published. The normal verification and Pages workflow rebuild without this flag and reject unreviewed art. Keep candidates `owner-preview` until all checks pass. Do not change publication settings to get around the gate.

After actual inspection, record the source path, final PNG SHA-256, brief slug, review date, result, explicit review notes, expected/observed visible hand counts, second pass, and all ten checks. `result: "pass"` and `reviewStatus: "agent-reviewed"` (or actual `owner-approved`) are required. Failed or uncertain entries must not accompany published art. Example new review:

```json
{
  "src": "briefs/YYYY-MM-DD-topic.png",
  "brief": "YYYY-MM-DD",
  "sha256": "SHA256_OF_FINAL_PNG",
  "reviewedAt": "YYYY-MM-DD",
  "result": "pass",
  "secondPass": true,
  "expectedVisibleHands": 0,
  "observedVisibleHands": 0,
  "notes": "Describe what was actually inspected and why it passed.",
  "checks": {
    "limbCount": true, "limbConnections": true, "hands": true,
    "poseAndProps": true, "face": true, "framing": true, "story": true,
    "desktop": true, "mobile": true, "sharingCard": true
  }
}
```

This is an enforced record of editorial review, not automatic anatomy recognition. The review must actually happen. Keep exact generation prompts and provenance in the private image log.

Rejected September 18 directions: glass blocks and paths; distressed fake UI; the access-path diagram. Do not reinstate them.

The approved reference's complete generation prompt and provenance are in [brief-image-2026-09-18-cartoon.md](brief-image-2026-09-18-cartoon.md).

## Purple background variant

On September 18 the owner requested a purple background. The local preview now uses `public/assets/briefs/2026-09-18-altman-purple.png`, a background-only edit preserving the approved character and composition, with a muted medium purple backdrop and pale desk. The original approved image is retained. The owner approved the purple variant on September 18 (“I like that”). Use it as the preferred reference for future editions.
