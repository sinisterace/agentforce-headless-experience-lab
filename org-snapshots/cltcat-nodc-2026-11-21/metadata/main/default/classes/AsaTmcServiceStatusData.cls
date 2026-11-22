/**
 * @description Lightning Type backing class for ASA Technology, Media & Comms · Service Status.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Service status",
 *   "overall": "degraded",
 *   "headline": "We're aware of an issue in your area",
 *   "area": "SoMa, San Francisco 94103",
 *   "etaText": "Est. restore by 4:30 PM",
 *   "updatedText": "Updated 2 min ago",
 *   "services": [
 *     { "id": "internet", "name": "Internet", "status": "down", "detail": "Fiber node offline", "icon": "internet" },
 *     { "id": "tv", "name": "TV", "status": "degraded", "detail": "Some channels affected", "icon": "tv" },
 *     { "id": "mobile", "name": "Mobile", "status": "operational", "icon": "mobile" },
 *     { "id": "voice", "name": "Home phone", "status": "operational", "icon": "voice" }
 *   ],
 *   "submitText": "Notify me when it's fixed",
 *   "submitValue": "Please text me when service is restored"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaTmcServiceStatusData {

    @AuraEnabled
    global String tmcServiceStatusJSON;

    global AsaTmcServiceStatusData(String tmcServiceStatusJSON) {
        this.tmcServiceStatusJSON = tmcServiceStatusJSON;
    }

    global AsaTmcServiceStatusData() {
        this.tmcServiceStatusJSON = '';
    }
}