import { useState } from 'react';
import { Check, MapPin } from 'lucide-react';
import type { HealthcareRxRefillPayload, RxMedication } from './payloads';
import { statusBucket, statusText, rxMedicationImage } from './rxRefillFormat';

/**
 * Live preview for the ASA Healthcare · Prescription Refill CLT (DTO field
 * healthcareRxRefillJSON). Mirrors the deployed LWC "prescription label": each
 * medication is a squared paper label with an ℞ mark, name + strength, a
 * monospace label data block (Sig / Supply / Refills) split by a dashed
 * perforation, and a squared select box; out-of-refills meds carry a rotated
 * "NO REFILLS" stamp and aren't selectable. A tear-off pickup ticket anchors the
 * destination. LWC-true fields: title, subtitle?, medications (object[] of
 * { id, name, dosage?, supplyText?, status?, refillsLeft? }), pharmacy?
 * ({ name, address?, hours? }), submitText?. Empty medications → test-mode.
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

const refillsRemaining = (n?: number) => {
  if (n == null || Number.isNaN(Number(n))) return '';
  const v = Number(n);
  return v === 1 ? '1 remaining' : `${v} remaining`;
};

/** Faithful preview: mirrors the Prescription Refill LWC, including test-mode fallback. */
export function HealthcareRxRefillPreview({
  value,
  accentColor,
}: {
  value: HealthcareRxRefillPayload;
  accentColor: string;
}) {
  const usable = (Array.isArray(value.medications) ? value.medications : []).filter((m) => m && (m.name || m.id));
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
    <div className="clt-live-preview asa-rx" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {title && <h3 className="asa-rx-title">{title}</h3>}
      {source.subtitle && <p className="asa-rx-sub">{source.subtitle}</p>}

      <div className="asa-rx-list">
        {source.medications.map((med, index) => {
          const bucket = statusBucket(med.status);
          const selectable = bucket !== 'out';
          const key = keyFor(med, index);
          const isSelected = selectable && selected.has(key);
          const supply = med.supplyText ? String(med.supplyText).trim() : statusText(bucket);
          const note = refillsRemaining(med.refillsLeft);
          const dosage = med.dosage ? String(med.dosage).trim() : '';
          return (
            <button
              type="button"
              key={key}
              className={`asa-rx-med is-${bucket}${isSelected ? ' is-selected' : ''}${selectable ? '' : ' is-disabled'}`}
              aria-pressed={isSelected}
              disabled={!selectable}
              onClick={() => selectable && toggle(key)}
            >
              <span className="asa-rx-head">
                {rxMedicationImage(med.name) ? (
                  <span className="asa-rx-thumb"><img src={rxMedicationImage(med.name)} alt={med.name || 'Medication'} /></span>
                ) : (
                  <span className="asa-rx-mark" aria-hidden="true">&#8478;</span>
                )}
                <span className="asa-rx-headtext">
                  <span className="asa-rx-name">{med.name || 'Medication'}</span>
                  {dosage && <span className="asa-rx-strength">{dosage}</span>}
                </span>
                <span className={`asa-rx-tag is-${bucket}`}>{supply}</span>
                {bucket === 'out' && <span className="asa-rx-stamp" aria-hidden="true">No Refills</span>}
              </span>

              <span className="asa-rx-fields">
                {dosage && (
                  <span className="asa-rx-field">
                    <span className="asa-rx-flabel">Sig</span>
                    <span className="asa-rx-fval">{dosage}</span>
                  </span>
                )}
                <span className="asa-rx-field">
                  <span className="asa-rx-flabel">Supply</span>
                  <span className="asa-rx-fval">{supply}</span>
                </span>
                {note && (
                  <span className="asa-rx-field">
                    <span className="asa-rx-flabel">Refills</span>
                    <span className="asa-rx-fval">{note}</span>
                  </span>
                )}
              </span>

              <span className={isSelected ? 'asa-rx-check on' : 'asa-rx-check'} aria-hidden="true"><Check /></span>
            </button>
          );
        })}
      </div>

      {pharmacy?.name && (
        <div className="asa-rx-pickup">
          <span className="asa-rx-pickup-eyebrow"><MapPin /> Pickup pharmacy</span>
          <span className="asa-rx-pickup-name">{pharmacy.name}</span>
          {pharmacy.address && <span className="asa-rx-pickup-meta">{pharmacy.address}</span>}
          {pharmacy.hours && <span className="asa-rx-pickup-hours">{pharmacy.hours}</span>}
        </div>
      )}

      {count > 0 && (
        <button type="button" className="asa-rx-submit">{`${submitBase} (${count})`}</button>
      )}
    </div>
  );
}
