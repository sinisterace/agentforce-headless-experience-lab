import { ChevronRight, ExternalLink, Phone, TriangleAlert, Check, Clock, DollarSign, Info } from 'lucide-react';
import type { HealthcareCareOptionsPayload } from './payloads';
import { actionKind, channelBucket, channelIcon, telHref, type ChannelBucket } from './careOptionsFormat';

/**
 * Live preview for the ASA Healthcare · Care Options CLT
 * (DTO field healthcareCareOptionsJSON). Mirrors the deployed LWC "Care
 * Navigator": each channel is an elevated card with a round channel medallion,
 * label, an optional Recommended banner + accent ring, a typed meta chip
 * (wait-time / cost / info), and a full-width channel-colored action. A routing
 * card only — no symptoms are collected. 'call'/'link' render as redirect
 * anchors; 'book' hands the conversation back to the agent. LWC-true fields:
 * title, subtitle?, options (object[] of { id, channel?, label, description?,
 * meta?, recommended?, actionType, actionValue? }), disclaimer?. An empty option
 * list drops into a test-mode fallback so it renders even with no payload.
 */

const CHANNEL_HUES: Record<ChannelBucket, string> = {
  nurseline: '#0e7490',
  video: '#2563eb',
  inperson: '#0f766e',
  urgent: '#b45309',
  er: '#c0392b',
  pharmacy: '#15803d',
  message: '#475467',
};

const metaKind = (meta?: string): 'cost' | 'time' | 'info' => {
  const m = String(meta || '').toLowerCase();
  if (/\$|free|per\s|plan|copay|co-pay|cost|covered|deductible/.test(m)) return 'cost';
  if (/min|hour|\bhr|wait|now|24\s*\/?\s*7|open|today|same[-\s]?day|next/.test(m)) return 'time';
  return 'info';
};

const TEST_PAYLOAD: HealthcareCareOptionsPayload = {
  title: 'How would you like to get care?',
  subtitle: 'Choose the option that fits your needs',
  options: [
    { id: 'o1', channel: 'nurse_line', label: '24/7 Nurse Advice Line', description: 'Talk to a registered nurse now', meta: 'Avg wait 3 min', actionType: 'call', actionValue: '+18005551234' },
    { id: 'o2', channel: 'video', label: 'Video visit', description: 'See a provider by video in about 15 minutes', meta: '$0 with your plan', actionType: 'link', actionValue: 'https://example.com/video-visit', recommended: true },
    { id: 'o3', channel: 'in_person', label: 'Schedule an in-person visit', description: 'Book a time at a clinic near you', actionType: 'book', actionValue: 'Schedule an in-person visit' },
    { id: 'o4', channel: 'er', label: 'Emergency care', description: 'For severe or life-threatening symptoms', actionType: 'call', actionValue: '911' },
  ],
  disclaimer: 'If this is a medical emergency, call 911. This tool does not provide medical advice.',
};

export function HealthcareCareOptionsPreview({
  value,
  accentColor,
}: {
  value: HealthcareCareOptionsPayload;
  accentColor: string;
}) {
  const payloadOptions = Array.isArray(value.options) ? value.options : [];
  const isTestMode = payloadOptions.length === 0;
  const source = isTestMode ? TEST_PAYLOAD : value;
  const title = (source.title || 'How would you like to get care?').trim() || 'How would you like to get care?';
  const options = isTestMode ? TEST_PAYLOAD.options : payloadOptions;

  return (
    <div className="clt-live-preview asa-co" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {title && <h3 className="asa-co-title">{title}</h3>}
      {source.subtitle && <p className="asa-co-sub">{source.subtitle}</p>}

      <div className="asa-co-list">
        {options.map((opt, index) => {
          const bucket = channelBucket(opt.channel);
          const kind = actionKind(opt.actionType);
          const rawValue = opt.actionValue != null ? String(opt.actionValue).trim() : '';
          const Icon = channelIcon(bucket);
          const hue = CHANNEL_HUES[bucket];
          let href = '';
          if (kind === 'call') href = telHref(rawValue);
          else if (kind === 'link') href = /^https?:\/\//i.test(rawValue) ? rawValue : '';
          const isAnchor = (kind === 'call' || kind === 'link') && !!href;
          const effectiveKind = isAnchor ? kind : 'book';
          const bookValue = rawValue || opt.label || '';
          const key = opt.id || `opt-${index}`;
          const mk = metaKind(opt.meta);
          const MetaIcon = mk === 'cost' ? DollarSign : mk === 'time' ? Clock : Info;
          return (
            <div
              className={`asa-co-card is-${bucket}${opt.recommended ? ' is-recommended' : ''}`}
              style={{ '--chan': hue } as React.CSSProperties}
              key={key}
            >
              {opt.recommended && (
                <span className="asa-co-ribbon"><Check aria-hidden="true" /> Recommended</span>
              )}
              <div className="asa-co-top">
                <span className="asa-co-medallion" aria-hidden="true"><Icon /></span>
                <span className="asa-co-headtext">
                  <span className="asa-co-label">{opt.label || 'Care option'}</span>
                  {opt.description && <span className="asa-co-desc">{opt.description}</span>}
                </span>
              </div>
              {opt.meta && (
                <span className="asa-co-chip">
                  <MetaIcon aria-hidden="true" />
                  <span className="asa-co-chip-text">{opt.meta}</span>
                </span>
              )}
              {isAnchor ? (
                <a
                  className="asa-co-action"
                  href={href}
                  target={effectiveKind === 'link' ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  aria-label={effectiveKind === 'call' ? 'Call' : 'Open'}
                >
                  {effectiveKind === 'call' ? <Phone /> : <ExternalLink />}
                  <span className="asa-co-action-text">{effectiveKind === 'call' ? 'Call' : 'Open'}</span>
                </a>
              ) : (
                <button type="button" className="asa-co-action" aria-label="Choose" data-value={bookValue}>
                  <ChevronRight />
                  <span className="asa-co-action-text">Choose</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {source.disclaimer && (
        <p className="asa-co-disclaimer">
          <TriangleAlert aria-hidden="true" />
          <span>{source.disclaimer}</span>
        </p>
      )}
    </div>
  );
}
