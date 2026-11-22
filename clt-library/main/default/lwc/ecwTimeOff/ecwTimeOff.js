/**
 * @description Agentforce Coworker · HR · Who's out — interactive week calendar.
 * A Monday–Friday week strip signals who is off each day (stacked headshots + a count);
 * clicking a day reveals that day's roster, and clicking a teammate expands their
 * record (type, coverage, department, return, email) with quick links out to their
 * Workday profile and the team calendar. Day selection + record expand are local UI
 * state (no agent round-trip). Headshots are bundled static resources (ecwPerson1/2/3).
 *
 * Contract: field names below MUST match genAiFunctions/ecwTimeOff_Output_f2b3/input/schema.json.
 * Fields: periodLabel?, headline?, people[]{ name, role?, dates?, type?, state (info|warn|bad),
 *   coverage?, department?, email?, returns? }.
 */
import { LightningElement, api, track } from 'lwc';
import PERSON1 from '@salesforce/resourceUrl/ecwPerson1';
import PERSON2 from '@salesforce/resourceUrl/ecwPerson2';
import PERSON3 from '@salesforce/resourceUrl/ecwPerson3';

const PHOTOS = [PERSON1, PERSON2, PERSON3];
const ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const STATE = { info: 'is-info', warn: 'is-warn', bad: 'is-bad' };
const DAY_ALIASES = [
    ['mon', 'monday'], ['tue', 'tues', 'tuesday'], ['wed', 'weds', 'wednesday'],
    ['thu', 'thur', 'thurs', 'thursday'], ['fri', 'friday']
];

function slug(name) { return String(name).trim().toLowerCase().replace(/[^a-z]+/g, '.'); }
function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

// Parse a loose weekday range ("Mon–Wed", "All week", "Fri", "Thu-Fri") to day indices 0..4.
function parseDays(text) {
    const s = String(text || '').toLowerCase();
    if (!s) return [0];
    if (s.includes('all week') || s.includes('all-week')) return [0, 1, 2, 3, 4];
    const found = [];
    DAY_ALIASES.forEach((aliases, i) => { if (aliases.some((a) => new RegExp(`\\b${a}`).test(s))) found.push(i); });
    if (!found.length) return [0];
    const isRange = /[–—\-]|\bto\b|\bthrough\b/.test(s) && found.length >= 2;
    if (isRange) {
        const lo = Math.min(...found), hi = Math.max(...found);
        const out = []; for (let i = lo; i <= hi; i++) out.push(i); return out;
    }
    return found;
}

const TEST_DATA = {
    periodLabel: 'This week', headline: '5 teammates out this week',
    people: [
        { name: 'Jordan Lee', role: 'Sales Manager', dates: 'Mon–Wed', type: 'PTO', state: 'info', coverage: 'Marcus Hale', department: 'Sales', email: 'jordan.lee@company.com', returns: 'Thu' },
        { name: 'Priya Nair', role: 'Support Lead', dates: 'All week', type: 'Parental leave', state: 'warn', coverage: 'Dana Price', department: 'Customer Service', email: 'priya.nair@company.com', returns: 'Mar 24' },
        { name: 'Marcus Hale', role: 'Field Supervisor', dates: 'Thu–Fri', type: 'PTO', state: 'info', coverage: 'On-call rotation', department: 'Installation', email: 'marcus.hale@company.com', returns: 'Mon' },
        { name: 'Sofia Russo', role: 'Recruiter', dates: 'Fri', type: 'Sick', state: 'bad', coverage: '', department: 'People', email: 'sofia.russo@company.com', returns: 'Mon' },
        { name: 'Devin Clark', role: 'IT Analyst', dates: 'Wed–Fri', type: 'PTO', state: 'info', coverage: 'Helpdesk queue', department: 'IT', email: 'devin.clark@company.com', returns: 'Mon' }
    ]
};

export default class EcwTimeOff extends LightningElement {
    @api value;
    @track eyebrow = '';
    @track headline = '';
    @track days = [];
    @track roster = [];
    @track selectedLabel = '';

    isTestMode = false;
    rawPeople = [];
    week = [];
    selectedIndex = 0;
    expandedKey = '';

