import { prepareImageDelivery } from './image-delivery.mjs';
import { renderHome, briefFigure } from './home-page.mjs';
import { buildSharingImages, sharingMeta } from './sharing.mjs';
import { validateIntegrations, contactForm, contactModal, analyticsControls, privacyPage } from './contact-page.mjs';
import { renderSafetyPage } from './safety-page.mjs';
import { collections, renderResourcesOverview, renderResourceCollection } from './resources-page.mjs';
import { renderSocialPage } from './social-page.mjs';
import { renderSourcesPage } from './sources-page.mjs';
import { renderNewsPage } from './news-page.mjs';
import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { marked } from 'marked';
import sanitize from 'sanitize-html';
import { readJSON, escapeHTML as e, dateLabel, isWebURL } from './lib.mjs';

const site = await readJSON('content/site.json');
validateIntegrations(site);
const resources = await readJSON('content/resources.json');
const home = await readJSON('content/home.json');
const safety = await readJSON('content/safety.json');
const feeds = await readJSON('content/feeds.json');
const social = await readJSON('content/social.json');
const socialPosts = await readJSON('content/social-posts.json');
const news = await readJSON('content/news.json');
const allBriefs = await readJSON('content/briefs.json');
const today = new Intl.DateTimeFormat('en-CA', { timeZone: site.timezone }).format(new Date());
const briefs = allBriefs.filter(b => b.status === 'published' && b.date <= today).sort((a, b) => b.date.localeCompare(a.date));
const latest = briefs[0];
const base = ('/' + (process.env.BASE_PATH ?? '').replace(/^\/+|\/+$/g, '')).replace(/\/$/, '');
const origin = process.env.SITE_URL ?? site.url;
const url = path => `${base}/${path.replace(/^\//, '')}`;
const absolute = path => `${origin.replace(/\/$/, '')}${url(path)}`;
const nav = [['brief', 'Daily Brief'], ['news', 'News'], ['resources', 'Resources'], ['safety', 'Safety & Society']];
const redirects = { 'social/': 'news/social/', 'learn/': 'resources/learn/', 'projects/': 'resources/projects/', 'money/': 'resources/money/' };
const markdown = text => sanitize(marked.parse(text), { allowedTags: [...sanitize.defaults.allowedTags, 'img'], allowedAttributes: { ...sanitize.defaults.allowedAttributes, a: ['href', 'title'], img: ['src', 'alt'] }, allowedSchemes: ['http', 'https', 'mailto'], allowProtocolRelative: false });
const arrow = '<span aria-hidden="true">↗</span>';
const routes = [];
const searchItems = [];
const seenIds = new Set();
for (const r of resources) {
  if (seenIds.has(r.id) || !/^[a-z0-9-]+$/.test(r.id) || !isWebURL(r.url) || !r.description || !r.checkedAt) throw new Error(`Invalid resource: ${r.id}`);
  seenIds.add(r.id);
}
const seenDates = new Set();
for (const b of allBriefs) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date) || b.slug !== b.date || b.file !== `${b.date}.md` || !b.title || !b.excerpt || seenDates.has(b.date)) throw new Error(`Invalid or duplicate brief: ${b.date}`);
  if (!b.sources?.length || b.sources.some(s => !isWebURL(s.url))) throw new Error(`Brief needs valid sources: ${b.date}`);
  seenDates.add(b.date);
}

