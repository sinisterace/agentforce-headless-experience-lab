import { useState, useEffect } from 'react';
import { ArrowUpRight, Check, Copy } from 'lucide-react';
import type { CompanyProfile, DeployResponse, Recommendation } from '@/types/catalog';
import { hostnameOf } from '@/components/shared';
import salesforceCloud from '@/assets/brand/df26/salesforce-cloud-3d.png';
import experienceShot from '@/assets/brand/df26/salesforce-experience-site.png';
import coworkerAskHome from '@/assets/brand/df26/coworker-ask-home.png';
import { channelsFor, ChannelMark, type ChannelId } from './channels';
import { startersFor } from './channelCopy';
import { ChatGptFrame } from './ChatGptFrame';
import { ClaudeFrame } from './ClaudeFrame';
import { SlackFrame } from './SlackFrame';

/** Deep link to THIS org's Agentforce Coworker Ask page — never hardcode the org
 *  subdomain (it differs per org). The UIBundle app is served at
 *  `<myDomain>--c.my.salesforce.app`; Lightning + the Coworker Ask surface live at
 *  `<myDomain>.lightning.force.com/lightning/coworker`. Derive `<myDomain>` from the
 *  running host, tolerating sandbox/enhanced suffixes. */
function coworkerUrl(): string {
  if (typeof window === 'undefined') return '#';
  const host = window.location.hostname;
  if (!host || host.startsWith('localhost')) return '#';
  // The app host is `<myDomain>--c.<suffix>`; everything before `--c.` is myDomain.
  const bundleMatch = host.match(/^(.+?)--c\./i);
  const myDomain = bundleMatch
    ? bundleMatch[1]
    // Fallback: already on a Lightning/core host — strip the known suffix.
    : host.replace(/\.(lightning\.force\.com|my\.salesforce\.(com|app))$/i, '');
  return myDomain ? `https://${myDomain}.lightning.force.com/lightning/coworker` : '#';
}

/**
 * URL-path prefix of the canonical branded-agent Experience site (constant across
 * templated orgs). This is the LWR site `AgentforceServiceAgent` (serves at
 * /<prefix>). Both this and the Aura `companyagentforceserviceagent` site render
 * the branded hero + FAQ (guest-read works on both), but ONLY this LWR site is
 * wired with the embedded-messaging ("Ask Me Anything") agent widget — so it's the
 * canonical one. (Verified live 2026-10-09: Aura site had no chat widget.)
 */
const SITE_PATH = 'AgentforceServiceAgent';

/**
 * Public URL of THIS org's branded-agent Experience site — never hardcode the org
 * subdomain (it differs per Trialforce/OrgFarm org). Prefer the value the backend
 * resolved for this org (deployResult.siteUrl, built from URL.getOrgDomainUrl); if
 * absent, derive the org's my.site.com domain from the running Lightning host.
 */
function experienceSiteUrl(deployResult: DeployResponse | null): string {
  if (deployResult?.siteUrl) return deployResult.siteUrl;
  try {
    // Derive the Experience domain from the running org's host, never hardcoded.
    // LEX serves at <mydomain>.lightning.force.com (or the core .my.salesforce.com);
    // Experience sites serve at the matching <mydomain>.my.site.com. Suffix-replace
    // (not split) keeps enhanced/sandbox subdomains intact. LWR sites serve at
    // /<prefix> (no /s app root).
    const host = window.location.hostname;
    if (host && !host.startsWith('localhost')) {
      const base = host
        .replace('.lightning.force.com', '.my.site.com')
        .replace('.my.salesforce.com', '.my.site.com');
      return `https://${base}/${SITE_PATH}`;
    }
  } catch { /* window unavailable */ }
  return `/${SITE_PATH}`;
}

/**
 * The multi-client viewer (DF26 "surface" layout): four big surface cards switch
 * the rendered surface below. ChatGPT / Claude / Slack render the REAL, unchanged
 * client frames (their own chrome + the live CLT). Agentforce shows the branded
 * "agent is live" landing (the deployed headless site) — the deploy panel, placed
 * exactly as the Lovable design. Only the chrome here is DF26; the *Frame renders
 * and their props are untouched.
 */
