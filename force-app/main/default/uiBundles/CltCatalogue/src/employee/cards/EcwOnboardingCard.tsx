import { useState } from 'react';
import person1 from '@/assets/people/person1.jpg';
import person2 from '@/assets/people/person2.jpg';
import person3 from '@/assets/people/person3.jpg';
import './EcwOnboardingCard.css';

/** React preview mirror of the deployed `ecwOnboarding` LWC (HR · Onboarding) —
 *  squared employee cards with a headshot + progress stepper; click to expand a
 *  detail grid and external links. */
const PHOTOS = [person1, person2, person3];
const STATE: Record<string, string> = { good: 'is-good', warn: 'is-warn', info: 'is-info' };

export type EcwHire = {
  name: string; role?: string; start?: string; stages: string[]; stageIndex: number;
  detail?: string; state: 'good' | 'warn' | 'info'; manager?: string; department?: string; location?: string; email?: string;
};
export type EcwOnboardingPayload = { headline?: string; hires: EcwHire[] };

const slug = (name: string) => name.trim().toLowerCase().replace(/[^a-z]+/g, '.');

export const ONBOARDING_TEST: EcwOnboardingPayload = {
  headline: '3 new hires onboarding',
  hires: [
    { name: 'Dana Price', role: 'Account Executive · Sales', start: 'Starts Monday', stages: ['Offer', 'Paperwork', 'Equipment', 'Day 1', '30-day'], stageIndex: 2, detail: 'Laptop shipped; badge access pending from IT.', state: 'info', manager: 'Jordan Lee', department: 'Sales', location: 'Austin, TX', email: 'dana.price@company.com' },
    { name: 'Omar Haddad', role: 'Field Installation Tech · Installation', start: 'Started 3 days ago', stages: ['Offer', 'Paperwork', 'Equipment', 'Day 1', '30-day'], stageIndex: 3, detail: 'On site for Day 1; van and tools assigned.', state: 'info', manager: 'Marcus Hale', department: 'Installation', location: 'Phoenix, AZ', email: 'omar.haddad@company.com' },
    { name: 'Grace Lin', role: 'Support Engineer · Customer Service', start: 'Started 2 weeks ago', stages: ['Offer', 'Paperwork', 'Equipment', 'Day 1', '30-day'], stageIndex: 4, detail: '30-day check-in scheduled with manager.', state: 'good', manager: 'Priya Nair', department: 'Customer Service', location: 'Remote', email: 'grace.lin@company.com' },
  ],
};

export function EcwOnboardingCard({ value }: { value?: Partial<EcwOnboardingPayload> }) {
  const hasContent = !!(value && Array.isArray(value.hires) && value.hires.length);
  const src: EcwOnboardingPayload = hasContent ? ({ ...ONBOARDING_TEST, ...value } as EcwOnboardingPayload) : ONBOARDING_TEST;
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const hires = (src.hires || []).filter((h) => h && h.name).map((h, i) => {
    const stages = Array.isArray(h.stages) && h.stages.length ? h.stages.map(String) : ['Offer', 'Day 1'];
    const idx = Math.max(0, Math.min(Number(h.stageIndex) || 0, stages.length - 1));
    const state = ['good', 'warn', 'info'].includes(h.state) ? h.state : 'info';
    const steps = stages.map((label, j) => ({ key: `s-${i}-${j}`, label, cls: `ecw-ob-step ${j < idx ? 'is-done' : (j === idx ? 'is-current' : 'is-upcoming')}`, isDone: j < idx, showConn: j > 0 }));
    const dept = h.department?.trim() || (h.role && h.role.includes('·') ? h.role.split('·').pop()!.trim() : '');
    const s = slug(h.name);
    return {
      key: `h-${i}`, photoUrl: PHOTOS[i % PHOTOS.length], name: h.name.trim(), role: h.role?.trim() || '', start: h.start?.trim() || '',
      cardClass: `ecw-ob-badge ${STATE[state]}`, statusClass: `ecw-ob-status ${STATE[state]}`, statusText: stages[idx], steps,
      progressText: `Stage ${idx + 1} of ${stages.length}`, nextText: idx < stages.length - 1 ? `Next: ${stages[idx + 1]}` : 'Final stage',
      detail: h.detail?.trim() || '',
      details: [
        { key: 'mgr', label: 'Manager', value: h.manager?.trim() || '—' },
        { key: 'dept', label: 'Department', value: dept || '—' },
        { key: 'loc', label: 'Location', value: h.location?.trim() || '—' },
        { key: 'email', label: 'Email', value: h.email?.trim() || '—', isMono: true },
      ],
      links: [
        { key: 'wd', label: 'Open in Workday', url: `https://company.my.workday.com/d/worker/${s}` },
        { key: 'it', label: 'IT setup ticket', url: `https://company.service-now.com/onboarding/${s}` },
        { key: 'plan', label: 'Onboarding plan', url: `https://company.lightning.force.com/onboarding/${s}` },
      ],
    };
  });

  return (
    <div className="clt-live-preview ecw-ob">
      <div className="ecw-ob-head">
        <span className="ecw-ob-eyebrow">Onboarding</span>
        {src.headline ? <span className="ecw-ob-headline">{src.headline}</span> : null}
      </div>
      <div className="ecw-ob-stack">
        {hires.map((h) => {
          const isOpen = !!open[h.key];
          return (
            <article key={h.key} className={h.cardClass} onClick={() => setOpen((o) => ({ ...o, [h.key]: !o[h.key] }))}>
              <div className="ecw-ob-id">
                <img className="ecw-ob-photo" src={h.photoUrl} alt={h.name} loading="lazy" />
                <div className="ecw-ob-idtext">
                  <span className="ecw-ob-name">{h.name}</span>
                  {h.role ? <span className="ecw-ob-role">{h.role}</span> : null}
                  {h.start ? <span className="ecw-ob-start">{h.start}</span> : null}
                </div>
                <span className={h.statusClass}>{h.statusText}</span>
                <svg className={`ecw-ob-caret${isOpen ? ' is-open' : ''}`} viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>

              <div className="ecw-ob-steps">
                {h.steps.map((s) => (
                  <div key={s.key} className={s.cls}>
                    {s.showConn ? <span className="ecw-ob-conn" aria-hidden="true" /> : null}
                    <span className="ecw-ob-node" aria-hidden="true">{s.isDone ? <span className="ecw-ob-check">✓</span> : null}</span>
                    <span className="ecw-ob-steplabel">{s.label}</span>
                  </div>
                ))}
              </div>

              <div className="ecw-ob-prog"><span className="ecw-ob-progtext">{h.progressText}</span><span className="ecw-ob-next">{h.nextText}</span></div>
              {h.detail ? <p className="ecw-ob-foot"><span className="ecw-ob-footdot" aria-hidden="true" />{h.detail}</p> : null}

              {isOpen ? (
                <div className="ecw-ob-expand">
                  <div className="ecw-ob-grid">
                    {h.details.map((d) => (
                      <div key={d.key} className="ecw-ob-field">
                        <span className="ecw-ob-flabel">{d.label}</span>
                        <span className={`ecw-ob-fval${d.isMono ? ' is-mono' : ''}`}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="ecw-ob-links">
                    {h.links.map((l) => (
                      <a key={l.key} className="ecw-ob-link" href={l.url} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>
                        {l.label}
                        <svg className="ecw-ob-ext" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5m0-5-8 8M9 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
