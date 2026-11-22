/**
 * @description Lightning Type backing class for Agentforce Coworker · Employee of the Month.
 * Holds the card payload as a single JSON string; the LWC parses it. A single
 * JSON-string field keeps one DTO/Flow shape serving the whole CLT catalogue.
 *
 * JSON shape (see genAiFunctions/ecwEmployeeOfMonth_Output_eom1/input/schema.json):
 * { "name", "title", "reason",
 *   "stats":  [{ "label", "value" }],
 *   "badges": [ "..." ],
 *   "congratulateText", "congratulateCount" (number),
 *   "nomineeText" }
 */
@JsonAccess(serializable='always' deserializable='always')
global class EcwEmployeeOfMonthData {

    @AuraEnabled
    global String ecwEmployeeOfMonthJSON;

    global EcwEmployeeOfMonthData(String ecwEmployeeOfMonthJSON) {
        this.ecwEmployeeOfMonthJSON = ecwEmployeeOfMonthJSON;
    }

    global EcwEmployeeOfMonthData() {
        this.ecwEmployeeOfMonthJSON = '';
    }
}
