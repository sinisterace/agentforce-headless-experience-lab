import { useState } from 'react';
import { Check, FileText } from 'lucide-react';
import type { PseDocsChecklistPayload, PseDocument } from './payloads';

/**
 * Live preview for the ASA Public Sector & Education · Documents Checklist CLT
 * (DTO field pseDocsChecklistJSON). LWC-true fields: title, subtitle?,
 * documents (object[] of { id, name, detail?, status? }), submitText?,
 * submitValue?. A document with status 'received' is shown checked and is not
 * selectable. An empty document list drops the preview into a test-mode
 * fallback so it renders even with no payload — mirroring the LWC.
 */

const TEST_PAYLOAD: PseDocsChecklistPayload = {
  title: "Documents you'll need",
  subtitle: 'For your building permit application',
  documents: [
    { id: 'id', name: 'Government-issued ID', detail: "Driver's license or passport", status: 'received' },
    { id: 'proof', name: 'Proof of residency', detail: 'Utility bill within 60 days', status: 'required' },
    { id: 'site', name: 'Site plan', detail: 'PDF, drawn to scale', status: 'required' },
    { id: 'insurance', name: 'Contractor insurance', detail: 'Only if using a contractor', status: 'optional' },
  ],
};

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

/** Faithful preview: mirrors the Documents Checklist LWC, including test-mode fallback. */
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
  const title = (source.title || "Documents you'll need").trim() || "Documents you'll need";
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
  const count = selected.size;

  return (
    <div className="clt-live-preview docs-checklist-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {isTestMode && <p className="clt-test-badge">Test mode — add documents to preview your content</p>}
      {title && <h3 className="selector-title">{title}</h3>}
      {source.subtitle && <p className="asa-card-sub">{source.subtitle}</p>}

      <div className="asa-dc-list">
        {source.documents.map((doc, index) => {
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
              <span className="asa-dc-ico" aria-hidden="true"><FileText /></span>
              <span className="asa-dc-body">
                <span className="asa-dc-name">{doc.name || 'Document'}</span>
                {doc.detail && <span className="asa-dc-detail">{doc.detail}</span>}
                <span className="asa-dc-status">
                  <span className={`asa-dc-pill is-${bucket}`}>{statusText(bucket)}</span>
                </span>
              </span>
              <span className={checkOn ? 'asa-dc-check on' : 'asa-dc-check'} aria-hidden="true"><Check /></span>
            </button>
          );
        })}
      </div>

      {count > 0 && (
        <button type="button" className="asa-dc-submit">{`${submitBase} (${count})`}</button>
      )}
    </div>
  );
}
