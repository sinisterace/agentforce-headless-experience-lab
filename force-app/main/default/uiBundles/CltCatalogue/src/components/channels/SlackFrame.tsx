import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AtSign,
  Bell,
  ChevronDown,
  Clock3,
  ExternalLink,
  Hash,
  Home,
  Inbox,
  LayoutGrid,
  MessageSquare,
  Mic,
  MoreHorizontal,
  MoreVertical,
  Plus,
  Search,
  Send,
  Sparkles,
  SquarePen,
} from 'lucide-react';
import type { CompanyProfile, Recommendation } from '@/types/catalog';
import { safeParse } from '@/components/playground/payloads';
import { resolveWidget } from '@/components/playground/widgets/registry';
import { invokingLabelFor, leadFor, startersFor } from './channelCopy';
import { buildTiles } from './tiles/registry';
import { TileCard } from './tiles/TileRenderer';
import slackbotLogo from '@/assets/slackbot-logo.svg';
import salesforceCloud from '@/assets/salesforce-cloud.png';

/**
 * A faithful Slack desktop recreation (modeled on the Slackbot Design System
 * Figma): the aubergine top bar + workspace rail + channel sidebar, and a main
 * pane where "Slackbot · AGENT" replies. Unlike ChatGPT/Claude, Slack renders a
 * CLT as a BuilderKit *tile* card (see TileRenderer), not the LWC — so this frame
 * shows the same CLT in its authentic Slack form. Clicking a starter invokes the
 * agent (typing indicator) and then renders the tile card, like a real turn.
 */

type Phase = 'suggest' | 'invoking' | 'rendered';

/** Slackbot's app avatar (the Slackbot logo). */
function SlackbotMark({ className }: { className?: string }) {
  return <img src={slackbotLogo} alt="" aria-hidden="true" className={`slk-bot-mark${className ? ` ${className}` : ''}`} />;
}

