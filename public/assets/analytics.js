export const CONSENT_KEY='chatgptfan-analytics-v1';
const MAX_AGE=180*86400000;
export function savedConsent(storage,now=Date.now()) {
  try {
    const value=JSON.parse(storage.getItem(CONSENT_KEY));
    return value && ['granted','denied'].includes(value.choice) && Number.isFinite(value.at) && value.at<=now && now-value.at<MAX_AGE ? value.choice : null;
  } catch {return null;}
}
export function permittedHost(actual,configured) {
  return Boolean(configured && (actual===configured || actual==='www.'+configured));
}
export function pageMetadata(location,referrer) {
  let origin='';
  try {origin=new URL(referrer).origin;} catch {}
  return {page_location:location.origin+location.pathname,page_referrer:origin};
}

export function initAnalytics(win,doc) {
  const id=doc.body.dataset.analyticsId,host=doc.body.dataset.analyticsHost;
  if(!/^G-[A-Z0-9]+$/.test(id||'') || !permittedHost(win.location.hostname,host)) return;
  const panel=doc.querySelector('[data-analytics-choice]');
  if(!panel) return;
  let storage;
  try {storage=win.localStorage;} catch {storage={getItem:()=>null,setItem:()=>{}};}
  let choice=savedConsent(storage),started=false;
  function gtag(){win.dataLayer.push(arguments);}
  const track=(name,parameters={})=>{
    if(choice==='granted' && started) gtag('event',name,{...pageMetadata(win.location,doc.referrer),...parameters});
  };
  const enable=()=>{
    if(started) return;
    win['ga-disable-'+id]=false;
    win.dataLayer=win.dataLayer||[]; win.gtag=gtag;
    gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    gtag('set','ads_data_redaction',true);
    gtag('js',new Date());
    gtag('config',id,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,cookie_path:'/',cookie_expires:180*86400,...pageMetadata(win.location,doc.referrer)});
    started=true;
    const tag=doc.createElement('script');tag.async=true;tag.src='https://www.googletagmanager.com/gtag/js?id='+id;
    tag.onerror=()=>{ /* A blocked analytics request never interrupts the page. */ };
    doc.head.append(tag);
    track('page_view');
  };
  const clearCookies=()=>{
    const names=doc.cookie.split(';').map(c=>c.trim().split('=')[0]).filter(n=>/^_ga(?:_|$)/.test(n));
    const parts=win.location.hostname.split('.');
    for(const name of names) {
      doc.cookie=`${name}=; Max-Age=0; Path=/; SameSite=Lax`;
      for(let i=0;i<parts.length-1;i++) doc.cookie=`${name}=; Max-Age=0; Path=/; Domain=${parts.slice(i).join('.')}; SameSite=Lax`;
    }
  };
  const setChoice=value=>{
    choice=value;
    try {storage.setItem(CONSENT_KEY,JSON.stringify({choice,at:Date.now()}));} catch {}
    panel.hidden=true;
    if(value==='granted') {
      if(started) {win['ga-disable-'+id]=false;gtag('consent','update',{analytics_storage:'granted'});} else enable();
    } else {
      win['ga-disable-'+id]=true;
      clearCookies();
      // Reload after withdrawal unloads Google's code instead of leaving background listeners running.
      if(started) win.location.reload();
    }
    const status=doc.querySelector('[data-privacy-consent-status]');
    if(status) status.textContent=value==='granted'?'Analytics allowed.':'Analytics declined.';
  };
  if(win.navigator?.globalPrivacyControl===true || win.navigator?.doNotTrack==='1' || win.doNotTrack==='1') {
    setChoice('denied');
    const status=doc.querySelector('[data-privacy-consent-status]');
    if(status) status.textContent='Analytics is off because your browser sends a privacy signal.';
    return;
  }
  panel.querySelector('[data-analytics-allow]').addEventListener('click',()=>setChoice('granted'));
  panel.querySelector('[data-analytics-deny]').addEventListener('click',()=>setChoice('denied'));
  const show=()=>{panel.hidden=false;};
  for(const button of doc.querySelectorAll('[data-open-analytics]')) {
    button.hidden=false;button.addEventListener('click',()=>{show();panel.querySelector('[data-analytics-deny]').focus();});
  }
  if(choice==='granted') enable();
  else if(!choice) show();
  doc.addEventListener('contact:sent',()=>track('contact_sent'));
  doc.addEventListener('click',event=>{
    const link=event.target.closest?.('a[href]');
    if(!link || link.closest('.contact-form')) return;
    try {const target=new URL(link.href);if(target.protocol==='https:' && target.origin!==win.location.origin) track('outbound_click',{destination_domain:target.hostname});}catch {}
  });
  win.addEventListener('storage',event=>{
    if(event.key!==CONSENT_KEY && event.key!==null) return;
    const next=savedConsent(storage);
    if(started && next!=='granted') {win['ga-disable-'+id]=true;win.location.reload();}
    else if(!started) {choice=next;panel.hidden=Boolean(next);if(next==='granted') enable();}
  });
}
if(typeof window!=='undefined' && typeof document!=='undefined') initAnalytics(window,document);
