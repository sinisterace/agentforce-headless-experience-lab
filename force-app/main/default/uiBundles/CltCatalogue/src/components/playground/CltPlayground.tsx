import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Code2, Copy, Mic, MoreVertical, Plus, RotateCcw, TreePine } from 'lucide-react';
import type { Recommendation } from '@/types/catalog';
import agentSparkle from '@/assets/brand/df26/sparkle-dreamviolet.png';
import agentforceAvatar from '@/assets/brand/df26/agentforce-avatar.png';
import { safeParse } from './payloads';
import { StructurePane } from './StructurePane';
import { CltCodeInspector } from './CltCodeInspector';
import { resolveWidget } from './widgets/registry';
import { sampleAsk } from './samplePrompts';

/**
 * The CLT "agent action" playground (DF26). The rendered component is the hero:
 * it sits on a soft canvas exactly as a customer would see it in the agent, with
 * a Structure | Data inspector always shown beside it (matching the Lovable
 * design). The header names the agent action + its Custom Lightning Type.
 *
 * IMPORTANT: the live CLT render itself (`<Preview>` inside `.clt-canvas-mount`)
 * and the widget registry are the deployed-CLT surface and are NOT restyled —
 * only the surrounding playground chrome. Adding a new CLT is still one *.def.ts
 * file plus a registry line; this file never grows. Only data source is the
 * catalogue row (Apex /cltcat/*).
 */
type InspectorView = 'structure' | 'source';

export function CltPlayground({
  recommendation,
  accentColor,
  companyName,
}: {
  recommendation: Recommendation;
  accentColor: string;
  /** When supplied, the stage reads as this company's own live preview. */
  companyName?: string;
}) {
  const def = resolveWidget(recommendation);

  const seed = useMemo(() => {
    const parsed = safeParse<Record<string, unknown>>(recommendation.defaultPayloadJson ?? '');
    return parsed ? { ...(def.defaults as object), ...parsed } : { ...(def.defaults as object) };
  }, [recommendation.defaultPayloadJson, def]);

  const [payload, setPayload] = useState<Record<string, unknown>>(seed);
  const [view, setView] = useState<InspectorView>('structure');

  // Re-seed when a different CLT is opened.
  useEffect(() => setPayload(seed), [seed]);

  const { Preview } = def;

  // A representative customer utterance for this CLT, with a tap-to-copy button —
  // the service-track analogue of the team track's per-function `ask`.
  const ask = sampleAsk(def.kind, recommendation.label);
  const [copied, setCopied] = useState(false);
  async function copyAsk() {
    try {
      await navigator.clipboard.writeText(ask);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable (insecure context) — no-op */
    }
  }

  return (
    <section
      className="clt-stage"
      style={{ '--customer-accent': accentColor } as React.CSSProperties}
      aria-label={`${recommendation.label} playground`}
    >
      <header className="clt-stage-bar">
        <div className="clt-action-id">
          <span className="clt-action-glyph" aria-hidden="true">
            <img src={agentSparkle} alt="" />
          </span>
          <div>
            <span className="clt-action-kicker">Agent action</span>
            <strong>{recommendation.label}</strong>
            <code>c/{recommendation.cltApiName}</code>
          </div>
        </div>
        <div className="clt-stage-tabs" role="tablist" aria-label="Inspector view">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'structure'}
            className={view === 'structure' ? 'active' : ''}
            onClick={() => setView('structure')}
          >
            <TreePine aria-hidden="true" /> Structure
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'source'}
            className={view === 'source' ? 'is-source active' : 'is-source'}
            onClick={() => setView('source')}
          >
            <Code2 aria-hidden="true" /> Source
          </button>
        </div>
      </header>

      <div className="clt-stage-body">
        <div className="clt-canvas">
          {/* Agentforce conversation frame — the CLT render (<Preview>) is
              unchanged; it's wrapped in the agent chat chrome to match Lovable. */}
          <div className="clt-chatframe">
            <header className="clt-chat-head">
              <span className="clt-chat-title">{companyName || 'Your company'} Service Agent</span>
              <span className="clt-chat-actions" aria-hidden="true"><MoreVertical /><ChevronDown /></span>
            </header>
            <div className="clt-chat-body">
              {/* The customer's ask — tap to copy, then paste into the real agent. */}
              <div className="clt-chat-userturn">
                <p className="clt-chat-userbubble">{ask}</p>
                <button type="button" className="clt-chat-copy" onClick={copyAsk} aria-label="Copy this prompt">
                  {copied ? <><Check aria-hidden="true" /> Copied</> : <><Copy aria-hidden="true" /> Copy prompt</>}
                </button>
              </div>
              <div className="clt-chat-turn">
                <img className="clt-chat-avatar" src={agentforceAvatar} alt="" aria-hidden="true" />
                <div className="clt-chat-turn-copy">
                  <p className="clt-chat-bubble">Here are the details.</p>
                  <span className="clt-chat-agentlabel">Agentforce</span>
                </div>
              </div>
              <div className="clt-canvas-mount">
                <Preview value={payload} accentColor={accentColor} />
              </div>
            </div>
            <div className="clt-chat-input" aria-hidden="true">
              <Plus />
              <span>What can I help you with?</span>
              <Mic />
            </div>
          </div>
        </div>

        <aside className="clt-inspector" aria-label="Component inspector">
          {view !== 'source' && (
            <div className="clt-inspector-sub">
              <code>{recommendation.dtoFieldName}</code>
              <button type="button" className="clt-reset" onClick={() => setPayload(seed)}>
                <RotateCcw aria-hidden="true" /> Reset
              </button>
            </div>
          )}
          <div className={view === 'source' ? 'clt-inspector-body is-source' : 'clt-inspector-body'}>
            {view === 'structure' && <StructurePane nodes={def.structure} payload={payload} />}
            {view === 'source' && <CltCodeInspector recommendation={recommendation} embedded />}
          </div>
        </aside>
      </div>
    </section>
  );
}