export function ChannelViewer({
  recommendation,
  profile,
  deployResult,
  deployError,
  audience,
}: {
  recommendation: Recommendation;
  profile: CompanyProfile;
  /** Accepted for API compatibility; the surface cards drive selection internally. */
  initials?: string;
  deployResult?: DeployResponse | null;
  deployError?: string | null;
  /** 'employee' swaps the Salesforce "your site" surface for Agentforce Coworker. */
  audience?: 'customer' | 'employee';
}) {
  const channels = channelsFor(audience);
  const [channel, setChannel] = useState<ChannelId>(audience === 'employee' ? 'coworker' : 'agentforce');

  // Toggling the audience must re-point the preview to that audience's primary
  // surface: 'For your team' -> Coworker, 'For customers' -> the branded site.
  // (useState's initializer only runs on mount, so without this the stage stays
  // stuck on whatever surface it first rendered.)
  useEffect(() => {
    setChannel(audience === 'employee' ? 'coworker' : 'agentforce');
  }, [audience]);

  return (
    <div className="channel-viewer df-surfaces">
      <div className="df-surface-cards" role="tablist" aria-label="Preview surface">
        {channels.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={channel === c.id}
            className={`df-surface-card${channel === c.id ? ' active' : ''}`}
            onClick={() => setChannel(c.id)}
          >
            <span className="df-surface-mark"><ChannelMark id={c.id} /></span>
            <span className="df-surface-name">{c.label}</span>
            <Check className="df-surface-check" aria-hidden="true" />
          </button>
        ))}
      </div>

      <div className="df-surface-stage">
        {channel === 'agentforce' ? (
          <SiteLanding recommendation={recommendation} profile={profile} deployResult={deployResult ?? null} deployError={deployError ?? null} />
        ) : channel === 'coworker' ? (
          <CoworkerLanding recommendation={recommendation} profile={profile} />
        ) : (
          <div className="df-surface-frame">
            {channel === 'chatgpt' && <ChatGptFrame recommendation={recommendation} profile={profile} />}
            {channel === 'claude' && <ClaudeFrame recommendation={recommendation} profile={profile} />}
            {channel === 'slack' && <SlackFrame recommendation={recommendation} profile={profile} />}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * The Agentforce Coworker surface — the team-track analogue of SiteLanding:
 * the same branded "it's live" landing (chrome + copy + prompt pills + an
 * embedded product shot), but for Coworker. "Open in Coworker" deep-links to
 * this org's `/lightning/coworker` Ask page.
 */
function CoworkerLanding({ recommendation, profile }: { recommendation: Recommendation; profile: CompanyProfile }) {
  const prompts = startersFor(recommendation).slice(0, 4);
  const [copied, setCopied] = useState<string | null>(null);
  async function copyPrompt(p: string) {
    try {
      await navigator.clipboard.writeText(p);
      setCopied(p);
      window.setTimeout(() => setCopied((c) => (c === p ? null : c)), 1400);
    } catch { /* clipboard unavailable — no-op */ }
  }

  return (
    <div className="df-site">
      <div className="df-site-chrome">
        <span className="df-site-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="df-site-url"><img src={salesforceCloud} alt="" aria-hidden="true" /> Agentforce Coworker</span>
        <span className="df-site-badge"><span className="df-site-badge-dot" aria-hidden="true" /> Live</span>
      </div>
      <div className="df-site-body">
        <div className="df-site-copy">
          <span className="df-site-domain"><span aria-hidden="true" /> Agentforce Coworker</span>
          <h2>{profile.companyName}&rsquo;s Coworker is live</h2>
          <p className="df-site-lede">Agentforce Coworker is ready for {profile.companyName} &mdash; grounded on your Data 360, routing every ask to the right Employee Agent, right in the flow of work.</p>
          <ul className="df-site-checks">
            <li><Check aria-hidden="true" /> Grounded on your Salesforce &amp; business data &mdash; no training needed</li>
            <li><Check aria-hidden="true" /> Renders this card inline across Salesforce, Slack, ChatGPT &amp; Claude</li>
          </ul>
          <a className="df-site-open" href={coworkerUrl()} target="_blank" rel="noreferrer">Open in Coworker <ArrowUpRight aria-hidden="true" /></a>
          {prompts.length > 0 && (
            <div className="df-site-prompts" aria-label={`Prompts to try for ${recommendation.label}`}>
              <span className="df-site-prompts-label">try one of these in Coworker &mdash; tap to copy</span>
              <div className="df-site-prompt-row">
                {prompts.map((p) => (
                  <button
                    type="button"
                    key={p}
                    className={`df-site-prompt${copied === p ? ' is-copied' : ''}`}
                    onClick={() => copyPrompt(p)}
                    aria-label={copied === p ? `Copied: ${p}` : `Copy prompt: ${p}`}
                  >
                    <span className="df-site-prompt-text">{p}</span>
                    {copied === p ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="df-site-shot">
          <div className="df-site-shot-frame">
            <span className="df-site-shot-tag">Agentforce Coworker</span>
            <img src={coworkerAskHome} alt={`Agentforce Coworker Ask home for ${profile.companyName}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The Agentforce surface = the branded headless site landing (Lovable SitePanel),
 * driven by the app's real deploy result (faqCount / siteUrl / branding). Also
 * surfaces the selected CLT's example prompts as copy-to-clipboard pills — the same
 * starters shown in the Agentforce Builder guide — so the user can paste one
 * straight into the embedded chat on their live site (Salesforce surface only).
 */
function SiteLanding({
  recommendation,
  profile,
  deployResult,
  deployError,
}: {
  recommendation: Recommendation;
  profile: CompanyProfile;
  deployResult: DeployResponse | null;
  deployError: string | null;
}) {
  const domain = hostnameOf(profile.website);
  const siteUrl = experienceSiteUrl(deployResult);
  const faqCount = deployResult?.faqCount ?? 12;
  const fallback = deployResult?.faqIsFallback;
  // Same per-CLT starters as the Builder guide + ChatGPT/Claude/Slack previews.
  const prompts = startersFor(recommendation).slice(0, 4);
  const [copied, setCopied] = useState<string | null>(null);
  async function copyPrompt(p: string) {
    try {
      await navigator.clipboard.writeText(p);
      setCopied(p);
      window.setTimeout(() => setCopied((c) => (c === p ? null : c)), 1400);
    } catch { /* clipboard unavailable — no-op */ }
  }

  return (
    <div className="df-site">
      <div className="df-site-chrome">
        <span className="df-site-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="df-site-url"><img src={salesforceCloud} alt="" aria-hidden="true" /> {domain}/agent</span>
        <span className="df-site-badge"><span className="df-site-badge-dot" aria-hidden="true" /> Live site</span>
      </div>
      <div className="df-site-body">
        <div className="df-site-copy">
          <span className="df-site-domain"><span aria-hidden="true" /> {domain}</span>
          <h2>{profile.companyName} agent is live</h2>
          <p className="df-site-lede">A live Experience Cloud site, branded and ready for {profile.companyName} &mdash; with your AI support agent embedded and grounded on your content.</p>
          <ul className="df-site-checks">
            <li><Check aria-hidden="true" /> Grounded on {faqCount} FAQ answer{faqCount === 1 ? '' : 's'}{fallback ? ' (industry starter)' : ' from your website'}</li>
            <li><Check aria-hidden="true" /> Personalized site branded to {profile.companyName}&rsquo;s colors, logo &amp; FAQ</li>
          </ul>
          {deployError ? (
            <p className="df-site-error">{deployError}</p>
          ) : (
            <>
              <a className="df-site-open" href={siteUrl} target="_blank" rel="noreferrer">Open your site <ArrowUpRight aria-hidden="true" /></a>
              {prompts.length > 0 && (
                <div className="df-site-prompts" aria-label={`Prompts to try for ${recommendation.label}`}>
                  <span className="df-site-prompts-label">try one of these in your agent &mdash; tap to copy</span>
                  <div className="df-site-prompt-row">
                    {prompts.map((p) => (
                      <button
                        type="button"
                        key={p}
                        className={`df-site-prompt${copied === p ? ' is-copied' : ''}`}
                        onClick={() => copyPrompt(p)}
                        aria-label={copied === p ? `Copied: ${p}` : `Copy prompt: ${p}`}
                      >
                        <span className="df-site-prompt-text">{p}</span>
                        {copied === p ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="df-site-shot">
          <div className="df-site-shot-frame">
            <span className="df-site-shot-tag">Example preview</span>
            <img src={experienceShot} alt={`Example preview of an Experience Cloud support site with an embedded AI agent — your live ${profile.companyName} site is branded to your company`} />
          </div>
        </div>
      </div>
    </div>
  );
}
