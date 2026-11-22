import { ArrowLeft, ChevronRight, ExternalLink } from 'lucide-react';
import df26Cloudspiral from '@/assets/brand/df26/df26-cloudspiral.png';
import builderAppLauncherShot from '@/assets/brand/df26/builder-app-launcher.png';
import builderConnectionShot from '@/assets/brand/df26/builder-connection-ecv2.png';
import builderPreviewShot from '@/assets/brand/df26/builder-lightning-type-example.png';
import { startersFor } from '@/components/channels/channelCopy';
import type { Recommendation } from '@/types/catalog';

/**
 * "See it in the Agentforce Builder" — step 4 of the flow, for the technically
 * curious: how do these interactive cards actually render inside the agent, and
 * how do I preview them myself? A polished-but-technical register (blueprint grid
 * + soft wash, mono labels, a runbook trace-timeline echoing the agent's own
 * reasoning trace, keycaps, personalized prompt pills, IDE viewport frames) that
 * still matches the DF26 design system. Presentation only; the one behavior is
 * the external link to Agentforce Studio (derived from the org's own Lightning
 * host, never hardcoded) plus Back.
 */

const AGENT_NAME = 'Agentforce Service Agent'; // same in every provisioned org.

/**
 * Open Agentforce Studio (the modern App Launcher app, not the legacy Einstein
 * Copilot setup node) in THIS org, on its Agents tab. The app is served from the
 * org's Lightning host (see experienceSiteUrl() in ChannelViewer), so we prefix
 * window.location.origin to land in the right org — no per-org URL hardcoded, and
 * `standard-AgentforceStudio` is a standard nav item present in every org.
 */
function agentforceStudioUrl(): string {
  const path = '/lightning/n/standard-AgentforceStudio?c__nav=agents';
  try {
    const origin = window.location.origin;
    if (origin && !origin.includes('localhost')) return `${origin}${path}`;
  } catch {
    /* SSR / no window — fall through to the relative path */
  }
  return path;
}

export function BuilderGuide({
  selectedRec,
  onBack,
}: {
  selectedRec: Recommendation;
  onBack: () => void;
}) {
  const studioUrl = agentforceStudioUrl();
  // Personalized example prompts for the CLT they built — the same starters shown
  // as pills in the ChatGPT / Claude previews.
  const prompts = startersFor(selectedRec).slice(0, 4);

  return (
    <div className="preview-stage df-launch df-builder df-builder-tech">
      <div aria-hidden="true" className="df-builder-grid" />
      <div aria-hidden="true" className="df-builder-wash" />

      <div className="df-intake-topbar">
        <nav className="df-stepnav" aria-label="Progress">
          <span className="df-step"><i>1</i> Company</span>
          <span className="df-step"><i>2</i> Playground</span>
          <span className="df-step"><i>3</i> Preview</span>
          <span className="df-step is-active"><i>4</i> Agentforce Builder</span>
        </nav>
        <button className="df-intake-back" type="button" onClick={onBack}><ArrowLeft aria-hidden="true" /> Back to preview</button>
      </div>

      <div className="df-builder-main">
        <section className="df-builder-head">
          <img src={df26Cloudspiral} alt="" aria-hidden="true" className="df-builder-head-ombre" />
          <div className="df-builder-head-copy">
            <h1 className="df-builder-title">See it in the Agentforce Builder</h1>
            <p className="df-builder-lede">
              Want to peek at the backend, or see exactly how these interactive cards render inside your agent?
              Preview the live agent — and its full reasoning trace — right in Agentforce Studio.
            </p>
          </div>
          <div className="df-builder-head-actions">
            <a className="df-builder-studio" href={studioUrl} target="_blank" rel="noreferrer">
              <ExternalLink aria-hidden="true" /> Open Agentforce Studio
            </a>
          </div>
        </section>

        {/* Steps as a technical "runbook" — a trace-timeline echoing the agent's reasoning trace. */}
        <ol className="df-builder-run" aria-label="Steps to preview the agent">
          <li className="df-builder-node">
            <span className="df-builder-node-mark" aria-hidden="true">01</span>
            <div className="df-builder-node-card df-glass">
              <h3 className="df-builder-node-title">Open the agent in Agentforce Studio</h3>
              <p>
                Quickest: hit the <strong>Open Agentforce Studio</strong> button above. <strong>Or</strong> open it manually —
                from the <kbd>App&nbsp;Launcher</kbd>, search for <strong>Agentforce Studio</strong> and open it:
              </p>
              <figure className="df-builder-viewport is-narrow">
                <figcaption className="df-builder-viewport-bar">
                  <span className="df-builder-viewport-dots" aria-hidden="true"><i /><i /><i /></span>
                  <span className="df-builder-viewport-name">app launcher</span>
                </figcaption>
                <img src={builderAppLauncherShot} alt="Salesforce App Launcher searching for Agentforce Studio" />
              </figure>
              <p>
                Either way, click into the <strong>{AGENT_NAME}</strong>, then press <kbd>Preview</kbd>.
              </p>
            </div>
          </li>

          <li className="df-builder-node">
            <span className="df-builder-node-mark" aria-hidden="true">02</span>
            <div className="df-builder-node-card df-glass">
              <h3 className="df-builder-node-title">Switch the preview to Enhanced Chat v2</h3>
              <p>
                At the top-left of the preview, open the mode dropdown (<kbd>Live&nbsp;Test&nbsp;·&nbsp;…</kbd>). Under{' '}
                <kbd>Connections</kbd>, select <kbd>Enhanced&nbsp;Chat&nbsp;v2</kbd>. Not listed? Add a connection and choose{' '}
                <kbd>Enhanced&nbsp;Chat&nbsp;v2&nbsp;(ECv2)</kbd>.
              </p>
              <figure className="df-builder-viewport is-narrow">
                <figcaption className="df-builder-viewport-bar">
                  <span className="df-builder-viewport-dots" aria-hidden="true"><i /><i /><i /></span>
                  <span className="df-builder-viewport-name">preview · connections</span>
                </figcaption>
                <img src={builderConnectionShot} alt="Agentforce preview mode dropdown with Enhanced Chat v2 selected under Connections" />
              </figure>
            </div>
          </li>

          <li className="df-builder-node">
            <span className="df-builder-node-mark" aria-hidden="true">03</span>
            <div className="df-builder-node-card df-glass">
              <h3 className="df-builder-node-title">Run a task — watch the card render</h3>
              <p>
                Type in your prompt — like the <strong>{selectedRec.label}</strong> experience you built. The agent routes to the
                right subagent, calls the action, and renders the interactive Lightning Type inline, with its reasoning trace beside it.
              </p>
              {prompts.length > 0 && (
                <div className="df-builder-prompts" aria-label={`Example prompts for ${selectedRec.label}`}>
                  <span className="df-builder-prompts-label">try one of these</span>
                  <div className="df-builder-prompt-row">
                    {prompts.map((p) => (
                      <span className="df-builder-prompt" key={p}>
                        <ChevronRight aria-hidden="true" /> {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <figure className="df-builder-viewport">
                <figcaption className="df-builder-viewport-bar">
                  <span className="df-builder-viewport-dots" aria-hidden="true"><i /><i /><i /></span>
                  <span className="df-builder-viewport-name">live test · enhanced chat v2</span>
                  <span className="df-builder-viewport-tag">example</span>
                </figcaption>
                <img src={builderPreviewShot} alt="Agentforce Builder preview rendering a Track Order Lightning Type card next to the agent reasoning trace" />
              </figure>
            </div>
          </li>
        </ol>
      </div>
    </div>
  );
}
