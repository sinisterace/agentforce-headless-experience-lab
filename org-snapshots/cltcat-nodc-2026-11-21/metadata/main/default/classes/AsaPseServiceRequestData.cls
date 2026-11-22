/**
 * @description Lightning Type backing class for ASA Public Sector & Education · Service Request.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Report a problem",
 *   "subtitle": "Choose what you'd like to report",
 *   "locationText": "Near 123 Main St",
 *   "requestTypes": [
 *     { "id": "pothole", "label": "Pothole / road", "description": "Damaged road or pavement", "icon": "road" }
 *   ],
 *   "submitText": "Start report",
 *   "submitValue": "I'd like to report a"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaPseServiceRequestData {

    @AuraEnabled
    global String pseServiceRequestJSON;

    global AsaPseServiceRequestData(String pseServiceRequestJSON) {
        this.pseServiceRequestJSON = pseServiceRequestJSON;
    }

    global AsaPseServiceRequestData() {
        this.pseServiceRequestJSON = '';
    }
}