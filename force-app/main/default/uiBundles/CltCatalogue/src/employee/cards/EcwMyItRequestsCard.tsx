import './EcwMyItRequestsCard.css';

/** React preview mirror of the deployed `ecwMyItRequests` LWC (IT · My IT requests).
 *  Hero open-request count + per-request rows with a type glyph, mono id, and a node stepper. */
export type EcwItRequest = { id?: string; title: string; type?: string; stages?: string[]; stageIndex?: number; detail?: string; state?: 'good' | 'warn' | 'info' };
export type EcwMyItRequestsPayload = { openCount?: number; headline?: string; requests: EcwItRequest[] };

function typeKind(t?: string): 'hardware' | 'access' | 'software' | 'other' {
  const s = String(t || '').toLowerCase();
  if (s.includes('hardware')) return 'hardware';
  if (s.includes('access')) return 'access';
  if (s.includes('software')) return 'software';
  return 'other';
}

export const MY_IT_REQUESTS_TEST: EcwMyItRequestsPayload = {
  openCount: 2, headline: '2 open requests',
  requests: [
    { id: 'REQ-10234', title: 'MacBook Pro 16" refresh', type: 'Hardware', stages: ['Submitted', 'Approved', 'Fulfilling', 'Done'], stageIndex: 2, detail: 'Approved by your manager; ships from the IT depot in ~2 days.', state: 'info' },
    { id: 'REQ-10251', title: 'Access: Camera Cloud admin', type: 'Access', stages: ['Submitted', 'Approved', 'Granted'], stageIndex: 1, detail: 'Pending approval from Jordan Lee (your manager).', state: 'warn' },
    { id: 'REQ-10198', title: 'Figma license', type: 'Software', stages: ['Submitted', 'Approved', 'Fulfilling', 'Done'], stageIndex: 3, detail: 'License assigned — check your email for the activation link.', state: 'good' },
  ],
};

function Glyph({ kind }: { kind: string }) {
  if (kind === 'hardware') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M2 20h20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
  if (kind === 'access') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="10" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M11 12l9 9m-3 0 2-2m-4-2 2-2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
  if (kind === 'software') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 21 8v8l-9 5-9-5V8z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>;
}

export function EcwMyItRequestsCard({ value }: { value?: Partial<EcwMyItRequestsPayload> }) {
  const hasContent = !!(value && Array.isArray(value.requests) && value.requests.length);
  const src: EcwMyItRequestsPayload = hasContent ? ({ ...MY_IT_REQUESTS_TEST, ...value } as EcwMyItRequestsPayload) : MY_IT_REQUESTS_TEST;
  const requests = (src.requests || []).filter((r) => r && r.title).map((r, i) => {
    const stages = Array.isArray(r.stages) && r.stages.length ? r.stages.map(String) : ['Submitted', 'Done'];
    const idx = Math.max(0, Math.min(Number(r.stageIndex) || 0, stages.length - 1));
    const state = (['good', 'warn', 'info'].includes(r.state as never) ? r.state : 'info') as string;
    const kind = typeKind(r.type);
    const steps = stages.map((label, j) => ({
      key: `${i}-${j}`, label,
      nodeClass: `ecw-ir-node${j < idx ? ' is-done' : (j === idx ? ` is-current is-${state}` : '')}`,
      connClass: `ecw-ir-conn${j > 0 && j <= idx ? ' is-filled' : ''}`, showConn: j > 0,
    }));
    return { key: i, kind, type: r.type ? String(r.type).trim() : '', title: r.title.trim(), id: r.id ? String(r.id).trim() : '', steps, currentText: stages[idx], state, detail: r.detail ? String(r.detail).trim() : '' };
  });
  const count = requests.length;
  const countUnit = count === 1 ? 'open request' : 'open requests';

  return (
    <div className="clt-live-preview ecw-ir">
      <div className="ecw-ir-hero">
        <span className="ecw-ir-hero-label">My IT requests</span>
        <div className="ecw-ir-hero-row">
          <strong className="ecw-ir-hero-val">{count}</strong>
          <span className="ecw-ir-hero-unit">{countUnit}</span>
        </div>
        {src.headline ? <span className="ecw-ir-hero-meta">{src.headline}</span> : null}
      </div>
      <ul className="ecw-ir-list">
        {requests.map((r) => (
          <li key={r.key} className="ecw-ir-row">
            <div className="ecw-ir-top">
              <span className={`ecw-ir-type is-${r.kind}`}><Glyph kind={r.kind} />{r.type}</span>
              <span className="ecw-ir-title">{r.title}</span>
              {r.id ? <span className="ecw-ir-id">{r.id}</span> : null}
            </div>
            <div className="ecw-ir-stepper">
              {r.steps.map((s) => (
                <div key={s.key} className="ecw-ir-step">
                  {s.showConn ? <span className={s.connClass} /> : null}
                  <span className={s.nodeClass} />
                  <span className="ecw-ir-steplabel">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="ecw-ir-foot">
              <span className={`ecw-ir-current is-${r.state}`}>{r.currentText}</span>
              {r.detail ? <span className="ecw-ir-detail">{r.detail}</span> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
