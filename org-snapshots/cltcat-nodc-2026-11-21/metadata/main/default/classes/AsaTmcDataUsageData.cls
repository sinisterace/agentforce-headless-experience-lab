/**
 * @description Lightning Type backing class for ASA Technology, Media & Comms · Data Usage Meter.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Your data this cycle",
 *   "cycleText": "12 days left · resets Sep 30",
 *   "used": 42.1,
 *   "total": 50,
 *   "unit": "GB",
 *   "categories": [
 *     { "label": "Streaming", "amount": 24.6, "color": "#0891b2" },
 *     { "label": "Social", "amount": 9.8 },
 *     { "label": "Other", "amount": 7.7 }
 *   ],
 *   "note": "You're on track to stay under your limit.",
 *   "submitText": "Add a data pass",
 *   "submitValue": "I'd like to add a data pass to my plan"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaTmcDataUsageData {

    @AuraEnabled
    global String tmcDataUsageJSON;

    global AsaTmcDataUsageData(String tmcDataUsageJSON) {
        this.tmcDataUsageJSON = tmcDataUsageJSON;
    }

    global AsaTmcDataUsageData() {
        this.tmcDataUsageJSON = '';
    }
}