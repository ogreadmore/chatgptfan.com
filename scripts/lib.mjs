import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { dirname } from 'node:path';

export const readJSON = async path => JSON.parse(await readFile(path, 'utf8'));
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const isWebURL = value => { try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; } };
export function safeImageURL(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || !url.hostname.includes('.') || /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(url.hostname) || /^[\d.]+$/.test(url.hostname) || url.hostname.includes(':')) return null;
    return url.href;
  } catch { return null; }
}
export function canonicalURL(value) {
  const url = new URL(value);
  for (const key of [...url.searchParams.keys()]) if (/^(utm_|fbclid$|gclid$)/i.test(key)) url.searchParams.delete(key);
  url.hash = '';
  return url.href.replace(/\/$/, '');
}
export async function writeAtomic(file, contents) {
  await mkdir(dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  await writeFile(temporary, contents);
  await rename(temporary, file);
}
export function dateLabel(date, options = {}) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC', ...options }).format(new Date(date.length === 10 ? `${date}T12:00:00Z` : date));
}
