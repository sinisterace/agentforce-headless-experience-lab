/**
 * @description Agentforce Coworker · HR · Open roles renderer.
 * Open requisitions for the People team, rendered as a recruiting ledger in the
 * asaMfgQuoteBuilder design language: an icon header card with recruiting context,
 * a bordered requisition table (role, dept, stage, days open, hiring manager, with
 * the candidate count as the right-aligned numeric column), and a summary block
 * ending in a prominent open-roles total. Display-only (no CTAs).
 *
 * Contract: field names below MUST match genAiFunctions/ecwOpenRoles_Output_f3c4/input/schema.json.
 * Fields: headline?, roles[]{ title, dept?, stage?, daysOpen (number), candidates (number), hiringManager?, state (ok|warn|bad) }.
 */
import { LightningElement, api, track } from 'lwc';

function num(v) { const n = Number(v); return isFinite(n) ? n : 0; }

const TEST_DATA = {
    headline: '5 open roles',
    roles: [
        { title: 'Field Installation Technician', dept: 'Installation & Field', stage: 'Interviewing', daysOpen: 22, candidates: 6, hiringManager: 'Alex Monroe', state: 'ok' },
        { title: 'Enterprise Account Executive', dept: 'Sales', stage: 'Offer out', daysOpen: 41, candidates: 2, hiringManager: 'Jordan Lee', state: 'warn' },
        { title: 'Support Engineer', dept: 'Customer Service', stage: 'Sourcing', daysOpen: 9, candidates: 14, hiringManager: 'Priya Nair', state: 'ok' },
        { title: 'Security Systems Architect', dept: 'IT', stage: 'Interviewing', daysOpen: 55, candidates: 3, hiringManager: 'Devin Clark', state: 'bad' },
        { title: 'Staff Accountant', dept: 'Finance & Admin', stage: 'Screening', daysOpen: 17, candidates: 8, hiringManager: 'Rosa Behn', state: 'ok' }
    ]
};

export default class EcwOpenRoles extends LightningElement {
    @api value;
    @track headline = '';
    @track roles = [];
    @track totalRolesText = '0';
    @track totalCandidatesText = '0';
    @track offersOutText = '0';
    @track avgDaysText = '0d';
    @track deptCountText = '0';
    isTestMode = false;

    connectedCallback() { if (!this.tryLoadFromFlow()) this.initializeFromData({}); }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.ecwOpenRolesJSON) {
                const data = JSON.parse(this.value.ecwOpenRolesJSON);
                if (data && typeof data === 'object' && Array.isArray(data.roles)) { this.initializeFromData(data); return true; }
            }
        } catch (e) { console.error('EcwOpenRoles parse error:', e.message); }
        return false;
    }

    initializeFromData(data) {
        const raw = data || {};
        const hasContent = Array.isArray(raw.roles) && raw.roles.length > 0;
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? TEST_DATA : raw;

        this.headline = src.headline ? String(src.headline).trim() : '';

        const list = (Array.isArray(src.roles) ? src.roles : []).filter((r) => r && r.title);
        let totalCand = 0, offers = 0, totalDays = 0;
        const depts = new Set();

        this.roles = list.map((r, i) => {
            const state = ['ok', 'warn', 'bad'].includes(r.state) ? r.state : 'ok';
            const cand = num(r.candidates);
            const days = num(r.daysOpen);
            const stage = r.stage ? String(r.stage).trim() : '';
            totalCand += cand;
            totalDays += days;
            if (stage.toLowerCase().includes('offer')) offers += 1;
            if (r.dept && String(r.dept).trim()) depts.add(String(r.dept).trim());
            return {
                key: `r-${i}`,
                num: String(i + 1).padStart(2, '0'),
                title: String(r.title).trim(),
                dept: r.dept ? String(r.dept).trim() : '',
                stage,
                stageClass: `ecw-or-stage is-${state}`,
                daysText: `${days}d`,
                daysClass: `ecw-or-tdays is-${state}`,
                candidates: cand,
                hiringManager: r.hiringManager ? String(r.hiringManager).trim() : '',
                hasHm: !!(r.hiringManager && String(r.hiringManager).trim())
            };
        });

        const n = list.length;
        this.totalRolesText = String(n);
        this.totalCandidatesText = String(totalCand);
        this.offersOutText = String(offers);
        this.avgDaysText = `${n ? Math.round(totalDays / n) : 0}d`;
        this.deptCountText = String(depts.size);
    }

    get hasRoles() { return this.roles.length > 0; }
}