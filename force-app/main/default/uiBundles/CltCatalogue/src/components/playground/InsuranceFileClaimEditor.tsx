import { useState } from 'react';
import { ArrowDown, ArrowUp, Check, Plus, Trash2, Shield } from 'lucide-react';
import type { IncidentType, InsuranceFileClaimPayload } from './payloads';
import { incidentIcon, normalizeIncidentIcon } from './insuranceFileClaimFormat';
import teslaFallback from '@/assets/insurance-tesla-model3.jpg';

/**
 * Build/Input editor + live preview for the ASA Insurance · File a Claim CLT
 * (DTO field insuranceFileClaimJSON). LWC-true fields: title, policy? ({ label,
 * policyNumber? }), incidentTypes (object[] with id, label, description?,
 * icon?), submitText?. Fewer than one incident type drops the preview into a
 * test-mode fallback so it renders even with no payload — mirroring the LWC.
 */

const INCIDENT_ICONS = ['collision', 'theft', 'weather', 'water', 'fire', 'glass', 'liability', 'medical', 'other'];

export function InsuranceFileClaimEditor({
  value,
  onChange,
}: {
  value: InsuranceFileClaimPayload;
  onChange: (next: InsuranceFileClaimPayload) => void;
}) {
  const setIncident = (index: number, patch: Partial<IncidentType>) => {
    const incidentTypes = value.incidentTypes.slice();
    incidentTypes[index] = { ...incidentTypes[index], ...patch };
    onChange({ ...value, incidentTypes });
  };
  const addIncident = () =>
    onChange({
      ...value,
      incidentTypes: [
        ...value.incidentTypes,
        { id: `inc-${value.incidentTypes.length + 1}`, label: 'New incident', description: '', icon: 'other' },
      ],
    });
  const removeIncident = (index: number) =>
    onChange({ ...value, incidentTypes: value.incidentTypes.filter((_, i) => i !== index) });
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.incidentTypes.length) return;
    const incidentTypes = value.incidentTypes.slice();
    [incidentTypes[index], incidentTypes[target]] = [incidentTypes[target], incidentTypes[index]];
    onChange({ ...value, incidentTypes });
  };
  const policy = value.policy ?? { label: '', policyNumber: '', imageUrl: '' };
  const setPolicy = (patch: Partial<{ label: string; policyNumber: string; imageUrl: string }>) =>
    onChange({ ...value, policy: { ...policy, ...patch } });

  return (
    <div className="playground-editor">
      <label className="playground-field">
        Title
        <input value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} placeholder="What happened?" />
      </label>

      <div className="playground-card">
        <div className="playground-card-head">
          <strong>Policy context</strong>
          <span className="optional-label">Optional</span>
        </div>
        <label className="playground-field">
          Policy label
          <input value={policy.label ?? ''} onChange={(e) => setPolicy({ label: e.target.value })} placeholder="Auto — 2022 Tesla Model 3" />
        </label>
        <label className="playground-field">
          Policy number <span className="optional-label">last digits</span>
          <input value={policy.policyNumber ?? ''} onChange={(e) => setPolicy({ policyNumber: e.target.value })} placeholder="8842" />
        </label>
        <label className="playground-field">
          Item photo URL <span className="optional-label">Optional</span>
          <input value={policy.imageUrl ?? ''} onChange={(e) => setPolicy({ imageUrl: e.target.value })} placeholder="/resource/asaInsuranceTeslaModel3" />
        </label>
      </div>

      <label className="playground-field">
        Submit button text
        <input value={value.submitText ?? ''} onChange={(e) => onChange({ ...value, submitText: e.target.value })} placeholder="Start claim" />
      </label>

      <div className="playground-list">
        <div className="playground-list-head">
          <span>Incident types</span>
          <button type="button" className="playground-add" onClick={addIncident}><Plus aria-hidden="true" /> Add incident</button>
        </div>
        {value.incidentTypes.length === 0 && <p className="playground-empty">No incident types — the component shows sample test data until you add one.</p>}
        {value.incidentTypes.map((inc, index) => (
          <div className="playground-card" key={index}>
            <div className="playground-card-head">
              <strong>Incident {index + 1}</strong>
              <span className="playground-card-actions">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up"><ArrowUp aria-hidden="true" /></button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === value.incidentTypes.length - 1} aria-label="Move down"><ArrowDown aria-hidden="true" /></button>
                <button type="button" onClick={() => removeIncident(index)} aria-label="Remove incident"><Trash2 aria-hidden="true" /></button>
              </span>
            </div>
            <label className="playground-field">
              Label
              <input value={inc.label} onChange={(e) => setIncident(index, { label: e.target.value })} placeholder="Collision" />
            </label>
            <label className="playground-field">
              Description <span className="optional-label">Optional</span>
              <input value={inc.description ?? ''} onChange={(e) => setIncident(index, { description: e.target.value })} placeholder="Accident with another vehicle or object" />
            </label>
            <div className="playground-field">
              <span>Icon</span>
              <select value={normalizeIncidentIcon(inc.icon)} onChange={(e) => setIncident(index, { icon: e.target.value })}>
                {INCIDENT_ICONS.map((i) => <option value={i} key={i}>{i}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const TEST_INCIDENTS: IncidentType[] = [
  { id: 'collision', label: 'Collision', description: 'Accident with another vehicle or object', icon: 'collision' },
  { id: 'theft', label: 'Theft or break-in', description: 'Vehicle or contents stolen', icon: 'theft' },
  { id: 'weather', label: 'Weather or storm', description: 'Hail, wind, flood, or fallen tree', icon: 'weather' },
  { id: 'glass', label: 'Glass or windshield', description: 'Cracked or shattered glass', icon: 'glass' },
];
const TEST_POLICY = { label: 'Auto — 2022 Tesla Model 3', policyNumber: '8842', imageUrl: '/resource/asaInsuranceTeslaModel3' };

/** Faithful preview: mirrors the File a Claim LWC, including test-mode fallback. */
export function InsuranceFileClaimPreview({
  value,
  accentColor,
}: {
  value: InsuranceFileClaimPayload;
  accentColor: string;
}) {
  const isTestMode = value.incidentTypes.length === 0;
  const title = (isTestMode ? 'What happened?' : value.title) || 'What happened?';
  const incidents = isTestMode ? TEST_INCIDENTS : value.incidentTypes;
  const policy = isTestMode ? TEST_POLICY : value.policy;
  const submitText = value.submitText || 'Start claim';

  const [selected, setSelected] = useState<string>('');

  return (
    <div className="clt-live-preview file-claim-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {isTestMode && <p className="clt-test-badge">Test mode — add incident types to preview your content</p>}
      {title && <h3 className="selector-title">{title}</h3>}

      {policy?.imageUrl && (
        <div className="asa-fc-asset" aria-hidden="true">
          {/* Payload URL first (e.g. /resource/... resolves in-org); fall back to
              the bundled photo when it can't load (local dev, missing resource). */}
          <img
            src={policy.imageUrl}
            alt={policy.label ?? 'Insured item'}
            onError={(e) => {
              if (e.currentTarget.src !== teslaFallback) e.currentTarget.src = teslaFallback;
            }}
          />
        </div>
      )}

      {policy?.label && (
        <div className="asa-fc-policy">
          <span className="asa-fc-policy-ico" aria-hidden="true"><Shield /></span>
          <span className="asa-fc-policy-text">
            <span className="asa-fc-policy-label">{policy.label}</span>
            {policy.policyNumber && <span className="asa-fc-policy-num">•• {policy.policyNumber}</span>}
          </span>
        </div>
      )}

      <div className="asa-fc-grid">
        {incidents.map((inc, index) => {
          const key = inc.id || `${inc.label}-${index}`;
          const Icon = incidentIcon(inc.icon);
          const bucket = normalizeIncidentIcon(inc.icon);
          const isSelected = selected === key;
          const tileClass = `asa-fc-tile is-${bucket}${isSelected ? ' is-selected' : ''}`;
          return (
            <button type="button" key={key} className={tileClass} onClick={() => setSelected(key)} aria-pressed={isSelected}>
              <span className="asa-fc-ico" aria-hidden="true"><Icon /></span>
              <span className="asa-fc-text">
                <span className="asa-fc-label">{inc.label}</span>
                {inc.description && <span className="asa-fc-desc">{inc.description}</span>}
              </span>
              <span className={isSelected ? 'asa-fc-check on' : 'asa-fc-check'} aria-hidden="true"><Check /></span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="submit-container">
          <button type="button" className="asa-fc-submit">{submitText}</button>
        </div>
      )}
    </div>
  );
}
