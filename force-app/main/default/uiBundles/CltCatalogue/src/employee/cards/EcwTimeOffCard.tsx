import { useState } from 'react';
import person1 from '@/assets/people/person1.jpg';
import person2 from '@/assets/people/person2.jpg';
import person3 from '@/assets/people/person3.jpg';
import './EcwTimeOffCard.css';

/** React preview mirror of the deployed `ecwTimeOff` LWC (HR · Who's out) —
 *  an interactive week calendar: Mon–Fri strip with per-day headshots + count;
 *  click a day to see the roster, click a teammate for their record + links. */
const PHOTOS = [person1, person2, person3];
const ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const STATE: Record<string, string> = { info: 'is-info', warn: 'is-warn', bad: 'is-bad' };
const DAY_ALIASES = [['mon', 'monday'], ['tue', 'tues', 'tuesday'], ['wed', 'weds', 'wednesday'], ['thu', 'thur', 'thurs', 'thursday'], ['fri', 'friday']];

const slug = (name: string) => name.trim().toLowerCase().replace(/[^a-z]+/g, '.');

function parseDays(text: string): number[] {
  const s = String(text || '').toLowerCase();
  if (!s) return [0];
  if (s.includes('all week') || s.includes('all-week')) return [0, 1, 2, 3, 4];
  const found: number[] = [];
  DAY_ALIASES.forEach((aliases, i) => { if (aliases.some((a) => new RegExp(`\\b${a}`).test(s))) found.push(i); });
  if (!found.length) return [0];
  const isRange = /[–—-]|\bto\b|\bthrough\b/.test(s) && found.length >= 2;
  if (isRange) { const lo = Math.min(...found), hi = Math.max(...found); const out: number[] = []; for (let i = lo; i <= hi; i++) out.push(i); return out; }
  return found;
}

export type EcwPerson = { name: string; role?: string; dates?: string; type?: string; state: 'info' | 'warn' | 'bad'; coverage?: string; department?: string; email?: string; returns?: string };
export type EcwTimeOffPayload = { periodLabel?: string; headline?: string; people: EcwPerson[] };

export const TIME_OFF_TEST: EcwTimeOffPayload = {
  periodLabel: 'This week', headline: '5 teammates out this week',
  people: [
    { name: 'Jordan Lee', role: 'Sales Manager', dates: 'Mon–Wed', type: 'PTO', state: 'info', coverage: 'Marcus Hale', department: 'Sales', email: 'jordan.lee@company.com', returns: 'Thu' },
    { name: 'Priya Nair', role: 'Support Lead', dates: 'All week', type: 'Parental leave', state: 'warn', coverage: 'Dana Price', department: 'Customer Service', email: 'priya.nair@company.com', returns: 'Mar 24' },
    { name: 'Marcus Hale', role: 'Field Supervisor', dates: 'Thu–Fri', type: 'PTO', state: 'info', coverage: 'On-call rotation', department: 'Installation', email: 'marcus.hale@company.com', returns: 'Mon' },
    { name: 'Sofia Russo', role: 'Recruiter', dates: 'Fri', type: 'Sick', state: 'bad', coverage: '', department: 'People', email: 'sofia.russo@company.com', returns: 'Mon' },
    { name: 'Devin Clark', role: 'IT Analyst', dates: 'Wed–Fri', type: 'PTO', state: 'info', coverage: 'Helpdesk queue', department: 'IT', email: 'devin.clark@company.com', returns: 'Mon' },
  ],
};

