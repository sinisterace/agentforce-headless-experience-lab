/**
 * @description Lightning Type backing class for ASA Technology, Media & Comms · Bill Explainer.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Your September bill",
 *   "currency": "USD",
 *   "total": 118.4,
 *   "dueDateText": "Due Sep 28",
 *   "periodText": "Sep 1 – Sep 30",
 *   "items": [
 *     { "id": "plan", "label": "Unlimited Plus plan", "amount": 70, "category": "plan" },
 *     { "id": "device", "label": "iPhone installment", "amount": 27.08, "category": "device" },
 *     { "id": "stream", "label": "Streaming add-on", "amount": 9.99, "category": "streaming" },
 *     { "id": "taxes", "label": "Taxes & fees", "amount": 11.33, "category": "taxes" }
 *   ],
 *   "deltaAmount": 12.4,
 *   "deltaText": "You added the Streaming add-on this cycle.",
 *   "note": "Autopay is on. This amount will be charged automatically.",
 *   "submitText": "Pay now",
 *   "submitValue": "I'd like to pay my bill now",
 *   "secondaryText": "Set up autopay",
 *   "secondaryValue": "Help me set up autopay"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaTmcBillExplainerData {

    @AuraEnabled
    global String tmcBillExplainerJSON;

    global AsaTmcBillExplainerData(String tmcBillExplainerJSON) {
        this.tmcBillExplainerJSON = tmcBillExplainerJSON;
    }

    global AsaTmcBillExplainerData() {
        this.tmcBillExplainerJSON = '';
    }
}