let sharingImages;
function frame(title, body, active = '', description = site.description, route = '') {
  const brief = briefs.find(b => route === `brief/${b.slug}/`);
  const share = sharingMeta({site,title,description,canonical:absolute(redirects[route] || route),image:absolute(sharingImages.get(brief?.slug ?? 'site')),brief});
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(title === site.name ? title : `${title} · ${site.name}`)}</title><meta name="description" content="${e(description)}">${redirects[route] ? `<meta http-equiv="refresh" content="0;url=${e(url(redirects[route]))}">` : ''}<meta name="theme-color" content="#111214"><link rel="canonical" href="${e(absolute(redirects[route] || route))}">${share}<link rel="icon" href="${url('favicon.svg')}" type="image/svg+xml"><link rel="alternate" type="application/rss+xml" title="Daily Brief" href="${url('feed.xml')}"><link rel="stylesheet" href="${url('assets/site.css')}"><link rel="stylesheet" href="${url('assets/reader.css')}"><link rel="stylesheet" href="${url('assets/resources.css')}">${active === 'safety' ? `<link rel="stylesheet" href="${url('assets/safety.css')}">` : ''}<link rel="stylesheet" href="${url('assets/contact.css')}">${route === '' || brief ? `<link rel="stylesheet" href="${url('assets/home.css')}">` : ''}<script src="${url('assets/site.js')}" defer></script><script src="${url('assets/contact.js')}" defer></script>${site.analytics?.enabled ? `<script type="module" src="${url('assets/analytics.js')}"></script>` : ''}${active === 'news' ? `<script src="${url('assets/news-reader.js')}" defer></script>` : ''}</head>
  <body data-base="${e(base)}" ${site.analytics?.enabled ? `data-analytics-id="${e(site.analytics.measurementId)}" data-analytics-host="${e(new URL(site.url).hostname)}"` : ''}><a class="skip" href="#main">Skip to content</a><header class="site-header wrap"><a class="wordmark" href="${url('')}" aria-label="ChatGPT Fan home"><span class="pixel-mark" aria-hidden="true">✦</span>ChatGPT<span class="brand-fan">Fan</span></a><nav aria-label="Main">${nav.map(([path, label]) => `<a href="${url(`${path}/`)}" ${active === path ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav><a class="search-link" href="${url('search/')}" aria-label="Search the site"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg></a></header>
  <main id="main" class="wrap">${body}</main><footer class="site-footer wrap"><div><a class="footer-brand" href="${url('')}">ChatGPT Fan</a><p>Independent. Not affiliated with OpenAI.</p></div><div class="footer-links"><a href="${url('about/')}">About</a><a href="${url('contact/')}" data-open-contact>Contact</a><a href="${url('privacy/')}">Privacy</a>${site.analytics?.enabled ? '<button class="footer-setting" type="button" data-open-analytics hidden>Analytics settings</button>' : ''}<a href="${url('sources/')}">Sources</a><a href="${url('position/')}">Our position</a><a href="${url('feed.xml')}">RSS</a>${site.newsletterUrl && isWebURL(site.newsletterUrl) ? `<a href="${e(site.newsletterUrl)}">Newsletter</a>` : ''}</div></footer>
  <dialog id="safety-notice" aria-labelledby="safety-title" data-version="${e(site.safetyNoticeVersion)}" data-auto-open="${site.safetyNoticeAutoOpen}"><form method="dialog"><span class="eyebrow">A note from us</span><h2 id="safety-title">Our position on AI safety</h2><p>We love using ChatGPT. We also believe powerful AI needs meaningful oversight and public accountability.</p><p>Our safety library includes research and criticism of OpenAI. Being a fan doesn’t mean looking away.</p><div class="dialog-actions"><a class="text-link" href="${url('safety/')}">Explore the safety library →</a><button class="button" value="dismiss" autofocus>Continue</button></div></form></dialog>${contactModal(site,url)}${analyticsControls(site,url)}</body></html>`;
}
async function page(route, title, body, active = '', description) {
  const file = route === '404.html' ? 'dist/404.html' : `dist/${route}index.html`;
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, frame(title, body, active, description, route));
  if (route !== '404.html') routes.push(route);
}
const pageHead = (title, description) => `<div class="page-head"><h1>${e(title)}</h1><p>${e(description)}</p></div>`;
const archive = items => items.length ? `<div class="archive">${items.map(b => `<a href="${url(`brief/${b.slug}/`)}"><time datetime="${b.date}">${dateLabel(b.date)}</time><span>${e(b.title)}</span><span aria-hidden="true">↗</span></a>`).join('')}</div>` : '<p class="meta">The first edition is here. Previous days will collect here as we publish.</p>';

// Only generated output is replaced; source content and supplied assets stay untouched.
const output = resolve('dist');
if (dirname(output) !== process.cwd()) throw new Error('Unsafe output path');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const usedArt=new Set([...briefs.map(b=>b.image?.src),...resources.map(r=>r.image)].filter(Boolean));
await cp('public', output, { recursive: true, filter:src=>!(/\.(png|svg)$/i.test(src)&&src.replaceAll('\\','/').includes('/assets/briefs/')&&!usedArt.has(src.replaceAll('\\','/').split('/assets/')[1])) });
await prepareImageDelivery([...usedArt]);
sharingImages = await buildSharingImages(briefs);

await page('', site.name, renderHome({config:home, resources, news, social, socialPosts, briefs, today, url}));

