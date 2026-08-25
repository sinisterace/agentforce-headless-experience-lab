import { useState } from 'react';
import { Calendar, ClipboardCheck, Droplet, Fan, Filter, Flame, Lightbulb, Snowflake, Thermometer, Wind } from 'lucide-react';
import type { ComponentType } from 'react';
import type { HvacSystemHealthPayload, HvacSystemRow } from './payloads';

/**
 * Live preview for the ASA HVAC · Comfort System Health Report CLT (DTO field
 * hvacSystemHealthJSON). LWC-true fields: title?, score(number 0-100),
 * scoreLabel?, statusText?, updatedText?, systems[]{label,status,detail?,icon?},
 * filter{lifePct,daysLeft?,label?}, nextServiceText?, recommendationText?,
 * submitText?, submitValue?. An empty payload (no numeric score) drops the
 * preview into test-mode so it renders with no payload — mirroring the LWC.
 */

const TRACK_LENGTH = 75; // 270° of a pathLength=100 circle.

const TEST: HvacSystemHealthPayload = {
  title: 'Your comfort system checkup',
  score: 82,
  scoreLabel: 'Good',
  statusText: 'One item needs attention soon',
  updatedText: 'Checked today',
  systems: [
    { label: 'Furnace', status: 'good', detail: 'Operating normally', icon: 'furnace' },
    { label: 'AC condenser', status: 'watch', detail: 'Coil could use a cleaning', icon: 'ac' },
    { label: 'Thermostat', status: 'good', detail: 'Firmware up to date', icon: 'thermostat' },
    { label: 'Air filter', status: 'due', detail: 'Replace within a week', icon: 'filter' },
  ],
  filter: { lifePct: 18, daysLeft: 6, label: '20×25×1 filter' },
  nextServiceText: 'Next maintenance due Nov 3',
  recommendationText: 'Book a tune-up to clean the AC coil before summer.',
  submitText: 'Book maintenance',
};

function normStatus(s?: string): 'good' | 'watch' | 'due' | 'fault' {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'fault' || raw === 'bad' || raw === 'critical' || raw === 'alarm' || raw === 'fail') return 'fault';
  if (raw === 'due' || raw === 'overdue' || raw === 'replace' || raw === 'service') return 'due';
  if (raw === 'watch' || raw === 'warn' || raw === 'warning' || raw === 'caution' || raw === 'soon') return 'watch';
  return 'good';
}

const ICONS: Record<string, ComponentType<{ 'aria-hidden'?: boolean }>> = {
  furnace: Flame,
  ac: Snowflake,
  thermostat: Thermometer,
  ductwork: Wind,
  filter: Filter,
  heatpump: Fan,
  water_heater: Droplet,
};

function normIcon(s?: string): string {
  const raw = String(s || '').toLowerCase().replace(/[^a-z_]/g, '');
  if (raw === 'ac' || raw === 'aircon' || raw === 'condenser' || raw === 'cooling') return 'ac';
  if (raw === 'furnace' || raw === 'heater' || raw === 'heating' || raw === 'boiler') return 'furnace';
  if (raw === 'thermostat' || raw === 'stat' || raw === 'control') return 'thermostat';
  if (raw === 'ductwork' || raw === 'ducts' || raw === 'duct' || raw === 'vents' || raw === 'airflow') return 'ductwork';
  if (raw === 'filter' || raw === 'airfilter') return 'filter';
  if (raw === 'heatpump' || raw === 'pump') return 'heatpump';
  if (raw === 'waterheater' || raw === 'water_heater' || raw === 'water') return 'water_heater';
  return 'furnace';
}

