/**
 * @description Agentforce Coworker · Service · Field dispatch — suggested reassignment.
 * An at-risk service appointment (SLA countdown, customer, window, the current tech
 * who's running behind) over a live dispatch map, then ranked candidate technicians
 * to reassign to — each with a fit score, skills match, ETA/distance, utilization, and
 * rating. Select the best fit and confirm. Selection + confirm are local UI state.
 *
 * TEMPLATE-SAFE: the org (and the orgfarm template it seeds) has no Field Service data
 * (0 ServiceAppointment/ServiceResource rows), so the backing Apex returns CURATED,
 * seed-stable, FSL-shaped data with no org Ids — identical pattern to the other ecw
 * CLTs. The card also carries its own never-blank fallback.
 *
 * Contract: field names below MUST match genAiFunctions/ecwFieldDispatch_Output_g7h9/input/schema.json.
 * Fields: title?, appointment{ number, customer, jobType?, address?, window?, slaText?,
 *   slaState (ok|warn|bad), currentTech?, currentIssue?, priority? },
 *   candidates[]{ name, status?, fit (number), rating?, etaMin (number), distanceKm (number),
 *   skillsMatch (number 0-100), utilization (number 0-100), best?, pos?{ top, left } }.
 */
import { LightningElement, api, track } from 'lwc';
import PERSON1 from '@salesforce/resourceUrl/ecwPerson1';
import PERSON2 from '@salesforce/resourceUrl/ecwPerson2';
import PERSON3 from '@salesforce/resourceUrl/ecwPerson3';

const PHOTOS = [PERSON1, PERSON2, PERSON3];
const SLA = { ok: 'is-ok', warn: 'is-warn', bad: 'is-bad' };

function num(v, d = 0) { const n = Number(v); return isFinite(n) ? n : d; }

const TEST_DATA = {
    title: 'Reassign at-risk appointment',
    appointment: {
        number: 'SA-10427', customer: 'Northwind Traders', jobType: 'HVAC — no cooling',
        address: '1200 W 5th St, Austin TX', window: 'Today · 2:00–4:00 PM',
        slaText: 'SLA breaches in 48m', slaState: 'bad', priority: 'High',
        currentTech: 'Marcus Hale', currentIssue: 'Running 55m behind on a prior job'
    },
    site: { top: 46, left: 50 },
    candidates: [
        { name: 'Dana Price', status: 'Available now', fit: 94, rating: 4.9, etaMin: 12, distanceKm: 3.1, skillsMatch: 100, utilization: 62, best: true, pos: { top: 30, left: 24 } },
        { name: 'Grace Lin', status: 'Finishing nearby', fit: 81, rating: 4.7, etaMin: 23, distanceKm: 5.4, skillsMatch: 80, utilization: 78, pos: { top: 70, left: 70 } },
        { name: 'Omar Haddad', status: 'Available now', fit: 68, rating: 4.8, etaMin: 34, distanceKm: 8.9, skillsMatch: 60, utilization: 45, pos: { top: 24, left: 78 } }
    ]
};

export default class EcwFieldDispatch extends LightningElement {
    @api value;
    @track title = '';
    @track appt = {};
    @track slaClass = 'ecw-fd-sla';
    @track candidates = [];
    @track markers = [];
    @track siteStyle = 'top:46%;left:50%;';
    @track selectedKey = '';
    @track done = false;
    @track doneText = '';

    isTestMode = false;
    rawCandidates = [];

