/**
 * @description Lightning Type backing class for ASA Travel · Seat Map.
 * Holds the seat-map payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Choose your seat",
 *   "flight": "SFO to JFK · Flight AF128",
 *   "columns": ["A","B","C","D","E","F"],
 *   "aisleAfter": "C",
 *   "currency": "USD",
 *   "seats": [ { "id": "14A", "row": 14, "col": "A", "status": "open", "kind": "exit", "price": 30 } ],
 *   "submitText": "Select seat",
 *   "submitValue": "I would like to select this seat"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaTravelSeatMapData {

    @AuraEnabled
    global String travelSeatMapJSON;

    global AsaTravelSeatMapData(String travelSeatMapJSON) {
        this.travelSeatMapJSON = travelSeatMapJSON;
    }

    global AsaTravelSeatMapData() {
        this.travelSeatMapJSON = '';
    }
}
