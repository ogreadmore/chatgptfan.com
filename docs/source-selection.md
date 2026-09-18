# Source selection

Reviewed September 18, 2026. The public source guide at `/sources/` is generated from the descriptions, labels, and context in `content/feeds.json`.

## Selection criteria

Prioritize original reporting, empirical work, practical experiments, clear authorship, and relevance to readers. Distinguish the role of each source: an announcement establishes what a vendor says; independent reporting tests claims; research supplies methods and limitations; advocacy supplies arguments. Popularity alone is not a quality signal. No collection is comprehensive.

## Feed mix

- Reuters and AP: wire reporting, including international developments and policy. Google News is the discovery transport; its source domain must match Reuters or AP. Read the underlying report for the brief.
- OpenAI: firsthand product, research, and policy announcements, labeled as company material.
- OpenAI on YouTube: recent official videos, in the Videos category and labeled as company material. The native YouTube Atom feed works with the same scheduled refresh and last-good snapshot; no API key or embedded player is needed. More channels can be added using their verified channel ID at `https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID`. The feed is a recent-upload window, not a full archive.
- MIT Technology Review: reporting and analysis connecting research to practical and social consequences.
- Simon Willison: reproducible experiments, implementation detail, and security analysis. The full Atom feed is filtered to AI/LLM categories.
- 404 Media: investigations into privacy, labor, and misuse. Registration or subscriptions may apply.
- METR: empirical capabilities and productivity evaluations. Translated copies are excluded. Its large full-text feed needs a bounded 12 MB download allowance; only headline metadata is retained.
- The Guardian: social impact, policy, and reporting beyond Silicon Valley; also carries opinion.
- The Verge: consumer products and platform decisions.
- TechCrunch: products, startups, and business developments. Funding is not evidence of profitability.
- Ars Technica: technical reporting and scrutiny.
- One Useful Thing: Ethan Mollick's research-informed experiments on work and education.
- AI Now Institute: policy research and advocacy, explicitly labeled.
- Alignment Forum: technical discussion with variable review status, explicitly labeled.
- OpenAI Status: operational notices kept in a separate category.

The old unrestricted Google News query was replaced by the wire query. The Verge's narrow OpenAI keyword filter was removed to include consequential industry and policy coverage. Tagged sponsored content is excluded across feeds. Sources have individual headline allowances; there is no shared cap that silently eliminates lower-frequency research. Deduplication still removes repeated URLs and titles. Failure retains a last-good snapshot and is disclosed in the reader.

## Resource libraries

New links: Hugging Face Learn and Wharton Generative AI Labs (Learn); METR, Apollo Research, the UK AI Security Institute, MIT AI Risk Repository, and Epoch AI (Safety & Society); Hugging Face Spaces (Projects); Stanford AI Index (Money). These were checked at their original sites. Sources without a suitable feed remain library entries instead of being scraped into improvised feeds.

Prefer substantive worked examples and economic evidence over earnings claims. Do not add a broad community or paper firehose simply to increase volume. Periodically inspect sample headlines for relevance, tagged promotions, duplicate translations, and attribution. Review source suitability when quality changes; successful XML fetching alone does not establish quality.

## Editorial coverage

Safety & Society is a reading guide for AI users who want to understand consequences, with deeper paths for teams, technical readers, and people following policy. Its public selection method and four topics are defined in `content/safety.json`: Everyday use, Harms & evidence, Power & policy, and Frontier risks. Resource annotations explain the audience, why we included the source, what to read first, and important limits. Membership is based on reader usefulness, inspectable evidence or a clearly stated proposal, transparent source roles, and continued relevance—not popularity or agreement with the site. On September 18, EFF's AI privacy guide and NCSC's nontechnical AI/cybersecurity guide were read and added to fill the practical-use gap. The NCSC PDF uses some older product examples, which is disclosed. The FTC consumer pages could not be read reliably and were not added.

The Safety page's separate feed preview automatically selects up to six recent headlines with at most two per publisher, omitting obvious hiring/fundraising titles. It is labeled as unreviewed discovery and links to the full reader and source guide. No automatic feed item should be described as an editorial recommendation or verified claim. The site's position and source inclusion remain separate; criticism of OpenAI is welcome.

Feeds support discovery. They do not replace the broad independent search and lead-selection process in `docs/daily-update.md`. Check major policy and safety stories beyond the configured sources before choosing each day's lead. Keep critical voices visible and identify affiliations and advocacy without treating labels as verdicts on accuracy.

## Social and image previews

Social lives under News at /news/social/; /social/ redirects there. Profiles are in content/social.json and selected post summaries are in content/social-posts.json. X's embedded timelines failed in the local browser and have been removed. The page renders its own HTML from sourced, dated summaries, with original X links and the public archive used to check each item. This is an editorial selection, not a complete or live timeline. Initial entries were checked against TEXXR's public handle archives; direct X access was unavailable. coveredAt is the date of linked coverage, not a claimed original posting timestamp. Do not invent a timestamp or imply original-post access when only an archive was available. Keep summaries attributed, and use independent evidence before treating social claims as facts. Check roles and handles during library maintenance.

The reader retains remote thumbnail URLs supplied in RSS/Atom media metadata or feed HTML; it does not copy article bodies or download publisher images. Images load lazily with no referrer; invalid URLs are rejected and failed images disappear. Feeds without image metadata remain text-only. Saved stories retain their available image and video marker.