    connectedCallback() { if (!this.tryLoadFromFlow()) this.initializeFromData({}); }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.ecwFieldDispatchJSON) {
                const data = JSON.parse(this.value.ecwFieldDispatchJSON);
                if (data && typeof data === 'object' && Array.isArray(data.candidates)) { this.initializeFromData(data); return true; }
            }
        } catch (e) { console.error('EcwFieldDispatch parse error:', e.message); }
        return false;
    }

    initializeFromData(data) {
        const raw = data || {};
        const hasContent = Array.isArray(raw.candidates) && raw.candidates.length > 0;
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? TEST_DATA : raw;

        this.title = src.title ? String(src.title).trim() : 'Suggested reassignment';
        const a = src.appointment || {};
        const slaState = ['ok', 'warn', 'bad'].includes(a.slaState) ? a.slaState : 'warn';
        this.appt = {
            number: a.number ? String(a.number).trim() : '',
            customer: a.customer ? String(a.customer).trim() : '',
            jobType: a.jobType ? String(a.jobType).trim() : '',
            address: a.address ? String(a.address).trim() : '', hasAddress: !!a.address,
            window: a.window ? String(a.window).trim() : '', hasWindow: !!a.window,
            slaText: a.slaText ? String(a.slaText).trim() : '', hasSla: !!a.slaText,
            priority: a.priority ? String(a.priority).trim() : '', hasPriority: !!a.priority,
            currentTech: a.currentTech ? String(a.currentTech).trim() : '',
            currentIssue: a.currentIssue ? String(a.currentIssue).trim() : '',
            hasCurrent: !!(a.currentTech || a.currentIssue)
        };
        this.slaClass = `ecw-fd-sla ${SLA[slaState]}`;

        const site = src.site || { top: 46, left: 50 };
        this.siteStyle = `top:${num(site.top, 46)}%;left:${num(site.left, 50)}%;`;

        this.rawCandidates = (Array.isArray(src.candidates) ? src.candidates : []).filter((c) => c && c.name).map((c, i) => ({
            key: `c-${i}`, idx: i, name: String(c.name).trim(),
            status: c.status ? String(c.status).trim() : '',
            fit: Math.max(0, Math.min(100, Math.round(num(c.fit)))),
            rating: c.rating ? Number(c.rating).toFixed(1) : '',
            etaMin: Math.round(num(c.etaMin)), distanceKm: num(c.distanceKm),
            skillsMatch: Math.max(0, Math.min(100, Math.round(num(c.skillsMatch)))),
            utilization: Math.max(0, Math.min(100, Math.round(num(c.utilization)))),
            best: !!c.best, photoUrl: PHOTOS[i % PHOTOS.length],
            pos: c.pos || { top: 30 + i * 20, left: 24 + i * 26 }
        }));
        this.selectedKey = '';
        this.done = false;
        this.recompute();
    }

    recompute() {
        const sel = this.selectedKey;
        this.candidates = this.rawCandidates.map((c) => {
            const isSel = c.key === sel;
            const fitState = c.fit >= 85 ? 'is-high' : (c.fit >= 70 ? 'is-mid' : 'is-low');
            return {
                ...c,
                selected: isSel,
                cardClass: `ecw-fd-cand${isSel ? ' is-selected' : ''}${c.best ? ' is-best' : ''}`,
                dotClass: `ecw-fd-radio${isSel ? ' on' : ''}`,
                fitClass: `ecw-fd-fit ${fitState}`,
                skillsStyle: `width:${c.skillsMatch}%;`,
                utilStyle: `width:${c.utilization}%;`,
                metaLine: `${c.etaMin} min ETA · ${c.distanceKm} km`,
                ratingText: c.rating ? `${c.rating}★` : ''
            };
        });
        this.markers = this.rawCandidates.map((c) => ({
            key: c.key, name: c.name, photoUrl: c.photoUrl, best: c.best,
            markerClass: `ecw-fd-mk${c.best ? ' is-best' : ''}${c.key === sel ? ' is-selected' : ''}`,
            style: `top:${num(c.pos.top, 40)}%;left:${num(c.pos.left, 40)}%;`
        }));
    }

    handleSelect(event) {
        const key = event.currentTarget.dataset.key;
        if (!key || this.done) return;
        this.selectedKey = this.selectedKey === key ? '' : key;
        this.recompute();
    }

    handleConfirm() {
        if (!this.selectedKey || this.done) return;
        const c = this.rawCandidates.find((x) => x.key === this.selectedKey);
        if (!c) return;
        this.done = true;
        this.doneText = `${this.appt.number || 'Appointment'} reassigned to ${c.name} — ${c.etaMin} min ETA`;
        this.recompute();

        // Primary (Agentforce / Coworker surface): feed the reassignDispatch user_input
        // tool via the valuechange CustomEvent (matches Apex c__EcwFieldDispatchInput).
        this.dispatchEvent(new CustomEvent('valuechange', {
            detail: { value: { technician: c.name, appointment: this.appt.number || '', eta: `${c.etaMin} min`, fit: c.fit } }
        }));
        // Fallback (ECv2 web-messaging surface, where valuechange does not apply).
        this.sendMessage(`Reassign ${this.appt.number || 'the appointment'} to ${c.name} (${c.etaMin} min ETA, ${c.fit}% fit)`);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('EcwFieldDispatch sent:', message))
                    .catch((err) => console.error('EcwFieldDispatch send error:', err));
            } else {
                console.log('EcwFieldDispatch: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) { console.error('EcwFieldDispatch sendMessage error:', err); }
    }

    get bestEta() {
        const b = this.rawCandidates.find((c) => c.best) || this.rawCandidates[0];
        return b && b.etaMin ? `${b.etaMin} min` : '';
    }
    get hasCandidates() { return this.candidates.length > 0; }
    get showConfirm() { return !!this.selectedKey && !this.done; }
    get confirmLabel() {
        const c = this.rawCandidates.find((x) => x.key === this.selectedKey);
        return c ? `Reassign to ${c.name}` : 'Confirm reassignment';
    }
}
