const notice = document.querySelector('#safety-notice');
// Remote feed thumbnails can disappear; preserve the headline and layout.
for (const img of document.querySelectorAll('[data-home-image]')) {
  const hideFailed = () => { img.hidden = true; };
  img.addEventListener('error', hideFailed);
  if (img.complete && !img.naturalWidth) hideFailed();
}
const noticeKey = `chatgptfan-safety-${notice?.dataset.version}`;
const remember = () => { try { localStorage.setItem(noticeKey, 'seen'); } catch {} };
if (notice && typeof notice.showModal === 'function') {
  let seen = false;
  try { seen = localStorage.getItem(noticeKey) === 'seen'; } catch {}
  notice.addEventListener('close', remember);
  notice.addEventListener('click', event => { if (event.target.closest('a')) remember(); });
  if (!seen && notice.dataset.autoOpen === 'true') notice.showModal();
}
for (const scope of document.querySelectorAll('[data-filter-scope]')) {
  const controls = scope.querySelector('[data-filter-controls]');
  const search = scope.querySelector('[data-filter-search]');
  const select = scope.querySelector('[data-filter-select]');
  const items = [...scope.querySelectorAll('[data-filter-item]')];
  const update = () => {
    const terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let count = 0;
      items.forEach(item => {
      item.hidden = !!((select.value && select.value !== item.dataset.kind) || !terms.every(term => item.textContent.toLowerCase().includes(term)));
      if (!item.hidden) count++;
      });
      for (const group of scope.querySelectorAll('[data-filter-group]')) {
        group.hidden = ![...group.querySelectorAll('[data-filter-item]')].some(item => !item.hidden);
      }
    scope.querySelector('.filter-count').textContent = `${count} ${count === 1 ? 'result' : 'results'}`;
    scope.querySelector('[data-filter-empty]').hidden = count > 0;
  };
  controls.hidden = false;
  search.addEventListener('input', update);
  select.addEventListener('change', update);
  update();
}
const searchForm = document.querySelector('#site-search');
if (searchForm) {
  const input = searchForm.querySelector('input');
  const results = document.querySelector('#search-results');
  const status = document.querySelector('#search-status');
  let index;
  let revision = 0;
  const render = async () => {
    const current = ++revision;
    const query = input.value.trim();
    const address = new URL(location.href);
    query ? address.searchParams.set('q', query) : address.searchParams.delete('q');
    history.replaceState(null, '', address);
    results.replaceChildren();
    if (!query) { status.textContent = 'Type to search the library.'; return; }
    status.textContent = 'Searching…';
    try {
      if (!index) {
        const response = await fetch(`${document.body.dataset.base}/search.json`);
        if (!response.ok) throw new Error('Search unavailable');
        index = await response.json();
      }
      if (current !== revision) return;
      const terms = query.toLowerCase().split(/\s+/);
      const matches = index.filter(item => terms.every(term => `${item.title} ${item.text} ${item.section}`.toLowerCase().includes(term)));
      status.textContent = `${matches.length} ${matches.length === 1 ? 'result' : 'results'}${matches.length ? '' : '. Try a broader search.'}`;
      for (const item of matches) {
        const article = document.createElement('article'); article.className = 'search-result';
        const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = item.section;
        const heading = document.createElement('h2');
        const link = document.createElement('a'); link.href = item.url; link.textContent = item.title;
        const description = document.createElement('p'); description.textContent = item.text.slice(0, 200) + (item.text.length > 200 ? '…' : '');
        heading.append(link); article.append(meta, heading, description); results.append(article);
      }
    } catch {
      if (current === revision) status.textContent = 'Search is temporarily unavailable. Browse the sections above or try again.';
    }
  };
  searchForm.addEventListener('submit', event => { event.preventDefault(); render(); });
  input.addEventListener('input', render);
  input.value = new URLSearchParams(location.search).get('q') ?? '';
  render();
}
