import { useState } from 'react';
import { Check, MapPin, Pill } from 'lucide-react';
import type { HealthcareRxRefillPayload, RxMedication } from './payloads';
import { refillsNote, statusBucket, statusText } from './rxRefillFormat';

/**
 * Live preview for the ASA Healthcare · Prescription Refill
 * CLT (DTO field healthcareRxRefillJSON). LWC-true fields: title, subtitle?,
 * medications (object[] of { id, name, dosage?, supplyText?, status?,
 * refillsLeft? }), pharmacy? ({ name, address?, hours? }), submitText?. A
 * medication with status 'out' is shown but not selectable. An empty medication
 * list drops the preview into a test-mode fallback so it renders even with no
 * payload — mirroring the LWC.
 */


const TEST_PAYLOAD: HealthcareRxRefillPayload = {
  title: 'Refill prescriptions',
  subtitle: 'Select the medications to refill',
  medications: [
    { id: 'm1', name: 'Atorvastatin', dosage: '20 mg tablet', supplyText: '3 days left', status: 'low', refillsLeft: 2 },
    { id: 'm2', name: 'Lisinopril', dosage: '10 mg tablet', supplyText: 'In stock', status: 'ok', refillsLeft: 5 },
    { id: 'm3', name: 'Metformin', dosage: '500 mg tablet', supplyText: 'No refills left', status: 'out', refillsLeft: 0 },
  ],
  pharmacy: { name: 'Walgreens · Market St', address: '700 Market St', hours: 'Open until 10 PM' },
};

/** Faithful preview: mirrors the Prescription Refill LWC, including test-mode fallback. */
export function HealthcareRxRefillPreview({
  value,
  accentColor,
}: {
  value: HealthcareRxRefillPayload;
  accentColor: string;
}) {
  const usable = value.medications.filter((m) => m && (m.name || m.id));
  const isTestMode = usable.length === 0;
  const source = isTestMode ? TEST_PAYLOAD : { ...value, medications: usable };
  const title = (source.title || 'Refill prescriptions').trim() || 'Refill prescriptions';
  const submitBase = (value.submitText || 'Request refill').trim() || 'Request refill';
  const pharmacy = source.pharmacy;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const keyFor = (m: RxMedication, i: number) => (m.id ? String(m.id) : `med-${i}`);
  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const count = selected.size;

  return (
    <div className="clt-live-preview rx-refill-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {isTestMode && <p className="clt-test-badge">Test mode — add a medication to preview your content</p>}
      {title && <h3 className="selector-title">{title}</h3>}
      {source.subtitle && <p className="asa-card-sub">{source.subtitle}</p>}

      <div className="asa-rx-list">
        {source.medications.map((med, index) => {
          const bucket = statusBucket(med.status);
          const selectable = bucket !== 'out';
          const key = keyFor(med, index);
          const isSelected = selectable && selected.has(key);
          const supply = med.supplyText ? String(med.supplyText).trim() : statusText(bucket);
          const note = refillsNote(med.refillsLeft);
          return (
            <button
              type="button"
              key={key}
              className={`asa-rx-med is-${bucket}${isSelected ? ' is-selected' : ''}${selectable ? '' : ' is-disabled'}`}
              aria-pressed={isSelected}
              disabled={!selectable}
              onClick={() => selectable && toggle(key)}
            >
              <span className="asa-rx-ico" aria-hidden="true"><Pill /></span>
              <span className="asa-rx-body">
                <span className="asa-rx-name">{med.name || 'Medication'}</span>
                {med.dosage && <span className="asa-rx-dose">{med.dosage}</span>}
                <span className="asa-rx-status">
                  <span className={`asa-rx-pill is-${bucket}`}>{supply}</span>
                  {note && <span className="asa-rx-refills">{note}</span>}
                </span>
              </span>
              <span className={isSelected ? 'asa-rx-check on' : 'asa-rx-check'} aria-hidden="true"><Check /></span>
            </button>
          );
        })}
      </div>

      {pharmacy?.name && (
        <div className="asa-rx-pharmacy">
          <span className="asa-rx-ph-ico" aria-hidden="true"><MapPin /></span>
          <span className="asa-rx-ph-text">
            <span className="asa-rx-ph-eyebrow">Pickup at</span>
            <span className="asa-rx-ph-name">{pharmacy.name}</span>
            {pharmacy.address && <span className="asa-rx-ph-meta">{pharmacy.address}</span>}
            {pharmacy.hours && <span className="asa-rx-ph-hours">{pharmacy.hours}</span>}
          </span>
        </div>
      )}

      {count > 0 && (
        <button type="button" className="asa-rx-submit">{`${submitBase} (${count})`}</button>
      )}
    </div>
  );
}
