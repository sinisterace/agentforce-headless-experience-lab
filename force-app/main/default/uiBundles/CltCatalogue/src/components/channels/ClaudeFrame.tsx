import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  AudioLines,
  Briefcase,
  Check,
  ChevronRight,
  Code,
  Download,
  GraduationCap,
  Info,
  Lightbulb,
  MessagesSquare,
  Mic,
  Palette,
  PanelLeft,
  Plus,
  Store,
} from 'lucide-react';
import type { CompanyProfile, Recommendation } from '@/types/catalog';
import { safeParse } from '@/components/playground/payloads';
import { resolveWidget } from '@/components/playground/widgets/registry';
import { ClaudeMark } from './channels';
import { invokingLabelFor, leadFor, startersFor } from './channelCopy';
import salesforceCloud from '@/assets/salesforce-cloud.png';

/**
 * A faithful Claude.ai web recreation (modeled on the current Claude web app):
 * a thin icon-only left rail, a serif greeting over a centered composer, grey
 * right-aligned user bubbles, and the coral sunburst as the assistant avatar.
 * Clicking a starter chip invokes the connector in real time and renders the
 * selected CLT inline as a tool-result card — so the card appears like a real
 * MCP tool invocation, not before. The widget itself is the registry's faithful
 * preview (identical to the playground and the deployed LWC); only the
 * surrounding chrome is Claude. Shares its per-CLT copy with the ChatGPT frame
 * via channelCopy so the same CLT is introduced with the same words everywhere.
 */

type Phase = 'suggest' | 'invoking' | 'rendered';

/** The starter-chip row under Claude's composer (Write / Learn / Code / …). */
const CLAUDE_CATEGORIES = [
  { label: 'Write', Icon: MessagesSquare },
  { label: 'Learn', Icon: GraduationCap },
  { label: 'Code', Icon: Code },
  { label: 'Life stuff', Icon: Lightbulb },
] as const;

