import { escapeHTML as e } from './lib.mjs';

export function validateIntegrations(site) {
  const endpoint=site.contact?.formspreeEndpoint || '';
  if(endpoint && !/^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(endpoint)) throw new Error('Contact requires a Formspree /f/ endpoint');
  const a=site.analytics || {};
  if(a.measurementId && !/^G-[A-Z0-9]+$/.test(a.measurementId)) throw new Error('Invalid GA4 measurement ID');
  if(a.enabled && (!a.measurementId || !a.enhancedMeasurementDisabled)) throw new Error('Before enabling analytics, set a GA4 ID and confirm Enhanced Measurement is disabled');
}

export function contactForm(site,url,prefix) {
  const endpoint=site.contact?.formspreeEndpoint || '';
  return `<form class="contact-form" data-contact-form data-ready="${Boolean(endpoint)}" method="post" ${endpoint?`action="${e(endpoint)}"`:''} aria-describedby="${prefix}-notice">
    <p id="${prefix}-notice" class="contact-note">${endpoint?'Questions, corrections, or something worth sharing.':'The contact form is not open yet. Please check back soon.'}</p>
    <fieldset ${endpoint?'':'disabled'}><legend class="sr-only">Your message</legend><div class="contact-fields"><label>Name <span>optional</span><input name="name" type="text" autocomplete="name" maxlength="100"></label><label>Email<input name="email" type="email" autocomplete="email" required maxlength="254"></label></div>
    <label>What’s this about?<select name="topic" required><option>General question</option><option>Correction</option><option>Suggest a resource</option><option>Business inquiry</option></select></label><label>Message<textarea name="message" rows="5" required minlength="10" maxlength="5000" placeholder="For a correction or suggestion, please include a link."></textarea></label>
    <div class="contact-trap" aria-hidden="true"><label>Leave this empty<input name="_gotcha" type="text" tabindex="-1" autocomplete="off"></label></div>
    <p class="contact-fine">${endpoint?'Your details go to Formspree and the site owner so we can respond. They do not subscribe you to a mailing list.':'Messages cannot be sent yet.'} <a href="${url('privacy/')}">Privacy details</a></p><button class="button" type="submit">Send message <span aria-hidden="true">↗</span></button></fieldset><p class="contact-status" data-contact-status role="status" aria-live="polite"></p></form>`;
}

export function contactModal(site,url) {
  return `<dialog id="contact-dialog" class="contact-dialog" aria-labelledby="contact-title"><button type="button" class="dialog-close" data-contact-close aria-label="Close contact form" autofocus>×</button><span class="eyebrow">Get in touch</span><h2 id="contact-title">Contact</h2>${contactForm(site,url,'modal-contact')}</dialog>`;
}

export function analyticsControls(site,url) {
  if(!site.analytics?.enabled) return '';
  return `<section class="analytics-choice" data-analytics-choice hidden aria-label="Analytics preference"><div><h2>Help us understand what’s useful.</h2><p>Allow Google Analytics to measure visits and link clicks? It’s optional. <a href="${url('privacy/')}">Privacy details</a></p></div><div class="analytics-actions"><button class="choice-button" type="button" data-analytics-deny>No thanks</button><button class="choice-button" type="button" data-analytics-allow>Allow analytics</button></div><p class="sr-only" data-analytics-status role="status"></p></section>`;
}

export function privacyPage(site,url) {
  const contact=Boolean(site.contact?.formspreeEndpoint), analytics=site.analytics?.enabled;
  return `<article class="article prose"><h1>Privacy</h1><p>ChatGPT Fan is an independent publication. Here is what this site stores and where information goes.</p>
    <h2>On your device</h2><p>Your browser remembers dismissed safety notices, read headlines, saved stories, and your analytics choice. Saved stories stay on this device. Site search runs locally. Clearing this site’s browser storage removes these preferences.</p>
    <h2>Contact messages</h2><p>${contact?'The contact form sends your email, message, selected topic, and optional name to Formspree, which processes the submission for the site owner. We use these details to read and respond to your request. Contact messages are not newsletter subscriptions.':'The contact form is not active. No contact submissions are currently sent.'}</p><p>${contact?'You can use':'Once available, you can use'} <a href="${url('contact/')}" data-open-contact>Contact</a> to ask about a message you sent or request its deletion. Avoid including passwords or other sensitive information. <a href="https://formspree.io/legal/privacy-policy/">Formspree’s privacy policy</a> describes its processing.</p>
    <h2>Optional analytics</h2><p>${analytics?'Google Analytics is available only after you choose “Allow analytics.” Until then, this integration does not load Google’s analytics tag. If allowed, Google processes usage information such as page visits, device/browser information, and outbound link events. Analytics cookies can recognize returning browsers.':'Google Analytics is not enabled on this version of the site.'}</p><p>When analytics is enabled, our configured events measure page visits, outbound destination domains, and successful contact submissions. We exclude message contents, email addresses, names, search terms, URL query strings, and fragments from those events. Google advertising signals and ad personalization are disabled.</p>${analytics?'<button class="choice-button" type="button" data-open-analytics hidden>Change analytics preference</button><p data-privacy-consent-status class="contact-note" role="status"></p>':''}<p>${analytics?'You can decline or withdraw consent through “Analytics settings” in the footer.':'If analytics is enabled later, an optional consent choice and footer settings will be provided.'} Withdrawal stops this integration and removes accessible first-party Google Analytics cookies; it cannot undo data already received by Google. <a href="https://policies.google.com/privacy">Google’s privacy policy</a> explains its processing. Your choice is remembered for up to six months on this browser.</p>
    <h2>Hosting and external content</h2><p>The hosting provider may process request logs. News images load from publishers’ image servers, which receive ordinary requests including your IP address. External links follow those sites’ policies. Fonts and the site’s own artwork are served with this site.</p></article>`;
}
