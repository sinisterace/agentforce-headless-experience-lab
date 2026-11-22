/**
 * @description Lightning Type backing class for ASA Healthcare · Find Care Near You.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Care near you",
 *   "facilities": [
 *     { "id": "f1", "name": "GoHealth Urgent Care – SoMa", "type": "urgent_care",
 *       "distance": "0.3 mi", "openNow": true, "hours": "Open until 8:00 PM",
 *       "waitTime": "15 min wait", "address": "876 Folsom St, San Francisco",
 *       "phone": "+14155550142", "services": ["X-ray","Labs"],
 *       "mapsUrl": "https://www.google.com/maps/dir/?api=1&destination=..." }
 *   ],
 *   "submitText": "Get directions"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaHealthcareFindCareData {

    @AuraEnabled
    global String healthcareFindCareJSON;

    global AsaHealthcareFindCareData(String healthcareFindCareJSON) {
        this.healthcareFindCareJSON = healthcareFindCareJSON;
    }

    global AsaHealthcareFindCareData() {
        this.healthcareFindCareJSON = '';
    }
}
