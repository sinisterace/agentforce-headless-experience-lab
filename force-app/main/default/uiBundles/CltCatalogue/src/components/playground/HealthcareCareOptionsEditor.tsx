import { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronRight, ExternalLink, Phone, Plus, Trash2, TriangleAlert } from 'lucide-react';
import type { CareOption, HealthcareCareOptionsPayload } from './payloads';
import { actionKind, channelBucket, channelIcon, telHref } from './careOptionsFormat';

/**
 * Build/Input editor + live preview for the ASA Healthcare · Care Options CLT
 * (DTO field healthcareCareOptionsJSON). LWC-true fields: title, subtitle?,
 * options (object[] of { id, channel?, label, description?, meta?, recommended?,
 * actionType, actionValue? }), disclaimer?. A routing card only — no symptoms
 * are collected. 'call'/'link' render as redirect anchors; 'book' hands the
 * conversation back to the agent. An empty option list drops the preview into a
 * test-mode fallback so it renders even with no payload — mirroring the LWC.
 */

const CHANNELS = ['nurse_line', 'video', 'in_person', 'urgent', 'er', 'pharmacy', 'message'];
const ACTION_TYPES = ['call', 'link', 'book'];

export function HealthcareCareOptionsEditor({
  value,
  onChange,
}: {
  value: HealthcareCareOptionsPayload;
  onChange: (next: HealthcareCareOptionsPayload) => void;
}) {
  const setOption = (index: number, patch: Partial<CareOption>) => {
    const options = value.options.slice();
    options[index] = { ...options[index], ...patch };
    onChange({ ...value, options });
  };
  const addOption = () =>
    onChange({
      ...value,
      options: [
        ...value.options,
        { id: `o-${value.options.length + 1}`, channel: 'message', label: 'New option', description: '', actionType: 'book', actionValue: '' },
      ],
    });
  const removeOption = (index: number) => onChange({ ...value, options: value.options.filter((_, i) => i !== index) });
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.options.length) return;
    const options = value.options.slice();
    [options[index], options[target]] = [options[target], options[index]];
    onChange({ ...value, options });
  };

  return (
    <div className="playground-editor">
      <label className="playground-field">
        Title
        <input value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} placeholder="How would you like to get care?" />
      </label>
      <label className="playground-field">
        Subtitle <span className="optional-label">Optional</span>
        <input value={value.subtitle ?? ''} onChange={(e) => onChange({ ...value, subtitle: e.target.value })} placeholder="Choose the option that fits your needs" />
      </label>
      <label className="playground-field">
        Disclaimer <span className="optional-label">Optional</span>
        <input value={value.disclaimer ?? ''} onChange={(e) => onChange({ ...value, disclaimer: e.target.value })} placeholder="If this is a medical emergency, call 911." />
      </label>

      <div className="playground-list">
        <div className="playground-list-head">
          <span>Options</span>
          <button type="button" className="playground-add" onClick={addOption}><Plus aria-hidden="true" /> Add option</button>
        </div>
        {value.options.length === 0 && <p className="playground-empty">No options — the component shows sample test data until you add one.</p>}
        {value.options.map((opt, index) => (
          <div className="playground-card" key={index}>
            <div className="playground-card-head">
              <strong>Option {index + 1}</strong>
              <span className="playground-card-actions">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up"><ArrowUp aria-hidden="true" /></button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === value.options.length - 1} aria-label="Move down"><ArrowDown aria-hidden="true" /></button>
                <button type="button" onClick={() => removeOption(index)} aria-label="Remove option"><Trash2 aria-hidden="true" /></button>
              </span>
            </div>
            <label className="playground-field">
              Label
              <input value={opt.label} onChange={(e) => setOption(index, { label: e.target.value })} placeholder="Video visit" />
            </label>
            <label className="playground-field">
              Description <span className="optional-label">Optional</span>
              <input value={opt.description ?? ''} onChange={(e) => setOption(index, { description: e.target.value })} placeholder="See a provider by video in about 15 minutes" />
            </label>
            <label className="playground-field">
              Meta tag <span className="optional-label">Optional</span>
              <input value={opt.meta ?? ''} onChange={(e) => setOption(index, { meta: e.target.value })} placeholder="$0 with your plan" />
            </label>
            <div className="playground-field">
              <span>Channel</span>
              <select value={channelToValue(opt.channel)} onChange={(e) => setOption(index, { channel: e.target.value })}>
                {CHANNELS.map((c) => <option value={c} key={c}>{c}</option>)}
              </select>
            </div>
            <div className="playground-field">
              <span>Action type</span>
              <select value={actionKind(opt.actionType)} onChange={(e) => setOption(index, { actionType: e.target.value })}>
                {ACTION_TYPES.map((a) => <option value={a} key={a}>{a}</option>)}
              </select>
            </div>
            <label className="playground-field">
              Action value <span className="optional-label">phone / URL / message</span>
              <input value={opt.actionValue ?? ''} onChange={(e) => setOption(index, { actionValue: e.target.value })} placeholder="+18005551234" />
            </label>
            <label className="playground-checkbox">
              <input type="checkbox" checked={!!opt.recommended} onChange={(e) => setOption(index, { recommended: e.target.checked })} />
              Recommended
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Snap a stored free-text channel back onto one of the select's canonical values. */
function channelToValue(channel?: string): string {
  const bucket = channelBucket(channel);
  switch (bucket) {
    case 'nurseline':
      return 'nurse_line';
    case 'inperson':
      return 'in_person';
    default:
      return bucket;
  }
}

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
