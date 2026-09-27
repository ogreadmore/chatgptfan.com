export const SESSION_KEY='chatgptfan-campaign-shown-v1';
export const followedKey=id=>'chatgptfan-campaign-followed:'+id;

export function initCampaign(win,doc) {
  // Also runs on Take action, which has a signing link but no automatic dialog.
  for(const link of doc.querySelectorAll('[data-campaign-outbound]')) {
    const follow=event=>{
      if(event.type==='auxclick' && event.button!==1) return;
      const id=link.dataset.campaignOutbound;
      if(!/^[a-z0-9-]+$/.test(id||'')) return;
      try {win.localStorage.setItem(followedKey(id),'1');} catch {}
    };
    link.addEventListener('click',follow);
    link.addEventListener('auxclick',follow);
  }
  const dialog=doc.querySelector('#campaign-dialog');
  if(!dialog || typeof dialog.showModal!=='function') return;
  const id=dialog.dataset.campaignId;
  if(!/^[a-z0-9-]+$/.test(id||'')) return;
  let local,session;
  // Without preference storage, use the permanent action page instead of risking repeat prompts.
  try {
    local=win.localStorage;session=win.sessionStorage;
    const probe='chatgptfan-preference-check';
    for(const storage of [local,session]) {storage.setItem(probe,'1');storage.removeItem(probe);}
  } catch {return;}
  const delay=Number(dialog.dataset.delay)*1000;
  if(!Number.isFinite(delay)||delay<0) return;
  const suppressed=()=>local.getItem(followedKey(id))==='1' || session.getItem(SESSION_KEY);
  if(suppressed()) return;
  let elapsed=0,last=win.performance.now(),finished=false,previousFocus;
  const emit=outcome=>doc.dispatchEvent(new win.CustomEvent('campaign:interaction',{detail:{outcome}}));
  const close=outcome=>{dialog.close();emit(outcome);};
  dialog.querySelectorAll('[data-campaign-close]').forEach(button=>button.addEventListener('click',()=>close('dismiss')));
  dialog.querySelector('[data-campaign-outbound]').addEventListener('click',()=>close('referral'));
  dialog.querySelector('[data-campaign-details]').addEventListener('click',()=>close('details'));
  dialog.addEventListener('cancel',event=>{event.preventDefault();close('dismiss');});
  dialog.addEventListener('close',()=>{if(previousFocus?.isConnected) previousFocus.focus({preventScroll:true});});
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
    try {session.setItem(SESSION_KEY,'1');} catch {return;}
    previousFocus=doc.activeElement;
    dialog.showModal();emit('shown');
  };
  const timer=win.setInterval(tick,500);
  doc.addEventListener('visibilitychange',()=>{last=win.performance.now();wasActive=active();});
  tick();
}
if(typeof window!=='undefined'&&typeof document!=='undefined') initCampaign(window,document);
