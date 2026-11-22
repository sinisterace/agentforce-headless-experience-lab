/**
 * @description Lightning Type backing class for ASA Manufacturing · Work Order Tracker.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Work order WO-4821",
 *   "orderNumber": "WO-4821",
 *   "product": "Trailblazer Assembly Cell · 2 units",
 *   "priority": "high",
 *   "etaText": "Est. ship Oct 2",
 *   "updatedText": "Updated 1h ago",
 *   "milestones": [
 *     { "label": "Order received", "state": "done", "timeText": "Sep 18", "owner": "Intake" },
 *     { "label": "Machining", "state": "done", "timeText": "Sep 22", "owner": "Cell A" },
 *     { "label": "Assembly", "state": "current", "timeText": "In progress", "owner": "Bay 4" },
 *     { "label": "Quality check", "state": "todo" },
 *     { "label": "Ready to ship", "state": "todo" }
 *   ],
 *   "submitText": "Message production team",
 *   "submitValue": "I have a question about work order WO-4821"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaMfgWorkOrderData {

    @AuraEnabled
    global String mfgWorkOrderJSON;

    global AsaMfgWorkOrderData(String mfgWorkOrderJSON) {
        this.mfgWorkOrderJSON = mfgWorkOrderJSON;
    }

    global AsaMfgWorkOrderData() {
        this.mfgWorkOrderJSON = '';
    }
}