export function ClaudeFrame({
  recommendation,
  profile,
}: {
  recommendation: Recommendation;
  profile: CompanyProfile;
}) {
  const def = resolveWidget(recommendation);
  const { Preview } = def;

  const payload = useMemo(() => {
    const parsed = safeParse<Record<string, unknown>>(recommendation.defaultPayloadJson ?? '');
    return parsed ? { ...(def.defaults as object), ...parsed } : { ...(def.defaults as object) };
  }, [recommendation.defaultPayloadJson, def]);

  const [phase, setPhase] = useState<Phase>('suggest');
  const [chosen, setChosen] = useState('');
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

  return (
    <section className="channel-surface claude-surface" aria-label="Claude preview">
      <div className="cl-app">
        {/* --- thin icon rail --- */}
        <aside className="cl-rail" aria-label="Claude navigation">
          <button type="button" className="cl-rail-toggle" aria-label="Toggle sidebar"><PanelLeft aria-hidden="true" /></button>
          <div className="cl-rail-group">
            <button type="button" className="cl-rail-btn cl-rail-new" onClick={reset} aria-label="New chat"><Plus aria-hidden="true" /></button>
            <button type="button" className="cl-rail-btn" aria-label="Chats"><MessagesSquare aria-hidden="true" /></button>
            <button type="button" className="cl-rail-btn" aria-label="Projects"><Store aria-hidden="true" /></button>
            <button type="button" className="cl-rail-btn" aria-label="Connectors"><Palette aria-hidden="true" /></button>
            <button type="button" className="cl-rail-btn" aria-label="Work"><Briefcase aria-hidden="true" /></button>
          </div>
          <div className="cl-rail-group cl-rail-mid">
            <button type="button" className="cl-rail-btn" aria-label="Code"><Code aria-hidden="true" /></button>
            <button type="button" className="cl-rail-btn" aria-label="Artifacts"><Palette aria-hidden="true" /></button>
          </div>
          <div className="cl-rail-foot">
            <button type="button" className="cl-rail-btn" aria-label="Downloads"><Download aria-hidden="true" /></button>
            <span className="cl-rail-avatar" aria-hidden="true"><img src={salesforceCloud} alt="" /></span>
          </div>
        </aside>

        {/* --- main conversation --- */}
        <div className={`cl-main${phase === 'suggest' ? ' cl-main-empty' : ''}`}>
          {/* Bridges the demo to the real thing: opens Claude (login) in a new
              tab so a viewer can go try the connector live. Floats top-right so
              it stays visible in both the empty and thread states. */}
          <a className="cl-try-cta" href="https://claude.ai/login" target="_blank" rel="noreferrer">
            <ClaudeMark className="cl-try-cta-mark" />
            Try it in Claude
            <ArrowUpRight className="cl-try-cta-arrow" aria-hidden="true" />
          </a>

          {/* Claude only shows the conversation topbar once a thread exists. */}
          {phase !== 'suggest' && (
            <header className="cl-topbar">
              <button type="button" className="cl-topbar-title">Greeting <span aria-hidden="true">⌄</span></button>
              <button type="button" className="cl-share">Share</button>
            </header>
          )}

          {phase === 'suggest' ? (
            /* --- empty state: centered composer + category chips --- */
            <div className="cl-home">
              <div className="cl-home-composer">
                <Composer placeholder="How can I help you today?" />
              </div>

              <div className="cl-categories" role="group" aria-label="Suggested categories">
                {CLAUDE_CATEGORIES.map(({ label, Icon }) => (
                  <span key={label} className="cl-category" aria-hidden="true"><Icon /> {label}</span>
                ))}
                <span className="cl-category cl-category-choice" aria-hidden="true"><Lightbulb /> Claude's choice</span>
              </div>

              <div className="cl-starters" role="group" aria-label="Suggested prompts">
                {starters.map((s) => (
                  <button type="button" key={s} className="cl-starter" onClick={() => pick(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="cl-thread" role="log" aria-label="Conversation">
                <div className="cl-column">
                  {/* user turn — grey bubble, right-aligned */}
                  <div className="cl-turn cl-turn-user">
                    <div className="cl-user-bubble">{chosen}</div>
                  </div>

                  {/* assistant response: cogitating status, then the tool-result card */}
                  <div className="cl-turn cl-turn-assistant">
                    {phase === 'invoking' ? (
                      <p className="cl-cogitating" aria-live="polite">
                        <span className="cl-cogitating-mark" aria-hidden="true" />
                        <span className="cl-cogitating-text">{invokingLabel}</span>
                      </p>
                    ) : (
                      <div className="cl-assistant-body">
                        <span className="cl-assistant-avatar" aria-hidden="true"><ClaudeMark /></span>
                        <div className="cl-assistant-content">
                          <p className="cl-assistant-text">{lead}</p>

                          <div className="cl-tool-card">
                            <div className="cl-tool-head">
                              <span className="cl-tool-source">
                                {profile.logoUrl ? (
                                  <img className="cl-tool-logo" src={profile.logoUrl} alt="" />
                                ) : (
                                  <ClaudeMark className="cl-tool-mark" />
                                )}
                                {def.label} · {profile.companyName}
                              </span>
                            </div>
                            <div className="cl-tool-body">
                              <Preview value={payload} accentColor={profile.accentColor} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="cl-composer-wrap">
                <Composer placeholder="Write a message…" />
                <p className="cl-disclaimer">Claude is AI and can make mistakes. Please double-check responses.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/** Claude's model menu — the current model line plus name/blurb per model,
    a checkmark on the active one, and the Effort / More models footer rows.
    Mirrors the real picker; nothing here is functional beyond opening. */
const CLAUDE_MODELS: { name: string; blurb: string; note?: string }[] = [
  { name: 'Fable 5', blurb: 'For your toughest challenges', note: 'Requires usage credits' },
  { name: 'Opus 5', blurb: 'For complex tasks' },
  { name: 'Sonnet 5', blurb: 'Most efficient for everyday tasks' },
  { name: 'Haiku 4.5', blurb: 'Fastest for quick answers' },
];

/** Claude's composer: rounded box, blinking-caret placeholder, model chip
    (opens the model dropdown), mic + waveform. */
function Composer({ placeholder }: { placeholder: string }) {
  const [model, setModel] = useState('Sonnet 5');
  const effort = 'Medium';
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Dismiss the menu on outside click / Escape, like the real picker.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="cl-composer">
      {/* A focused-composer look: greyed placeholder trailed by a blinking caret,
          so the frame reads as an active chat waiting for input — nothing sends. */}
      <span className="cl-composer-placeholder">
        <span className="cl-caret" aria-hidden="true" />
        {placeholder}
      </span>
      <div className="cl-composer-row">
        <span className="cl-composer-plus" aria-hidden="true"><Plus /></span>
        <span className="cl-composer-tools">
          <div className="cl-model" ref={menuRef}>
            <button
              type="button"
              className="cl-composer-model"
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {model} <em>{effort}</em> <span className="cl-composer-caret" aria-hidden="true">⌄</span>
            </button>

            {open && (
              <div className="cl-model-menu" role="menu" aria-label="Select model">
                {CLAUDE_MODELS.map((m) => (
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={m.name === model}
                    key={m.name}
                    className="cl-model-item"
                    onClick={() => {
                      setModel(m.name);
                      setOpen(false);
                    }}
                  >
                    <span className="cl-model-text">
                      <span className="cl-model-name">
                        {m.name}
                        {m.note && (
                          <span className="cl-model-note"><Info aria-hidden="true" /> {m.note}</span>
                        )}
                      </span>
                      <span className="cl-model-blurb">{m.blurb}</span>
                    </span>
                    {m.name === model && <Check className="cl-model-check" aria-hidden="true" />}
                  </button>
                ))}
                <div className="cl-model-sep" aria-hidden="true" />
                <button type="button" className="cl-model-row" role="menuitem">
                  <span>Effort</span>
                  <span className="cl-model-row-value">{effort} <ChevronRight aria-hidden="true" /></span>
                </button>
                <div className="cl-model-sep" aria-hidden="true" />
                <button type="button" className="cl-model-row" role="menuitem">
                  <span>More models</span>
                  <ChevronRight className="cl-model-row-chev" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
          <Mic className="cl-composer-icon" aria-hidden="true" />
          <span className="cl-composer-wave" aria-hidden="true"><AudioLines /></span>
        </span>
      </div>
    </div>
  );
}
