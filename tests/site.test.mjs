import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { XMLParser } from 'fast-xml-parser';
import { parseFeed, deduplicate, readFeedBody, upgradeVideoThumbnails } from '../scripts/refresh-feeds.mjs';
import { canonicalURL, escapeHTML } from '../scripts/lib.mjs';

const source = { id:'test', name:'Test source', topic:'News', type:'Reporting' };
test('Video thumbnails upgrade only verified YouTube images and retain originals on failures',async()=>{
  const item={format:'video',image:'https://i3.ytimg.com/vi/bbNTY8O0GTY/hqdefault.jpg'};
  const ok=await upgradeVideoThumbnails([item],async(url)=>{assert.equal(url,'https://i.ytimg.com/vi/bbNTY8O0GTY/maxresdefault.jpg');return new Response(null,{headers:{'content-type':'image/jpeg'}});});
  assert.ok(ok[0].image.endsWith('/maxresdefault.jpg'));
  for(const fetcher of [async()=>new Response(null,{status:404}),async()=>new Response('html'),async()=>{throw Error('timeout');}]) assert.deepEqual(await upgradeVideoThumbnails([item],fetcher),[item]);
  const unrelated={format:'video',image:'https://example.com/image.jpg'};
  assert.deepEqual(await upgradeVideoThumbnails([unrelated],async()=>{assert.fail('Must not probe unrelated hosts');}),[unrelated]);
});
test('RSS rejects executable links, future items, invalid dates, and external entities', () => {
  const xml = `<rss><channel><item><title>Valid</title><link>https://example.com/story?utm_source=test</link><pubDate>2026-01-01</pubDate></item><item><title>Bad</title><link>javascript:alert(1)</link><pubDate>2026-01-01</pubDate></item><item><title>Future</title><link>https://example.com/future</link><pubDate>2099-01-01</pubDate></item><item><title>No date</title><link>https://example.com/nodate</link></item></channel></rss>`;
  const items = parseFeed(xml, source, Date.parse('2026-09-14'));
  assert.equal(items.length, 1); assert.equal(items[0].url,'https://example.com/story');
  assert.throws(()=>parseFeed('<!DOCTYPE rss [<!ENTITY secret SYSTEM "file:///etc/passwd">]><rss/>',source));
});
test('Atom alternate links are selected and feed title is plain text', () => {
  const xml = `<feed><entry><title><![CDATA[<img src=x onerror=alert(1)>A useful story]]></title><link rel="self" href="https://example.com/api"/><link rel="alternate" href="https://example.com/article"/><updated>2026-01-02T00:00:00Z</updated></entry></feed>`;
  const [item] = parseFeed(xml,source);
  assert.equal(item.title,'A useful story'); assert.equal(item.url,'https://example.com/article');
});
test('Display titles decode common entities once and output remains escaped', () => {
  const [item] = parseFeed('<rss><channel><item><title>Research &amp; safety</title><link>https://example.com/test</link><pubDate>2026-01-01</pubDate></item></channel></rss>',source);
  assert.equal(item.title,'Research & safety');
  assert.equal(escapeHTML(item.title),'Research &amp; safety');
});
test('Syndicated titles and tracking variants are deduplicated', () => {
  const items = [{title:'A story!',url:'https://example.com/a',publishedAt:'2026-01-03'}, {title:'A story',url:'https://example.com/b',publishedAt:'2026-01-02'}, {title:'Renamed',url:'https://example.com/a',publishedAt:'2026-01-01'}];
  assert.equal(deduplicate(items).length,1);
  assert.equal(canonicalURL('https://example.com/a?utm_medium=rss&tag=ai#section'),'https://example.com/a?tag=ai');
  assert.equal(escapeHTML('"<script>&'),'&quot;&lt;script&gt;&amp;');
});
test('Mixed Atom feeds retain relevant tags and exclude translated copies', () => {
  const entry = (path, tag) => `<entry><title>${path}</title><link href="https://example.com/${path}"/><updated>2026-01-01</updated><category term="${tag}"/></entry>`;
  const xml = `<feed>${entry('ai-story','llms')}${entry('unrelated','rust')}${entry('zh-Hans/ai-story','llms')}${entry('paid','Sponsored')}</feed>`;
  const items = parseFeed(xml, {...source, includeTags:['llms','Sponsored'], excludePath:'^/zh-Hans/'});
  assert.deepEqual(items.map(item => item.title), ['ai-story']);
});
test('Wire discovery only accepts configured publishers and preserves their attribution', () => {
  const entry = (name, host, category='News') => `<item><title>${name}</title><link>https://news.google.com/${name}</link><pubDate>2026-01-01</pubDate><source url="https://${host}">${name}</source><category>${category}</category></item>`;
  const xml = `<rss><channel>${entry('Reuters','www.reuters.com')}${entry('Impersonator','reuters.com.example.com')}${entry('Paid','apnews.com','Sponsored Content')}${entry('AP','apnews.com')}</channel></rss>`;
  const items = parseFeed(xml, {...source, publisherDomains:['reuters.com','apnews.com']});
  assert.deepEqual(items.map(item => item.source), ['Reuters','AP']);
});
test('Source allowances keep newest entries even when a feed is relevance-ranked', () => {
  const entry = day => `<item><title>Story ${day}</title><link>https://example.com/${day}</link><pubDate>2026-01-${day}</pubDate></item>`;
  const xml = `<rss><channel>${entry('01')}${entry('03')}${entry('02')}</channel></rss>`;
  assert.deepEqual(parseFeed(xml, {...source,maxItems:2}).map(item => item.title), ['Story 03','Story 02']);
});
test('Feed body limits count bytes across chunks and cancel oversized streams', async () => {
  assert.equal(await readFeedBody(new Response('é'),2),'é');
  let cancelled=false;
  const stream = new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array([1,2])); controller.enqueue(new Uint8Array([3,4])); },
    cancel() { cancelled=true; }
  });
  await assert.rejects(readFeedBody(new Response(stream),3),/size limit/);
  assert.equal(cancelled,true);
});
test('YouTube thumbnails remain images while video embeds are never treated as images', () => {
  const xml=`<feed><entry><title>Demo</title><link href="https://www.youtube.com/watch?v=example"/><published>2026-01-01</published><yt:videoId>example</yt:videoId><media:group><media:content url="https://www.youtube.com/v/example" type="application/x-shockwave-flash"/><media:thumbnail url="https://i.ytimg.com/vi/example/hqdefault.jpg" width="480"/></media:group></entry></feed>`;
  const [item]=parseFeed(xml,source);
  assert.equal(item.image,'https://i.ytimg.com/vi/example/hqdefault.jpg');
  assert.equal(item.format,'video');
});
test('Preview extraction skips unsafe URLs and tracking pixels without retaining feed HTML', () => {
  const xml=`<rss><channel><item><title>Story</title><link>https://example.com/article</link><pubDate>2026-01-01</pubDate><media:thumbnail url="javascript:alert(1)"/><content:encoded><![CDATA[<img src="https://example.com/pixel" width="1" height="1"><img src="https://127.0.0.1/private"><img src="https://cdn.example.com/photo.jpg?a=1&amp;b=2" onerror="alert(1)"><script>alert(1)</script>]]></content:encoded></item></channel></rss>`;
  const [item]=parseFeed(xml,source);
  assert.equal(item.image,'https://cdn.example.com/photo.jpg?a=1&b=2');
  assert.ok(!JSON.stringify(item).includes('onerror'));
});
async function walk(path) {
  const files=[];
  for (const entry of await readdir(path,{withFileTypes:true})) {
    const full=resolve(path,entry.name);
    files.push(...(entry.isDirectory()?await walk(full):[full]));
  }
  return files;
}
test('Every generated internal link and asset resolves, including GitHub project paths', async () => {
  const root=resolve('dist');
  const base=('/'+(process.env.BASE_PATH??'').replace(/^\/+|\/+$/g,'')).replace(/\/$/,'');
  const files=(await walk(root)).filter(p=>p.endsWith('.html'));
  assert.ok(files.length >= 11);
  for (const file of files) {
    const html=await readFile(file,'utf8');
    assert.equal((html.match(/<h1[ >]/g)??[]).length,1,`one H1 in ${file}`);
    for(const [,link] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (/^(https?:|mailto:|#)/.test(link)) continue;
      let path=link.split(/[?#]/)[0];
      if (base && path.startsWith('/')) { assert.ok(path.startsWith(base+'/'),`Missing base in ${path}`); path=path.slice(base.length); }
      let target=path.startsWith('/')?resolve(root,'.'+path):resolve(dirname(file),path);
      if (path.endsWith('/')) target=resolve(target,'index.html');
      assert.ok((await stat(target)).isFile(),`Broken ${link} in ${file}`);
    }
  }
});
test('RSS is parseable and contains published briefs only', async () => {
  const feed=new XMLParser().parse(await readFile('dist/feed.xml','utf8'));
  assert.equal(feed.rss.channel.title,'ChatGPT Fan · Daily Brief');
  assert.ok(feed.rss.channel.item);
  const briefs=JSON.parse(await readFile('content/briefs.json','utf8'));
  const search=await readFile('dist/search.json','utf8');
  for(const brief of briefs.filter(b=>b.status!=='published')) assert.ok(!search.includes(brief.title));
});
