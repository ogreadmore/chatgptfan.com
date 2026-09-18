import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fitHeadline, sharingMeta } from '../scripts/sharing.mjs';

test('Every published brief has a real 1200x630 sharing image and matching article metadata', async () => {
  const entries = await readdir('dist/brief',{withFileTypes:true});
  const base = ('/'+(process.env.BASE_PATH??'').replace(/^\/+|\/+$/g,'')).replace(/\/$/,'');
  for (const entry of entries.filter(e=>e.isDirectory())) {
    const html = await readFile(`dist/brief/${entry.name}/index.html`,'utf8');
    const image = html.match(/property="og:image" content="([^"]+)"/)[1];
    assert.ok(image.startsWith('https://'));
    const path = new URL(image).pathname.slice(base.length);
    const png = await readFile('dist'+path);
    assert.equal(png.subarray(1,4).toString(),'PNG');
    assert.equal(png.readUInt32BE(16),1200);
    assert.equal(png.readUInt32BE(20),630);
    const article = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    assert.equal(article.datePublished,entry.name);
    assert.deepEqual(article.image,[image]);
    assert.ok(article.url.endsWith(`${base}/brief/${entry.name}/`));
    assert.ok(html.includes('name="twitter:card" content="summary_large_image"'));
    assert.ok(html.includes('property="og:type" content="article"'));
  }
  const homepage = await readFile('dist/index.html','utf8');
  assert.ok(homepage.includes('name="google-site-verification"'));
});

test('Sharing metadata safely handles editorial text and headline cards fail visibly on overflow', () => {
  const title = 'A useful brief </script><script>alert(1)</script>';
  const html = sharingMeta({site:{name:'ChatGPT Fan',url:'https://chatgptfan.com'},title,description:title,canonical:'https://chatgptfan.com/brief/example/',image:'https://chatgptfan.com/image.png',brief:{date:'2026-09-18'}});
  const article = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(article.headline,title);
  assert.equal((html.match(/<script/g)??[]).length,1);
  const headline = 'AI leaders call for a slowdown. Trump pushes back.';
  assert.equal(fitHeadline(headline).lines.join(' '),headline);
  assert.throws(()=>fitHeadline('overflow '.repeat(400)),/too long/);
});
