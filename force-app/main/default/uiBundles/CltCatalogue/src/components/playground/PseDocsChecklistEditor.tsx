import { useState } from 'react';
import { Check } from 'lucide-react';
import type { PseDocsChecklistPayload, PseDocument } from './payloads';

/**
 * Live preview for the ASA Public Sector & Education · Documents Checklist CLT
 * (DTO field pseDocsChecklistJSON). LWC-true fields: title, subtitle?,
 * documents (object[] of { id, name, detail?, status? }), submitText?,
 * submitValue?. Mirrors the deployed LWC's "official intake manifest" design:
 * civic masthead + an X-OF-Y-PROVIDED progress meter + ruled rows with an
 * official form checkbox and a rubber-stamp status tag. A document with status
 * 'received' is shown checked/locked. An empty list drops into test-mode.
 */

const TEST_PAYLOAD: PseDocsChecklistPayload = {
  title: "Required documents",
  subtitle: 'For your building permit application',
  documents: [
    { id: 'id', name: 'Government-issued ID', detail: "Driver's license or passport", status: 'received' },
    { id: 'proof', name: 'Proof of residency', detail: 'Utility bill within 60 days', status: 'required' },
    { id: 'site', name: 'Site plan', detail: 'PDF, drawn to scale', status: 'required' },
    { id: 'insurance', name: 'Contractor insurance', detail: 'Only if using a contractor', status: 'optional' },
  ],
};

const SEAL = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18" /><path d="M4 21V10l8-5 8 5v11" /><path d="M8 21v-7" /><path d="M12 21v-7" /><path d="M16 21v-7" /><path d="M3 10h18" />
  </svg>
);

type DocBucket = 'required' | 'received' | 'optional';
function statusBucket(s?: string): DocBucket {
  const raw = String(s || '').toLowerCase().replace(/[^a-z]/g, '');
  if (raw === 'received' || raw === 'have' || raw === 'provided' || raw === 'done' || raw === 'complete' || raw === 'uploaded') return 'received';
  if (raw === 'optional' || raw === 'ifapplicable' || raw === 'ifneeded') return 'optional';
  return 'required';
}
function statusText(bucket: DocBucket): string {
  if (bucket === 'received') return 'Received';
  if (bucket === 'optional') return 'Optional';
  return 'Required';
}

/** Faithful preview: mirrors the Documents Checklist LWC (civic intake manifest). */
export function PseDocsChecklistPreview({
  value,
  accentColor,
}: {
  value: PseDocsChecklistPayload;
  accentColor: string;
}) {
  const usable = (value.documents || []).filter((d) => d && (d.name || d.id));
  const isTestMode = usable.length === 0;
  const source = isTestMode ? TEST_PAYLOAD : { ...value, documents: usable };
  const title = (source.title || "Required documents").trim() || "Required documents";
  const submitBase = (value.submitText || 'Upload selected').trim() || 'Upload selected';

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const keyFor = (d: PseDocument, i: number) => (d.id ? String(d.id) : `doc-${i}`);
  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const docs = source.documents;
  const total = docs.length;
  const receivedCount = docs.reduce((n, d) => (statusBucket(d.status) === 'received' ? n + 1 : n), 0);
  const provided = receivedCount + selected.size;
  const pct = total ? Math.round((provided / total) * 100) : 0;
  const count = selected.size;

  return (
    <div className="clt-live-preview docs-checklist-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>

      <div className="asa-card">
        <div className="asa-dc-masthead">
          <span className="asa-dc-seal" aria-hidden="true">{SEAL}</span>
          <span className="asa-dc-mast-text">
            <span className="asa-dc-kicker">Document Intake</span>
            <span className="asa-dc-mast-title">{title}</span>
          </span>
        </div>

        <div className="asa-dc-portal">
          {source.subtitle && <p className="asa-dc-sub">{source.subtitle}</p>}

          <div className="asa-dc-manifest-head">
            <span className="asa-dc-manifest-label">{`${provided} OF ${total} PROVIDED`}</span>
            <div className="asa-dc-meter" role="presentation">
              <span className="asa-dc-meter-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="asa-dc-manifest">
            {docs.map((doc, index) => {
              const bucket = statusBucket(doc.status);
              const selectable = bucket !== 'received';
              const key = keyFor(doc, index);
              const isSelected = selectable && selected.has(key);
              const checkOn = isSelected || bucket === 'received';
              return (
                <button
                  type="button"
                  key={key}
                  className={`asa-dc-doc is-${bucket}${isSelected ? ' is-selected' : ''}${selectable ? '' : ' is-disabled'}`}
                  aria-pressed={isSelected}
                  disabled={!selectable}
                  onClick={() => selectable && toggle(key)}
                >
                  <span className={checkOn ? 'asa-dc-box on' : 'asa-dc-box'} aria-hidden="true"><Check /></span>
                  <span className="asa-dc-body">
                    <span className="asa-dc-name">{doc.name || 'Document'}</span>
                    {doc.detail && <span className="asa-dc-detail">{doc.detail}</span>}
                  </span>
                  <span className={`asa-dc-stamp is-${bucket}`}>{statusText(bucket)}</span>
                </button>
              );
            })}
          </div>

          {count > 0 && (
            <button type="button" className="asa-dc-submit">{`${submitBase} (${count})`}</button>
          )}
        </div>
      </div>
    </div>
  );
}
