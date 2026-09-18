import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat, readdir} from 'node:fs/promises';
import sharp from 'sharp';

test('Published illustrations have valid responsive WebP delivery and retain originals',async()=>{
  const html=await readFile('dist/index.html','utf8');
  const sources=[...html.matchAll(/<source type="image\/webp" srcset="([^"]+)"/g)];
  assert.ok(sources.length>0);
  for(const [,srcset] of sources) for(const candidate of srcset.split(', ')) {
    const [url,width]=candidate.split(' ');
    const path='dist/assets/'+url.split('/assets/')[1];
    const meta=await sharp(path).metadata();
    assert.equal(meta.format,'webp');
    assert.equal(meta.width,Number(width.slice(0,-1)));
    const original=path.replace(/-\d+\.webp$/,'.png');
    assert.ok((await stat(path)).size<(await stat(original)).size);
  }
  const briefs=JSON.parse(await readFile('content/briefs.json','utf8'));
  const referenced=new Set(briefs.filter(b=>b.status==='published').map(b=>b.image?.src));
  for(const file of await readdir('dist/assets/briefs')) {
    if(/\.(png|svg)$/.test(file)) assert.ok(referenced.has('briefs/'+file),'Unused illustration deployed: '+file);
  }
});
