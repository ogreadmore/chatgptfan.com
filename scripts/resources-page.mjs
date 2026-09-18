import { escapeHTML as e, dateLabel } from './lib.mjs';

import {localImage} from './image-delivery.mjs';

export const collections = [
  { id: 'learn', title: 'Learn', description: 'Courses, guides, and examples worth your time.', detail: 'Start with the fundamentals, improve your practice, or learn to build.' },
  { id: 'tools', title: 'Tools', description: 'A small toolkit for useful work.', detail: 'Research, automation, and local models. Choose for the task at hand.' },
  { id: 'projects', title: 'Projects', description: 'Experiments to explore. Starting points to make your own.', detail: 'Working demos, practical workflows, and ideas with source code.' },
  { id: 'money', title: 'Money', description: 'How useful work becomes a business.', detail: 'Business examples, customer research, and the economics behind a product or service.' }
];

function tabs(url, active = '') {
  return `<nav class="library-tabs" aria-label="Resources"><a href="${url('resources/')}" ${!active ? 'aria-current="page"' : ''}>Overview</a>${collections.map(c => `<a href="${url(`resources/${c.id}/`)}" ${active === c.id ? 'aria-current="page"' : ''}>${c.title}</a>`).join('')}</nav>`;
}

function card(r, url, heading = 'h2') {
  return `<article class="library-entry" id="${e(r.id)}" data-filter-item data-kind="${e(r.kind)}">
    ${r.image ? `<div class="library-art">${localImage(r.image,url,{alt:r.imageAlt||'',width:1536,height:1024,sizes:'(max-width: 700px) 100vw, 500px'})}<span>Editorial illustration</span></div>` : ''}
    <div class="library-entry-body"><div class="library-entry-top"><span class="eyebrow">${e(r.kind)}</span>${r.status === 'archived' ? '<span class="library-status">Archived reference</span>' : ''}</div>
    <${heading}><a href="${e(r.url)}">${e(r.title)} <span aria-hidden="true">↗</span></a></${heading}>
    <div class="library-provider">${e(r.provider)}</div><p>${e(r.description)}</p>
    ${r.bestFor ? `<p class="library-use"><span>Good for</span> ${e(r.bestFor)}</p>` : ''}
    <div class="library-facts">${[r.level,r.cost,r.time].filter(Boolean).map(v=>`<span>${e(v)}</span>`).join('')}</div>
    ${r.needs || r.credential ? `<details><summary>Before you start</summary>${r.needs ? `<p>${e(r.needs)}</p>` : ''}${r.credential ? `<p>${e(r.credential)}</p>` : ''}</details>` : ''}
    <div class="library-reviewed">Checked <time datetime="${e(r.checkedAt)}">${dateLabel(r.checkedAt)}</time>${r.sourceUrl ? ` · <a href="${e(r.sourceUrl)}">Source notes ↗</a>` : ''}</div></div>
  </article>`;
}

