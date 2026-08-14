import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  AudioLines,
  BookOpen,
  Clock3,
  Copy,
  Folder,
  MoreHorizontal,
  Mic,
  PanelLeft,
  Plug,
  Plus,
  RefreshCw,
  Search,
  Share,
  SquarePen,
  Store,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import type { CompanyProfile, Recommendation } from '@/types/catalog';
import { safeParse } from '@/components/playground/payloads';
import { resolveWidget } from '@/components/playground/widgets/registry';
import { OpenAiMark } from './channels';
import { invokingLabelFor, leadFor, startersFor } from './channelCopy';
import salesforceCloud from '@/assets/salesforce-cloud.png';

/**
 * A faithful ChatGPT web recreation (modeled on the current ChatGPT web app with
 * a connected GPT open: "ChatGPT Plus" wordmark sidebar, a centered GPT profile
 * splash with starter cards, and a floating composer). Clicking a starter card
 * invokes the connector in real time and renders the selected CLT inline as an
 * Apps-SDK app card — so the card appears like a real tool invocation, not
 * before. The widget itself is the registry's faithful preview (identical to the
 * playground and the deployed LWC); only the surrounding chrome is ChatGPT.
 */

type Phase = 'suggest' | 'invoking' | 'rendered';

export function ChatGptFrame({ recommendation, profile }: { recommendation: Recommendation; profile: CompanyProfile }) {
  const def = resolveWidget(recommendation);
  const { Preview } = def;

  const payload = useMemo(() => {
    const parsed = safeParse<Record<string, unknown>>(recommendation.defaultPayloadJson ?? '');
    return parsed ? { ...(def.defaults as object), ...parsed } : { ...(def.defaults as object) };
  }, [recommendation.defaultPayloadJson, def]);

  const [phase, setPhase] = useState<Phase>('suggest');
  const [chosen, setChosen] = useState('');
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const starters = startersFor(recommendation);
  const lead = leadFor(recommendation, profile.companyName);
  const invokingLabel = invokingLabelFor(recommendation);

  // Reset the conversation whenever a different CLT is selected.
  useEffect(() => {
    setPhase('suggest');
    setChosen('');
    return () => window.clearTimeout(timer.current);
  }, [recommendation.cltApiName]);

  function pick(prompt: string) {
    setChosen(prompt);
    setPhase('invoking');
    window.clearTimeout(timer.current);
    // Brief, real-feeling tool-invocation delay before the card appears.
    timer.current = window.setTimeout(() => setPhase('rendered'), 950);
  }

  function reset() {
    window.clearTimeout(timer.current);
    setPhase('suggest');
    setChosen('');
  }

  async function copyLead() {
    try {
      await navigator.clipboard.writeText(lead);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable in sandbox — ignore */
    }
  }

  return (
    <section className="channel-surface chatgpt-surface" aria-label="ChatGPT preview">
      <div className="cg-app">
        {/* --- sidebar --- */}
        <aside className="cg-sidebar" aria-label="ChatGPT navigation">
          <div className="cg-sidebar-top">
            <span className="cg-wordmark">ChatGPT <span>Plus</span></span>
            <span className="cg-sidebar-icons" aria-hidden="true">
              <Search className="cg-sidebar-icon" />
              <PanelLeft className="cg-sidebar-icon" />
            </span>
          </div>
          <nav className="cg-nav">
            <button type="button" className="cg-nav-item" onClick={reset}><SquarePen aria-hidden="true" /> New chat</button>
            <button type="button" className="cg-nav-item"><BookOpen aria-hidden="true" /> Library</button>
            <button type="button" className="cg-nav-item"><Folder aria-hidden="true" /> Projects</button>
            <button type="button" className="cg-nav-item"><Clock3 aria-hidden="true" /> Scheduled</button>
            <button type="button" className="cg-nav-item"><Plug aria-hidden="true" /> Plugins</button>
            <button type="button" className="cg-nav-item"><OpenAiMark className="cg-nav-mark" /> Codex</button>
            <button type="button" className="cg-nav-item"><MoreHorizontal aria-hidden="true" /> More</button>
          </nav>
          <div className="cg-account">
            <span className="cg-account-avatar"><img src={salesforceCloud} alt="" aria-hidden="true" /></span>
            <span className="cg-account-meta"><strong>OrgFarm EPIC</strong><small>Plus</small></span>
            <Store className="cg-account-store" aria-hidden="true" />
          </div>
        </aside>

        {/* --- main conversation --- */}
        <div className="cg-main">
          <header className="cg-topbar">
            <span className="cg-topbar-spacer" aria-hidden="true" />
            {/* Bridges the demo to the real thing: opens ChatGPT (login) in a new
                tab so a viewer can go try the connector live. */}
            <a
              className="cg-try-cta"
              href="https://chatgpt.com/auth/login"
              target="_blank"
              rel="noreferrer"
            >
              <OpenAiMark className="cg-try-cta-mark" />
              Try it in ChatGPT
              <ArrowUpRight className="cg-try-cta-arrow" aria-hidden="true" />
            </a>
            <MoreHorizontal className="cg-topbar-more" aria-hidden="true" />
          </header>

          <div className="cg-thread" role="log" aria-label="Conversation">
            {phase === 'suggest' ? (
              /* --- empty state: centered prompt + pill options --- */
              <div className="cg-splash">
                <h1 className="cg-splash-title">What should we work on?</h1>
                <div className="cg-starters" role="group" aria-label="Suggested prompts">
                  {starters.map((s) => (
                    <button type="button" key={s} className="cg-starter" onClick={() => pick(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="cg-column">
                {/* user turn */}
                <div className="cg-turn cg-turn-user">
                  <div className="cg-user-bubble">{chosen}</div>
                </div>

                {/* assistant response: invoking status, then the app card */}
                <div className="cg-turn cg-turn-assistant">
                  {phase === 'invoking' ? (
                    <p className="cg-shimmer" aria-live="polite">{invokingLabel}</p>
                  ) : (
                    <div className="cg-assistant-body">
                      <p className="cg-assistant-text">{lead}</p>

                      <div className="cg-app-card">
                        <div className="cg-app-card-head">
                          <span className="cg-app-source">
                            {profile.logoUrl ? <img className="cg-app-source-logo" src={profile.logoUrl} alt="" /> : <OpenAiMark className="cg-app-source-mark" />}
                            {def.label} · {profile.companyName}
                          </span>
                          <span className="cg-app-badge">app</span>
                        </div>
                        <div className="cg-app-card-body">
                          <Preview value={payload} accentColor={profile.accentColor} />
                        </div>
                      </div>

                      <div className="cg-message-actions" aria-label="Message actions">
                        <button type="button" onClick={copyLead} aria-label="Copy"><Copy aria-hidden="true" /></button>
                        <button type="button" aria-label="Good response"><ThumbsUp aria-hidden="true" /></button>
                        <button type="button" aria-label="Bad response"><ThumbsDown aria-hidden="true" /></button>
                        <button type="button" aria-label="Share"><Share aria-hidden="true" /></button>
                        <button type="button" onClick={reset} aria-label="Regenerate"><RefreshCw aria-hidden="true" /></button>
                        <button type="button" aria-label="More"><MoreHorizontal aria-hidden="true" /></button>
                        {copied && <span className="cg-copied" role="status">Copied</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="cg-composer-wrap">
            <div className="cg-composer">
              <span className="cg-composer-plus" aria-hidden="true"><Plus /></span>
              <span className="cg-composer-placeholder">
                Ask anything
                <span className="cg-caret" aria-hidden="true" />
              </span>
              <span className="cg-composer-tools" aria-hidden="true">
                <Mic className="cg-composer-icon" />
                <span className="cg-composer-wave"><AudioLines /></span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
