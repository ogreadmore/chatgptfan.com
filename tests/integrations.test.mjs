import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { validateIntegrations, contactForm } from '../scripts/contact-page.mjs';
import { CONSENT_KEY, savedConsent, pageMetadata, initAnalytics } from '../public/assets/analytics.js';

test('integration configuration rejects unsafe destinations and incomplete analytics activation',()=>{
  assert.doesNotThrow(()=>validateIntegrations({}));
  assert.throws(()=>validateIntegrations({contact:{formspreeEndpoint:'https://formspree.io.evil.test/f/abc'}}));
  assert.throws(()=>validateIntegrations({analytics:{enabled:true,measurementId:'G-ABC'}}));
  assert.doesNotThrow(()=>validateIntegrations({analytics:{enabled:true,measurementId:'G-ABC',enhancedMeasurementDisabled:true}}));
  const html=contactForm({},p=>'/'+p,'test');
  assert.ok(html.includes('<fieldset disabled>'));
  assert.ok(!html.includes('action='));
});

test('analytics consent expires and query strings are never added to page metadata',()=>{
  const now=Date.now();
  const storage=record=>({getItem:()=>JSON.stringify(record)});
  assert.equal(savedConsent(storage({choice:'granted',at:now}),now),'granted');
  assert.equal(savedConsent(storage({choice:'granted',at:now-181*86400000}),now),null);
  assert.equal(savedConsent(storage({choice:'granted',at:now+100}),now),null);
  assert.deepEqual(pageMetadata(new URL('https://chatgptfan.com/search/?q=private#secret'),'https://other.test/profile?email=secret'),{page_location:'https://chatgptfan.com/search/',page_referrer:'https://other.test'});
});

function analyticsHarness(hostname='chatgptfan.com') {
  const listener=()=>({handlers:{},hidden:true,addEventListener(name,fn){this.handlers[name]=fn;},focus(){}});
  const allow=listener(),deny=listener(),panel=listener();
  panel.querySelector=s=>s==='[data-analytics-allow]'?allow:deny;
  const tags=[],events={},memory=new Map();let reloads=0;
  const win={location:{hostname,origin:'https://'+hostname,pathname:'/search/',search:'?q=private',reload:()=>reloads++},localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},addEventListener:(n,fn)=>events[n]=fn};
  const doc={body:{dataset:{analyticsId:'G-TEST',analyticsHost:'chatgptfan.com'}},referrer:'https://other.test/?secret=hidden',cookie:'',querySelector:s=>s==='[data-analytics-choice]'?panel:null,querySelectorAll:()=>[],createElement:()=>({}),head:{append:tag=>tags.push(tag)},addEventListener:(n,fn)=>events[n]=fn};
  return {win,doc,tags,allow,deny,panel,memory,reloads:()=>reloads};
}

test('analytics makes no tag request before opt-in, supports withdrawal, and ignores local previews',()=>{
  const h=analyticsHarness();initAnalytics(h.win,h.doc);
  assert.equal(h.tags.length,0); assert.equal(h.panel.hidden,false);
  h.deny.handlers.click();assert.equal(h.tags.length,0);
  h.allow.handlers.click();assert.equal(h.tags.length,1);
  const calls=h.win.dataLayer.map(a=>Array.from(a));
  assert.equal(calls.filter(c=>c[0]==='event'&&c[1]==='page_view').length,1);
  assert.ok(!JSON.stringify(calls).includes('private'));
  assert.equal(calls.find(c=>c[0]==='config')[2].allow_google_signals,false);
  h.deny.handlers.click();assert.equal(h.win['ga-disable-G-TEST'],true);assert.equal(h.reloads(),1);
  const local=analyticsHarness('127.0.0.1');initAnalytics(local.win,local.doc);assert.equal(local.tags.length,0);assert.equal(local.panel.hidden,true);
});

test('contact preserves input on failure, confirms success only on OK, and never sends while inactive',async()=>{
  const script=await readFile('public/assets/contact.js','utf8');
  let handler,resets=0,requests=0,sent=0,ok=false;
  const status={textContent:''},button={disabled:false};
  const form={dataset:{ready:'true'},reportValidity:()=>true,getAttribute:()=> 'https://formspree.io/f/testform',querySelector:s=>s==='[data-contact-status]'?status:button,addEventListener:(n,fn)=>handler=fn,setAttribute(){},removeAttribute(){},reset(){resets++;}};
  const doc={querySelector:()=>null,querySelectorAll:()=>[form],dispatchEvent:()=>sent++};
  vm.runInNewContext(script,{document:doc,FormData:class{},AbortController,Event,setTimeout,clearTimeout,fetch:async()=>{requests++;return {ok,status:ok?200:500};}});
  await handler({preventDefault(){}});assert.equal(resets,0);assert.match(status.textContent,/could not be sent/);assert.equal(button.disabled,false);
  ok=true;await handler({preventDefault(){}});assert.equal(resets,1);assert.equal(sent,1);assert.match(status.textContent,/Message sent/);
  form.dataset.ready='false';await handler({preventDefault(){}});assert.equal(requests,2);
});

test('browser privacy signals override saved analytics consent without loading Google',()=>{
  for(const signal of [{globalPrivacyControl:true},{doNotTrack:'1'}]) {
    const h=analyticsHarness();h.win.navigator=signal;
    h.memory.set(CONSENT_KEY,JSON.stringify({choice:'granted',at:Date.now()}));
    h.doc.cookie='_ga=previous';
    initAnalytics(h.win,h.doc);
    assert.equal(h.tags.length,0);
    assert.equal(h.panel.hidden,true);
    assert.equal(savedConsent(h.win.localStorage),'denied');
    assert.equal(h.win['ga-disable-G-TEST'],true);
    assert.match(h.doc.cookie,/Max-Age=0/);
  }
});
