import { useState } from 'react';
import { ArrowDown, ArrowUp, Check, MapPin, Pill, Plus, Trash2 } from 'lucide-react';
import type { HealthcareRxRefillPayload, RxMedication } from './payloads';
import { refillsNote, statusBucket, statusText } from './rxRefillFormat';

/**
 * Build/Input editor + live preview for the ASA Healthcare · Prescription Refill
 * CLT (DTO field healthcareRxRefillJSON). LWC-true fields: title, subtitle?,
 * medications (object[] of { id, name, dosage?, supplyText?, status?,
 * refillsLeft? }), pharmacy? ({ name, address?, hours? }), submitText?. A
 * medication with status 'out' is shown but not selectable. An empty medication
 * list drops the preview into a test-mode fallback so it renders even with no
 * payload — mirroring the LWC.
 */

const STATUSES = ['ok', 'low', 'out'];

export function HealthcareRxRefillEditor({
  value,
  onChange,
}: {
  value: HealthcareRxRefillPayload;
  onChange: (next: HealthcareRxRefillPayload) => void;
}) {
  const pharmacy = value.pharmacy ?? { name: '', address: '', hours: '' };
  const setPharmacy = (patch: Partial<NonNullable<HealthcareRxRefillPayload['pharmacy']>>) =>
    onChange({ ...value, pharmacy: { ...pharmacy, ...patch } });

  const setMed = (index: number, patch: Partial<RxMedication>) => {
    const medications = value.medications.slice();
    medications[index] = { ...medications[index], ...patch };
    onChange({ ...value, medications });
  };
  const addMed = () =>
    onChange({
      ...value,
      medications: [
        ...value.medications,
        { id: `m-${value.medications.length + 1}`, name: 'New medication', dosage: '', status: 'ok' },
      ],
    });
  const removeMed = (index: number) => onChange({ ...value, medications: value.medications.filter((_, i) => i !== index) });
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.medications.length) return;
    const medications = value.medications.slice();
    [medications[index], medications[target]] = [medications[target], medications[index]];
    onChange({ ...value, medications });
  };

  return (
    <div className="playground-editor">
      <label className="playground-field">
        Title
        <input value={value.title} onChange={(e) => onChange({ ...value, title: e.target.value })} placeholder="Refill prescriptions" />
      </label>
      <label className="playground-field">
        Subtitle <span className="optional-label">Optional</span>
        <input value={value.subtitle ?? ''} onChange={(e) => onChange({ ...value, subtitle: e.target.value })} placeholder="Select the medications to refill" />
      </label>
      <label className="playground-field">
        Submit button text
        <input value={value.submitText ?? ''} onChange={(e) => onChange({ ...value, submitText: e.target.value })} placeholder="Request refill" />
      </label>

      <div className="playground-card">
        <div className="playground-card-head">
          <strong>Pickup pharmacy</strong>
          <span className="optional-label">Optional</span>
        </div>
        <label className="playground-field">
          Name
          <input value={pharmacy.name ?? ''} onChange={(e) => setPharmacy({ name: e.target.value })} placeholder="Walgreens · Market St" />
        </label>
        <label className="playground-field">
          Address <span className="optional-label">Optional</span>
          <input value={pharmacy.address ?? ''} onChange={(e) => setPharmacy({ address: e.target.value })} placeholder="700 Market St" />
        </label>
        <label className="playground-field">
          Hours <span className="optional-label">Optional</span>
          <input value={pharmacy.hours ?? ''} onChange={(e) => setPharmacy({ hours: e.target.value })} placeholder="Open until 10 PM" />
        </label>
      </div>

      <div className="playground-list">
        <div className="playground-list-head">
          <span>Medications</span>
          <button type="button" className="playground-add" onClick={addMed}><Plus aria-hidden="true" /> Add medication</button>
        </div>
        {value.medications.length === 0 && <p className="playground-empty">No medications — the component shows sample test data until you add one.</p>}
        {value.medications.map((med, index) => (
          <div className="playground-card" key={index}>
            <div className="playground-card-head">
              <strong>Medication {index + 1}</strong>
              <span className="playground-card-actions">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up"><ArrowUp aria-hidden="true" /></button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === value.medications.length - 1} aria-label="Move down"><ArrowDown aria-hidden="true" /></button>
                <button type="button" onClick={() => removeMed(index)} aria-label="Remove medication"><Trash2 aria-hidden="true" /></button>
              </span>
            </div>
            <label className="playground-field">
              Name
              <input value={med.name} onChange={(e) => setMed(index, { name: e.target.value })} placeholder="Atorvastatin" />
            </label>
            <label className="playground-field">
              Dosage <span className="optional-label">Optional</span>
              <input value={med.dosage ?? ''} onChange={(e) => setMed(index, { dosage: e.target.value })} placeholder="20 mg tablet" />
            </label>
            <label className="playground-field">
              Supply text <span className="optional-label">Optional</span>
              <input value={med.supplyText ?? ''} onChange={(e) => setMed(index, { supplyText: e.target.value })} placeholder="3 days left" />
            </label>
            <div className="playground-field">
              <span>Status</span>
              <select value={statusBucket(med.status)} onChange={(e) => setMed(index, { status: e.target.value })}>
                {STATUSES.map((s) => <option value={s} key={s}>{s}</option>)}
              </select>
            </div>
            <label className="playground-field">
              Refills left <span className="optional-label">Optional</span>
              <input
                type="number"
                min={0}
                value={med.refillsLeft ?? ''}
                onChange={(e) => setMed(index, { refillsLeft: e.target.value === '' ? undefined : Number(e.target.value) })}
                placeholder="2"
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

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
