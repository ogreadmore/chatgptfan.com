import { XMLParser } from 'fast-xml-parser';
import sanitize from 'sanitize-html';
import { readJSON, writeAtomic, canonicalURL, isWebURL, safeImageURL } from './lib.mjs';
import { fileURLToPath } from 'node:url';

const array = value => value == null ? [] : Array.isArray(value) ? value : [value];
const decode = value => value.replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);/gi, entity => {
  const named = { '&amp;':'&', '&lt;':'<', '&gt;':'>', '&quot;':'"', '&apos;':"'" };
  if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
  const code = entity.toLowerCase().startsWith('&#x') ? parseInt(entity.slice(3,-1),16) : parseInt(entity.slice(2,-1),10);
  return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
});
const plain = value => decode(sanitize(typeof value === 'object' ? value?.['#text'] ?? '' : String(value ?? ''), { allowedTags: [], allowedAttributes: {} })).replace(/\s+/g, ' ').trim();
function previewImage(entry) {
  const groups = [entry, ...array(entry['media:group'])];
  const candidates = groups.flatMap(group => [
    ...array(group['media:thumbnail']),
    ...array(group['media:content']).filter(media => media['@_medium'] === 'image' || /^image\//.test(media['@_type'] ?? '') || /\.(?:jpe?g|png|webp|gif)(?:\?|$)/i.test(media['@_url'] ?? '')),
    ...array(group.enclosure).filter(media => /^image\//.test(media['@_type'] ?? ''))
  ]).filter(media => !(Number(media['@_width']) > 0 && Number(media['@_width']) < 80));
  for (const candidate of candidates) {
    const url = safeImageURL(decode(candidate['@_url'] ?? ''));
    if (url) return url;
  }
  let image;
  for (const value of [entry['content:encoded'], entry.content, entry.description, entry.summary]) {
    const html = typeof value === 'object' ? value?.['#text'] : value;
    if (typeof html !== 'string') continue;
    // Parse feed-supplied markup without retaining or rendering any of its HTML.
    sanitize(decode(html), {allowedTags: [], allowedAttributes: {}, transformTags: {img: (tagName, attrs) => {
      if (!image && !(Number(attrs.width) > 0 && Number(attrs.width) < 80) && !(Number(attrs.height) > 0 && Number(attrs.height) < 50)) image = safeImageURL(attrs.src);
      return {tagName, attribs:{}};
    }}});
    if (image) return image;
  }
  return null;
}
export function parseFeed(xml, source, now = Date.now()) {
  // Never resolve external entities or accept document type declarations from feeds.
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('XML declarations are not supported');
  const parsed = new XMLParser({ ignoreAttributes: false, processEntities: false }).parse(xml);
  const root = parsed.rss?.channel ?? parsed.feed ?? parsed['rdf:RDF'];
  if (!root) throw new Error('Not an RSS or Atom feed');
  const entries = array(root.item ?? root.entry);
  const filter = source.include ? new RegExp(source.include, 'i') : null;
  const maxItems = Math.max(1, Math.min(40, source.maxItems ?? 20));
  return entries.flatMap(entry => {
    const link = typeof entry.link === 'string' ? entry.link : array(entry.link).find(link => !link['@_rel'] || link['@_rel'] === 'alternate')?.['@_href'];
    const title = plain(entry.title);
    const date = new Date(entry.pubDate ?? entry.published ?? entry.updated ?? entry['dc:date']);
    if (!title || !isWebURL(link) || !Number.isFinite(date.getTime()) || date.getTime() > now + 300000) return [];
    const tags = array(entry.category).map(tag => plain(typeof tag === 'object' ? tag['@_term'] ?? tag['#text'] : tag).toLowerCase());
    if (tags.some(tag => /^(sponsored|sponsored content|advertisement|advertorial|partner content)$/.test(tag))) return [];
    if (source.includeTags && !source.includeTags.some(tag => tags.includes(tag.toLowerCase()))) return [];
    if (source.excludePath && new RegExp(source.excludePath, 'i').test(new URL(link).pathname)) return [];
    if (source.publisherDomains) {
      try {
        const host = new URL(entry.source?.['@_url']).hostname.replace(/^www\./, '');
        if (!source.publisherDomains.includes(host)) return [];
      } catch { return []; }
    }
    if (filter && !filter.test(`${title} ${plain(entry.description ?? entry.summary)}`)) return [];
    const image = previewImage(entry);
    return [{ title, url: canonicalURL(link), publishedAt: date.toISOString(), sourceId: source.id, source: source.publisherDomains ? plain(entry.source) : source.name, type: source.type, topic: source.topic, ...(image ? {image} : {}), ...(entry['yt:videoId'] ? {format:'video'} : {}) }];
  }).sort((a,b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, maxItems);
}
export function deduplicate(items) {
  const urls = new Set();
  const titles = new Set();
  return items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).filter(item => {
    const title = item.title.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    if (urls.has(item.url) || titles.has(title)) return false;
    urls.add(item.url); titles.add(title); return true;
  });
}
export async function upgradeVideoThumbnails(items, fetcher = fetch) {
  return Promise.all(items.map(async item => {
    if (item.format !== 'video') return item;
    const match = safeImageURL(item.image)?.match(/^https:\/\/i[0-9]?\.ytimg\.com\/vi\/([\w-]{11})\/(?:hqdefault|maxresdefault)\.jpg$/);
    if (!match) return item;
    const image = `https://i.ytimg.com/vi/${match[1]}/maxresdefault.jpg`;
    try {
      const response = await fetcher(image, {method:'HEAD', signal:AbortSignal.timeout(8000)});
      if (response.ok && /^image\//.test(response.headers.get('content-type') || '')) return {...item, image};
    } catch { /* Retain the feed's real thumbnail when a larger version is unavailable. */ }
    return item;
  }));
}
export async function readFeedBody(response, maxBytes = 3000000) {
  const reader = response.body.getReader();
  const chunks = []; let size = 0;
  try {
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new Error('Feed exceeds size limit'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks).toString('utf8');
}
async function main() {
  const feeds = await readJSON('content/feeds.json');
  const old = await readJSON('content/news.json');
  const now = new Date().toISOString();
  const results = await Promise.all(feeds.map(async source => {
    try {
      const response = await fetch(source.url, { signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'ChatGPTFan/1.0 (+https://chatgptfan.com/about/)', Accept: 'application/rss+xml, application/atom+xml, text/xml' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const raw = await readFeedBody(response, Math.min(12000000, source.maxBytes ?? 3000000));
      const items = await upgradeVideoThumbnails(parseFeed(raw, source));
      if (!items.length) throw new Error('No matching dated entries; keeping last good snapshot');
      return { source: { id: source.id, checkedAt: now, lastSuccessAt: now, status: 'ok', count: items.length }, items };
    } catch (error) {
      console.warn(`${source.name}: ${error.message}`);
      const previous = old.sources.find(item => item.id === source.id);
      return { source: { id: source.id, checkedAt: now, lastSuccessAt: previous?.lastSuccessAt ?? null, status: 'unavailable', error: error.message }, items: old.items.filter(item => item.sourceId === source.id) };
    }
  }));
  const successful = results.filter(result => result.source.status === 'ok').length;
  await writeAtomic('content/news.json', JSON.stringify({ updatedAt: now, sources: results.map(r => r.source), items: deduplicate(results.flatMap(r => r.items)) }, null, 2) + '\n');
  console.log(`Refreshed ${successful}/${feeds.length} feeds.`);
  if (!successful) process.exitCode = 1;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
