import { useState } from 'react';
import { AlertTriangle, BellRing, Check, Clock, MapPin, PowerOff, Wrench } from 'lucide-react';
import type { TmcServiceStatusPayload } from './payloads';
import {
  OVERALL_LABEL,
  STATUS_LABEL,
  normOverall,
  normServiceIcon,
  normStatus,
  overallFromServices,
  serviceIcon,
} from './tmcFormat';

const TEST_STATUS: TmcServiceStatusPayload = {
  title: 'Service status',
  overall: 'degraded',
  headline: "We're aware of an issue affecting your area",
  area: 'SoMa, San Francisco 94103',
  etaText: 'Est. restore by 4:30 PM',
  updatedText: 'Updated 2 min ago',
  services: [
    { id: 'internet', name: 'Internet', status: 'down', detail: 'Fiber node offline', icon: 'internet' },
    { id: 'tv', name: 'TV', status: 'degraded', detail: 'Some channels affected', icon: 'tv' },
    { id: 'mobile', name: 'Mobile', status: 'operational', icon: 'mobile' },
    { id: 'voice', name: 'Home phone', status: 'operational', icon: 'voice' },
  ],
  submitText: "Notify me when it's fixed",
};

/** Faithful preview: mirrors the Service Status LWC, including test-mode fallback + interactivity. */
export function TmcServiceStatusPreview({
  value,
  accentColor,
}: {
  value: TmcServiceStatusPayload;
  accentColor: string;
}) {
  const rawServices = (value.services ?? []).filter((s) => s && s.name);
  const isTestMode = rawServices.length === 0;
  const src = isTestMode ? TEST_STATUS : value;
  const title = (src.title && src.title.trim()) || 'Service status';
  const services = (isTestMode ? TEST_STATUS.services : rawServices).slice(0, 6);
  const states = services.map((s) => normStatus(s.status));
  const overall = src.overall ? normOverall(src.overall) : overallFromServices(states);

  const [notified, setNotified] = useState(false);
  const OverallIcon = overall === 'operational' ? Check : overall === 'degraded' ? AlertTriangle : overall === 'outage' ? PowerOff : Wrench;
  const hasMeta = !!(src.area || src.etaText);

  return (
    <div className="clt-live-preview service-status-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {isTestMode && <p className="clt-test-badge">Test mode — add services to preview your content</p>}
      <div className="asa-ss-head">
        <h3 className="selector-title">{title}</h3>
      </div>

      <div className={`asa-ss-hero is-${overall}`}>
        <span className="asa-ss-hero-glow" aria-hidden="true" />
        <div className="asa-ss-hero-top">
          <span className="asa-ss-hero-badge" aria-hidden="true">
            <span className="asa-ss-hero-ping" />
            <OverallIcon />
          </span>
          <div className="asa-ss-hero-text">
            <span className="asa-ss-hero-kicker">Network status</span>
            <span className="asa-ss-hero-label">{OVERALL_LABEL[overall]}</span>
          </div>
          {src.updatedText && <span className="asa-ss-hero-updated">{src.updatedText}</span>}
        </div>
        {src.headline && <p className="asa-ss-hero-headline">{src.headline}</p>}
        {hasMeta && (
          <div className="asa-ss-hero-meta">
            {src.area && (
              <span className="asa-ss-hero-chip">
                <MapPin aria-hidden="true" />
                <span className="asa-ss-chip-text">{src.area}</span>
              </span>
            )}
            {src.etaText && (
              <span className="asa-ss-hero-chip is-eta">
                <Clock aria-hidden="true" />
                <span className="asa-ss-chip-text">{src.etaText}</span>
              </span>
            )}
          </div>
        )}
      </div>

      <ul className="asa-ss-list">
        {services.map((s, index) => {
          const status = normStatus(s.status);
          const Icon = serviceIcon(normServiceIcon(s.icon, s.name));
          return (
            <li key={s.id || index} className={`asa-ss-row is-${status}`}>
              <span className="asa-ss-rail" aria-hidden="true" />
              <span className="asa-ss-ico" aria-hidden="true"><Icon /></span>
              <span className="asa-ss-row-text">
                <span className="asa-ss-row-name">{s.name}</span>
                <span className="asa-ss-row-detail">{(s.detail && s.detail.trim()) || STATUS_LABEL[status]}</span>
              </span>
              <span className="asa-ss-pill">
                <span className="asa-ss-pill-dot" aria-hidden="true" />
                {STATUS_LABEL[status]}
              </span>
            </li>
          );
        })}
      </ul>

      {src.submitText && (
        <button type="button" className="asa-ss-cta" disabled={notified} onClick={() => setNotified(true)}>
          {notified ? <><Check aria-hidden="true" /> We'll let you know</> : <><BellRing aria-hidden="true" /> {src.submitText}</>}
        </button>
      )}
    </div>
  );
}