console.log('Homepage built.');
await page('brief/', 'Daily Brief', `${pageHead('Daily Brief', 'One edition a day. Sources, context, and a little perspective.')}${archive(briefs)}<p class="rss-note"><a href="${url('feed.xml')}">Follow the brief by RSS →</a></p>`, 'brief');
for (const b of briefs) {
  const raw = await readFile(`content/briefs/${b.file}`, 'utf8');
  const minutes = Math.max(1, Math.ceil(raw.split(/\s+/).length / 220));
  await page(`brief/${b.slug}/`, b.title, `<article class="article"><a class="small-link" href="${url('brief/')}">← All editions</a><header><div class="eyebrow">Daily Brief · <time datetime="${b.date}">${dateLabel(b.date)}</time> · ${minutes} min read</div><h1>${e(b.title)}</h1><p class="standfirst">${e(b.excerpt)}</p><p class="meta">ChatGPT Fan · Prepared with AI assistance</p></header>${briefFigure(b,url)}<div class="prose">${markdown(raw)}</div><section class="sources"><h2>Sources</h2>${b.sources.map(s=>`<a href="${e(s.url)}">${e(s.title)} ${arrow}<span class="meta">${e(s.publisher)} · ${e(s.kind)} · ${dateLabel(s.publishedAt)}</span></a>`).join('')}</section><a class="text-link" href="${url('brief/')}">Browse the archive →</a></article>`, 'brief', b.excerpt);
  searchItems.push({ title: b.title, text: b.excerpt + ' ' + raw.replace(/[#*\[\]()]/g, ' '), section: 'Daily Brief', url: url(`brief/${b.slug}/`) });
}
await page('news/', 'News', renderNewsPage({ news, feeds, timezone: site.timezone, sourceGuideUrl: url('sources/'), newsUrl: url('news/'), socialUrl: url('news/social/') }), 'news');
await page('news/social/', 'Social · News', renderSocialPage(social, {newsUrl:url('news/'), socialUrl:url('news/social/'), posts:socialPosts}), 'news');
await page('social/', 'Social · News', `<div class="page-head"><h1>Social is part of News</h1><p><a href="${url('news/social/')}">Continue to Social →</a></p></div>`, 'news');
for (const post of socialPosts.items) searchItems.push({title:post.title,text:post.summary,section:'Social',url:post.url});
for (const account of social) searchItems.push({title:account.name,text:account.role+' OpenAI social posts X',section:'Social',url:url('news/social/#'+account.id)});
await page('sources/', 'Sources', renderSourcesPage({ feeds, newsUrl: url('news/'), libraryUrls: Object.fromEntries(['learn','safety','projects','money'].map(id => [id, url(id === 'safety' ? 'safety/' : 'resources/'+id+'/')])) }));
for (const feed of feeds) searchItems.push({ title:feed.name, text:feed.description+' '+feed.notes+' '+feed.type, section:'Sources', url:url('sources/#'+feed.id) });
await page('safety/', 'Safety & Society', renderSafetyPage({config:safety,resources,news,url}), 'safety', safety.purpose);
for (const r of resources.filter(r=>r.section==='safety')) searchItems.push({title:r.title,text:[r.description,r.provider,r.kind,r.safety.audience,r.safety.why].join(' '),section:'Safety & Society',url:url('safety/#'+r.id)});
await page('resources/', 'Resources', renderResourcesOverview(resources, url), 'resources');
for (const c of collections) {
  await page('resources/'+c.id+'/', c.title, renderResourceCollection(c.id, resources, url), 'resources', c.description);
  if (redirects[c.id+'/']) await page(c.id+'/', c.title+' · Resources', pageHead(c.title+' is in Resources', 'The collection has moved.')+'<p><a class="text-link" href="'+url('resources/'+c.id+'/')+'">Continue to '+c.title+' →</a></p>', 'resources');
  for (const r of resources.filter(r=>r.section===c.id)) searchItems.push({title:r.title,text:[r.description,r.provider,r.kind,r.level,r.bestFor,r.needs].filter(Boolean).join(' '),section:'Resources · '+c.title,url:url('resources/'+c.id+'/#'+r.id)});
}
for (const [slug,title] of [['about','About'],['position','Safety & independence']]) {
  await page(`${slug}/`, title, `<article class="article prose">${markdown(await readFile(`content/pages/${slug}.md`,'utf8'))}</article>`);
}
await page('contact/', 'Contact', '<div class="contact-page">'+pageHead('Contact','Questions, corrections, and good suggestions are welcome.')+contactForm(site,url,'page-contact')+'</div>');
await page('privacy/', 'Privacy', privacyPage(site,url));
await page('search/','Search',`${pageHead('Search','Find a brief, resource, or project.')}<div class="search-page"><form role="search" id="site-search"><label class="sr-only" for="query">Search the site</label><input id="query" name="q" type="search" placeholder="What are you looking for?" autocomplete="off"><button class="button" type="submit">Search</button></form><p id="search-status" class="meta" role="status" aria-live="polite">Type to search the library.</p><div id="search-results"></div><noscript>Search needs JavaScript. You can browse every collection using the navigation above.</noscript></div>`);
await page('404.html','Page not found',`${pageHead('Nothing here. Yet.','This page may have moved, or the address may be mistyped.')}<p><a class="text-link" href="${url('')}">Back to the home page →</a></p>`);
await writeFile('dist/search.json', JSON.stringify(searchItems));
await writeFile('dist/feed.xml', `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>ChatGPT Fan · Daily Brief</title><link>${e(absolute(''))}</link><description>${e(site.description)}</description><language>en</language>${briefs.slice(0,30).map(b=>`<item><title>${e(b.title)}</title><link>${e(absolute(`brief/${b.slug}/`))}</link><guid isPermaLink="true">${e(absolute(`brief/${b.slug}/`))}</guid><pubDate>${new Date(`${b.date}T12:00:00Z`).toUTCString()}</pubDate><description>${e(b.excerpt)}</description></item>`).join('')}</channel></rss>`);
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.filter(r=>r!=='search/' && !redirects[r]).map(r=>`<url><loc>${e(absolute(r))}</loc></url>`).join('')}</urlset>`);
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${absolute('sitemap.xml')}\n`);
await writeFile('dist/.nojekyll','');
console.log(`Built ${routes.length} pages, ${briefs.length} brief, ${resources.length} resources, ${news.items.length} headlines.`);
