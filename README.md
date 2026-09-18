# ChatGPT Fan

An independent static publication: one daily brief, curated news feeds, Resources (Learn, Tools, Projects, Money), and Safety & Society. Built for GitHub Pages with Markdown and JSON as the local CMS.

## Run locally

Requires Node.js 24 or newer.

```sh
npm ci
npm run build
npm run dev
```

Open http://127.0.0.1:4173. After content or code changes, run `npm run build` and reload the browser. `npm run dev` serves the last build; it does not watch files.

## Edit content

| File | Purpose |
| --- | --- |
| `content/briefs/*.md` | One article per day |
| `content/briefs.json` | Brief dates, headlines, excerpts, sources, publish/draft status |
| `content/resources.json` | Learning, tools, safety, project, and business resources; review intervals and dates |
| `content/safety.json` | Safety guide audience, topic membership, starting points, and selection criteria |
| `content/feeds.json` | Feed URLs, labels, topics, optional keyword filter |
| `content/news.json` | Committed feed snapshot; refresh with `npm run feeds` |
| `content/home.json` | Homepage selections; see [curation guide](docs/homepage-curation.md) |
| `content/site.json` | Site settings, optional newsletter link, notice behavior |
| `content/pages/*.md` | About, disclosure, and editorial position |
| `content/publishing.json` | Daily agent's approved repository and publish switch |

The build performs no network calls. It generates a branded sharing image and article metadata for every published Daily Brief. Failed feed refreshes retain the last successful stories and expose the source status on the News page. Search runs locally in the visitor's browser; all other content works without JavaScript. The safety notice appears once per version and is keyboard-dismissible. Fonts are self-hosted. No visitor accounts are included. Formspree contact is connected and tested. GA4 is configured for production-only, visitor-opt-in measurement; see [setup instructions](docs/contact-and-analytics.md).

`npm run verify` builds and tests the output, internal links, RSS, and feed parsing safeguards. Article Markdown is sanitized before rendering. News feeds contribute only attributed titles, dates, and links, not full copied articles.

## GitHub Pages

1. The project remote is `https://github.com/ogreadmore/chatgptfan.com.git`, with `main` as the publishing branch. Private setup notes, run logs, and superseded artwork are kept out of the public repository.
2. Push the source and lockfile to `main`. In repository **Settings → Pages**, choose **GitHub Actions** as the build source. `.github/workflows/pages.yml` installs locked dependencies, verifies, uploads `dist/`, and deploys it.
3. First verify the site's GitHub Pages URL. The workflow supplies the path prefix, so a project site under `/repository-name/` works as well as a custom domain.
4. Configure `chatgptfan.com` as the custom domain in Pages and verify domain ownership. Only then change DNS from the current host and enable HTTPS. This project deliberately contains no DNS-changing script or active CNAME takeover. See [GitHub's custom-domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).
5. Enable daily publication in `content/publishing.json` with the exact repository URL and branch once the repository is connected. Until then, agents can prepare local editions without pushing.

GitHub Pages has [commercial-use and size limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits). Reassess hosting before the site becomes primarily a commercial transaction service. Its static output can be moved to another host without changing the content format.

## Daily updates

The News reader opens with a compact board of source panels. Readers can switch to a chronological Latest view, browse categories or individual sources, search, filter unread stories, expand panels, and keep a saved list. Mobile includes category buttons and a source selector. The feed snapshot includes broad press discovery through Google News and official service notices; aggregation links are labeled. Opening a headline launches its publisher in another tab and marks it read. The small dot beside a headline toggles its read status. Bookmarks retain a local copy of the headline, source, date, and link so saved items survive rotation out of an RSS snapshot; full article text is not copied. These preferences stay in the visitor's browser. Filters can be shared through the page URL. Without JavaScript, the headlines remain ordinary working links.

The daily agent follows [docs/daily-update.md](docs/daily-update.md): refresh sources, research, write one edition, maintain the library, verify, and publish only to the configured repository. A local scheduled agent needs an available local execution environment; the GitHub build only deploys committed content and does not itself write articles. A missed local run leaves the previous published site intact. No paid API integration is required by the site.

The supplied first edition is a sourced article for September 14, 2026. No fabricated historical archive is included. The resource library includes guided starting points and four collections at `/resources/`. Legacy Learn, Projects, and Money URLs redirect to their new collections. Run `npm run resources:review` for a read-only, due-first review queue. The daily agenda includes 3–5 source reviews and a monthly coverage audit; see [docs/resource-maintenance.md](docs/resource-maintenance.md).

Substack is not connected. `newsletterUrl` can reveal a link once there is a real publication URL. The site exposes its own `/feed.xml`; importing or sending to Substack is a separate step.

## Artwork

`public/assets/village.png` and `sketch.png` are original AI-generated editorial illustrations, made with built-in imagegen, not screenshots of the linked projects. Prompts and provenance: [docs/artwork.md](docs/artwork.md). Font licenses are included under `public/assets/fonts/`.
