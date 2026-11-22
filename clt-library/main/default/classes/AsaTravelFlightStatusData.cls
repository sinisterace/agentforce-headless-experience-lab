/**
 * @description Lightning Type backing class for ASA Travel · Flight Status Tracker.
 * Holds the flight-status payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Flight AF128",
 *   "status": "in_air",
 *   "statusLabel": "In air",
 *   "origin": { "code": "SFO", "city": "San Francisco", "time": "10:35 AM", "gate": "A12", "terminal": "2" },
 *   "dest": { "code": "JFK", "city": "New York", "time": "7:05 PM", "terminal": "4", "baggage": "Belt 6" },
 *   "progressPct": 62,
 *   "aircraft": "Airbus A321neo",
 *   "durationText": "5h 30m",
 *   "updatedText": "Live · updated just now",
 *   "submitText": "Get gate updates",
 *   "submitValue": "Send me gate and delay updates for flight AF128"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaTravelFlightStatusData {

    @AuraEnabled
    global String travelFlightStatusJSON;

    global AsaTravelFlightStatusData(String travelFlightStatusJSON) {
        this.travelFlightStatusJSON = travelFlightStatusJSON;
    }

    global AsaTravelFlightStatusData() {
        this.travelFlightStatusJSON = '';
    }
}
