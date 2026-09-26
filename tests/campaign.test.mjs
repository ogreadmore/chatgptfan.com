import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateCampaign,campaignEligible,campaignModal} from '../scripts/campaign.mjs';
import {DISMISS_KEY,SESSION_KEY,recentlyDismissed,initCampaign} from '../public/assets/campaign.js';

const config=JSON.parse(await readFile('content/campaign.json','utf8'));
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};};
function harness() {
  const listener=()=>({handlers:{},addEventListener(n,fn){this.handlers[n]=fn;}});
  const close=listener(),outbound=listener(),details=listener(),dialog=listener();
  let time=0,interval,restored=0;
  Object.assign(dialog,{dataset:{delay:'20',dismissDays:'90'},open:false,showModal(){this.open=true;},close(){this.open=false;this.handlers.close();},querySelectorAll:()=>[close],querySelector:s=>s==='[data-campaign-outbound]'?outbound:details});
  const doc={...listener(),visibilityState:'visible',focused:true,blocked:false,editing:false,hasFocus(){return this.focused;},querySelector:s=>s==='#campaign-dialog'?dialog:(doc.blocked?{}:null),activeElement:{isConnected:true,focus(){restored++;},closest:()=>doc.editing},events:[],dispatchEvent(e){this.events.push(e.detail.outcome);}};
  const win={localStorage:storage(),sessionStorage:storage(),performance:{now:()=>time},setInterval:fn=>{interval=fn;return 1;},clearInterval:()=>interval=null,CustomEvent:class {constructor(type,options){this.type=type;this.detail=options.detail;}}};
  return {doc,win,dialog,close,outbound,advance(ms){for(let i=0;i<ms;i+=500){time+=500;interval?.();}},restored:()=>restored};
}
test('campaign is limited to reading routes and a verified destination',()=>{
  validateCampaign(config);
  for(const route of ['','brief/2026-09-26/','news/social/','resources/learn/','safety/']) assert.equal(campaignEligible(route),true);
  for(const route of ['contact/','privacy/','terms/','search/','safety/take-action/','social/','404.html']) assert.equal(campaignEligible(route),false);
  for(const change of [{url:'javascript:alert(1)'},{delaySeconds:0},{dismissDays:1}]) assert.throws(()=>validateCampaign({...config,...change}));
  assert.equal(campaignModal({...config,enabled:false},p=>'/'+p),'');
});
test('invitation waits for visible focused reading and never overlaps other choices or editing',()=>{
  const h=harness();initCampaign(h.win,h.doc);
  h.advance(19500);assert.equal(h.dialog.open,false);
  h.doc.visibilityState='hidden';h.advance(30000);assert.equal(h.dialog.open,false);
  h.doc.visibilityState='visible';h.doc.blocked=true;h.advance(30000);assert.equal(h.dialog.open,false);
  h.doc.blocked=false;h.doc.editing=true;h.advance(30000);assert.equal(h.dialog.open,false);
  h.doc.editing=false;h.doc.focused=false;h.advance(30000);assert.equal(h.dialog.open,false);
  h.doc.focused=true;h.advance(1000);assert.equal(h.dialog.open,true);assert.deepEqual(h.doc.events,['shown']);
  h.close.handlers.click();assert.equal(h.dialog.open,false);assert.equal(h.restored(),1);
  assert.ok(recentlyDismissed(h.win.localStorage,90));assert.equal(h.win.sessionStorage.getItem(SESSION_KEY),'1');
  initCampaign(h.win,h.doc);h.advance(30000);assert.equal(h.dialog.open,false);
});
test('Escape and outbound referrals close and persist; disabled storage never nags',()=>{
  for(const action of ['escape','outbound']) {
    const h=harness();initCampaign(h.win,h.doc);h.advance(20000);
    if(action==='escape') h.dialog.handlers.cancel({preventDefault(){}});else h.outbound.handlers.click();
    assert.equal(h.dialog.open,false);assert.ok(recentlyDismissed(h.win.localStorage,90));
    assert.equal(h.doc.events.at(-1),action==='escape'?'dismiss':'referral');
  }
  const h=harness();h.win.localStorage.setItem=()=>{throw Error('blocked');};initCampaign(h.win,h.doc);h.advance(60000);assert.equal(h.dialog.open,false);
});
test('dismissal expires at 90 days and rejects malformed or future dates',()=>{
  const s=storage(),now=Date.now();
  for(const [at,expected] of [[now,true],[now-89*86400000,true],[now-90*86400000,false],[now+100,false],['bad',false]]) {
    s.setItem(DISMISS_KEY,String(at));assert.equal(recentlyDismissed(s,90,now),expected);
  }
});
