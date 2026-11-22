import { MapPin } from 'lucide-react';
import type { RetailOrderTrackingPayload } from './payloads';
import { routeProgress, stepsForStatus, trackStatus } from './retailFormat';

/**
 * Live preview for the ASA Retail · Order Tracking CLT
 * (DTO field retailOrderTrackingJSON). LWC-true fields: title, live?, status?,
 * etaText?, courier?{ name, vehicle?, initials?, photoUrl?, rating? },
 * destination?{ label?, address? }, steps?[]{ label, state, time? },
 * submitText?, submitValue?.
 *
 * The map is a self-contained SVG (abstract street grid + dashed route + a
 * courier marker positioned by status + a destination pin) — NO external map
 * tiles, so it renders inside Enhanced Chat v2 where egress is blocked. When the
 * payload carries no status / steps / ETA the preview shows a sample so it is
 * never blank — mirroring the LWC.
 */

/* ── Self-contained map ─────────────────────────────────────────────────── */

/** Route polyline in the 320×176 viewBox — store (bottom-left) → home (top-right). */
const ROUTE: Array<[number, number]> = [
  [40, 150],
  [40, 106],
  [150, 106],
  [150, 60],
  [268, 60],
];

function pointAlong(progress: number): { x: number; y: number; covered: Array<[number, number]> } {
  const segs = ROUTE.slice(1).map((b, i) => {
    const a = ROUTE[i];
    return { a, b, len: Math.hypot(b[0] - a[0], b[1] - a[1]) };
  });
  const total = segs.reduce((sum, s) => sum + s.len, 0);
  const target = Math.max(0, Math.min(1, progress)) * total;
  let acc = 0;
  const covered: Array<[number, number]> = [ROUTE[0]];
  for (const seg of segs) {
    if (target <= acc + seg.len || seg === segs[segs.length - 1]) {
      const f = seg.len === 0 ? 0 : Math.max(0, Math.min(1, (target - acc) / seg.len));
      const x = seg.a[0] + (seg.b[0] - seg.a[0]) * f;
      const y = seg.a[1] + (seg.b[1] - seg.a[1]) * f;
      covered.push([x, y]);
      return { x, y, covered };
    }
    covered.push(seg.b);
    acc += seg.len;
  }
  const last = ROUTE[ROUTE.length - 1];
  return { x: last[0], y: last[1], covered };
}

function toPath(pts: Array<[number, number]>): string {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
}

function TrackingMap({ status, live }: { status: string; live: boolean }) {
  const s = trackStatus(status);
  const { x, y, covered } = pointAlong(routeProgress(s));
  const dest = ROUTE[ROUTE.length - 1];
  const fullPath = toPath(ROUTE);
  const coveredPath = toPath(covered);
  const arrived = s === 'delivered';
  return (
    <svg className="asa-ot-svg" viewBox="0 0 320 176" role="img" aria-label="Delivery map">
      <rect x="0" y="0" width="320" height="176" className="asa-ot-map-bg" />
      {/* abstract city blocks */}
      <g className="asa-ot-blocks">
        <rect x="10" y="12" width="56" height="42" rx="6" />
        <rect x="80" y="12" width="52" height="30" rx="6" />
        <rect x="196" y="12" width="48" height="34" rx="6" />
        <rect x="258" y="12" width="52" height="34" rx="6" />
        <rect x="10" y="118" width="60" height="46" rx="6" />
        <rect x="176" y="118" width="60" height="46" rx="6" />
        <rect x="250" y="82" width="60" height="42" rx="6" />
        <rect x="80" y="128" width="70" height="36" rx="6" />
      </g>
      {/* wide light "roads" under the route + two crossing streets */}
      <g className="asa-ot-roads">
        <path d={fullPath} />
        <line x1="0" y1="106" x2="320" y2="106" />
        <line x1="150" y1="0" x2="150" y2="176" />
      </g>
      {/* route: full (dashed) then covered (solid accent) */}
      <path className="asa-ot-route-rest" d={fullPath} />
      <path className="asa-ot-route-done" d={coveredPath} />
      {/* origin (store) */}
      <circle className="asa-ot-origin" cx={ROUTE[0][0]} cy={ROUTE[0][1]} r="5" />
      {/* destination pin */}
      <g transform={`translate(${dest[0]}, ${dest[1]})`}>
        <path className="asa-ot-dest-pin" d="M0,-15 C-6.5,-15 -12,-9.5 -12,-3 C-12,5 0,15 0,15 C0,15 12,5 12,-3 C12,-9.5 6.5,-15 0,-15 Z" />
        <circle className="asa-ot-dest-dot" cx="0" cy="-3" r="4" />
      </g>
      {/* courier marker */}
      <g transform={`translate(${x}, ${y})`}>
        {live && !arrived && <circle className="asa-ot-pulse" cx="0" cy="0" r="12" />}
        <circle className="asa-ot-courier-ring" cx="0" cy="0" r="11" />
        <circle className="asa-ot-courier-dot" cx="0" cy="0" r="7" />
      </g>
    </svg>
  );
}

/* ── Preview ─────────────────────────────────────────────────────────────── */

const TEST_TRACKING: RetailOrderTrackingPayload = {
  title: 'Track order #4821',
  live: true,
  status: 'out_for_delivery',
  etaText: 'Arriving 2:15–2:30 PM',
  courier: { name: 'Alex Rivera', vehicle: 'bike', initials: 'AR', rating: '4.9 ★' },
  destination: { label: 'Home', address: '150 4th St, San Francisco' },
  submitText: 'Message courier',
};

/** Faithful preview: mirrors the Order Tracking LWC, including test-mode fallback. */
export function RetailOrderTrackingPreview({
  value,
  accentColor,
}: {
  value: RetailOrderTrackingPayload;
  accentColor: string;
}) {
  const isTestMode = !value.status && !(value.steps && value.steps.length) && !value.etaText && !value.courier;
  const data = isTestMode ? TEST_TRACKING : value;
  const title = (data.title && data.title.trim()) || 'Track your order';
  const status = trackStatus(data.status);
  const steps = data.steps && data.steps.length ? data.steps : stepsForStatus(status);
  const dest = data.destination;
  const submitText = data.submitText && data.submitText.trim();

  return (
    <div className="clt-live-preview order-tracking-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      <div className="asa-ot-head">
        <h3 className="selector-title">{title}</h3>
      </div>

      <div className="asa-ot-map">
        <TrackingMap status={data.status || status} live={!!data.live} />
        {data.etaText && (
          <div className="asa-ot-eta">
            <span className="asa-ot-eta-label">Estimated arrival</span>
            <span className="asa-ot-eta-time">{data.etaText}</span>
            {dest && (dest.label || dest.address) && (
              <span className="asa-ot-eta-dest"><MapPin aria-hidden="true" />{[dest.label, dest.address].filter(Boolean).join(' · ')}</span>
            )}
          </div>
        )}
      </div>

      <ol className="asa-ot-steps">
        {steps.map((s, index) => {
          const state = ['done', 'current', 'todo'].includes(s.state) ? s.state : 'todo';
          return (
            <li className={`asa-ot-step is-${state}`} key={`${s.label}-${index}`}>
              <span className="asa-ot-step-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="asa-ot-node" aria-hidden="true" />
              <span className="asa-ot-step-label">{s.label}</span>
              {s.time && <span className="asa-ot-step-time">{s.time}</span>}
            </li>
          );
        })}
      </ol>

      {submitText && (
        <button type="button" className="asa-ot-cta">{submitText}</button>
      )}
    </div>
  );
}
