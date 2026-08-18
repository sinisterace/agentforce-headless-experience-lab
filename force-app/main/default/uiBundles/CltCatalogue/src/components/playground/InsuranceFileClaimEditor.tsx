import { useState } from 'react';
import { Check, Shield } from 'lucide-react';
import type { IncidentType, InsuranceFileClaimPayload } from './payloads';
import { incidentIcon, normalizeIncidentIcon } from './insuranceFileClaimFormat';
import teslaFallback from '@/assets/insurance-tesla-model3.jpg';

/**
 * Live preview for the ASA Insurance · File a Claim CLT
 * (DTO field insuranceFileClaimJSON). LWC-true fields: title, policy? ({ label,
 * policyNumber? }), incidentTypes (object[] with id, label, description?,
 * icon?), submitText?. Fewer than one incident type drops the preview into a
 * test-mode fallback so it renders even with no payload — mirroring the LWC.
 */


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
