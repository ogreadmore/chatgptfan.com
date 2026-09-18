import {escapeHTML as e, dateLabel, isWebURL, safeImageURL, canonicalURL} from './lib.mjs';

import {localImage} from './image-delivery.mjs';

const arrow = '<span aria-hidden="true">↗</span>';
export function selectHomeHeadlines(items, {limit=8, days=7, today, exclude=[]}={}) {
  const end = Date.parse(`${today}T23:59:59Z`), start=end-days*86400000;
  const blocked=new Set(exclude.filter(isWebURL).map(canonicalURL));
  const urls=new Set(), titles=new Set(), counts=new Map(), selected=[];
  const candidates=items.filter(n=>isWebURL(n.url) && Date.parse(n.publishedAt)<=end && Date.parse(n.publishedAt)>start && !blocked.has(canonicalURL(n.url)))
    .sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
  // Prefer different publishers, then allow a second item per publisher.
  for (const cap of [1,2]) for (const n of candidates) {
    const key=canonicalURL(n.url), title=n.title.toLowerCase().replace(/[^\p{L}\p{N}]/gu,''), source=n.source || n.sourceId;
    if(selected.length>=limit || urls.has(key) || titles.has(title) || (counts.get(source)||0)>=cap) continue;
    selected.push(n); urls.add(key); titles.add(title); counts.set(source,(counts.get(source)||0)+1);
  }
  return selected.sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
}
export function selectHomeVideos(items,{today,preferred=[],limit=6}={}) {
  const end=Date.parse(today+'T23:59:59Z');
  const candidates=items.filter(n=>n.format==='video'&&isWebURL(n.url)&&Date.parse(n.publishedAt)<=end&&Date.parse(n.publishedAt)>end-30*86400000).sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
  const selected=[],seen=new Set(),batches=new Map();
  const add=n=>{const key=canonicalURL(n.url);if(selected.length>=limit||seen.has(key))return;selected.push(n);seen.add(key);const batch=n.sourceId+':'+n.publishedAt.slice(0,10);batches.set(batch,(batches.get(batch)||0)+1);};
  for(const link of preferred){const n=candidates.find(n=>canonicalURL(n.url)===canonicalURL(link));if(n)add(n);}
  // Spread automatic picks across upload days before filling from one batch.
  for(const cap of [1,2,Infinity]) for(const n of candidates) if((batches.get(n.sourceId+':'+n.publishedAt.slice(0,10))||0)<cap)add(n);
  return selected;
}
export function validateHome(config,resources,socialPosts) {
  const ids=new Map(resources.map(r=>[r.id,r])), seen=new Set();
  for(const [key,sections] of [['resources',['learn','tools']],['projects',['projects']],['money',['money']],['safety',['safety']],['safetyFeature',['safety']]]) {
    const values=key==='safetyFeature'?[config[key]]:config[key];
    if(!Array.isArray(values) || !values.length) throw new Error(`Missing homepage selection: ${key}`);
    for(const id of values) {
      if(!sections.includes(ids.get(id)?.section) || seen.has(id)) throw new Error(`Invalid or duplicate homepage resource: ${id}`);
      seen.add(id);
    }
  }
  if(!Array.isArray(config.social) || new Set(config.social).size!==config.social.length || config.social.some(url=>!socialPosts.items.some(p=>p.url===url))) throw new Error('Invalid homepage social selection');
  if(config.videos && (!Array.isArray(config.videos)||config.videos.some(u=>!isWebURL(u)))) throw new Error('Invalid homepage video selection');
  if(!Array.isArray(config.excludeNewsUrls) || config.excludeNewsUrls.some(u=>!isWebURL(u))) throw new Error('Invalid homepage news exclusions');
}
export function briefFigure(brief,url,{hero=false}={}) {
  if(!brief?.image) return '';
  return `<figure class="brief-image ${hero?'brief-image-home':''}">${localImage(brief.image.src,url,{alt:brief.image.alt,width:brief.image.width,height:brief.image.height,eager:true,sizes:hero?'(max-width: 800px) 100vw, 700px':'(max-width: 800px) 100vw, 800px'})}<figcaption>${e(brief.image.credit)}</figcaption></figure>`;
}
function projectArt(r,url) {
  if(r.image) return localImage(r.image,url,{width:1536,height:1024,sizes:'(max-width: 700px) 100vw, 420px'});
  const voice=r.kind==='Voice';
  return `<svg viewBox="0 0 480 220" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2">${voice ? Array.from({length:31},(_,i)=>{const h=18+Math.abs(Math.sin(i*.68)*Math.cos(i*.17))*112;return `<path d="M${60+i*12} ${110-h/2}v${h}"/>`;}).join('') : '<rect x="62" y="64" width="72" height="90" rx="6"/><path d="M82 84h32M82 100h32M82 116h20M145 110h66m-8-8 8 8-8 8"/><rect x="223" y="76" width="62" height="68" rx="8"/><path d="M299 110h45m-8-8 8 8-8 8"/><rect x="355" y="82" width="64" height="56" rx="6"/><path d="M370 100h33M370 116h24"/>'}</g></svg>`;
}
export function renderHome({config,resources,news,social,socialPosts,briefs,today,url}) {
  validateHome(config,resources,socialPosts);
  const byId=new Map(resources.map(r=>[r.id,r])), latest=briefs[0];
  const head=(title,path,label='View all')=>`<div class="section-head"><h2>${title}</h2><a class="small-link" href="${url(path)}">${label} →</a></div>`;
  const detail=r=>url(r.section==='safety'?`safety/#${r.id}`:`resources/${r.section}/#${r.id}`);
  const facts=r=>`<div class="home-facts">${[r.kind,r.cost,r.level].filter(Boolean).map(v=>`<span>${e(v)}</span>`).join('')}</div>`;
  const resource=id=>{const r=byId.get(id);return `<article class="home-resource"><div class="meta">${e(r.provider)}</div><h3><a href="${e(r.url)}">${e(r.title)} ${arrow}</a></h3><p>${e(r.bestFor || r.safety?.readFirst || r.description)}</p>${facts(r)}<a class="home-detail" href="${detail(r)}">Details →</a></article>`;};
  const headlines=selectHomeHeadlines(news.items.filter(n=>n.topic==='News'&&n.format!=='video'),{today,exclude:[...config.excludeNewsUrls,...(latest?.sources.map(s=>s.url)||[])]});
  const videos=selectHomeVideos(news.items,{today,preferred:config.videos});
  const posts=config.social.map(u=>socialPosts.items.find(p=>p.url===u));
  const image=(n,cls='')=>safeImageURL(n.image)?`<img class="${cls}" src="${e(safeImageURL(n.image))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-home-image>`:'';
  return `<div class="home-publication"><div class="home-lead-grid"><section class="brief-feature"><div class="section-head"><h1>${latest?.date===today?'Today’s brief':'Latest brief'}</h1>${latest?`<time class="meta" datetime="${latest.date}">${dateLabel(latest.date)}</time>`:''}</div>${latest?`<div class="eyebrow"><span class="status-square"></span> Daily edition</div><h2><a href="${url('brief/'+latest.slug+'/')}">${e(latest.title)}</a></h2><p class="standfirst">${e(latest.excerpt)}</p><a class="text-link" href="${url('brief/'+latest.slug+'/')}">Read the brief →</a>${briefFigure(latest,url,{hero:true})}`:'<p>The first edition is on its way.</p>'}</section>
    <aside class="home-headlines">${head('Latest news','news/')}<div>${headlines.map(n=>`<article class="home-headline"><div><div class="meta">${e(n.source)}${n.type.includes('Google News')?' · via Google News':''} · <time datetime="${e(n.publishedAt)}">${dateLabel(n.publishedAt,{year:undefined})}</time></div><h3><a href="${e(n.url)}">${e(n.title)} ${arrow}</a></h3></div>${image(n)}</article>`).join('')||'<p>No recent headlines. Browse the reader for the last available snapshot.</p>'}</div><p class="home-note">From the feeds · ${news.updatedAt?'Checked '+dateLabel(news.updatedAt):'Awaiting refresh'}</p></aside></div>
    <section class="home-section home-social">${head('Social','news/social/')}<p class="home-note">Selected summaries · OpenAI people</p><div class="home-social-grid">${posts.map(p=>{const account=social.find(a=>a.id===p.accountId);const date=p.publishedAt||p.coveredAt;return `<article><div class="meta">${e(account?.name||p.accountId)} · ${p.publishedAt?'':'Covered '}${dateLabel(date,{year:undefined})}</div><h3><a href="${e(p.url)}">${e(p.title)} ${arrow}</a></h3><p>${e(p.summary)}</p><a class="home-detail" href="${e(p.sourceUrl)}">Source: ${e(p.sourceName)} ↗</a></article>`;}).join('')}</div></section>
    <section class="home-section home-videos">${head('Videos','news/?category=Videos')}<div class="home-video-grid">${videos.map(n=>`<article><a class="home-video-art" href="${e(n.url)}" tabindex="-1" aria-hidden="true">${image(n)}<span>▶</span></a><div class="meta">${e(n.source)} · ${dateLabel(n.publishedAt,{year:undefined})}</div><h3><a href="${e(n.url)}">${e(n.title)} ${arrow}</a></h3></article>`).join('')||'<p>No recent videos in the feed.</p>'}</div></section>
    <section class="home-section">${head('Projects','resources/projects/')}<div class="home-project-grid">${config.projects.slice(0,3).map(id=>{const r=byId.get(id);return `<article class="home-project"><div class="home-project-art">${projectArt(r,url)}<span>Editorial illustration</span></div><div class="meta">${e(r.kind)} · ${e(r.provider)}</div><h3><a href="${e(r.url)}">${e(r.title)} ${arrow}</a></h3><p>${e(r.description)}</p><div class="home-facts"><span>${e(r.cost)}</span><span>${e(r.level)}</span></div><a class="home-detail" href="${detail(r)}">Before you start →</a></article>`;}).join('')}</div>${config.projects.length>3?`<div class="home-resource-grid home-project-more">${config.projects.slice(3).map(resource).join('')}</div>`:''}</section>
    <section class="home-section">${head('Money','resources/money/')}<div class="home-money-grid">${config.money.map(id=>{const r=byId.get(id);return `<article class="home-resource"><div class="eyebrow">${e(r.kind)}</div><h3><a href="${e(r.url)}">${e(r.title)} ${arrow}</a></h3><p>${e(r.description)}</p><div class="meta">${e(r.provider)}</div><a class="home-detail" href="${detail(r)}">Details →</a></article>`;}).join('')}</div></section>
    <section class="home-section">${head('Resources','resources/','Explore the library')}<div class="home-resource-grid">${config.resources.map(resource).join('')}</div></section>
    <section class="home-section home-previous">${head('Previous editions','brief/','Archive')}<div>${briefs.slice(1,4).map(b=>`<a href="${url('brief/'+b.slug+'/')}"><time class="meta" datetime="${b.date}">${dateLabel(b.date)}</time><span>${e(b.title)} →</span></a>`).join('')||'<p>Previous editions will collect here.</p>'}</div></section></div>`;
}
