import './EcwSystemStatusCard.css';

/** React preview mirror of the deployed `ecwSystemStatus` LWC (IT · System status).
 *  Energy & Utilities design language: 30-day uptime hero, status-mix meter, an SVG
 *  per-service uptime column chart (zoomed 95–100% axis), and a hairline legend. */
export type EcwSystemStatusService = { name: string; state: 'operational' | 'degraded' | 'down'; uptime?: string; note?: string };
export type EcwSystemStatusPayload = { overall?: 'operational' | 'degraded' | 'down'; headline?: string; opsText?: string; overallUptime?: string; services: EcwSystemStatusService[] };

const STATE_LABEL: Record<string, string> = { operational: 'Operational', degraded: 'Degraded', down: 'Down' };
const STATE_ORDER = ['operational', 'degraded', 'down'] as const;
const AXIS_MIN = 95, AXIS_MAX = 100, STEP = 34, BAR_W = 20, CHART_TOP = 8, CHART_H = 78;
const BASELINE_Y = CHART_TOP + CHART_H, LABEL_Y = BASELINE_Y + 13, VAL_Y = LABEL_Y + 10;

export const SYSTEM_STATUS_TEST: EcwSystemStatusPayload = {
  overall: 'degraded', headline: '1 service degraded', opsText: '7 of 8 operational', overallUptime: '99.7%',
  services: [
    { name: 'Email & Calendar', state: 'operational', uptime: '99.99%' },
    { name: 'VPN / Remote Access', state: 'operational', uptime: '99.97%' },
    { name: 'Salesforce CRM', state: 'operational', uptime: '100%' },
    { name: 'Badge Access System', state: 'degraded', uptime: '98.2%', note: 'Intermittent reader timeouts at HQ east entrance. Engineering is rolling out a firmware fix.' },
    { name: 'Camera Cloud', state: 'operational', uptime: '99.95%' },
    { name: 'Visitor Kiosk Platform', state: 'operational', uptime: '99.98%' },
    { name: 'Workday / HR', state: 'operational', uptime: '99.99%' },
    { name: 'Wi-Fi (HQ)', state: 'operational', uptime: '99.9%' },
  ],
};

function parsePct(v?: string): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(String(v).replace(/[^0-9.]/g, ''));
  return isFinite(n) ? n : null;
}
function abbrev(name: string): string {
  const left = String(name || '').trim().split(/[/|]/)[0].trim();
  const words = left.split(/[\s&]+/).filter(Boolean);
  if (words.length >= 2) { const ac = words.map((w) => w[0]).join('').toUpperCase().slice(0, 4); if (ac.length >= 2) return ac; }
  return (words[0] || left).slice(0, 5);
}

