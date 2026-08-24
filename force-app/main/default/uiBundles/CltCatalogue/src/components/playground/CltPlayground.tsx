import { useEffect, useMemo, useState } from 'react';
import { Braces, MousePointer2, RotateCcw, SlidersHorizontal, Sparkles, TreePine, X, Zap } from 'lucide-react';
import type { Recommendation } from '@/types/catalog';
import { pretty, safeParse } from './payloads';
import { StructurePane } from './StructurePane';
import { resolveWidget } from './widgets/registry';

/**
 * The CLT playground. The rendered component is the hero: it sits alone on a
 * soft canvas, exactly as a customer would see it in the agent. The authoring
 * detail — Structure | JSON — is tucked into an inspector that only opens when
 * you ask for it, so the screen stays focused on the CLT itself.
 *
 * Every CLT is looked up in the widget registry, so this file never grows as
 * the library scales — a new CLT is one *.def.ts file plus a registry line.
 * Fully self-contained: the only data source is the catalogue row (Apex
 * /cltcat/*). Nothing here depends on the MCP server.
 */
type InspectorView = 'structure' | 'json';

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
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [view, setView] = useState<InspectorView>('structure');

  // Re-seed when a different CLT is opened.
  useEffect(() => setPayload(seed), [seed]);

  const { Preview } = def;
  const jsonString = pretty(payload);

  return (
    <section
      className={`clt-stage${inspectorOpen ? ' inspecting' : ''}`}
      style={{ '--customer-accent': accentColor } as React.CSSProperties}
      aria-label={`${recommendation.label} playground`}
    >
      <div className="clt-workbench-label" aria-hidden="true">
        <span><i /><i /><i /></span>
        <strong>Interactive component laboratory</strong>
        <b>CLT / LIVE</b>
      </div>
      <header className="clt-stage-bar">
        <div className="clt-action-id">
          <span className="clt-action-glyph" aria-hidden="true"><Zap /></span>
          <div>
            <span className="clt-action-kicker">Agent action</span>
            <strong>{recommendation.label}</strong>
            <code>c/{recommendation.cltApiName}</code>
          </div>
        </div>
        <div className="clt-stage-controls">
          <span className="clt-live-pill">
            <i aria-hidden="true" />
            {companyName ? `Live for ${companyName}` : 'Live preview'}
          </span>
          <button type="button" className="clt-reset" onClick={() => setPayload(seed)}>
            <RotateCcw aria-hidden="true" /> Reset
          </button>
          <button
            type="button"
            className={inspectorOpen ? 'clt-inspect-toggle on' : 'clt-inspect-toggle'}
            onClick={() => setInspectorOpen((o) => !o)}
            aria-pressed={inspectorOpen}
          >
            <SlidersHorizontal aria-hidden="true" /> {inspectorOpen ? 'Hide details' : 'Structure & data'}
          </button>
        </div>
      </header>

      <div className="clt-stage-body">
        <div className="clt-canvas">
          <div className="clt-canvas-orbit" aria-hidden="true"><i /><i /><i /></div>
          <div className="clt-canvas-label" aria-hidden="true"><Sparkles /> Customer-facing render</div>
          <div className="clt-canvas-mount">
            <Preview value={payload} accentColor={accentColor} />
          </div>
          <div className="clt-canvas-meta" aria-hidden="true">
            <span><i /><MousePointer2 /> Interaction ready</span>
            <code>c/{recommendation.cltApiName}</code>
          </div>
        </div>

        {inspectorOpen && (
          <aside className="clt-inspector" aria-label="Component inspector">
            <div className="clt-inspector-head">
              <div className="clt-inspector-tabs" role="tablist" aria-label="Inspector view">
                <button type="button" role="tab" aria-selected={view === 'structure'} className={view === 'structure' ? 'active' : ''} onClick={() => setView('structure')}>
                  <TreePine aria-hidden="true" /> Structure
                </button>
                <button type="button" role="tab" aria-selected={view === 'json'} className={view === 'json' ? 'active' : ''} onClick={() => setView('json')}>
                  <Braces aria-hidden="true" /> JSON
                </button>
              </div>
              <button type="button" className="clt-inspector-close" onClick={() => setInspectorOpen(false)} aria-label="Close details">
                <X aria-hidden="true" />
              </button>
            </div>
            <div className="clt-inspector-sub">
              <code>{recommendation.dtoFieldName}</code>
            </div>
            <div className="clt-inspector-body">
              {view === 'structure' && <StructurePane nodes={def.structure} payload={payload} />}
              {view === 'json' && (
                <div className="clt-json-view">
                  <pre>
                    {jsonString.split('\n').map((line, index) => (
                      <code key={index}>
                        <span>{index + 1}</span>
                        {line || ' '}
                      </code>
                    ))}
                  </pre>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}
