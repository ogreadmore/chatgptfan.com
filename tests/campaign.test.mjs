import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateCampaign,campaignEligible,campaignModal} from '../scripts/campaign.mjs';
import {SESSION_KEY,followedKey,initCampaign} from '../public/assets/campaign.js';
const config=JSON.parse(await readFile('content/campaign.json','utf8'));
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};};
function harness() {
  const listener=()=>({handlers:{},addEventListener(n,fn){const previous=this.handlers[n];this.handlers[n]=e=>{previous?.(e);fn(e);};}});
  const close=listener(),outbound=listener(),details=listener(),dialog=listener();
  outbound.dataset={campaignOutbound:config.id};
  let time=0,interval,restored=0;
  Object.assign(dialog,{dataset:{delay:String(config.delaySeconds),campaignId:config.id},open:false,showModal(){this.open=true;},close(){this.open=false;this.handlers.close();},querySelectorAll:()=>[close],querySelector:s=>s==='[data-campaign-outbound]'?outbound:details});
  const doc={...listener(),visibilityState:'visible',focused:true,blocked:false,editing:false,hasDialog:true,hasFocus(){return this.focused;},querySelector:s=>s==='#campaign-dialog'?(doc.hasDialog?dialog:null):(doc.blocked?{}:null),querySelectorAll:()=>[outbound],activeElement:{isConnected:true,focus(){restored++;},closest:()=>doc.editing},events:[],dispatchEvent(e){this.events.push(e.detail.outcome);}};
  const win={localStorage:storage(),sessionStorage:storage(),performance:{now:()=>time},setInterval:fn=>{interval=fn;return 1;},clearInterval:()=>interval=null,CustomEvent:class {constructor(type,options){this.type=type;this.detail=options.detail;}}};
  return {doc,win,dialog,close,outbound,advance(ms){for(let i=0;i<ms;i+=500){time+=500;interval?.();}},restored:()=>restored};
}
const nextPage=(previous,newSession=false)=>{const h=harness();h.win.localStorage=previous.win.localStorage;if(!newSession)h.win.sessionStorage=previous.win.sessionStorage;return h;};
test('campaign routes and destination remain restricted, with one global display policy',()=>{
  validateCampaign(config);
  for(const route of ['','brief/2026-09-26/','news/social/','resources/learn/','safety/']) assert.equal(campaignEligible(route),true);
  for(const route of ['contact/','privacy/','terms/','search/','safety/take-action/','social/','404.html']) assert.equal(campaignEligible(route),false);
  for(const change of [{url:'javascript:alert(1)'},{delaySeconds:-1}]) assert.throws(()=>validateCampaign({...config,...change}));
  assert.equal(campaignModal({...config,enabled:false},p=>'/'+p),'');
  assert.match(campaignModal(config,p=>'/'+p),/data-campaign-id="superintelligence-statement"/);
  assert.ok(!campaignModal(config,p=>'/'+p).includes('repeat-on-entry'));
});
test('one invitation per session: dismiss on homepage, stay quiet on Safety, eligible next session',()=>{
  const home=harness();home.doc.focused=false;initCampaign(home.win,home.doc);
  assert.equal(home.dialog.open,true);home.close.handlers.click();assert.equal(home.restored(),1);
  assert.equal(home.win.sessionStorage.getItem(SESSION_KEY),'1');
  assert.equal(home.win.localStorage.getItem(followedKey(config.id)),null);
  const safety=nextPage(home);initCampaign(safety.win,safety.doc);safety.advance(30000);assert.equal(safety.dialog.open,false);
  const next=nextPage(home,true);initCampaign(next.win,next.doc);assert.equal(next.dialog.open,true);
});
test('Read & sign suppresses future sessions from both the modal and the permanent action page',()=>{
  for(const hasDialog of [true,false]) for(const type of ['click','auxclick']) {
    const h=harness();h.doc.hasDialog=hasDialog;initCampaign(h.win,h.doc);
    h.outbound.handlers[type]({type,button:type==='auxclick'?1:0});
    assert.equal(h.win.localStorage.getItem(followedKey(config.id)),'1');
    const future=nextPage(h,true);initCampaign(future.win,future.doc);assert.equal(future.dialog.open,false);
    assert.ok(!JSON.stringify(h.doc.events).includes('signed'));
  }
  const h=harness();initCampaign(h.win,h.doc);h.outbound.handlers.auxclick({type:'auxclick',button:2});
  assert.equal(h.win.localStorage.getItem(followedKey(config.id)),null);
});
test('campaign-specific stop survives independently of session storage and does not stop a different campaign',()=>{
  const h=harness();h.win.localStorage.setItem(followedKey('another-campaign'),'1');initCampaign(h.win,h.doc);
  assert.equal(h.dialog.open,true);
});
test('hidden pages, competing dialogs, and inputs postpone showing; unavailable storage skips it',()=>{
  for(const reason of ['hidden','blocked','editing']) {
    const h=harness();if(reason==='hidden') h.doc.visibilityState='hidden';else h.doc[reason]=true;
    initCampaign(h.win,h.doc);h.advance(30000);assert.equal(h.dialog.open,false);
    h.doc.visibilityState='visible';h.doc.blocked=false;h.doc.editing=false;h.advance(500);assert.equal(h.dialog.open,true);
    h.dialog.handlers.cancel({preventDefault(){}});h.advance(30000);assert.equal(h.dialog.open,false);
    assert.equal(h.doc.events.at(-1),'dismiss');assert.equal(h.win.localStorage.getItem(followedKey(config.id)),null);
  }
  const h=harness();h.win.localStorage.setItem=()=>{throw Error('blocked');};initCampaign(h.win,h.doc);h.advance(30000);assert.equal(h.dialog.open,false);
});
test('optional reading delay only counts visible focused time',()=>{
  const h=harness();h.dialog.dataset.delay='20';initCampaign(h.win,h.doc);h.advance(19500);assert.equal(h.dialog.open,false);
  h.doc.focused=false;h.advance(30000);assert.equal(h.dialog.open,false);
  h.doc.focused=true;h.advance(1000);assert.equal(h.dialog.open,true);
});
