const dialog=document.querySelector('#contact-dialog');
if(dialog && typeof dialog.showModal==='function') {
  document.querySelectorAll('[data-open-contact]').forEach(link=>link.addEventListener('click',event=>{
    if(event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); dialog.showModal();
  }));
  dialog.querySelector('[data-contact-close]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog) return;
    const box=dialog.getBoundingClientRect();
    if(event.clientX<box.left || event.clientX>box.right || event.clientY<box.top || event.clientY>box.bottom) dialog.close();
  });
}
for(const form of document.querySelectorAll('[data-contact-form]')) {
  let pending=false;
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(pending || form.dataset.ready!=='true' || !form.reportValidity()) return;
    const status=form.querySelector('[data-contact-status]');
    const button=form.querySelector('[type="submit"]');
    const endpoint=form.getAttribute('action');
    if(!/^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(endpoint)) return;
    const body=new FormData(form);
    pending=true; button.disabled=true; form.setAttribute('aria-busy','true');
    status.textContent='Sending…';
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),20000);
    try {
      const response=await fetch(endpoint,{method:'POST',body,headers:{Accept:'application/json'},signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
      if(!response.ok) {
        status.textContent=response.status===429?'Too many attempts. Please wait before trying again. Your message is still here.':'Your message could not be sent. Please check the fields and try again. Your message is still here.';
        return;
      }
      form.reset(); status.textContent='Message sent. Thank you for getting in touch.';
      document.dispatchEvent(new Event('contact:sent'));
    } catch {
      status.textContent='We could not confirm delivery. Your message is still here; check your connection before trying again.';
    } finally {clearTimeout(timer);pending=false;button.disabled=false;form.removeAttribute('aria-busy');}
  });
}
