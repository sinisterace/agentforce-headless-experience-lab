/**
 * @description Lightning Type backing class for ASA Travel · Digital Boarding Pass.
 * Holds the pass payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Boarding pass",
 *   "airline": "Aero Air",
 *   "passenger": "J. RIVERA",
 *   "from": "SFO",
 *   "fromCity": "San Francisco",
 *   "to": "JFK",
 *   "toCity": "New York",
 *   "flight": "AF128",
 *   "date": "Jul 12",
 *   "boardingTime": "10:05 AM",
 *   "departTime": "10:35 AM",
 *   "gate": "A12",
 *   "terminal": "2",
 *   "seat": "12A",
 *   "group": "B",
 *   "status": "Boarding",
 *   "submitText": "Add to wallet",
 *   "submitValue": "Add my boarding pass to my wallet",
 *   "secondaryText": "Email pass"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaTravelBoardingPassData {

    @AuraEnabled
    global String travelBoardingPassJSON;

    global AsaTravelBoardingPassData(String travelBoardingPassJSON) {
        this.travelBoardingPassJSON = travelBoardingPassJSON;
    }

    global AsaTravelBoardingPassData() {
        this.travelBoardingPassJSON = '';
    }
}
