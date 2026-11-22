/**
 * @description Agentforce Coworker · Finance · Month-end close renderer.
 * The month-end close checklist for the finance team: a hero % complete + progress
 * bar + close target, then each task with a status marker; tasks with a note
 * (in-progress / blocked) are click-to-expand. Each non-done task has a row action
 * ("Mark complete" / "Chase blocker") that sends the choice back to the agent.
 *
 * This component is dual-registered (ecwMonthEndClose.js-meta.xml):
 *  - lightning__AgentforceOutput (sourceType c__ecwMonthEndClose) — the read-only card.
 *  - lightning__AgentforceInput  (targetType  c__ecwMonthEndCloseInput) — the interactive
 *    editor. A row action dispatches the Agentforce `valuechange` CustomEvent with
 *    { taskAction, task, note } (matching Apex c__EcwMonthEndCloseInput), consumed by the
 *    agent's user_input tool. embeddedservice_configuration.util.sendTextMessage(...) is
 *    kept as a fallback for the ECv2 web-messaging surface.
 *
 * Contract: field names below MUST match genAiFunctions/ecwMonthEndClose_Output_e4f6/input/schema.json.
 * Fields: headline?, pct (number), targetText?, tasks[]{ name, state (done|in_progress|blocked|todo), note? }.
 */
import { LightningElement, api, track } from 'lwc';

const MARK = {
    done: { cls: 'is-done', label: '✓' },
    in_progress: { cls: 'is-progress', label: '●' },
    blocked: { cls: 'is-blocked', label: '!' },
    todo: { cls: 'is-todo', label: '' }
};

function num(v) { const n = Number(v); return isFinite(n) ? n : 0; }

// NEVER-BLANK GUARANTEE: themed close checklist (seed-stable).
const TEST_DATA = {
    headline: '6 of 11 tasks complete', pct: 55, targetText: 'Close target: Business Day 5',
    tasks: [
        { name: 'Bank reconciliations', state: 'done' },
        { name: 'Accruals & prepaids', state: 'done' },
        { name: 'Accounts payable cutoff', state: 'done' },
        { name: 'AR & revenue recognition', state: 'in_progress', note: '2 contracts pending review' },
        { name: 'Fixed assets & depreciation', state: 'in_progress' },
        { name: 'Intercompany eliminations', state: 'blocked', note: 'Awaiting FX rates from Treasury' },
        { name: 'Payroll & commissions accrual', state: 'done' },
        { name: 'Expense accruals', state: 'done' },
        { name: 'Flux / variance analysis', state: 'todo' },
        { name: 'Management reporting pack', state: 'todo' },
        { name: 'Final review & sign-off', state: 'todo' }
    ]
};

export default class EcwMonthEndClose extends LightningElement {
    @api value;

    @track pctText = '';
    @track barStyle = 'width:0%;';
    @track headline = '';
    @track targetText = '';
    @track tasks = [];

    isTestMode = false;

    connectedCallback() { if (!this.tryLoadFromFlow()) this.initializeFromData({}); }

    tryLoadFromFlow() {
        try {
            if (this.value && this.value.ecwMonthEndCloseJSON) {
                const data = JSON.parse(this.value.ecwMonthEndCloseJSON);
                if (data && typeof data === 'object' && Array.isArray(data.tasks)) { this.initializeFromData(data); return true; }
            }
        } catch (e) { console.error('EcwMonthEndClose parse error:', e.message); }
        return false;
    }

    initializeFromData(data) {
        const raw = data || {};
        const hasContent = Array.isArray(raw.tasks) && raw.tasks.length > 0;
        this.isTestMode = !hasContent;
        const src = this.isTestMode ? TEST_DATA : raw;

        const pct = Math.max(0, Math.min(100, Math.round(num(src.pct))));
        this.pctText = `${pct}%`;
        this.barStyle = `width:${pct}%;`;
        this.headline = src.headline ? String(src.headline).trim() : '';
        this.targetText = src.targetText ? String(src.targetText).trim() : '';

        this.tasks = (Array.isArray(src.tasks) ? src.tasks : []).filter((t) => t && t.name).map((t, i) => {
            const state = ['done', 'in_progress', 'blocked', 'todo'].includes(t.state) ? t.state : 'todo';
            const mark = MARK[state];
            const note = t.note ? String(t.note).trim() : '';
            const isChase = state === 'blocked';
            return {
                key: `t-${i}`,
                name: String(t.name).trim(),
                markClass: `ecw-mc-mark ${mark.cls}`,
                markLabel: mark.label,
                nameClass: state === 'done' ? 'ecw-mc-name is-done' : 'ecw-mc-name',
                note: note,
                hasNote: !!note,
                expanded: false,
                rowClass: note ? 'ecw-mc-row is-clickable' : 'ecw-mc-row',
                caretClass: note ? 'ecw-mc-caret' : 'ecw-mc-caret is-hidden',
                // Row action: done tasks have none; blocked → chase, else → mark complete.
                showAction: state !== 'done',
                isChase,
                actClass: isChase ? 'ecw-mc-act is-chase' : 'ecw-mc-act',
                actLabel: isChase ? 'Chase blocker' : 'Mark complete',
                actDisabled: false,
                requested: false
            };
        });
    }

    handleAction(event) {
        event.stopPropagation();
        const key = event.currentTarget.dataset.key;
        const task = this.tasks.find((t) => t.key === key);
        if (!task || task.requested) return;
        const taskAction = task.isChase ? 'chase' : 'complete';
        const message = task.isChase
            ? `Chase blocker on month-end task: ${task.name}${task.note ? ' — ' + task.note : ''}`
            : `Mark month-end task complete: ${task.name}`;
        // Primary (Agentforce surface): feed the user_input tool via valuechange.
        this.dispatchEvent(new CustomEvent('valuechange', {
            detail: { value: { taskAction, task: task.name, note: task.note || '' } }
        }));
        // Fallback (ECv2 web-messaging surface): post as a chat message.
        this.sendMessage(message);
        this.tasks = this.tasks.map((t) => t.key === key
            ? { ...t, requested: true, actDisabled: true, actLabel: 'Requested ✓' }
            : t);
    }

    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('EcwMonthEndClose sent:', message))
                    .catch((err) => console.error('EcwMonthEndClose send error:', err));
            } else {
                console.log('EcwMonthEndClose: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('EcwMonthEndClose sendMessage error:', err);
        }
    }

    toggleTask(event) {
        const key = event.currentTarget.dataset.key;
        this.tasks = this.tasks.map((t) => t.key === key && t.hasNote ? { ...t, expanded: !t.expanded, caretClass: `ecw-mc-caret${!t.expanded ? ' is-open' : ''}` } : t);
    }

    get hasTasks() { return this.tasks.length > 0; }
}
