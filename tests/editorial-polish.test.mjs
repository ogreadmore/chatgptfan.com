import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {renderSocialPage} from '../scripts/social-page.mjs';
test('Unavailable social archives retain attribution and original/context links without broken archive anchors',()=>{
const account={id:'OpenAI',name:'OpenAI',url:'https://x.com/OpenAI',role:'Company',group:'Company'};
const item={accountId:'OpenAI',url:'https://x.com/OpenAI/status/123',coveredAt:'2026-11-01',title:'Test post',summary:'Attributed summary',sourceUrl:'https://texxr.com/handle/openai',sourceName:'TEXXR archive',sourceUnavailable:true,contextUrl:'https://openai.com/news/',contextLabel:'Company context'};
const render=p=>renderSocialPage([account],{newsUrl:'/news/',socialUrl:'/news/social/',posts:{updatedAt:'2026-11-01',items:[p]}});
const html=render(item);assert.ok(html.includes('currently unavailable'));assert.ok(html.includes('href="'+item.url+'"'));assert.ok(html.includes('href="'+item.contextUrl+'"'));assert.ok(!html.includes('href="'+item.sourceUrl+'"'));assert.ok(render({...item,sourceUnavailable:false}).includes('href="'+item.sourceUrl+'"'));
});
test('Search excerpts preserve article link labels without Markdown destinations',async()=>{
const index=JSON.parse(await readFile('dist/search.json','utf8'));const entry=index.find(x=>x.url.endsWith('/brief/2026-11-02/'));assert.ok(entry.text.includes('Axios reports'));assert.ok(!entry.text.includes('https://www.axios.com/2026/11/01/scoop-openai-post-midterm-policy'));
const article=await readFile('dist/brief/2026-11-02/index.html','utf8');assert.ok(article.includes('href="https://www.axios.com/2026/11/01/scoop-openai-post-midterm-policy"'));
const home=await readFile('dist/index.html','utf8');const social=JSON.parse(await readFile('content/social-posts.json','utf8'));for(const p of social.items.filter(p=>p.sourceUnavailable))assert.ok(!home.includes('href="'+p.sourceUrl+'"'));
});
