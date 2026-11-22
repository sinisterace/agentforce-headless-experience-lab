/**
 * @description Lightning Type backing class for ASA HVAC · Comfort System Health Report.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Your comfort system checkup",
 *   "score": 82,
 *   "scoreLabel": "Good",
 *   "statusText": "One item needs attention soon",
 *   "updatedText": "Checked today",
 *   "systems": [
 *     { "label": "Furnace", "status": "good", "detail": "Operating normally", "icon": "furnace" }
 *   ],
 *   "filter": { "lifePct": 18, "daysLeft": 6, "label": "20×25×1 filter" },
 *   "nextServiceText": "Next maintenance due Nov 3",
 *   "recommendationText": "Book a tune-up to clean the AC coil before summer.",
 *   "submitText": "Book maintenance",
 *   "submitValue": "I'd like to book a maintenance visit"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaHvacSystemHealthData {

    @AuraEnabled
    global String hvacSystemHealthJSON;

    global AsaHvacSystemHealthData(String hvacSystemHealthJSON) {
        this.hvacSystemHealthJSON = hvacSystemHealthJSON;
    }

    global AsaHvacSystemHealthData() {
        this.hvacSystemHealthJSON = '';
    }
}