export function EcwTimeOffCard({ value }: { value?: Partial<EcwTimeOffPayload> }) {
  const hasContent = !!(value && Array.isArray(value.people) && value.people.length);
  const src: EcwTimeOffPayload = hasContent ? ({ ...TIME_OFF_TEST, ...value } as EcwTimeOffPayload) : TIME_OFF_TEST;

  const people = (src.people || []).filter((p) => p && p.name).map((p, i) => {
    const state = ['info', 'warn', 'bad'].includes(p.state) ? p.state : 'info';
    const s = slug(p.name);
    return {
      key: `p-${i}`, photoUrl: PHOTOS[i % PHOTOS.length], name: p.name.trim(), role: p.role?.trim() || '',
      dates: p.dates?.trim() || '', type: p.type?.trim() || 'Out', typeClass: `ecw-to-type ${STATE[state]}`,
      coverage: p.coverage?.trim() || '', department: p.department?.trim() || '', email: p.email?.trim() || '', returns: p.returns?.trim() || '',
      dayset: parseDays(p.dates || ''),
      links: [
        { key: 'wd', label: 'View in Workday', url: `https://company.my.workday.com/d/worker/${s}` },
        { key: 'cal', label: 'Team calendar', url: `https://company.lightning.force.com/calendar/team/${s}` },
      ],
    };
  });

  const today = new Date();
  const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const week = ABBR.map((abbr, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    return { abbr, num: d.getDate(), iso: d.toISOString().slice(0, 10), isToday: d.toDateString() === today.toDateString(), label: `${abbr}, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` };
  });

  const busiest = (() => { let best = 0, n = -1; week.forEach((_, i) => { const c = people.filter((p) => p.dayset.includes(i)).length; if (c > n) { n = c; best = i; } }); return best; })();
  const [selectedIndex, setSelectedIndex] = useState(busiest);
  const [expandedKey, setExpandedKey] = useState('');

  const days = week.map((d, i) => {
    const out = people.filter((p) => p.dayset.includes(i));
    const avatars = out.slice(0, 3).map((p) => ({ key: `${d.iso}-${p.key}`, photoUrl: p.photoUrl }));
    let cls = 'ecw-to-day'; if (out.length) cls += ' has-out'; if (i === selectedIndex) cls += ' is-selected'; if (d.isToday) cls += ' is-today';
    return { ...d, index: i, count: out.length, hasOut: out.length > 0, avatars, moreCount: out.length > 3 ? out.length - 3 : 0, hasMore: out.length > 3, dayClass: cls };
  });

  const roster = people.filter((p) => p.dayset.includes(selectedIndex)).map((p) => {
    const expanded = p.key === expandedKey;
    const details: { key: string; label: string; value: string; isMono?: boolean }[] = [];
    if (p.department) details.push({ key: 'dept', label: 'Department', value: p.department });
    if (p.coverage) details.push({ key: 'cov', label: 'Coverage', value: p.coverage });
    if (p.returns) details.push({ key: 'ret', label: 'Returns', value: p.returns });
    if (p.email) details.push({ key: 'em', label: 'Email', value: p.email, isMono: true });
    return { ...p, expanded, rowClass: expanded ? 'ecw-to-row is-open' : 'ecw-to-row', caretClass: expanded ? 'ecw-to-caret is-open' : 'ecw-to-caret', details };
  });
  const selectedLabel = week[selectedIndex]?.label || '';

  return (
    <div className="clt-live-preview ecw-to">
      <div className="ecw-to-head">
        <div className="ecw-to-head-text">
          <span className="ecw-to-eyebrow">Time off</span>
          {src.headline ? <span className="ecw-to-headline">{src.headline}</span> : null}
        </div>
        <span className="ecw-to-period">{src.periodLabel?.trim() || 'This week'}</span>
      </div>

      <div className="ecw-to-week">
        {days.map((d) => (
          <button key={d.iso} type="button" className={d.dayClass} onClick={() => { setSelectedIndex(d.index); setExpandedKey(''); }}>
            <span className="ecw-to-dabbr">{d.abbr}</span>
            <span className="ecw-to-dnum">{d.num}</span>
            <div className="ecw-to-davatars">
              {d.hasOut ? (<>{d.avatars.map((a) => <img key={a.key} className="ecw-to-dav" src={a.photoUrl} alt="" loading="lazy" />)}{d.hasMore ? <span className="ecw-to-dmore">+{d.moreCount}</span> : null}</>) : <span className="ecw-to-dnone" aria-hidden="true" />}
            </div>
          </button>
        ))}
      </div>

      <div className="ecw-to-roster-head"><span className="ecw-to-roster-day">{selectedLabel}</span></div>

      {roster.length ? (
        <ul className="ecw-to-roster">
          {roster.map((p) => (
            <li key={p.key} className={p.rowClass}>
              <button type="button" className="ecw-to-rowhead" onClick={() => setExpandedKey((k) => (k === p.key ? '' : p.key))}>
                <img className="ecw-to-photo" src={p.photoUrl} alt={p.name} loading="lazy" />
                <span className="ecw-to-meta">
                  <span className="ecw-to-name">{p.name}</span>
                  {p.role ? <span className="ecw-to-role">{p.role}</span> : null}
                </span>
                <span className="ecw-to-tags">
                  <span className={p.typeClass}>{p.type}</span>
                  {p.dates ? <span className="ecw-to-dates">{p.dates}</span> : null}
                </span>
                <svg className={p.caretClass} viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              {p.expanded ? (
                <div className="ecw-to-record">
                  <div className="ecw-to-grid">
                    {p.details.map((d) => (
                      <div key={d.key} className="ecw-to-field">
                        <span className="ecw-to-flabel">{d.label}</span>
                        <span className={`ecw-to-fval${d.isMono ? ' is-mono' : ''}`}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="ecw-to-links">
                    {p.links.map((l) => (
                      <a key={l.key} className="ecw-to-link" href={l.url} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>
                        {l.label}
                        <svg className="ecw-to-ext" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5m0-5-8 8M9 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="ecw-to-empty">Nobody is out on {selectedLabel}.</p>
      )}
    </div>
  );
}
