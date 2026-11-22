import type { AutoStatusItem, AutoTire, AutoVehicleStatusPayload } from './payloads';
import vehicleTopView from '@/assets/automotive/vehicle-top-view.jpg';

/**
 * Live preview for the ASA Automotive · Connected Car Status CLT (DTO field
 * autoVehicleStatusJSON). LWC-true fields: title?, vehicle{name,trim?,imageUrl?,
 * initials?}, isElectric?, range{value,total?,unit?}, battery?, odometer?,
 * odometerUnit?, tires[]{pos,psi,status}, items[]{label,value,status}, alerts[],
 * updatedText?, submitText?, submitValue?. An empty payload (no vehicle.name and
 * no range/battery) drops the preview into test-mode — mirroring the LWC.
 */

const TRACK_LENGTH = 75;

const TEST: AutoVehicleStatusPayload = {
  title: 'Your vehicle',
  vehicle: { name: 'Electric SUV', trim: 'RS AWD', imageUrl: '', initials: 'EV' },
  isElectric: true,
  range: { value: 248, total: 312, unit: 'mi' },
  battery: 78,
  odometer: 18452,
  odometerUnit: 'mi',
  tires: [
    { pos: 'FL', psi: 34, status: 'good' },
    { pos: 'FR', psi: 33, status: 'good' },
    { pos: 'RL', psi: 28, status: 'low' },
    { pos: 'RR', psi: 35, status: 'good' },
  ],
  items: [
    { label: 'Charge', value: '78%', status: 'good' },
    { label: 'Next service', value: 'in 1,200 mi', status: 'good' },
    { label: 'Oil life', value: 'N/A', status: 'good' },
    { label: 'Tire pressure', value: '1 low', status: 'watch' },
  ],
  alerts: ['Rear-left tire pressure is low (28 psi)'],
  updatedText: 'Updated 3 min ago',
  submitText: 'Schedule service',
};

const TIRE_ORDER = ['FL', 'FR', 'RL', 'RR'];
const TIRE_LABELS: Record<string, string> = { FL: 'Front L', FR: 'Front R', RL: 'Rear L', RR: 'Rear R' };

function num(v: unknown): number | null {
  const n = Number(v);
  return isFinite(n) ? n : null;
}
function trimNum(n: number): string {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}
function normTire(s?: string): 'good' | 'watch' | 'bad' {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'low' || raw === 'high' || raw === 'bad' || raw === 'flat' || raw === 'critical') return 'bad';
  if (raw === 'watch' || raw === 'warn' || raw === 'warning') return 'watch';
  return 'good';
}
function normItem(s?: string): 'good' | 'watch' | 'bad' {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'bad' || raw === 'critical' || raw === 'low' || raw === 'due') return 'bad';
  if (raw === 'watch' || raw === 'warn' || raw === 'warning' || raw === 'soon') return 'watch';
  return 'good';
}

