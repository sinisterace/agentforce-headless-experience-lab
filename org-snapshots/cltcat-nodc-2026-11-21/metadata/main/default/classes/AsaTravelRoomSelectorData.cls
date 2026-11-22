/**
 * @description Lightning Type backing class for ASA Travel · Room Selector.
 * Holds the room-selector payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Choose your room",
 *   "subtitle": "The Shoreline Resort · Jul 12-15 · 2 guests",
 *   "currency": "USD",
 *   "rooms": [
 *     { "id": "r1", "name": "Ocean View King", "bed": "1 King bed", "size": "420 sq ft", "sleeps": 2, "amenities": ["Ocean view","Balcony","Free WiFi"], "price": 389, "cadence": "night", "badge": "Best value" },
 *     { "id": "r2", "name": "Garden Double Queen", "bed": "2 Queen beds", "size": "480 sq ft", "sleeps": 4, "amenities": ["Garden view","Free WiFi","Mini bar"], "price": 329, "cadence": "night" },
 *     { "id": "r3", "name": "Beachfront Suite", "bed": "1 King + sofa bed", "size": "720 sq ft", "sleeps": 3, "amenities": ["Beachfront","Living room","Soaking tub"], "price": 612, "cadence": "night", "badge": "Only 2 left" }
 *   ],
 *   "submitText": "Reserve",
 *   "submitValue": "I would like to reserve this room"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaTravelRoomSelectorData {

    @AuraEnabled
    global String travelRoomSelectorJSON;

    global AsaTravelRoomSelectorData(String travelRoomSelectorJSON) {
        this.travelRoomSelectorJSON = travelRoomSelectorJSON;
    }

    global AsaTravelRoomSelectorData() {
        this.travelRoomSelectorJSON = '';
    }
}