import sharp from 'sharp';
import {mkdir, stat} from 'node:fs/promises';
import {dirname} from 'node:path';
import {escapeHTML as e} from './lib.mjs';

const variants=new Map();
export async function prepareImageDelivery(paths) {
  variants.clear();
  for(const src of new Set(paths)) {
    if(!/^(?:briefs\/)?[a-z0-9-]+\.png$/.test(src)) throw new Error('Invalid local image path: '+src);
    const input='public/assets/'+src, meta=await sharp(input).metadata(), sizes=[];
    for(const width of [480,960,1440].filter(w=>w<=meta.width)) {
      const file=src.replace(/\.png$/,`-${width}.webp`);
      await mkdir(dirname('dist/assets/'+file),{recursive:true});
      await sharp(input).resize({width,withoutEnlargement:true}).webp({quality:84,effort:5}).toFile('dist/assets/'+file);
      sizes.push({file,width,bytes:(await stat('dist/assets/'+file)).size});
    }
    variants.set(src,sizes);
  }
  return variants;
}

export function localImage(src,url,{alt='',width,height,eager=false,sizes='100vw'}={}) {
  const versions=variants.get(src)||[];
  return `<picture>${versions.length?`<source type="image/webp" srcset="${versions.map(v=>`${url('assets/'+v.file)} ${v.width}w`).join(', ')}" sizes="${e(sizes)}">`:''}<img src="${url('assets/'+src)}" alt="${e(alt)}" width="${width}" height="${height}" ${eager?'fetchpriority="high" loading="eager"':'loading="lazy"'} decoding="async"></picture>`;
}