/** Faithful preview: mirrors the Connected Car Status LWC, including test-mode. */
export function AutoVehicleStatusPreview({ value, accentColor }: { value: AutoVehicleStatusPayload; accentColor: string }) {
  const vehicle = value.vehicle || ({} as NonNullable<AutoVehicleStatusPayload['vehicle']>);
  const range = value.range || ({} as NonNullable<AutoVehicleStatusPayload['range']>);
  const hasName = !!(vehicle.name && String(vehicle.name).trim());
  const hasRange = num(range.value) !== null || num(value.battery) !== null;
  const isTestMode = !hasName && !hasRange;
  const src = isTestMode ? TEST : value;

  const sVeh = src.vehicle || ({} as NonNullable<AutoVehicleStatusPayload['vehicle']>);
  const vehicleName = sVeh.name ? String(sVeh.name).trim() : 'Your vehicle';
  const parts = vehicleName.split(/\s+/).filter(Boolean);
  const initials =
    (sVeh.initials && String(sVeh.initials).trim().slice(0, 2).toUpperCase()) ||
    ((parts[0] ? parts[0][0] : '') + (parts[1] ? parts[1][0] : '')).toUpperCase() ||
    'CAR';

  // Gauge
  const sRange = src.range || ({} as NonNullable<AutoVehicleStatusPayload['range']>);
  const rv = num(sRange.value);
  const rt = num(sRange.total);
  const battery = num(src.battery);
  const unit = sRange.unit ? String(sRange.unit).trim() : 'mi';
  let frac = 0;
  let centerMain = '—';
  let centerUnit = '';
  let centerSub = '';
  if (rv !== null && rt !== null && rt > 0) {
    frac = rv / rt;
    centerMain = trimNum(rv);
    centerUnit = unit;
    centerSub = `of ${trimNum(rt)} ${unit}`;
  } else if (rv !== null) {
    frac = 0.9;
    centerMain = trimNum(rv);
    centerUnit = unit;
    centerSub = 'range';
  } else if (battery !== null) {
    frac = battery / 100;
    centerMain = trimNum(battery);
    centerUnit = '%';
    centerSub = src.isElectric ? 'charge' : 'fuel';
  }
  frac = Math.max(0, Math.min(1, frac));
  const valueDash = `${(TRACK_LENGTH * frac).toFixed(2)} 100`;
  const warn = frac <= 0.2;
  const gaugeClass = `asa-vs-gauge ${warn ? 'is-warn' : 'is-ok'}`;

  let subline = '';
  if (rv !== null && battery !== null) subline = `${trimNum(battery)}% ${src.isElectric ? 'charged' : 'fuel'}`;
  else if (num(src.odometer) !== null) subline = `${Number(src.odometer).toLocaleString()} ${src.odometerUnit ? String(src.odometerUnit).trim() : 'mi'} on the odometer`;

  // Tires
  const rawTires: AutoTire[] = Array.isArray(src.tires) ? src.tires.filter((t) => t && t.pos) : [];
  const byPos: Record<string, AutoTire> = {};
  rawTires.forEach((t) => {
    const pos = String(t.pos).toUpperCase().replace(/[^A-Z]/g, '');
    if (TIRE_ORDER.includes(pos)) byPos[pos] = t;
  });
  const tires = TIRE_ORDER.filter((p) => byPos[p]).map((pos) => {
    const t = byPos[pos];
    const st = normTire(t.status);
    const psi = num(t.psi);
    return { pos, label: TIRE_LABELS[pos], psi: psi !== null ? trimNum(psi) : '—', cls: `asa-vs-tire is-${pos.toLowerCase()} is-${st}` };
  });

  // Items
  const items = (Array.isArray(src.items) ? src.items.filter((m: AutoStatusItem) => m && m.label) : []).slice(0, 4).map((m: AutoStatusItem) => ({
    label: String(m.label).trim(),
    value: m.value != null ? String(m.value).trim() : '—',
    cls: `asa-vs-item is-${normItem(m.status)}`,
  }));

  const alerts = (Array.isArray(src.alerts) ? src.alerts : []).map((a) => (a == null ? '' : String(a).trim())).filter(Boolean);

  return (
    <div className="clt-live-preview vehicle-status-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>

      <h3 className="selector-title">{src.title ? String(src.title) : 'Your vehicle'}</h3>

      <div className="asa-vs-head">
        <span className="asa-vs-veh">
          <span className="asa-vs-avatar">
            {src.vehicle?.imageUrl ? (
              <img src={src.vehicle.imageUrl} alt={vehicleName} />
            ) : (
              <span className="asa-vs-avatar-fallback" aria-hidden="true">{initials}</span>
            )}
          </span>
          <span className="asa-vs-veh-text">
            <span className="asa-vs-veh-name">{vehicleName}</span>
            {sVeh.trim && <span className="asa-vs-veh-trim">{sVeh.trim}</span>}
          </span>
        </span>
        {src.updatedText && (
          <span className="asa-vs-updated"><span className="asa-vs-live-dot" aria-hidden="true" />{src.updatedText}</span>
        )}
      </div>

      <div className="asa-vs-meter">
        <svg className={gaugeClass} viewBox="0 0 120 120" role="img" aria-label="Vehicle range gauge">
          <circle className="asa-vs-track" cx="60" cy="60" r="52" pathLength="100" strokeDasharray={`${TRACK_LENGTH} 100`} transform="rotate(135 60 60)" />
          <circle className="asa-vs-value" cx="60" cy="60" r="52" pathLength="100" strokeDasharray={valueDash} transform="rotate(135 60 60)" />
        </svg>
        <div className="asa-vs-center">
          <span className="asa-vs-main">{centerMain}<span className="asa-vs-unit">{centerUnit}</span></span>
          {centerSub && <span className="asa-vs-sub">{centerSub}</span>}
        </div>
      </div>
      {subline && <p className="asa-vs-subline">{subline}</p>}

      {tires.length > 0 && (
        <div className="asa-vs-tires" role="group" aria-label="Tire pressures">
          {tires.map((t) => (
            <span key={t.pos} className={t.cls}>
              <span className="asa-vs-tire-pos">{t.label}</span>
              <span className="asa-vs-tire-psi">{t.psi}<span className="asa-vs-tire-unit">psi</span></span>
            </span>
          ))}
          <span className="asa-vs-car" aria-hidden="true">
            <img className="asa-vs-car-img" src={vehicleTopView} alt="" />
          </span>
        </div>
      )}

      {items.length > 0 && (
        <div className="asa-vs-items">
          {items.map((m, i) => (
            <div key={i} className={m.cls}>
              <span className="asa-vs-item-label"><span className="asa-vs-dot" aria-hidden="true" />{m.label}</span>
              <span className="asa-vs-item-value">{m.value}</span>
            </div>
          ))}
        </div>
      )}

      {alerts.length > 0 && (
        <ul className="asa-vs-alerts">
          {alerts.map((a, i) => (
            <li key={i} className="asa-vs-alert">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m10.29 3.86-8.48 14.14A2 2 0 0 0 3.51 21h16.98a2 2 0 0 0 1.7-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
              <span className="asa-vs-alert-text">{a}</span>
            </li>
          ))}
        </ul>
      )}

      {src.submitText && (
        <button type="button" className="asa-vs-cta">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" /></svg>
          {src.submitText}
        </button>
      )}
    </div>
  );
}
