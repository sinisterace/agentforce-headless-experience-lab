/**
 * @description Lightning Type backing class for ASA Healthcare · Care Options.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "How would you like to get care?",
 *   "options": [
 *     { "id": "o1", "channel": "video", "label": "Video visit",
 *       "description": "See a provider by video in ~15 min", "meta": "$0 with your plan",
 *       "actionType": "link", "actionValue": "https://...", "recommended": true }
 *   ],
 *   "disclaimer": "If this is an emergency, call 911.",
 *   "submitText": "Continue"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaHealthcareCareOptionsData {

    @AuraEnabled
    global String healthcareCareOptionsJSON;

    global AsaHealthcareCareOptionsData(String healthcareCareOptionsJSON) {
        this.healthcareCareOptionsJSON = healthcareCareOptionsJSON;
    }

    global AsaHealthcareCareOptionsData() {
        this.healthcareCareOptionsJSON = '';
    }
}