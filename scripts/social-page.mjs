import {renderNewsTabs} from './news-page.mjs';
import {escapeHTML as e, dateLabel, isWebURL} from './lib.mjs';

export function renderSocialPage(accounts, {newsUrl, socialUrl, posts}) {
  for (const account of accounts) {
    if (!/^[A-Za-z0-9_]{1,15}$/.test(account.id) || account.url !== `https://x.com/${account.id}`) throw new Error('Invalid social account');
  }
  const ids = new Set();
  for (const post of posts.items) {
    if (!accounts.some(a=>a.id===post.accountId) || !new RegExp(`^https://x\\.com/${post.accountId}/status/[0-9]+$`).test(post.url) || ids.has(post.url) || !isWebURL(post.sourceUrl) || !/^\d{4}-\d{2}-\d{2}$/.test(post.coveredAt) || !post.title || !post.summary || (post.contextUrl && !isWebURL(post.contextUrl))) throw new Error('Invalid social post');
    ids.add(post.url);
  }
  const items=[...posts.items].sort((a,b)=>b.coveredAt.localeCompare(a.coveredAt));
  return `<div class="reader"><header class="reader-heading"><div><div class="eyebrow">Social</div><h1>News</h1><p>From the people building OpenAI.</p></div></header>${renderNewsTabs(newsUrl, socialUrl, 'social')}
    <div class="social-reading-layout"><section aria-label="Selected social posts"><div class="section-head"><h2>Selected posts</h2><span class="meta">Reviewed ${dateLabel(posts.updatedAt)}</span></div><p class="social-method">Summaries from public archives, with links to the original posts. Dates reflect coverage; this is not a complete or live timeline.</p>
    <div class="social-posts">${items.map(post=>{const a=accounts.find(a=>a.id===post.accountId);return `<article class="social-post"><div class="social-post-byline"><span class="social-initials" aria-hidden="true">${e(a.name.split(' ').map(n=>n[0]).join(''))}</span><div><a href="${e(a.url)}">${e(a.name)}</a><span class="meta">@${e(a.id)} · ${e(a.role)}</span></div><time class="meta" datetime="${e(post.coveredAt)}">${dateLabel(post.coveredAt,{year:undefined})}</time></div><h3><a href="${e(post.url)}">${e(post.title)} ↗</a></h3><p>${e(post.summary)}</p><div class="social-post-links"><a href="${e(post.url)}">Original post ↗</a><a href="${e(post.sourceUrl)}">${e(post.sourceName)} ↗</a>${post.contextUrl?`<a href="${e(post.contextUrl)}">${e(post.contextLabel)} ↗</a>`:''}<span class="meta">Post summary</span></div></article>`;}).join('')}</div></section>
    <aside class="social-accounts" aria-label="Social accounts"><h2>Accounts</h2>${[...new Set(accounts.map(a=>a.group))].map(group=>`<div class="reader-nav-heading">${e(group)}</div>${accounts.filter(a=>a.group===group).map(a=>`<a class="social-account" id="${e(a.id)}" href="${e(a.url)}"><span>${e(a.name)} ↗</span><small>${e(a.role)} · @${e(a.id)}</small></a>`).join('')}`).join('')}<p class="meta">Personal posts and company statements are firsthand perspectives, not independent reporting.</p></aside></div></div>`;
}
