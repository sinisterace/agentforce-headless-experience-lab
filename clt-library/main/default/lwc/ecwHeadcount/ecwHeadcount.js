/**
 * @description Agentforce Coworker · HR · Headcount renderer.
 * Company headcount for the People team, presented as a business "ledger" styled
 * after asaMfgQuoteBuilder: an accent icon-header with a growth pill, a bordered
 * department table (rank · name + share-of-total bar · people), and a summary that
 * ends on a prominent total. Display-only (no steppers/inputs/CTAs).
 *
 * Contract: field names below MUST match genAiFunctions/ecwHeadcount_Output_f1a2/input/schema.json.
 * Fields: periodLabel?, total (number), growthText?, openRoles?, depts[]{ name, count (number) }.
 */
import { LightningElement, api, track } from 'lwc';

function num(v) { const n = Number(v); return isFinite(n) ? n : 0; }

const TEST_DATA = {
    periodLabel: 'Company headcount', total: 482, growthText: '+18 this quarter', openRoles: 11,
    depts: [
        { name: 'Operations', count: 168 }, { name: 'Sales', count: 92 }, { name: 'Customer Service', count: 76 },
        { name: 'Installation & Field', count: 64 }, { name: 'IT', count: 28 }, { name: 'Finance & Admin', count: 24 },
        { name: 'People & HR', count: 16 }, { name: 'Marketing', count: 14 }
    ]
};

export default class EcwHeadcount extends LightningElement {
    @api value;
    @track eyebrow = '';
    @track heroValue = '';
    @track growthText = '';
    @track pillClass = 'ecw-hc-pill';
    @track hasOpenRoles = false;
    @track openRolesValue = '';
    @track deptCountText = '0';
    @track depts = [];
    isTestMode = false;

    connectedCallback() { if (!this.tryLoadFromFlow()) this.initializeFromData({}); }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.ecwHeadcountJSON) {
                const data = JSON.parse(this.value.ecwHeadcountJSON);
                if (data && typeof data === 'object' && Array.isArray(data.depts)) { this.initializeFromData(data); return true; }
            }
        } catch (e) { console.error('EcwHeadcount parse error:', e.message); }
        return false;
    }

    initializeFromData(data) {
        const raw = data || {};
        const hasContent = Array.isArray(raw.depts) && raw.depts.length > 0;
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? TEST_DATA : raw;

        this.eyebrow = src.periodLabel ? String(src.periodLabel).trim() : 'Headcount';
        this.growthText = src.growthText ? String(src.growthText).trim() : '';
        this.pillClass = `ecw-hc-pill${this.growthText.startsWith('-') ? ' is-down' : ''}`;

        const open = num(src.openRoles);
        this.hasOpenRoles = open > 0;
        this.openRolesValue = String(open);

        // Rank departments by size so the leaderboard numbering is meaningful.
        const list = (Array.isArray(src.depts) ? src.depts : [])
            .filter((d) => d && d.name)
            .slice()
            .sort((a, b) => num(b.count) - num(a.count));
        this.deptCountText = String(list.length);

        const sum = list.reduce((a, d) => a + num(d.count), 0);
        const total = num(src.total) || sum;
        this.heroValue = String(total);
        const denom = total || 1;

        this.depts = list.map((d, i) => {
            const c = num(d.count);
            const pct = Math.round((c / denom) * 100);
            return {
                key: `d-${i}`,
                rank: String(i + 1).padStart(2, '0'),
                name: String(d.name).trim(),
                countText: String(c),
                pctText: `${pct}%`,
                barStyle: `width:${Math.max(2, pct)}%;`
            };
        });
    }

    get hasDepts() { return this.depts.length > 0; }
}
