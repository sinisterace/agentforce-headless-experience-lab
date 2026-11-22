/**
 * @description Agentforce Coworker · HR · Onboarding renderer.
 * Each new hire renders as a crisp, squared employee card: a real headshot (bundled
 * static resource), name + role + start, a current-stage pill, a labeled horizontal
 * progress stepper, and a "Stage N of M · Next: …" readout. Click a card to expand a
 * detail grid (manager, department, location, email) and quick links out (Workday,
 * IT setup, onboarding plan). Expand/collapse is local UI state (not an agent round-trip).
 *
 * Headshots are generic professional portraits shipped as static resources
 * (ecwPerson1/2/3) so they travel with the org; they are assigned round-robin.
 *
 * Contract: field names below MUST match genAiFunctions/ecwOnboarding_Output_f4d5/input/schema.json.
 * Fields: headline?, hires[]{ name, role?, start?, stages[string], stageIndex (number),
 *   detail?, state (good|warn|info), manager?, department?, location?, email? }.
 */
import { LightningElement, api, track } from 'lwc';
import PERSON1 from '@salesforce/resourceUrl/ecwPerson1';
import PERSON2 from '@salesforce/resourceUrl/ecwPerson2';
import PERSON3 from '@salesforce/resourceUrl/ecwPerson3';

const PHOTOS = [PERSON1, PERSON2, PERSON3];
const STATE = { good: 'is-good', warn: 'is-warn', info: 'is-info' };

const TEST_DATA = {
    headline: '3 new hires onboarding',
    hires: [
        { name: 'Dana Price', role: 'Account Executive · Sales', start: 'Starts Monday', stages: ['Offer', 'Paperwork', 'Equipment', 'Day 1', '30-day'], stageIndex: 2, detail: 'Laptop shipped; badge access pending from IT.', state: 'info', manager: 'Jordan Lee', department: 'Sales', location: 'Austin, TX', email: 'dana.price@company.com' },
        { name: 'Omar Haddad', role: 'Field Installation Tech · Installation', start: 'Started 3 days ago', stages: ['Offer', 'Paperwork', 'Equipment', 'Day 1', '30-day'], stageIndex: 3, detail: 'On site for Day 1; van and tools assigned.', state: 'info', manager: 'Marcus Hale', department: 'Installation', location: 'Phoenix, AZ', email: 'omar.haddad@company.com' },
        { name: 'Grace Lin', role: 'Support Engineer · Customer Service', start: 'Started 2 weeks ago', stages: ['Offer', 'Paperwork', 'Equipment', 'Day 1', '30-day'], stageIndex: 4, detail: '30-day check-in scheduled with manager.', state: 'good', manager: 'Priya Nair', department: 'Customer Service', location: 'Remote', email: 'grace.lin@company.com' }
    ]
};

function slug(name) { return String(name).trim().toLowerCase().replace(/[^a-z]+/g, '.'); }

export default class EcwOnboarding extends LightningElement {
    @api value;
    @track headline = '';
    @track hires = [];
    isTestMode = false;

    connectedCallback() { if (!this.tryLoadFromFlow()) this.initializeFromData({}); }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.ecwOnboardingJSON) {
                const data = JSON.parse(this.value.ecwOnboardingJSON);
                if (data && typeof data === 'object' && Array.isArray(data.hires)) { this.initializeFromData(data); return true; }
            }
        } catch (e) { console.error('EcwOnboarding parse error:', e.message); }
        return false;
    }

    initializeFromData(data) {
        const raw = data || {};
        const hasContent = Array.isArray(raw.hires) && raw.hires.length > 0;
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? TEST_DATA : raw;

        this.headline = src.headline ? String(src.headline).trim() : '';

        this.hires = (Array.isArray(src.hires) ? src.hires : []).filter((h) => h && h.name).map((h, i) => {
            const stages = Array.isArray(h.stages) && h.stages.length ? h.stages.map(String) : ['Offer', 'Day 1'];
            const idx = Math.max(0, Math.min(Number(h.stageIndex) || 0, stages.length - 1));
            const state = ['good', 'warn', 'info'].includes(h.state) ? h.state : 'info';
            const steps = stages.map((label, j) => {
                const phase = j < idx ? 'is-done' : (j === idx ? 'is-current' : 'is-upcoming');
                return { key: `s-${i}-${j}`, label, cls: `ecw-ob-step ${phase}`, isDone: j < idx, showConn: j > 0 };
            });
            const next = idx < stages.length - 1 ? `Next: ${stages[idx + 1]}` : 'Final stage';
            const dept = h.department ? String(h.department).trim() : (h.role && h.role.includes('·') ? h.role.split('·').pop().trim() : '');
            const details = [
                { key: 'mgr', label: 'Manager', value: h.manager ? String(h.manager).trim() : '—' },
                { key: 'dept', label: 'Department', value: dept || '—' },
                { key: 'loc', label: 'Location', value: h.location ? String(h.location).trim() : '—' },
                { key: 'email', label: 'Email', value: h.email ? String(h.email).trim() : '—', isMono: true }
            ];
            const s = slug(h.name);
            const links = [
                { key: 'wd', label: 'Open in Workday', url: `https://company.my.workday.com/d/worker/${s}` },
                { key: 'it', label: 'IT setup ticket', url: `https://company.service-now.com/onboarding/${s}` },
                { key: 'plan', label: 'Onboarding plan', url: `https://company.lightning.force.com/onboarding/${s}` }
            ];
            return {
                key: `h-${i}`,
                photoUrl: PHOTOS[i % PHOTOS.length],
                name: String(h.name).trim(),
                role: h.role ? String(h.role).trim() : '',
                hasRole: !!(h.role && String(h.role).trim()),
                start: h.start ? String(h.start).trim() : '',
                hasStart: !!(h.start && String(h.start).trim()),
                cardClass: `ecw-ob-badge ${STATE[state]}`,
                statusClass: `ecw-ob-status ${STATE[state]}`,
                statusText: stages[idx],
                steps,
                progressText: `Stage ${idx + 1} of ${stages.length}`,
                nextText: next,
                detail: h.detail ? String(h.detail).trim() : '',
                hasDetail: !!(h.detail && String(h.detail).trim()),
                details,
                links,
                expanded: false,
                caretClass: 'ecw-ob-caret'
            };
        });
    }

    toggleHire(event) {
        const key = event.currentTarget.dataset.key;
        this.hires = this.hires.map((h) => h.key === key
            ? { ...h, expanded: !h.expanded, caretClass: `ecw-ob-caret${!h.expanded ? ' is-open' : ''}` }
            : h);
    }

    stopLink(event) { event.stopPropagation(); }

    get hasHires() { return this.hires.length > 0; }
}
