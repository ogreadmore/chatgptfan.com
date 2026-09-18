import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { openSync } from 'fontkit';
import { Resvg } from '@resvg/resvg-js';
import { escapeHTML as e, dateLabel } from './lib.mjs';

// Outline the bundled fonts so cards render identically on Windows and GitHub Actions.
const inter = openSync('public/assets/fonts/inter.woff2');
const headlineFont = inter;
const pixel = openSync('public/assets/fonts/silkscreen.woff2');
const width = (text, size, font = headlineFont) => font.layout(text).advanceWidth * size / font.unitsPerEm;
function lettering(text, x, y, size, color, font = inter) {
  const run = font.layout(text), scale = size / font.unitsPerEm;
  let pen = 0;
  return `<g fill="${color}">${run.glyphs.map((glyph, i) => {
    const p = run.positions[i];
    const path = `<path transform="translate(${x + (pen + p.xOffset) * scale} ${y - p.yOffset * scale}) scale(${scale} ${-scale})" d="${glyph.path.toSVG()}"/>`;
    pen += p.xAdvance;
    return path;
  }).join('')}</g>`;
}
export function fitHeadline(title, maxWidth=1040) {
  const words = title.trim().split(/\s+/);
  for (let size = 68; size >= 28; size -= 2) {
    const lines = [];
    for (const word of words) {
      if (width(word, size) > maxWidth) break;
      const last = lines.at(-1);
      if (last && width(`${last} ${word}`, size) <= maxWidth) lines[lines.length - 1] += ` ${word}`;
      else lines.push(word);
    }
    if (lines.join(' ') === words.join(' ') && lines.length * size * 1.16 <= 260) return { size, lines };
  }
  throw new Error('Brief headline is too long for its sharing card; shorten the editorial title.');
}
function cardSVG(title, date, art, layout) {
  if(art && layout==='split') {
    const {size,lines}=fitHeadline(title,448);
    const firstBaseline=335-((lines.length-1)*size*1.16)/2;
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#111214"/>
      <path d="M64 50h18v18h18v18H82v18H64V86H46V68h18Z" fill="#c4b5f2"/>
      ${lettering('ChatGPT Fan',120,88,34,'#efeeea',pixel)}
      <image xlink:href="${art}" x="32" y="154" width="624" height="351" preserveAspectRatio="xMidYMid meet"/>
      ${lettering('DAILY BRIEF',704,168,18,'#c4b5f2',pixel)}
      ${lines.map((line,i)=>lettering(line,704,firstBaseline+i*size*1.16,size,'#efeeea')).join('')}
      <path d="M64 528H1136" stroke="#2c2d33"/>
      ${lettering(dateLabel(date),64,568,23,'#a0a0a9')}
      ${lettering('chatgptfan.com',902,568,23,'#c4b5f2')}
      ${lettering('Independent. Not affiliated with OpenAI.',64,608,17,'#a0a0a9')}
      </svg>`;
  }
  const { size, lines } = fitHeadline(title,art?670:1040);
  const firstBaseline = 310 - ((lines.length - 1) * size * 1.16) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#111214"/>
    ${art?`<defs><linearGradient id="shade"><stop stop-color="#111214" stop-opacity=".98"/><stop offset=".52" stop-color="#111214" stop-opacity=".84"/><stop offset="1" stop-color="#111214" stop-opacity=".12"/></linearGradient></defs><image xlink:href="${art}" width="1200" height="630" preserveAspectRatio="xMidYMid slice"/><rect width="1200" height="630" fill="url(#shade)"/><rect y="504" width="1200" height="126" fill="#111214" fill-opacity=".88"/>`:''}
    <path d="M64 50h18v18h18v18H82v18H64V86H46V68h18Z" fill="#c4b5f2"/>
    ${lettering('ChatGPT Fan', 120, 88, 34, '#efeeea', pixel)}
    ${lettering(date ? 'DAILY BRIEF' : 'INDEPENDENT BY DESIGN', 64, 168, 18, '#c4b5f2', pixel)}
    ${lines.map((line,i) => lettering(line,64,firstBaseline+i*size*1.16,size,'#efeeea',headlineFont)).join('')}
    <path d="M64 504H1136" stroke="#2c2d33"/>
    ${lettering(date ? dateLabel(date) : 'News · Resources · Safety & Society',64,552,23,'#a0a0a9')}
    ${lettering('chatgptfan.com',902,552,23,'#c4b5f2')}
    ${lettering('Independent. Not affiliated with OpenAI.',64,594,17,'#a0a0a9')}
    </svg>`;
}
export async function buildSharingImages(briefs) {
  const directory = 'dist/assets/share';
  await mkdir(directory, { recursive:true });
  const images = new Map();
  for (const brief of [{ slug:'site', title:'A daily brief. A useful library.' }, ...briefs]) {
    let art;
    if(brief.image) {
      if(!/^briefs\/[a-z0-9-]+\.png$/.test(brief.image.src) || !brief.image.alt || !brief.image.credit || !Number.isInteger(brief.image.width) || !Number.isInteger(brief.image.height) || brief.image.width<1 || brief.image.height<1) throw new Error(`Invalid brief image: ${brief.slug}`);
      const bytes=await readFile('public/assets/'+brief.image.src);
      if(bytes.subarray(1,4).toString()!=='PNG' || bytes.readUInt32BE(16)!==brief.image.width || bytes.readUInt32BE(20)!==brief.image.height) throw new Error(`Brief image dimensions do not match: ${brief.slug}`);
      art='data:image/png;base64,'+bytes.toString('base64');
    }
    const svg = cardSVG(brief.title, brief.date, art, brief.image?.shareLayout);
    const png = new Resvg(svg, { font:{loadSystemFonts:false} }).render().asPng();
    const hash = createHash('sha256').update(png).digest('hex').slice(0,12);
    const name = `${brief.slug}-${hash}.png`;
    await writeFile(`${directory}/${name}`,png);
    images.set(brief.slug, `assets/share/${name}`);
  }
  return images;
}
export function sharingMeta({site,title,description,canonical,image,brief}) {
  const alt = brief ? `${site.name} · Daily Brief · ${dateLabel(brief.date)} · ${title}` : `${site.name} · A daily brief. A useful library.`;
  const article = brief ? {
    '@context':'https://schema.org', '@type':'Article', headline:title, description,
    datePublished:brief.date, mainEntityOfPage:canonical, url:canonical,
    image:[image], inLanguage:'en', articleSection:'Daily Brief',
    author:{'@type':'Organization',name:site.name,url:site.url+'/about/'},
    publisher:{'@type':'Organization',name:site.name,url:site.url}
  } : null;
  return `<meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:site_name" content="${e(site.name)}"><meta property="og:type" content="${brief?'article':'website'}"><meta property="og:url" content="${e(canonical)}"><meta property="og:image" content="${e(image)}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${e(alt)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${e(title)}"><meta name="twitter:description" content="${e(description)}"><meta name="twitter:image" content="${e(image)}"><meta name="twitter:image:alt" content="${e(alt)}">${brief?`<meta property="article:published_time" content="${e(brief.date)}"><script type="application/ld+json">${JSON.stringify(article).replace(/</g,'\\u003c')}</script>`:''}${site.googleSiteVerification?`<meta name="google-site-verification" content="${e(site.googleSiteVerification)}">`:''}`;
}
