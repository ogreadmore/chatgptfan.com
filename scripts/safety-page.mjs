import { escapeHTML as e, dateLabel } from './lib.mjs';

export function validateSafety(config, resources) {
  const entries = resources.filter(r=>r.section==='safety');
  const ids = new Set();
  const groups = new Set();
  for (const group of config.groups) {
    if (!/^[a-z0-9-]+$/.test(group.id) || groups.has(group.id) || !group.resources.length) throw new Error('Invalid safety group: '+group.id);
    groups.add(group.id);
    for (const id of group.resources) {
      const r=entries.find(r=>r.id===id);
      if (!r || ids.has(id) || r.safety?.group!==group.id || ['audience','why','readFirst','limits'].some(k=>!r.safety[k])) throw new Error('Invalid safety resource: '+id);
      ids.add(id);
    }
  }
  if (ids.size!==entries.length) throw new Error('Every safety resource needs a place in the guide');
  if (config.starts.length!==3 || config.starts.some(s=>!ids.has(s.id))) throw new Error('Safety starting points must reference the library');
}

export function selectSafetyHeadlines(items) {
  const counts = new Map();
  const seen = new Set();
  return items.filter(n=>n.topic==='Safety & Society' && !/\b(hiring|job opening|we.re recruiting|fundrais(er|ing))\b/i.test(n.title))
    .sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt))
    .filter(n=>{
      const count=counts.get(n.sourceId)||0;
      if(count>=2 || seen.has(n.url)) return false;
      counts.set(n.sourceId,count+1); seen.add(n.url); return true;
    }).slice(0,6);
}

export function renderSafetyPage({config, resources, news, url}) {
  validateSafety(config,resources);
  const byId=new Map(resources.map(r=>[r.id,r]));
  const headlines=selectSafetyHeadlines(news.items);
  const card = id => {
    const r=byId.get(id), s=r.safety;
    return `<article class="safety-resource" id="${e(id)}"><div class="safety-resource-meta"><span>${e(r.kind)}</span><span>${e(s.audience)}</span></div><h3><a href="${e(r.url)}">${e(r.title)} <span aria-hidden="true">↗</span></a></h3><p>${e(r.description)}</p><p class="safety-start-with">${e(s.readFirst)}</p><details><summary>Why this source</summary><p>${e(s.why)}</p><p><strong>Keep in mind.</strong> ${e(s.limits)}</p></details><div class="safety-resource-credit">${e(r.provider)} · Checked <time datetime="${e(r.checkedAt)}">${dateLabel(r.checkedAt)}</time></div></article>`;
  };
  return `<header class="page-head safety-head"><span class="eyebrow">An independent guide</span><h1>Safety & Society</h1><p>${e(config.purpose)}</p><p class="safety-introduction">${e(config.introduction)}</p></header>
    <section class="safety-starts" aria-labelledby="safety-start-title"><div class="section-head"><h2 id="safety-start-title">Start here</h2><a class="small-link" href="#selection">How we choose sources ↓</a></div><div class="safety-start-grid">${config.starts.map((s,i)=>`<article class="safety-starter ${i===0?'safety-starter-lead':''}"><span class="eyebrow">${i===0?'The overview':i===1?'For your own use':'For public life'}</span><h3>${e(s.title)}</h3><p>${e(s.description)}</p><a href="${e(byId.get(s.id).url)}" class="text-link">${e(s.label)} ↗</a><a class="safety-context-link" href="#${e(s.id)}">About this source ↓</a></article>`).join('')}</div></section>
    <div class="safety-layout"><aside class="safety-index"><nav aria-label="Safety topics"><span class="eyebrow">Explore</span>${config.groups.map(g=>`<a href="#${e(g.id)}">${e(g.title)} <span>${g.resources.length}</span></a>`).join('')}<a href="#safety-feeds">From the feeds</a><a href="#selection">Our selection</a></nav><div class="safety-stance"><h2>Our position</h2><p>We enjoy using ChatGPT and believe powerful AI needs meaningful oversight and public accountability. Criticism of OpenAI belongs here.</p><a href="${url('position/')}">Read our position →</a></div></aside>
    <div class="safety-reading">${config.groups.map(g=>`<section class="safety-topic" id="${e(g.id)}" aria-labelledby="${e(g.id)}-title"><header><span class="eyebrow">${e(g.title)}</span><h2 id="${e(g.id)}-title">${e(g.question)}</h2><p>${e(g.description)}</p></header><div class="safety-resource-grid">${g.resources.map(card).join('')}</div></section>`).join('')}
    <section class="safety-feed-section" id="safety-feeds"><div class="section-head"><h2>From the feeds</h2><a class="small-link" href="${url('news/?category=Safety%20%26%20Society')}">Open the reader →</a></div><p class="safety-section-note">Automatically collected headlines from our configured safety sources, newest first, with up to two per source. These are discovery links; inclusion does not mean we have reviewed the article or verified its claims.</p><div class="safety-feed-list">${headlines.length ? headlines.map(n=>`<article><div class="meta">${e(n.source)} · ${e(n.type)} · <time datetime="${e(n.publishedAt)}">${dateLabel(n.publishedAt)}</time></div><h3><a href="${e(n.url)}">${e(n.title)} <span aria-hidden="true">↗</span></a></h3></article>`).join('') : '<p>No feed headlines are available. The resources above remain a place to start.</p>'}</div><p class="safety-section-note">${news.updatedAt?`Snapshot refreshed ${dateLabel(news.updatedAt)}. `:''}<a href="${url('sources/')}">See the feed sources and their perspectives →</a></p></section>
    <section class="safety-selection" id="selection"><span class="eyebrow">Editorial method</span><h2>Why these sources?</h2><p>This is a selected reading guide for curious AI users, with deeper material for people building systems or following policy. It covers present harms and possible future risks. It is neither an exhaustive directory nor a ranking of organizations.</p><div class="safety-selection-grid">${config.selection.map(s=>`<div><h3>${e(s.title)}</h3><p>${e(s.description)}</p></div>`).join('')}</div><p class="safety-section-note">The library is selected and maintained with AI assistance. The feed above is collected automatically. Labels describe a source’s role, not a verdict on its accuracy. Inclusion does not endorse every claim or proposal.</p></section></div></div>`;
}