export function EcwSystemStatusCard({ value }: { value?: Partial<EcwSystemStatusPayload> }) {
  const hasContent = !!(value && Array.isArray(value.services) && value.services.length);
  const src: EcwSystemStatusPayload = hasContent ? ({ ...SYSTEM_STATUS_TEST, ...value } as EcwSystemStatusPayload) : SYSTEM_STATUS_TEST;

  const overall = STATE_ORDER.includes(src.overall as never) ? src.overall! : 'operational';
  const services = (src.services || []).filter((s) => s && s.name).map((s) => ({
    name: s.name.trim(), state: STATE_ORDER.includes(s.state as never) ? s.state : 'operational',
    uptime: s.uptime ? String(s.uptime).trim() : '', pct: parsePct(s.uptime), note: s.note ? String(s.note).trim() : '',
  }));
  const total = services.length;
  const overallUptime = src.overallUptime ? String(src.overallUptime).trim() : '';
  const monitoredText = total ? `${total} ${total === 1 ? 'service' : 'services'} monitored` : (src.headline || '');
  const cycleText = src.opsText ? String(src.opsText).trim() : (src.headline || '');

  const counts: Record<string, number> = { operational: 0, degraded: 0, down: 0 };
  services.forEach((s) => { counts[s.state] += 1; });
  const denom = total || 1;
  const mix = STATE_ORDER.filter((k) => counts[k] > 0).map((k) => ({ k, style: { width: `${(counts[k] / denom) * 100}%` } }));
  const mixCaption = STATE_ORDER.filter((k) => counts[k] > 0).map((k) => `${counts[k]} ${k}`).join(' · ');

  const cols = services.filter((s) => s.pct !== null);
  const chartW = Math.max(cols.length * STEP, STEP);
  const viewBox = `0 0 ${chartW} ${VAL_Y + 2}`;
  const columns = cols.map((s, i) => {
    const frac = Math.min(1, Math.max(0, ((s.pct as number) - AXIS_MIN) / (AXIS_MAX - AXIS_MIN)));
    const h = Math.max(3, Math.round(frac * CHART_H));
    return { key: i, x: i * STEP + (STEP - BAR_W) / 2, y: BASELINE_Y - h, w: BAR_W, h, cx: i * STEP + STEP / 2, label: abbrev(s.name), valText: `${s.pct}`, state: s.state };
  });

  return (
    <div className="clt-live-preview ecw-ss">
      <div className="ecw-ss-head">
        <h3 className="ecw-ss-title">System status</h3>
        {cycleText ? <span className="ecw-ss-cycle">{cycleText}</span> : null}
      </div>

      <div className="ecw-ss-projbar">
        <div className="ecw-ss-proj">
          <span className="ecw-ss-proj-eyebrow">30-day uptime</span>
          {overallUptime ? <span className="ecw-ss-proj-value">{overallUptime}</span> : null}
          {monitoredText ? <span className="ecw-ss-used">{monitoredText}</span> : null}
        </div>
        <span className={`ecw-ss-chip is-${overall}`}><span className="ecw-ss-chip-dot" />{STATE_LABEL[overall]}</span>
      </div>

      {mix.length ? (
        <div className="ecw-ss-mix-wrap">
          <div className="ecw-ss-mix">{mix.map((m) => <span key={m.k} className={`ecw-ss-mix-seg is-${m.k}`} style={m.style} />)}</div>
          <div className="ecw-ss-mix-cap">{mixCaption}</div>
        </div>
      ) : null}

      {columns.length ? (
        <div className="ecw-ss-chart-wrap">
          <div className="ecw-ss-chart-head">
            <span className="ecw-ss-chart-title">Uptime by service</span>
            <span className="ecw-ss-chart-axis">{AXIS_MIN}–{AXIS_MAX}%</span>
          </div>
          <svg className="ecw-ss-chart" viewBox={viewBox} preserveAspectRatio="xMidYMid meet" role="img" aria-hidden="true">
            <line className="ecw-ss-grid" x1="0" y1={CHART_TOP} x2={chartW} y2={CHART_TOP} />
            {columns.map((c) => <rect key={`b${c.key}`} className={`ecw-ss-bar is-${c.state}`} x={c.x} y={c.y} width={c.w} height={c.h} />)}
            <line className="ecw-ss-baseline" x1="0" y1={BASELINE_Y} x2={chartW} y2={BASELINE_Y} />
            {columns.map((c) => <text key={`l${c.key}`} className="ecw-ss-bar-label" x={c.cx} y={LABEL_Y} textAnchor="middle">{c.label}</text>)}
            {columns.map((c) => <text key={`v${c.key}`} className="ecw-ss-bar-val" x={c.cx} y={VAL_Y} textAnchor="middle">{c.valText}</text>)}
          </svg>
        </div>
      ) : null}

      {services.length ? (
        <ul className="ecw-ss-legend">
          {services.map((s, i) => (
            <li key={i} className="ecw-ss-leg">
              <span className={`ecw-ss-leg-dot is-${s.state}`} />
              <span className="ecw-ss-leg-main">
                <span className="ecw-ss-leg-label">{s.name}</span>
                {s.note ? <span className="ecw-ss-leg-note">{s.note}</span> : null}
              </span>
              <span className="ecw-ss-leg-amt">{s.uptime || '—'}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
