import { escapeHTML as e } from './lib.mjs';

export function validateCampaign(c) {
  if (typeof c.enabled !== 'boolean' || !/^[a-z0-9-]+$/.test(c.id) ||
      !['title','introduction','summary','invitation','label','organizer'].every(k => typeof c[k] === 'string' && c[k].trim()) ||
      c.url !== 'https://superintelligence-statement.org/' ||
      !Number.isFinite(c.delaySeconds) || c.delaySeconds < 0) throw Error('Invalid campaign configuration');
}

// Standing information, searches, redirects, and the action page never interrupt reading.
export function campaignEligible(route) {
  return route === '' || /^(brief|news|resources)(\/|$)/.test(route) || route === 'safety/';
}

export function campaignModal(c, url) {
  if (!c.enabled) return '';
  return `<dialog id="campaign-dialog" class="campaign-dialog" aria-labelledby="campaign-title" aria-describedby="campaign-introduction campaign-summary campaign-invitation" data-delay="${c.delaySeconds}" data-campaign-id="${e(c.id)}">
    <button type="button" class="dialog-close" data-campaign-close aria-label="Close invitation" autofocus>×</button>
    <span class="eyebrow">An invitation</span><h2 id="campaign-title">${e(c.title)}</h2>
    <p id="campaign-introduction">${e(c.introduction)}</p><p id="campaign-summary">${e(c.summary)}</p><p id="campaign-invitation">${e(c.invitation)}</p>
    <div class="campaign-actions"><a class="button" data-campaign-outbound="${e(c.id)}" href="${e(c.url)}" target="_blank" rel="noopener noreferrer">${e(c.label)} <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a><button type="button" class="campaign-continue" data-campaign-close>Continue reading</button></div>
    <div class="campaign-foot"><span>Hosted by the ${e(c.organizer)}.</span><a href="${url('safety/take-action/')}" data-campaign-details>Why we support it →</a></div>
  </dialog>`;
}

export function renderActionPage(c, url) {
  return `<article class="action-page"><a class="small-link" href="${url('safety/')}">← Safety & Society</a>
    <header class="page-head"><span class="eyebrow">Take action</span><h1>${e(c.title)}</h1><p>Enjoy what AI makes possible. Have a say in what happens next.</p></header>
    <section class="action-feature" aria-labelledby="statement-title"><span class="eyebrow">The campaign we support</span><h2 id="statement-title">Statement on Superintelligence</h2><p>${e(c.summary)}</p><p>Superintelligence means AI that substantially exceeds human capabilities across cognitive tasks. This statement concerns developing those systems; it does not call for people to stop using today’s ChatGPT.</p><a class="button" data-campaign-outbound="${e(c.id)}" href="${e(c.url)}" target="_blank" rel="noopener noreferrer">${e(c.label)} <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a><p class="action-credit">Hosted by the ${e(c.organizer)}. Signing happens on the organizer’s website, under its own privacy policy. We do not collect signatures or know whether you signed.</p></section>
    <div class="action-copy prose"><h2>Why we support it</h2><p>We think decisions with potentially irreversible consequences need independent scrutiny and public legitimacy. Useful AI and binding safeguards can belong in the same future. This is <a href="${url('position/')}">our editorial position</a>, and you are welcome here whether or not you agree.</p><p>The <a href="${e(c.url)}">statement’s signatories</a> include Geoffrey Hinton, Yoshua Bengio, and Stuart Russell. Its website also quotes people who have not signed. Concern about AI risk is widespread; agreement on this particular prohibition is not universal.</p>
    <h2>What deserves debate</h2><p>A prohibition needs workable definitions, independent verification, and international cooperation. It also needs safeguards against giving today’s largest companies permanent control of the field. There are real disagreements about how to achieve those things and how to balance delayed benefits against risks.</p><p>For one different approach, <a href="https://darioamodei.com/post/we-must-pace-the-frontier">Dario Amodei’s proposal for pacing frontier development</a> discusses evaluations and coordinated limits. It should not be confused with an endorsement of this statement. <a href="https://apnews.com/article/ai-slowdown-challenges-anthropic-openai-trump-b61f28b6212338e88c0baec31f661701">AP’s reporting on the practical disagreements</a> examines obstacles to turning safety commitments into policy.</p>
    <h2>Make it a policy conversation</h2><p>A signature expresses support; it does not change the law. Contacting a representative or attending a local meeting is another way to ask for independent evaluations, public accountability, and enforceable safeguards. Choose the route that fits where you live.</p></div>
    <div class="action-grid"><section class="action-card"><span class="eyebrow">United States</span><h3>Contact your representatives</h3><p>PauseAI US offers outreach and meeting guides. Read the current request and put your own views in your own words.</p><a class="text-link" href="https://www.pauseai-us.org/takeaction/">US action guide ↗</a></section><section class="action-card"><span class="eyebrow">Other countries</span><h3>Find a local route</h3><p>PauseAI’s international action guide links to communities and ways to contact policymakers. Availability varies by country.</p><a class="text-link" href="https://pauseai.org/action">International action guide ↗</a></section></div>
    <p class="action-credit">These are advocacy organizations. Linking to an outreach guide does not endorse every campaign, bill, or tactic it promotes.</p>
    <section class="action-context" aria-labelledby="action-context-title"><h2 id="action-context-title">More context</h2><div class="action-grid"><section class="action-card"><h3>Pro-Human AI Declaration</h3><p>A broader platform covering human control, power, agency, and accountability. Supporting the superintelligence statement does not require endorsing this entire platform.</p><a class="text-link" href="https://humanstatement.org/">Read the declaration ↗</a></section><section class="action-card"><h3>Statement on AI Risk</h3><p>The Center for AI Safety statement calls for extinction risk from AI to be a global priority. It does not itself demand a pause or prohibition.</p><a class="text-link" href="https://safe.ai/work/statement-on-ai-extinction-risk">Read the risk statement ↗</a></section></div></section>
    <p class="action-credit">Selected by ChatGPT Fan · Reviewed October 2, 2026. We check campaign links and developments during our daily review. We do not display unverified signature totals or treat referrals as signatures.</p>
  </article>`;
}