export function SlackFrame({ recommendation, profile }: { recommendation: Recommendation; profile: CompanyProfile }) {
  const def = resolveWidget(recommendation);
  const { Preview } = def;

  const payload = useMemo(() => {
    const parsed = safeParse<Record<string, unknown>>(recommendation.defaultPayloadJson ?? '');
    return parsed ? { ...(def.defaults as object), ...parsed } : { ...(def.defaults as object) };
  }, [recommendation.defaultPayloadJson, def]);

  const tiles = useMemo(
    () => buildTiles(recommendation.dtoFieldName, payload, { label: def.label, description: recommendation.description }),
    [recommendation.dtoFieldName, payload, def.label, recommendation.description],
  );

  const [phase, setPhase] = useState<Phase>('suggest');
  const [chosen, setChosen] = useState('');
  const timer = useRef<number | undefined>(undefined);

  const starters = startersFor(recommendation);
  const lead = leadFor(recommendation, profile.companyName);
  const invokingLabel = invokingLabelFor(recommendation);

  useEffect(() => {
    setPhase('suggest');
    setChosen('');
    return () => window.clearTimeout(timer.current);
  }, [recommendation.cltApiName]);

  function pick(prompt: string) {
    setChosen(prompt);
    setPhase('invoking');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPhase('rendered'), 950);
  }

  return (
    <section className="channel-surface slack-surface" aria-label="Slack preview">
      <div className="slk-app">
        {/* --- top bar --- */}
        <header className="slk-topbar">
          <span className="slk-traffic" aria-hidden="true"><i className="is-r" /><i className="is-y" /><i className="is-g" /></span>
          <div className="slk-search"><Search aria-hidden="true" /> Search {profile.companyName}</div>
          <div className="slk-topbar-right">
            <span className="slk-ws-chip"><img className="slk-ws-avatar" src={slackbotLogo} alt="" aria-hidden="true" /> Slackbot <ChevronDown aria-hidden="true" /></span>
          </div>
        </header>

        <div className="slk-body">
          {/* --- workspace rail --- */}
          <nav className="slk-rail" aria-label="Workspaces">
            <img className="slk-rail-ws" src={salesforceCloud} alt="" aria-hidden="true" />
            <button type="button" className="slk-rail-item is-active"><Home aria-hidden="true" /><span>Home</span></button>
            <button type="button" className="slk-rail-item"><Bell aria-hidden="true" /><span>Activity</span></button>
            <button type="button" className="slk-rail-item"><MoreHorizontal aria-hidden="true" /><span>More</span></button>
          </nav>

          {/* --- channel sidebar --- */}
          <aside className="slk-sidebar" aria-label="Channels">
            <div className="slk-sidebar-head">
              <strong>Slack</strong><ChevronDown aria-hidden="true" />
              <span className="slk-sidebar-head-actions" aria-hidden="true"><SquarePen /></span>
            </div>
            <nav className="slk-chan-nav">
              <button type="button" className="slk-chan is-active"><SlackbotMark className="slk-chan-bot" /> Slackbot</button>
              <button type="button" className="slk-chan"><Inbox aria-hidden="true" /> Unreads</button>
              <button type="button" className="slk-chan"><MessageSquare aria-hidden="true" /> Threads</button>
              <button type="button" className="slk-chan"><Send aria-hidden="true" /> Drafts &amp; sent</button>
              <p className="slk-chan-section">Channels</p>
              <button type="button" className="slk-chan"><Hash aria-hidden="true" /> q3-priorities</button>
              <button type="button" className="slk-chan"><Hash aria-hidden="true" /> support</button>
              <button type="button" className="slk-chan"><Hash aria-hidden="true" /> sales-support</button>
              <p className="slk-chan-section">Direct messages</p>
              <button type="button" className="slk-chan"><span className="slk-dot is-green" aria-hidden="true" /> Lisa Dawson</button>
              <button type="button" className="slk-chan"><span className="slk-dot is-coral" aria-hidden="true" /> Claude</button>
              <button type="button" className="slk-chan"><span className="slk-dot is-blue" aria-hidden="true" /> Sales Agent</button>
            </nav>
          </aside>

          {/* --- main conversation --- */}
          <div className="slk-main">
            <header className="slk-main-head">
              <span className="slk-main-title"><SlackbotMark /> <strong>Slackbot</strong></span>
              <span className="slk-main-head-icons" aria-hidden="true"><SquarePen /><Clock3 /><MoreVertical /></span>
            </header>

            <div className="slk-thread" role="log" aria-label="Conversation">
              {phase === 'suggest' ? (
                <div className="slk-msg">
                  <SlackbotMark className="slk-avatar" />
                  <div className="slk-msg-body">
                    <p className="slk-msg-meta"><strong>Slackbot</strong> <span className="slk-time">12:32 PM</span></p>
                    <p className="slk-msg-text">Hi! I can help with your {profile.companyName} accounts right here. What would you like to do?</p>
                    <div className="slk-starters" role="group" aria-label="Suggested prompts">
                      {starters.map((s) => (
                        <button type="button" key={s} className="slk-starter" onClick={() => pick(s)}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* user turn */}
                  <div className="slk-msg">
                    <img className="slk-avatar slk-avatar-user" src={salesforceCloud} alt="" aria-hidden="true" />
                    <div className="slk-msg-body">
                      <p className="slk-msg-meta"><strong>{profile.companyName}</strong> <span className="slk-time">12:32 PM</span></p>
                      <p className="slk-msg-text">{chosen}</p>
                    </div>
                  </div>

                  {/* agent turn */}
                  <div className="slk-msg">
                    <SlackbotMark className="slk-avatar" />
                    <div className="slk-msg-body">
                      <p className="slk-msg-meta"><strong>Slackbot</strong> <span className="slk-time">12:32 PM</span></p>
                      {phase === 'invoking' ? (
                        <p className="slk-typing" aria-live="polite"><span /><span /><span /> {invokingLabel}</p>
                      ) : (
                        <>
                          <p className="slk-msg-text">{lead}</p>
                          <div className={tiles ? 'slk-tile-card' : 'slk-tile-card slk-tile-card-live'}>
                            {tiles ? <TileCard node={tiles} /> : <Preview value={payload} accentColor={profile.accentColor} />}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* --- composer --- */}
            <div className="slk-composer-wrap">
              <div className="slk-composer">
                <div className="slk-composer-input">
                  <span className="slk-caret" aria-hidden="true" />Ask anything
                </div>
                <div className="slk-composer-tools">
                  <span className="slk-composer-left" aria-hidden="true">
                    <Plus /><Sparkles /><LayoutGrid /><AtSign />
                  </span>
                  <span className="slk-composer-right" aria-hidden="true">
                    <Mic />
                    <span className="slk-composer-send"><Send /></span>
                  </span>
                </div>
              </div>
              <div className="slk-blockkit-tip">
                <span className="slk-blockkit-tip-mark" aria-hidden="true"><LayoutGrid /></span>
                <p className="slk-blockkit-tip-text">
                  This reply is composed with Slack <strong>Block Kit</strong>.{' '}
                  <a href="https://docs.slack.dev/block-kit/" target="_blank" rel="noreferrer">Build your own headless app layouts <ExternalLink aria-hidden="true" /></a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