/** Faithful preview: mirrors the Comfort System Health LWC, including test-mode + gauge geometry. */
export function HvacSystemHealthPreview({ value, accentColor }: { value: HvacSystemHealthPayload; accentColor: string }) {
  const isTestMode = !Number.isFinite(value.score as number);
  const src = isTestMode ? TEST : value;

  const title = (src.title && src.title.trim()) || 'Your comfort system checkup';
  const score = Math.max(0, Math.min(100, Number(src.score) || 0));
  const bucket = score >= 80 ? 'good' : score >= 50 ? 'fair' : 'poor';
  const scoreLabel = src.scoreLabel?.trim() || (score >= 80 ? 'Good' : score >= 50 ? 'Fair' : 'Needs attention');
  const valueDash = `${(TRACK_LENGTH * (score / 100)).toFixed(2)} 100`;

  const systems: HvacSystemRow[] = (src.systems ?? []).filter((s) => s && s.label).slice(0, 6);

  const lifePct = Number(src.filter?.lifePct);
  const hasFilter = Number.isFinite(lifePct);
  const pct = Math.max(0, Math.min(100, lifePct));
  const filterState = pct > 50 ? 'good' : pct >= 20 ? 'watch' : 'low';

  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="clt-live-preview system-health-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {isTestMode && <p className="clt-test-badge">Test mode — add a system score to preview your content</p>}

      <div className="asa-sh-head">
        <h3 className="selector-title">{title}</h3>
        {src.updatedText && <span className="asa-sh-updated">{src.updatedText}</span>}
      </div>

      <div className="asa-sh-meter">
        <svg className={`asa-sh-gauge is-${bucket}`} viewBox="0 0 120 120" role="img" aria-label="Comfort health score">
          <circle className="asa-sh-track" cx="60" cy="60" r="52" pathLength={100} strokeDasharray={`${TRACK_LENGTH} 100`} transform="rotate(135 60 60)" />
          <circle className="asa-sh-value" cx="60" cy="60" r="52" pathLength={100} strokeDasharray={valueDash} transform="rotate(135 60 60)" />
        </svg>
        <div className="asa-sh-center">
          <span className="asa-sh-score">{Math.round(score)}</span>
          <span className="asa-sh-score-label">{scoreLabel}</span>
        </div>
      </div>

      {src.statusText && <p className="asa-sh-status">{src.statusText}</p>}

      {systems.length > 0 && (
        <ul className="asa-sh-systems">
          {systems.map((s, i) => {
            const status = normStatus(s.status);
            const Icon = ICONS[normIcon(s.icon)] ?? Flame;
            return (
              <li key={i} className={`asa-sh-sys is-${status}`}>
                <span className="asa-sh-sys-icon" aria-hidden="true"><Icon aria-hidden={true} /></span>
                <span className="asa-sh-sys-text">
                  <span className="asa-sh-sys-label">{s.label}</span>
                  {s.detail && <span className="asa-sh-sys-detail">{s.detail}</span>}
                </span>
                <span className={`asa-sh-pill is-${status}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
              </li>
            );
          })}
        </ul>
      )}

      {hasFilter && (
        <div className={`asa-sh-filter is-${filterState}`}>
          <div className="asa-sh-filter-top">
            <span className="asa-sh-filter-label">{src.filter?.label?.trim() || 'Air filter'}</span>
            <span className="asa-sh-filter-pct">{Math.round(pct)}%</span>
          </div>
          <div className="asa-sh-filter-bar"><span className="asa-sh-filter-fill" style={{ width: `${pct.toFixed(0)}%` }} /></div>
          <span className="asa-sh-filter-cap">
            {Number.isFinite(Number(src.filter?.daysLeft)) ? `${Math.round(Number(src.filter?.daysLeft))} days of life left` : 'filter life remaining'}
          </span>
        </div>
      )}

      {src.nextServiceText && (
        <div className="asa-sh-callout is-schedule"><Calendar aria-hidden="true" /> <span>{src.nextServiceText}</span></div>
      )}
      {src.recommendationText && (
        <div className="asa-sh-callout is-rec"><Lightbulb aria-hidden="true" /> <span>{src.recommendationText}</span></div>
      )}

      {src.submitText && (
        <button type="button" className="asa-sh-cta" disabled={submitted} onClick={() => setSubmitted(true)}>
          <ClipboardCheck aria-hidden="true" /> {submitted ? 'Request sent' : src.submitText}
        </button>
      )}
    </div>
  );
}
