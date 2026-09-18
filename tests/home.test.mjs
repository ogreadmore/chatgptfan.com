import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { selectHomeHeadlines, selectHomeVideos, validateHome } from '../scripts/home-page.mjs';
import { escapeHTML } from '../scripts/lib.mjs';

test('Homepage videos retain fresh curated picks and diversify upload batches as selections expire',()=>{
  const video=(id,date)=>({format:'video',url:'https://www.youtube.com/watch?v='+id,title:id,sourceId:'one',publishedAt:date+'T12:00:00Z'});
  const rows=[video('a','2026-09-18'),video('b','2026-09-18'),video('c','2026-09-18'),video('d','2026-09-17'),video('e','2026-09-16'),video('old','2026-01-01'),video('future','2027-01-01')];
  const selected=selectHomeVideos(rows,{today:'2026-09-18',limit:4,preferred:[rows[1].url,rows[1].url,rows[5].url,rows[6].url,'https://www.youtube.com/watch?v=missing']});
  assert.deepEqual(selected.map(x=>x.title),['b','d','e','a']);
});

test('Homepage headlines diversify actual publishers, exclude duplicates and stale or future entries',()=>{
  const item=(source,title,date='2026-09-18T10:00:00Z',url='https://example.com/'+title)=>({source,sourceId:'aggregate',title,publishedAt:date,url});
  const rows=[item('A','one'),item('A','two'),item('A','three'),item('B','four'),item('C','five'),item('D','five'),item('E','old','2026-08-01'),item('F','future','2027-01-01'),item('G','blocked'),item('H','unsafe',undefined,'javascript:alert(1)'),item('B','copy',undefined,'https://example.com/four?utm_source=rss')];
  const selected=selectHomeHeadlines(rows,{today:'2026-09-18',limit:8,exclude:['https://example.com/blocked']});
  assert.deepEqual(selected.map(n=>n.title),['one','four','five','two']);
  assert.deepEqual(selectHomeHeadlines(rows,{today:'2026-09-18',limit:3}).map(n=>n.source),['A','B','C']);
});

test('Homepage selections reference the right collections and its detail links reach real anchors',async()=>{
  const read=async p=>JSON.parse(await readFile(p,'utf8'));
  const config=await read('content/home.json'), resources=await read('content/resources.json'), posts=await read('content/social-posts.json');
  validateHome(config,resources,posts);
  assert.throws(()=>validateHome({...config,projects:['academy']},resources,posts),/Invalid/);
  assert.throws(()=>validateHome({...config,safety:[config.safetyFeature]},resources,posts),/duplicate/);
  const base=('/'+(process.env.BASE_PATH??'').replace(/^\/+|\/+$/g,'')).replace(/\/$/,'');
  const html=await readFile('dist/index.html','utf8');
  for(const [,href] of html.matchAll(/href="([^"#]+#[^"]+)"/g)) {
    if(!href.startsWith(base+'/')) continue;
    const [path,id]=href.slice(base.length).split('#');
    const page=await readFile('dist'+path+'index.html','utf8');
    assert.ok(page.includes(`id="${id}"`),`Missing anchor ${href}`);
  }
  const site=await read('content/site.json');
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:site.timezone}).format(new Date());
  const latest=(await read('content/briefs.json')).filter(b=>b.status==='published'&&b.date<=today).sort((a,b)=>b.date.localeCompare(a.date))[0];
  const brief=await readFile(`dist/brief/${latest.slug}/index.html`,'utf8');
  assert.ok(html.includes(`/brief/${latest.slug}/`),'Homepage links to the latest published edition');
  if(latest.image) {
    assert.ok(html.includes(latest.image.src),'Homepage uses the current edition’s illustration');
    assert.ok(brief.includes(latest.image.src),'Article uses the same illustration');
    assert.ok(html.includes(escapeHTML(latest.image.credit)),'Homepage credits the actual image source');
  }
});
