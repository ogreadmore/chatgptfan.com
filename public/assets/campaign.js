export const DISMISS_KEY='chatgptfan-campaign-dismissed-v1';
export const SESSION_KEY='chatgptfan-campaign-shown-v1';
export function recentlyDismissed(storage, days, now=Date.now()) {
  try {
    const at=Number(storage.getItem(DISMISS_KEY));
    return at>0 && at<=now && now-at<days*86400000;
  } catch {return false;}
}

export function initCampaign(win,doc) {
  const dialog=doc.querySelector('#campaign-dialog');
  if(!dialog || typeof dialog.showModal!=='function') return;
  const repeatOnEntry=dialog.dataset.repeatOnEntry==='true';
  let local,session;
  // Safety entry is an explicit repeat; other pages require working preference storage.
  try {
    local=win.localStorage;session=win.sessionStorage;
    const probe='chatgptfan-preference-check';
    for(const storage of [local,session]) {storage.setItem(probe,'1');storage.removeItem(probe);}
  } catch {if(!repeatOnEntry) return;}
  const days=Number(dialog.dataset.dismissDays), delay=Number(dialog.dataset.delay)*1000;
  if(!Number.isFinite(days)||days<90||!Number.isFinite(delay)||delay<0) return;
  const suppressed=()=>!repeatOnEntry && (recentlyDismissed(local,days)||session.getItem(SESSION_KEY));
  if(suppressed()) return;
  let elapsed=0,last=win.performance.now(),finished=false,previousFocus;
  const emit=outcome=>doc.dispatchEvent(new win.CustomEvent('campaign:interaction',{detail:{outcome}}));
  const remember=()=>{try {local.setItem(DISMISS_KEY,String(Date.now()));} catch {}};
  const close=outcome=>{remember();dialog.close();emit(outcome);};
  dialog.querySelectorAll('[data-campaign-close]').forEach(button=>button.addEventListener('click',()=>close('dismiss')));
  dialog.querySelector('[data-campaign-outbound]').addEventListener('click',()=>close('referral'));
  dialog.querySelector('[data-campaign-details]').addEventListener('click',()=>close('details'));
  dialog.addEventListener('cancel',event=>{event.preventDefault();close('dismiss');});
  dialog.addEventListener('close',()=>{remember();if(previousFocus?.isConnected) previousFocus.focus({preventScroll:true});});
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog) return;
    const b=dialog.getBoundingClientRect();
    if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom) close('dismiss');
  });
  const active=()=>doc.visibilityState==='visible' && (delay===0 || doc.hasFocus()) &&
    !doc.querySelector('dialog[open], [data-analytics-choice]:not([hidden])') &&
    !doc.activeElement?.closest('input,textarea,select,[contenteditable="true"],video,iframe');
  let wasActive=active();
  const tick=()=>{
    const now=win.performance.now(),isActive=active();
    if(wasActive&&isActive) elapsed+=Math.min(now-last,1500);
    last=now;wasActive=isActive;
    if(finished || elapsed<delay || !isActive) return;
    finished=true;win.clearInterval(timer);
    if(suppressed()) return;
    try {session.setItem(SESSION_KEY,'1');} catch {if(!repeatOnEntry) return;}
    previousFocus=doc.activeElement;
    dialog.showModal();emit('shown');
  };
  const timer=win.setInterval(tick,500);
  doc.addEventListener('visibilitychange',()=>{last=win.performance.now();wasActive=active();});
  tick();
}
if(typeof window!=='undefined'&&typeof document!=='undefined') initCampaign(window,document);