export function renderResourcesOverview(resources, url) {
  const items = resources.filter(r=>r.section!=='safety');
  const paths = [
    ['New to AI', 'Start with the basics, then practice on a real task.', ['academy','elements','wharton-gail']],
    ['AI at work', 'Work with sources, connect your tools, and test the result.', ['notebook','n8n','n8n-summary']],
    ['Build something', 'Learn the patterns, make a demo, then explore agents.', ['ms-genai','gradio-demo','hf-agents']]
  ];
  return `<header class="page-head library-head"><div><span class="eyebrow">The library</span><h1>Resources</h1><p>Good things to learn from, work with, and build on.</p></div><span class="library-total">${items.length}<small>selected resources</small></span></header>${tabs(url)}
    <section class="library-start"><div class="section-head"><h2>Find your starting point</h2></div><div class="library-paths">${paths.map(([title,desc,ids])=>`<article><h3>${title}</h3><p>${desc}</p><ol>${ids.map(id=>{ const r=resources.find(x=>x.id===id); return `<li><a href="${url(`resources/${r.section}/#${r.id}`)}">${e(r.title)} <span aria-hidden="true">→</span></a></li>`; }).join('')}</ol></article>`).join('')}</div></section>
    <section class="library-browse"><div class="section-head"><h2>Browse the library</h2></div>${collections.map(c=>`<a class="library-collection" href="${url(`resources/${c.id}/`)}"><h3>${c.title}</h3><p>${c.description}</p><span class="meta">${items.filter(r=>r.section===c.id).length} resources</span><span aria-hidden="true">↗</span></a>`).join('')}</section>
    <section class="library-picks"><div class="section-head"><h2>A few good places to begin</h2></div><div class="library-grid">${['wharton-gail','n8n-summary'].map(id=>card(items.find(r=>r.id===id),url,'h3')).join('')}</div></section>
    <aside class="library-footer"><div><h2>Keep the bigger picture in view.</h2><p>Independent research, documented harms, practical safeguards, and arguments for stronger oversight.</p><a class="text-link" href="${url('safety/')}">Safety & Society →</a></div><div><h3>A maintained collection</h3><p>Entries show when their source was last checked. We review a small selection each day, prioritize overdue checks, and revisit the whole library monthly. A source check is not a hands-on product test.</p></div></aside>`;
}

export function renderResourceCollection(id, resources, url) {
  const c=collections.find(c=>c.id===id);
  const items=resources.filter(r=>r.section===id);
  const kinds=[...new Set(items.map(r=>r.kind))];
  const learningGroups=[
    {id:'getting-started',title:'Getting Started',description:'Start using ChatGPT, then practice on a task you care about.',stage:'start'},
    {id:'courses',title:'Courses & foundations',description:'Structured learning, with costs and prerequisites up front.',stage:'courses'},
    {id:'developers',title:'For developers',description:'Code, APIs, and agents. Programming experience is expected.',stage:'build'}
  ];
  if(id==='learn' && items.some(r=>!learningGroups.some(g=>g.stage===r.learningStage))) throw new Error('Every Learn resource needs a valid learningStage');
  const group=g=>`<section class="learning-group" id="${g.id}" data-filter-group><header><h${g.stage==='start'?'2':'3'}>${g.title}</h${g.stage==='start'?'2':'3'}><p>${g.description}</p></header><div class="library-grid">${items.filter(r=>r.learningStage===g.stage).map(r=>card(r,url,g.stage==='start'?'h3':'h4')).join('')}</div></section>`;
  const listing=id==='learn'?`${group(learningGroups[0])}<section class="learning-deeper" id="learning" data-filter-group><header><h2>Learning</h2><p>Build your understanding or develop something of your own.</p></header>${learningGroups.slice(1).map(group).join('')}</section>`:`<div class="library-grid">${items.map(r=>card(r,url)).join('')}</div>`;
  return `<header class="page-head library-head"><div><a class="eyebrow" href="${url('resources/')}">Resources</a><h1>${c.title}</h1><p>${c.description}</p></div><span class="library-total">${items.length}<small>selected resources</small></span></header>${tabs(url,id)}
    <p class="library-intro">${c.detail}${id==='money' ? ' Vendor case studies are identified; none is a promise of earnings.' : ''}</p>
    ${id==='learn'?'<nav class="learning-jumps" aria-label="Learning paths"><a href="#getting-started">Getting Started ↓</a><a href="#courses">Courses & foundations ↓</a><a href="#developers">For developers ↓</a></nav>':''}
    <div data-filter-scope><div class="filters library-filters" data-filter-controls hidden><label><span class="sr-only">Search this collection</span><input type="search" data-filter-search placeholder="Search ${c.title.toLowerCase()}…"></label><label><span class="sr-only">Resource type</span><select data-filter-select><option value="">All types</option>${kinds.map(k=>`<option value="${e(k)}">${e(k)}</option>`).join('')}</select></label><span class="filter-count meta" role="status" aria-live="polite"></span></div>${listing}<p class="empty" data-filter-empty hidden>No matches. Try another search or type.</p></div><p class="library-method">“Checked” means we reviewed the linked source, not that we tested every tool or completed every course. Availability and prices can change. ${id==='learn' ? 'Completion certificates are labeled separately from professional qualifications.' : ''}</p>`;
}
