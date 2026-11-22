/**
 * @description Agentforce Coworker · Finance · Budget vs actual renderer.
 * Energy & Utilities design language (per c/asaEnergyUsageCost): warm-stone
 * neutrals + amber accent, squared hairline geometry, monospace tabular numerals.
 * Composition: a projected-spend readout (actual of budget + % used + over/under
 * delta), an SVG vertical column chart of per-department spend with a dashed
 * budget tick per column, and a segmented spend-share meter whose hairline legend
 * rows carry the per-line variance detail + Investigate action.
 *
 * This component is dual-registered (ecwBudgetActual.js-meta.xml):
 *  - lightning__AgentforceOutput (sourceType c__ecwBudgetActual) — the read-only card.
 *  - lightning__AgentforceInput  (targetType  c__ecwBudgetActualInput) — the interactive
 *    editor. Tapping Investigate dispatches the Agentforce `valuechange` CustomEvent with
 *    { dept, variance, pct } (matching Apex c__EcwBudgetActualInput), which the agent's
 *    user_input tool consumes. It also calls embeddedservice_configuration.util
 *    .sendTextMessage(...) as a fallback on the ECv2 web-messaging surface.
 *
 * Contract: field names below MUST match genAiFunctions/ecwBudgetActual_Output_b1c3/input/schema.json.
 * Fields: periodLabel?, headline?, totalBudget (number), totalActual (number),
 *   lines[]{ dept, budget (number), actual (number), state (ok|warn|over) }.
 */
import { LightningElement, api, track } from 'lwc';

// State hues in the warm-stone/amber world: healthy green, warning amber, over-budget red.
const STATE_COLOR = { ok: '#15803d', warn: '#b45309', over: '#b91c1c' };

function num(v) { const n = Number(v); return isFinite(n) ? n : 0; }
function compact(n) {
    const a = Math.abs(num(n)); const s = n < 0 ? '-' : '';
    if (a >= 1e9) return `${s}$${String(Number((a / 1e9).toFixed(2)))}B`;
    if (a >= 1e6) return `${s}$${String(Number((a / 1e6).toFixed(2)))}M`;
    if (a >= 1e3) return `${s}$${Math.round(a / 1e3)}K`;
    return `${s}$${Math.round(a)}`;
}

// NEVER-BLANK GUARANTEE: themed to the company's departments (seed-stable).
const TEST_DATA = {
    periodLabel: 'FY26 · YTD', headline: '81% of budget used',
    totalBudget: 7800000, totalActual: 6300000,
    lines: [
        { dept: 'Sales', budget: 2400000, actual: 1680000, state: 'ok' },
        { dept: 'Customer Service', budget: 1800000, actual: 1710000, state: 'warn' },
        { dept: 'IT', budget: 1200000, actual: 1320000, state: 'over' },
        { dept: 'Facilities', budget: 900000, actual: 540000, state: 'ok' },
        { dept: 'R&D', budget: 1500000, actual: 1050000, state: 'ok' }
    ]
};

export default class EcwBudgetActual extends LightningElement {
    @api value;

    @track eyebrow = '';
    @track heroValue = '';
    @track budgetText = '';
    @track pctUsedText = '';
    @track hasDelta = false;
    @track deltaClass = 'asa-ba-delta';
    @track deltaArrow = '';
    @track deltaLabel = '';
    @track columns = [];
    @track chartViewBox = '0 0 100 100';
    @track baselineX2 = 100;
    @track lines = [];

    isTestMode = false;

