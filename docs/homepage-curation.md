# Homepage curation

The homepage keeps one Daily Brief as the lead and surfaces the breadth of the publication below it. Edit `content/home.json` to change selections without redesigning the page. Cards use existing resource records, so corrections, costs, and descriptions have one source of truth.

The approved order is: Daily Brief beside Latest News, then Social, Videos, Projects, Money, Resources, and Previous Editions. Videos and Social are separate full-width sections. Safety & Society remains a main-navigation destination, not a separate homepage block.

- `resources`: nine useful courses, guides, and tools, balancing beginners, everyday users, and builders.
- `projects`: six distinct things to explore or build: three illustrated features followed by three compact entries. Prefer maintained projects; disclose archived status if intentionally featured.
- `safetyFeature` and `safety`: retained legacy selections; these do not currently render on the homepage. Maintain the dedicated Safety & Society guide and preserve independent criticism.
- `money`: three concrete business resources. Keep vendor case-study claims attributed; no unverified earnings promises.
- `videos`: up to six selected YouTube URLs from the current feed, balancing demonstrations, conversations, and practical guidance. Avoid filling the section with clips from one webinar. Selections older than thirty days or absent from the feed fall back to recent uploads spread across upload days. Refresh these picks during daily curation. Use the real YouTube thumbnails; the feed refresher checks for the larger version and keeps the feed image when unavailable.
- `social`: six original-post URLs already in the reviewed social digest, displayed in a three-column, two-row section on desktop. Use different people and topics when possible. Keep dates visible and never imply these are all today's posts. Prefer retaining useful dated items to collapsing the section to one post; seek new source-checked replacements as they become available. Coverage dates remain labeled as coverage dates; summaries link to the source actually read.
- `excludeNewsUrls`: exact article URLs to omit when they duplicate the lead story or are low-value homepage material. Matching strips tracking parameters. The reader still retains its full snapshot.
- `reviewedAt`: date of homepage selection review, not a claim that every original source was checked again.

News draws up to eight headlines from the last seven days, prefers different actual publishers (including separate publishers inside Google News), then allows a second per publisher if needed. Future dates, unsafe links, duplicate URLs/titles, exclusions, and exact source links in the lead brief are omitted. Semantic overlap still requires editorial judgment. Videos show up to six recent videos within thirty days, preferring channel diversity when available. Dates remain visible. No invented popularity scores or random rotations.

During each daily run, check the lead, selected posts, headline relevance, broken thumbnails, repeated topics, and featured resource usefulness. Rotate one or two selections only when warranted. If removing a resource or social post, update its homepage reference in the same edit; the build rejects dangling references. Hide stale social selections by removing them from the array if there are no useful replacements. Keep the library's original source-review dates unchanged unless sources were actually reviewed.

## Brief images

Art is optional. Follow `docs/editorial-art-direction.md` for the modern editorial cartoon series requested by the owner. The September 18 magnifying-glass cartoon is owner-approved and is the style reference. Keep the style consistent while adapting expressions to the news: upbeat or curious by default, shocked, confused, or concerned when appropriate. Earlier glass-block, distressed-interface, and access-path diagram treatments were rejected; do not reuse them.

For new artwork, use a concrete visual idea tied to the actual story, with a composition that works as an image in its own right. Do not sacrifice most of the illustration to empty space for sharing-card text. Generic cubes, portals, networks, and decorative AI symbolism are not an acceptable substitute for a story. The sharing layout can adapt to the artwork.

The owner has approved the cartoon series and purple background. Future story-specific images in that established style can be generated and visually checked during the daily run; record agent review separately from owner approval. Save the prompt and provenance. Ask for feedback on a new style or an ambiguous concept; use the typography-only fallback if a suitable image cannot be produced. Avoid fabricated documentary scenes, invented quotations, or depictions of events as if photographed. Do not alter or reuse publisher photography without appropriate rights.

When the owner requests a replacement, put the candidate into the local site so they can review it in context. This does not imply approval for remote publication. Mark it `reviewStatus: "owner-preview"` and record that distinction in provenance. Use `shareLayout: "split"` for full-frame illustrations that need their own space beside the social-card headline.

After the applicable visual review, add an `image` object to brief metadata and record the review in its provenance document. Use `owner-approved` only for an image the owner actually approved, and `agent-reviewed` for subsequent images checked within the approved series:

```json
{
  "src": "briefs/YYYY-MM-DD-topic.png",
  "alt": "A concise description of the illustration.",
  "credit": "AI-generated editorial illustration",
  "width": 1672,
  "height": 941
}
```

Use the file's actual dimensions. The build checks them. This single asset appears on the homepage and article; the build generates a 1200×630 social version with the headline and date. Old briefs without images retain typography-only sharing cards. If image generation is unavailable, publish the sourced edition with that fallback, record the limitation, and never attach an unrelated old illustration merely to fill the space. Preview the homepage, article, and sharing card after adding or changing art. The content build remains offline; generation is an editorial step, not a GitHub Actions dependency.
