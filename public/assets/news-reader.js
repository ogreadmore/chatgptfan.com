const reader = document.querySelector('#news-reader');
if (reader) {
  const storageKey = 'chatgptfan-reader-v1';
  let state = {read:[],saved:{}};
  let storageAvailable = true;
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    if (stored && Array.isArray(stored.read) && stored.saved && typeof stored.saved === 'object') state=stored;
  } catch { storageAvailable=false; }
  const read = new Set(state.read.filter(id=>typeof id==='string'));
  const saved = new Map(Object.entries(state.saved).filter(([id,item])=>{
    try { return /^[a-f0-9]{16}$/.test(id) && typeof item.title==='string' && typeof item.source==='string' && typeof item.type==='string' && typeof item.sourceId==='string' && Number.isFinite(Date.parse(item.publishedAt)) && ['https:','http:'].includes(new URL(item.url).protocol); } catch { return false; }
  }));
  const board=reader.querySelector('#reader-groups');
  const panels=[...board.querySelectorAll('[data-feed]')];
  const stories=[...board.querySelectorAll('[data-story-id]')];
  const node=(tag,className,text)=>{const el=document.createElement(tag);el.className=className;if(text)el.textContent=text;return el;};
  const stamp=date=>new Intl.DateTimeFormat('en-US',{timeZone:reader.dataset.timezone,month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(date));
  const titleFor=row=>row.querySelector('.reader-story-title').textContent;
  const imageURL=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname.includes('.')&&!/(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(u.hostname)&&! /^[\d.]+$/.test(u.hostname)&&!u.hostname.includes(':')?u.href:null;}catch{return null;}};
  const addPreview=(link,item)=>{
    const src=imageURL(item.image);if(!src)return;
    const preview=node('span','reader-preview');const img=node('img','');
    Object.assign(img,{src,alt:'',width:160,height:100,loading:'lazy',decoding:'async',referrerPolicy:'no-referrer'});preview.append(img);
    if(item.format==='video'){const play=node('span','reader-play','▶');play.setAttribute('aria-hidden','true');preview.append(play);}
    link.prepend(preview);
  };
  // Retain saved stories when they age out of the rolling source feeds.
  for(const [id,item] of saved) {
    if(stories.some(row=>row.dataset.storyId===id))continue;
    const row=node('article','reader-story');Object.assign(row.dataset,{storyId:id,source:item.sourceId,published:item.publishedAt,archived:'true',format:item.format??'article'});
    const dot=node('button','reader-read-dot');dot.type='button';dot.dataset.markRead='';
    const content=node('div','reader-story-content');const heading=node('h4','');
    const link=node('a','reader-story-link');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';
    const label=node('span','reader-story-label');label.append(node('span','reader-story-title',item.title),node('span','sr-only',' (opens in a new tab)'));link.append(label);addPreview(link,item);heading.append(link);
    const meta=node('div','reader-story-meta');const time=node('time','',stamp(item.publishedAt));time.dateTime=item.publishedAt;
    meta.append(node('span','reader-story-source',item.source),node('span','reader-story-type',item.type),time);content.append(heading,meta);
    const button=node('button','reader-save','◇');button.type='button';button.dataset.saveStory='';
    row.append(dot,content,button);stories.push(row);
  }
  const latest=node('section','reader-panel');
  // Hide unavailable remote images without leaving a broken-image box.
  reader.addEventListener('error',event=>{if(event.target.matches?.('.reader-preview img'))event.target.closest('.reader-preview').remove();},true);
  for(const row of stories)for(const img of row.querySelectorAll('.reader-preview img')) {
    img.addEventListener('error',()=>img.closest('.reader-preview')?.remove(),{once:true});
    if(img.complete&&!img.naturalWidth)img.closest('.reader-preview')?.remove();
  }
  latest.append(node('div','reader-panel-stories'));
  const latestMore=node('button','reader-more','Show more stories ↓');latestMore.type='button';latestMore.dataset.readerMore='';latest.append(latestMore);
  const search=reader.querySelector('#reader-search');
  const params=new URLSearchParams(location.search);
  const sourceButtons=[...reader.querySelectorAll('[data-reader-source]')];
  const categoryButtons=[...reader.querySelectorAll('[data-reader-category]')];
  let source=sourceButtons.some(b=>b.dataset.readerSource===params.get('source'))?params.get('source'):'';
  let category=categoryButtons.some(b=>b.dataset.readerCategory===params.get('category'))?params.get('category'):'';
  let view=params.get('view')==='saved'?'saved':'all';
  let layout=params.get('layout')==='latest'?'latest':'board';
  let unread=params.get('unread')==='1';
  search.value=params.get('q')??'';
  const limits=new Map();
  const persist=()=>{
    try{localStorage.setItem(storageKey,JSON.stringify({read:[...read].slice(-4000),saved:Object.fromEntries(saved)}));}catch{storageAvailable=false;}
    reader.querySelector('#reader-storage-note').hidden=storageAvailable;
  };
  function update() {
    const focused=document.activeElement;
    const terms=search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const matches=[];
    for(const row of stories){
      const id=row.dataset.storyId;const isSaved=saved.has(id);const isRead=read.has(id);
      row.classList.toggle('is-read',isRead);
      const mark=row.querySelector('[data-mark-read]');mark.setAttribute('aria-label',`Mark as ${isRead?'unread':'read'}: ${titleFor(row)}`);mark.title=`Mark as ${isRead?'unread':'read'}`;
      const save=row.querySelector('[data-save-story]');save.setAttribute('aria-pressed',String(isSaved));save.setAttribute('aria-label',`${isSaved?'Remove saved story':'Save'}: ${titleFor(row)}`);save.title=isSaved?'Remove saved story':'Save story';
      const panel=panels.find(p=>p.dataset.feed===row.dataset.source);
      const match=(view==='saved'?isSaved:row.dataset.archived!=='true')&&(!source||row.dataset.source===source)&&(!category||panel?.dataset.category===category)&&(!unread||!isRead)&&terms.every(term=>row.textContent.toLowerCase().includes(term));
      row.hidden=!match;
      if(match)matches.push(row);
    }
    matches.sort((a,b)=>b.dataset.published.localeCompare(a.dataset.published));
    const flat=layout==='latest'||view==='saved';
    board.classList.toggle('is-latest',flat);board.classList.toggle('is-focused',Boolean(source)&&!flat);
    // Move the same article nodes between layouts so saved/read state never duplicates.
    board.replaceChildren(...(flat?[latest]:panels));
    for(const panel of (flat?[latest]:panels)){
      const matching=flat?matches:matches.filter(row=>row.dataset.source===panel.dataset.feed);
      const list=panel.querySelector('.reader-panel-stories');
      const limit=limits.get(flat?'latest':panel.dataset.feed)??(flat||source?20:5);
      list.replaceChildren(...matching);
      matching.forEach((row,index)=>row.hidden=index>=limit);
      const more=panel.querySelector('[data-reader-more]');more.hidden=matching.length<=limit;
      more.textContent=flat?`Show more · ${matching.length-limit} remaining ↓`:`More from ${panel.dataset.name} · ${matching.length-limit} ↓`;
      panel.hidden=matching.length===0;
      const empty=panel.querySelector('.reader-panel-empty');if(empty)empty.hidden=matching.length>0;
    }
    const heading=source?panels.find(p=>p.dataset.feed===source)?.dataset.name:category||(view==='saved'?'Saved stories':layout==='latest'?'Latest stories':'Overview');
    reader.querySelector('#reader-view-title').textContent=heading;
    reader.querySelector('#reader-result-count').textContent=`${matches.length} ${matches.length===1?'story':'stories'}`;
    reader.querySelector('#saved-count').textContent=saved.size;
    reader.querySelectorAll('[data-reader-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.readerView===view&&!source&&!category)));
    sourceButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.readerSource===source)));
    categoryButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.readerCategory===category)));
    reader.querySelectorAll('[data-reader-layout]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.readerLayout===(flat?'latest':'board'))));
    reader.querySelector('#reader-unread').setAttribute('aria-pressed',String(unread));
    const empty=reader.querySelector('#reader-empty');empty.hidden=matches.length>0;
    empty.querySelector('h3').textContent=view==='saved'&&!saved.size?'Your reading list starts here':'No matching stories';
    empty.querySelector('p').textContent=view==='saved'&&!saved.size?'Save a headline using the bookmark beside it.':'Try a broader search or clear your filters.';
    const address=new URL(location.href);
    address.searchParams.delete('sort');
    for(const [key,value] of Object.entries({source,category,view:view==='saved'?'saved':'',layout:layout==='latest'?'latest':'',unread:unread?'1':'',q:search.value.trim()}))value?address.searchParams.set(key,value):address.searchParams.delete(key);
    history.replaceState(null,'',address);
    reader.querySelector('#reader-source-select').value=source;
    if(focused instanceof HTMLElement && focused.isConnected && focused.getClientRects().length) focused.focus({preventScroll:true});
  }
  const change=fn=>{fn();limits.clear();update();};
  reader.querySelectorAll('[data-reader-control]').forEach(el=>el.hidden=false);
  reader.querySelectorAll('[data-reader-view]').forEach(b=>b.addEventListener('click',()=>change(()=>{view=b.dataset.readerView;source='';category='';})));
  sourceButtons.forEach(b=>b.addEventListener('click',()=>change(()=>{source=b.dataset.readerSource;category='';view='all';})));
  categoryButtons.forEach(b=>b.addEventListener('click',()=>change(()=>{category=category===b.dataset.readerCategory?'':b.dataset.readerCategory;source='';view='all';})));
  reader.querySelectorAll('[data-reader-layout]').forEach(b=>b.addEventListener('click',()=>change(()=>{layout=b.dataset.readerLayout;if(layout==='board'&&view==='saved')view='all';})));
  reader.querySelector('#reader-source-select').addEventListener('change',event=>change(()=>{source=event.target.value;category='';view='all';}));
  search.addEventListener('input',()=>change(()=>{}));
  reader.querySelector('#reader-unread').addEventListener('click',()=>change(()=>{unread=!unread;}));
  reader.querySelector('#reader-clear').addEventListener('click',()=>change(()=>{source='';category='';view='all';unread=false;search.value='';}));
  const markRead=event=>{
    const link=event.target.closest('.reader-story-link');if(!link||(event.type==='auxclick'&&event.button!==1))return;
    read.add(link.closest('[data-story-id]').dataset.storyId);persist();
    // Leave the native anchor in place until the browser dispatches navigation.
    setTimeout(update,0);
  };
  reader.addEventListener('auxclick',markRead);
  reader.addEventListener('click',event=>{
    markRead(event);
    const more=event.target.closest('[data-reader-more]');
    if(more){const panel=more.closest('.reader-panel');const key=panel===latest?'latest':panel.dataset.feed;limits.set(key,(limits.get(key)??(panel===latest||source?20:5))+10);update();return;}
    const mark=event.target.closest('[data-mark-read]');
    if(mark){const id=mark.closest('[data-story-id]').dataset.storyId;read.has(id)?read.delete(id):read.add(id);persist();update();return;}
    const button=event.target.closest('[data-save-story]');if(!button)return;
    const row=button.closest('[data-story-id]');const id=row.dataset.storyId;
    if(saved.has(id))saved.delete(id);
    else saved.set(id,{title:titleFor(row),url:row.querySelector('.reader-story-link').href,publishedAt:row.dataset.published,sourceId:row.dataset.source,source:row.querySelector('.reader-story-source').textContent,type:row.querySelector('.reader-story-type').textContent,image:row.querySelector('.reader-preview img')?.src,format:row.dataset.format});
    persist();update();
  });
  reader.querySelector('#reader-storage-note').hidden=storageAvailable;
  update();
}