    connectedCallback() { if (!this.tryLoadFromFlow()) this.initializeFromData({}); }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.ecwTimeOffJSON) {
                const data = JSON.parse(this.value.ecwTimeOffJSON);
                if (data && typeof data === 'object' && Array.isArray(data.people)) { this.initializeFromData(data); return true; }
            }
        } catch (e) { console.error('EcwTimeOff parse error:', e.message); }
        return false;
    }

    initializeFromData(data) {
        const raw = data || {};
        const hasContent = Array.isArray(raw.people) && raw.people.length > 0;
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? TEST_DATA : raw;

        this.eyebrow = src.periodLabel ? String(src.periodLabel).trim() : 'This week';
        this.headline = src.headline ? String(src.headline).trim() : '';

        this.rawPeople = (Array.isArray(src.people) ? src.people : []).filter((p) => p && p.name).map((p, i) => {
            const state = ['info', 'warn', 'bad'].includes(p.state) ? p.state : 'info';
            const s = slug(p.name);
            return {
                key: `p-${i}`,
                photoUrl: PHOTOS[i % PHOTOS.length],
                name: String(p.name).trim(),
                role: p.role ? String(p.role).trim() : '',
                dates: p.dates ? String(p.dates).trim() : '',
                type: p.type ? String(p.type).trim() : 'Out',
                typeClass: `ecw-to-type ${STATE[state]}`,
                coverage: p.coverage ? String(p.coverage).trim() : '',
                department: p.department ? String(p.department).trim() : '',
                email: p.email ? String(p.email).trim() : '',
                returns: p.returns ? String(p.returns).trim() : '',
                dayset: parseDays(p.dates),
                links: [
                    { key: 'wd', label: 'View in Workday', url: `https://company.my.workday.com/d/worker/${s}` },
                    { key: 'cal', label: 'Team calendar', url: `https://company.lightning.force.com/calendar/team/${s}` }
                ]
            };
        });

        // Build the current Mon–Fri week.
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
        this.week = ABBR.map((abbr, i) => {
            const d = new Date(monday); d.setDate(monday.getDate() + i);
            return { abbr, num: d.getDate(), iso: d.toISOString().slice(0, 10), isToday: sameDay(d, today), dateObj: d };
        });

        // Default to the day with the most people out (earliest on ties).
        let best = 0, bestN = -1;
        this.week.forEach((d, i) => {
            const n = this.rawPeople.filter((p) => p.dayset.includes(i)).length;
            if (n > bestN) { bestN = n; best = i; }
        });
        this.selectedIndex = best;
        this.expandedKey = '';
        this.recompute();
    }

    recompute() {
        this.days = this.week.map((d, i) => {
            const out = this.rawPeople.filter((p) => p.dayset.includes(i));
            const avatars = out.slice(0, 3).map((p) => ({ key: `${d.iso}-${p.key}`, photoUrl: p.photoUrl }));
            const sel = i === this.selectedIndex;
            let cls = 'ecw-to-day';
            if (out.length) cls += ' has-out';
            if (sel) cls += ' is-selected';
            if (d.isToday) cls += ' is-today';
            return {
                key: d.iso, index: i, abbr: d.abbr, num: d.num,
                count: out.length, hasOut: out.length > 0,
                avatars, moreCount: out.length > 3 ? out.length - 3 : 0, hasMore: out.length > 3,
                dayClass: cls
            };
        });

        const sel = this.week[this.selectedIndex];
        this.selectedLabel = sel ? `${sel.abbr}, ${sel.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : '';

        const out = this.rawPeople.filter((p) => p.dayset.includes(this.selectedIndex));
        this.roster = out.map((p) => {
            const expanded = p.key === this.expandedKey;
            const details = [];
            if (p.department) details.push({ key: 'dept', label: 'Department', value: p.department });
            if (p.coverage) details.push({ key: 'cov', label: 'Coverage', value: p.coverage });
            if (p.returns) details.push({ key: 'ret', label: 'Returns', value: p.returns });
            if (p.email) details.push({ key: 'em', label: 'Email', value: p.email, isMono: true });
            return {
                key: p.key, photoUrl: p.photoUrl, name: p.name, role: p.role, hasRole: !!p.role,
                type: p.type, typeClass: p.typeClass, dates: p.dates, hasDates: !!p.dates,
                expanded, rowClass: expanded ? 'ecw-to-row is-open' : 'ecw-to-row',
                caretClass: expanded ? 'ecw-to-caret is-open' : 'ecw-to-caret',
                details, links: p.links
            };
        });
    }

    handleDayClick(event) {
        const i = Number(event.currentTarget.dataset.index);
        if (!Number.isNaN(i)) { this.selectedIndex = i; this.expandedKey = ''; this.recompute(); }
    }

    handleTogglePerson(event) {
        const key = event.currentTarget.dataset.key;
        this.expandedKey = this.expandedKey === key ? '' : key;
        this.recompute();
    }

    stopLink(event) { event.stopPropagation(); }

    get hasRoster() { return this.roster.length > 0; }
    get emptyText() { return `Nobody is out on ${this.selectedLabel}.`; }
}
