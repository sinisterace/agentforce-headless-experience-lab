import { useEffect, useState } from 'react';
import { Flame, Snowflake, Thermometer } from 'lucide-react';
import type { HvacThermostatPayload } from './payloads';

/**
 * Live preview for the ASA HVAC · Smart Thermostat Control CLT (DTO field
 * hvacThermostatJSON). LWC-true fields: title?, currentTemp(number), targetTemp?,
 * mode?(heat|cool|auto|off|fan), unit?(F|C), humidity?, statusText?, minTemp?,
 * maxTemp?, presets[]{id,label,targetTemp,mode?}, submitText?, submitValue?. An
 * absent/non-number currentTemp drops the preview into test-mode so it renders
 * with no payload — mirroring the LWC (same dial geometry + heat/cool duality).
 */

const TEST: HvacThermostatPayload = {
  title: 'Living room thermostat',
  currentTemp: 71,
  targetTemp: 72,
  mode: 'cool',
  unit: 'F',
  humidity: 44,
  statusText: 'Cooling to 72°',
  minTemp: 50,
  maxTemp: 90,
  presets: [
    { id: 'eco', label: 'Eco', targetTemp: 78, mode: 'cool' },
    { id: 'comfort', label: 'Comfort', targetTemp: 72, mode: 'cool' },
    { id: 'away', label: 'Away', targetTemp: 82, mode: 'off' },
    { id: 'sleep', label: 'Sleep', targetTemp: 68, mode: 'cool' },
  ],
  submitText: 'Set thermostat',
  submitValue: 'Set my thermostat',
};

const MODES = ['heat', 'cool', 'auto', 'off'] as const;
const MODE_LABELS: Record<string, string> = { heat: 'Heat', cool: 'Cool', auto: 'Auto', off: 'Off', fan: 'Fan' };
const TRACK_LENGTH = 75;

function num(v: unknown): number | null {
  const n = Number(v);
  return isFinite(n) ? n : null;
}

function normMode(m?: string): string {
  const raw = String(m || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'heat' || raw === 'heating' || raw === 'warm') return 'heat';
  if (raw === 'cool' || raw === 'cooling' || raw === 'ac' || raw === 'cold') return 'cool';
  if (raw === 'off' || raw === 'standby') return 'off';
  if (raw === 'fan' || raw === 'fanonly') return 'fan';
  return 'auto';
}

