import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { compactMoney, money, num, pipelineBars, PIPELINE_TEST, type EcwPipelinePayload } from '../ecwFormat';

/**
 * The bespoke Sales · "My pipeline" snapshot — the reference-quality Coworker
 * CLT exemplar. A faithful preview of the deployed `ecwSalesPipeline` LWC: a
 * colored glyph head with a live-freshness chip, a lightly-tinted hero carrying
 * the one headline number + a quarter-over-quarter trend chip, a stage
 * breakdown drawn as one direct-labeled horizontal bar per stage (sequential
 * blue, deepening toward the close — no legend needed), a 2×2 semantic stat
 * grid, and a clean "Open in CRM" action. Read-only (a display card); form
 * interaction is reserved for the input/approval cards.
 *
 * An empty/invalid payload drops to PIPELINE_TEST so it never renders blank.
 */
export function EcwSalesPipelineCard({ value }: { value?: Partial<EcwPipelinePayload> }) {
  const hasContent = !!(value && Array.isArray(value.stages) && value.stages.length);
  const src: EcwPipelinePayload = hasContent ? ({ ...PIPELINE_TEST, ...value } as EcwPipelinePayload) : PIPELINE_TEST;
  const currency = src.currency || 'USD';
  const bars = pipelineBars(src.stages);
  const delta = typeof src.deltaPct === 'number' ? src.deltaPct : null;
  const up = (delta ?? 0) >= 0;

  return (
    <div className="clt-live-preview ecw-pipe">
      {/* Hero — the one headline number, leads the card (no header chrome) */}
      <div className="ecw-pipe-hero">
        <span className="ecw-pipe-hero-label">Open pipeline</span>
        <div className="ecw-pipe-hero-row">
          <strong className="ecw-pipe-hero-val">{compactMoney(num(src.openTotal), currency)}</strong>
          {delta !== null && (
            <span className={up ? 'ecw-pipe-delta is-up' : 'ecw-pipe-delta is-down'}>
              {up ? <ArrowUpRight aria-hidden="true" /> : <ArrowDownRight aria-hidden="true" />}
              {Math.abs(delta)}%{src.deltaText && <small>{src.deltaText}</small>}
            </span>
          )}
        </div>
      </div>

      {/* Stage breakdown — one direct-labeled horizontal bar per stage */}
      <div className="ecw-pipe-stages" role="img" aria-label="Open pipeline by stage">
        {bars.map((b) => (
          <div className="ecw-pipe-row" key={b.label}>
            <div className="ecw-pipe-row-top">
              <span className="ecw-pipe-row-label">{b.label}</span>
              <span className="ecw-pipe-row-val">{money(b.amount, currency, 0)}</span>
            </div>
            <div className="ecw-pipe-track">
              <span className="ecw-pipe-fill" style={{ width: `${b.pct}%`, background: b.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Open metrics strip — hairline dividers, no boxes */}
      <dl className="ecw-pipe-stats">
        {src.stats.map((st) => (
          <div className={`ecw-pipe-tile is-${st.state || 'neutral'}`} key={st.label}>
            <dt>{st.label}</dt>
            <dd>{st.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