    connectedCallback() { if (!this.tryLoadFromFlow()) this.initializeFromData({}); }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.ecwBudgetActualJSON) {
                const data = JSON.parse(this.value.ecwBudgetActualJSON);
                if (data && typeof data === 'object' && Array.isArray(data.lines)) { this.initializeFromData(data); return true; }
            }
        } catch (e) { console.error('EcwBudgetActual parse error:', e.message); }
        return false;
    }

    initializeFromData(data) {
        const raw = data || {};
        const hasContent = Array.isArray(raw.lines) && raw.lines.length > 0;
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? TEST_DATA : raw;

        this.eyebrow = src.periodLabel ? String(src.periodLabel).trim() : 'YTD';

        const rawLines = (Array.isArray(src.lines) ? src.lines : []).filter((l) => l && l.dept).map((l) => {
            const budget = num(l.budget), actual = num(l.actual);
            const pct = budget ? (actual / budget) * 100 : 0;
            const state = ['ok', 'warn', 'over'].includes(l.state) ? l.state : (pct > 100 ? 'over' : (pct >= 90 ? 'warn' : 'ok'));
            return { dept: String(l.dept).trim(), budget, actual, pct, state };
        });

        const tb = num(src.totalBudget) || rawLines.reduce((s, l) => s + l.budget, 0);
        const ta = num(src.totalActual) || rawLines.reduce((s, l) => s + l.actual, 0);
        const totalPct = tb ? Math.round((ta / tb) * 100) : 0;
        const totalVar = ta - tb;

        // Hero readout
        this.heroValue = compact(ta);
        this.budgetText = `of ${compact(tb)} budget`;
        this.pctUsedText = `${totalPct}% used`;
        this.hasDelta = totalVar !== 0;
        const over = totalVar > 0;
        this.deltaClass = `asa-ba-delta ${over ? 'is-up' : 'is-down'}`;
        this.deltaArrow = over ? '▲' : '▼';
        this.deltaLabel = over ? `${compact(totalVar)} over` : `${compact(Math.abs(totalVar))} under`;

        // Column chart geometry (SVG, preserveAspectRatio=none). Slot width 10 units.
        const n = rawLines.length || 1;
        const slot = 10, barW = 5, top = 6, baseline = 94, plotH = baseline - top;
        const vbW = n * slot;
        this.chartViewBox = `0 0 ${vbW} 100`;
        this.baselineX2 = vbW;
        const scaleMax = (rawLines.reduce((m, l) => Math.max(m, l.actual, l.budget), 0) || 1) * 1.06;

        this.columns = rawLines.map((l, i) => {
            const left = i * slot;
            const barH = Math.max(1.2, (l.actual / scaleMax) * plotH);
            const budgetY = baseline - (l.budget / scaleMax) * plotH;
            return {
                key: `col-${i}`,
                barX: left + (slot - barW) / 2,
                barY: baseline - barH,
                barW,
                barH,
                fill: STATE_COLOR[l.state],
                budgetY,
                budgetX1: left + 1,
                budgetX2: left + slot - 1
            };
        });

        // Spend-share meter + interactive legend rows
        const totalActual = rawLines.reduce((s, l) => s + l.actual, 0) || 1;
        this.lines = rawLines.map((l, i) => {
            const variance = l.actual - l.budget;
            const sharePct = Math.max(2, Math.round((l.actual / totalActual) * 100));
            const color = STATE_COLOR[l.state];
            return {
                key: `bl-${i}`,
                dept: l.dept,
                state: l.state,
                amountText: compact(l.actual),
                pctText: `${Math.round(l.pct)}%`,
                chipText: variance > 0 ? `${compact(variance)} over` : `${compact(Math.abs(variance))} left`,
                chipClass: `asa-ba-chip is-${l.state}`,
                varianceText: variance > 0 ? `${compact(variance)} over budget` : `${compact(Math.abs(variance))} remaining`,
                dotStyle: `background:${color};`,
                segStyle: `width:${sharePct}%;background:${color};`,
                expanded: false,
                rowClass: 'asa-ba-leg',
                caretClass: 'asa-ba-caret',
                isActionable: l.state === 'over' || l.state === 'warn',
                requested: false,
                actLabel: 'Investigate'
            };
        });
    }

    toggleLine(event) {
        const key = event.currentTarget.dataset.key;
        this.lines = this.lines.map((l) => l.key === key
            ? { ...l, expanded: !l.expanded, rowClass: `asa-ba-leg${!l.expanded ? ' is-open' : ''}`, caretClass: `asa-ba-caret${!l.expanded ? ' is-open' : ''}` }
            : l);
    }

    handleInvestigate(event) {
        event.stopPropagation();
        const key = event.currentTarget.dataset.key;
        const line = this.lines.find((l) => l.key === key);
        if (!line || line.requested) return;
        // Primary (Agentforce surface): feed the user_input tool via valuechange.
        this.dispatchEvent(new CustomEvent('valuechange', {
            detail: { value: { dept: line.dept, variance: line.varianceText, pct: line.pctText } }
        }));
        // Fallback (ECv2 web-messaging surface): post as a chat message.
        this.sendMessage(`Investigate budget variance: ${line.dept} — ${line.varianceText} (${line.pctText} of budget)`);
        this.lines = this.lines.map((l) => l.key === key ? { ...l, requested: true, actLabel: 'Requested ✓' } : l);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('EcwBudgetActual sent:', message))
                    .catch((err) => console.error('EcwBudgetActual send error:', err));
            } else {
                console.log('EcwBudgetActual: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('EcwBudgetActual sendMessage error:', err);
        }
    }

    get hasLines() { return this.lines.length > 0; }
    get hasColumns() { return this.columns.length > 0; }
}