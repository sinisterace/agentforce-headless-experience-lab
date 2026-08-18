import { useState } from 'react';
import { ChevronRight, ExternalLink, Phone, TriangleAlert } from 'lucide-react';
import type { HealthcareCareOptionsPayload } from './payloads';
import { actionKind, channelBucket, channelIcon, telHref } from './careOptionsFormat';

/**
 * Live preview for the ASA Healthcare · Care Options CLT
 * (DTO field healthcareCareOptionsJSON). LWC-true fields: title, subtitle?,
 * options (object[] of { id, channel?, label, description?, meta?, recommended?,
 * actionType, actionValue? }), disclaimer?. A routing card only — no symptoms
 * are collected. 'call'/'link' render as redirect anchors; 'book' hands the
 * conversation back to the agent. An empty option list drops the preview into a
 * test-mode fallback so it renders even with no payload — mirroring the LWC.
 */


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

/** Faithful preview: mirrors the Care Options LWC, including test-mode fallback. */
export function HealthcareCareOptionsPreview({
  value,
  accentColor,
}: {
  value: HealthcareCareOptionsPayload;
  accentColor: string;
}) {
  const isTestMode = value.options.length === 0;
  const source = isTestMode ? TEST_PAYLOAD : value;
  const title = (source.title || 'How would you like to get care?').trim() || 'How would you like to get care?';
  const options = isTestMode ? TEST_PAYLOAD.options : value.options;

  const [booked, setBooked] = useState('');

  return (
    <div className="clt-live-preview care-options-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {isTestMode && <p className="clt-test-badge">Test mode — add an option to preview your content</p>}
      {title && <h3 className="selector-title">{title}</h3>}
      {source.subtitle && <p className="asa-card-sub">{source.subtitle}</p>}

      <div className="asa-co-list">
        {options.map((opt, index) => {
          const bucket = channelBucket(opt.channel);
          const kind = actionKind(opt.actionType);
          const rawValue = opt.actionValue != null ? String(opt.actionValue).trim() : '';
          const Icon = channelIcon(bucket);
          let href = '';
          if (kind === 'call') href = telHref(rawValue);
          else if (kind === 'link') href = /^https?:\/\//i.test(rawValue) ? rawValue : '';
          const isAnchor = (kind === 'call' || kind === 'link') && !!href;
          const effectiveKind = isAnchor ? kind : 'book';
          const bookValue = rawValue || opt.label || '';
          const key = opt.id || `opt-${index}`;
          return (
            <div className={`asa-co-opt is-${bucket}${opt.recommended ? ' is-recommended' : ''}${booked === key ? ' is-booked' : ''}`} key={key}>
              <span className="asa-co-ico" aria-hidden="true"><Icon /></span>
              <span className="asa-co-text">
                <span className="asa-co-labelrow">
                  <span className="asa-co-label">{opt.label || 'Care option'}</span>
                  {opt.recommended && <span className="asa-co-rec">Recommended</span>}
                </span>
                {opt.description && <span className="asa-co-desc">{opt.description}</span>}
                {opt.meta && <span className="asa-co-metatag">{opt.meta}</span>}
              </span>
              {isAnchor ? (
                <a
                  className="asa-co-cta"
                  href={href}
                  target={effectiveKind === 'link' ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  aria-label={effectiveKind === 'call' ? 'Call' : 'Open'}
                >
                  {effectiveKind === 'call' ? <Phone /> : <ExternalLink />}
                  <span className="asa-co-cta-text">{effectiveKind === 'call' ? 'Call' : 'Open'}</span>
                </a>
              ) : (
                <button type="button" className="asa-co-cta" aria-label="Choose" onClick={() => setBooked(key === booked ? '' : key)} data-value={bookValue}>
                  <ChevronRight />
                  <span className="asa-co-cta-text">Choose</span>
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