/** Faithful preview: mirrors the Thermostat LWC's resolved render state. */
export function HvacThermostatPreview({ value, accentColor }: { value: HvacThermostatPayload; accentColor: string }) {
  const isTestMode = num(value.currentTemp) === null;
  const src = isTestMode ? TEST : value;

  const unit = String(src.unit || 'F').toUpperCase() === 'C' ? 'C' : 'F';
  const currentTemp = num(src.currentTemp) ?? 70;
  const minTemp = num(src.minTemp) ?? (unit === 'C' ? 10 : 50);
  let maxTemp = num(src.maxTemp) ?? (unit === 'C' ? 32 : 90);
  if (maxTemp <= minTemp) maxTemp = minTemp + 1;
  const clampTemp = (t: number) => Math.max(minTemp, Math.min(maxTemp, t));
  const initialTarget = Math.round(clampTemp(num(src.targetTemp) ?? currentTemp));
  const initialMode = normMode(src.mode);

  // Interactive: the visitor dials the target (big number + arc) and picks a mode.
  const [target, setTarget] = useState(initialTarget);
  const [mode, setMode] = useState(initialMode);
  const seedKey = `${isTestMode}|${initialTarget}|${initialMode}|${minTemp}|${maxTemp}`;
  useEffect(() => {
    setTarget(initialTarget);
    setMode(initialMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedKey]);

  const isOff = mode === 'off';
  const adjust = (d: number) => setTarget((t) => Math.round(clampTemp(t + d)));

  const frac = Math.max(0, Math.min(1, (target - minTemp) / (maxTemp - minTemp)));
  const valueDash = `${(TRACK_LENGTH * frac).toFixed(2)} 100`;
  const targetReadout = isOff ? 'System off' : `Set to ${Math.round(target)}°${unit}`;
  const statusLine = isOff
    ? 'System is off'
    : `${mode === 'heat' ? 'Heating' : mode === 'cool' ? 'Cooling' : 'Auto'} · now ${Math.round(currentTemp)}°${unit}`;

  const humidity = num(src.humidity);
  const presets = (Array.isArray(src.presets) ? src.presets : [])
    .filter((p) => p && p.id && p.label && num(p.targetTemp) != null)
    .slice(0, 4)
    .map((p) => ({ ...p, targetTemp: Math.round(clampTemp(num(p.targetTemp) as number)), mode: normMode(p.mode || initialMode) }));

  return (
    <div className="clt-live-preview thermostat-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>

      <div className="asa-th-head">
        <h3 className="selector-title">{src.title || 'Thermostat'}</h3>
        {humidity != null && (
          <span className="asa-th-humidity">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2.7S5.5 9.9 5.5 14.5a6.5 6.5 0 0 0 13 0C18.5 9.9 12 2.7 12 2.7Z" /></svg>
            {Math.round(humidity)}%
          </span>
        )}
      </div>

      <div className="asa-th-meter">
        <svg className={`asa-th-dial is-${mode}`} viewBox="0 0 120 120" role="img" aria-label="Thermostat dial">
          <circle className="asa-th-track" cx="60" cy="60" r="52" pathLength="100" strokeDasharray={`${TRACK_LENGTH} 100`} transform="rotate(135 60 60)" />
          <circle className="asa-th-value" cx="60" cy="60" r="52" pathLength="100" strokeDasharray={valueDash} transform="rotate(135 60 60)" />
        </svg>
        <div className="asa-th-center">
          <span className="asa-th-current">{Math.round(target)}<span className="asa-th-deg">°{unit}</span></span>
          <span className="asa-th-target">Now {Math.round(currentTemp)}°{unit}</span>
        </div>
      </div>

      <p className="asa-th-status">{statusLine}</p>

      <div className="asa-th-modes" role="group" aria-label="Mode">
        {MODES.map((m) => (
          <button key={m} type="button" className={m === mode ? `asa-th-mode is-${m} is-on` : 'asa-th-mode'} data-mode={m} aria-pressed={m === mode} onClick={() => setMode(m)}>
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      <div className="asa-th-stepper">
        <button type="button" className="asa-th-step" aria-label="Lower target" disabled={isOff || target <= minTemp} onClick={() => adjust(-1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /></svg>
        </button>
        <span className="asa-th-step-label">{mode === 'heat' ? <Flame aria-hidden="true" style={{ width: '0.9rem', height: '0.9rem', verticalAlign: '-2px', marginRight: 4 }} /> : mode === 'cool' ? <Snowflake aria-hidden="true" style={{ width: '0.9rem', height: '0.9rem', verticalAlign: '-2px', marginRight: 4 }} /> : <Thermometer aria-hidden="true" style={{ width: '0.9rem', height: '0.9rem', verticalAlign: '-2px', marginRight: 4 }} />}{targetReadout}</span>
        <button type="button" className="asa-th-step" aria-label="Raise target" disabled={isOff || target >= maxTemp} onClick={() => adjust(1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
        </button>
      </div>

      {presets.length > 0 && (
        <div className="asa-th-presets">
          {presets.map((p) => (
            <button key={p.id} type="button" className={p.targetTemp === target && p.mode === mode ? 'asa-th-preset is-on' : 'asa-th-preset'} data-id={p.id} onClick={() => { setTarget(p.targetTemp); setMode(p.mode); }}>
              {p.label}
            </button>
          ))}
        </div>
      )}

      <button type="button" className="asa-th-cta">{src.submitText || 'Set thermostat'}</button>
    </div>
  );
}
