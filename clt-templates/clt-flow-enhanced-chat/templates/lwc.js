/**
 * @description <Human Readable Card Title> renderer.
 * Receives the DTO from the Flow output via Lightning Type, parses the JSON
 * payload, and renders the card. Sends the user's choice back to the agent
 * through embeddedservice_configuration.util.sendTextMessage(...).
 *
 * Contract: the field names read from the parsed payload below MUST match the
 * example JSON + rules in genAiFunctions/<Fn>/input/schema.json. If they drift,
 * the planner emits fields the card ignores and the card silently misbehaves.
 */
import { LightningElement, api, track } from 'lwc';

// PORTABILITY: this component carries NO org-specific or business data. All
// real content arrives at runtime in `value.<jsonField>` (the agent fills it
// per the input schema), so it runs unchanged in any org. The fallback below
// is generic sample data (not tied to your org) that renders when no payload
// is present — a populated card is friendlier than a blank one.
//
// NEVER-BLANK GUARANTEE: FALLBACK_DATA is a plain JS object (no JSON.parse, so
// it cannot fail). If the Flow payload is missing or malformed, the card still
// renders this. Keep <field1>/<field2> populated with sensible sample values.
const FALLBACK_DATA = {
    <field1>: 'Example heading',
    <field2>: ['Option A', 'Option B']
};

export default class <PascalName> extends LightningElement {
    @api value; // Receives the <DtoClass> object from the Lightning Type.

    @track title = '';
    // TODO: add @track state fields for THIS card type (items, slots, seats, etc.)
    @track errorMessage = '';

    connectedCallback() {
        if (this.tryLoadFromFlow()) return;
        this.loadFallback();
    }

    // Render from this.value.<jsonField>. Return true on success.
    tryLoadFromFlow() {
        try {
            if (this.value && this.value.<jsonField>) {
                const data = JSON.parse(this.value.<jsonField>);
                if (this.isUsable(data)) {
                    this.initializeFromData(data);
                    return true;
                }
            }
        } catch (e) {
            console.error('<PascalName> parse error:', e.message);
        }
        return false;
    }

    // No usable payload from the Flow — render generic sample data so the card
    // is NEVER blank (same result in any org). FALLBACK_DATA is a literal
    // object, so there is nothing that can fail here.
    loadFallback() {
        this.initializeFromData(FALLBACK_DATA);
    }

    // Minimum shape needed to render. Adjust per card type.
    isUsable(data) {
        return data && typeof data === 'object';
    }

    // Hydrate component state. Be forgiving — default every field.
    initializeFromData(data) {
        this.errorMessage = '';
        this.title = data.<field1> || '';
        // TODO: read the rest of THIS card's fields from `data` here.
    }

    // Send the user's selection back to the agent as a chat message.
    sendMessage(message) {
        try {
            if (typeof embeddedservice_configuration !== 'undefined'
                && embeddedservice_configuration.util
                && embeddedservice_configuration.util.sendTextMessage) {
                embeddedservice_configuration.util.sendTextMessage(message)
                    .then(() => console.log('<PascalName> sent:', message))
                    .catch((err) => console.error('<PascalName> send error:', err));
            } else {
                console.log('<PascalName>: embeddedservice_configuration unavailable. Would send:', message);
            }
        } catch (err) {
            console.error('<PascalName> sendMessage error:', err);
        }
    }
}
