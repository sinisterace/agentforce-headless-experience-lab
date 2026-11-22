/**
 * @description Lightning Type backing class for ASA Retail · Order Tracking.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Track order #4821",
 *   "live": true,
 *   "status": "out_for_delivery",
 *   "etaText": "Arriving 2:15–2:30 PM",
 *   "courier": { "name": "Alex Rivera", "vehicle": "bike", "initials": "AR", "rating": "4.9 ★" },
 *   "destination": { "label": "Home", "address": "150 4th St, San Francisco" },
 *   "submitText": "Message courier"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaRetailOrderTrackingData {

    @AuraEnabled
    global String retailOrderTrackingJSON;

    global AsaRetailOrderTrackingData(String retailOrderTrackingJSON) {
        this.retailOrderTrackingJSON = retailOrderTrackingJSON;
    }

    global AsaRetailOrderTrackingData() {
        this.retailOrderTrackingJSON = '';
    }
}