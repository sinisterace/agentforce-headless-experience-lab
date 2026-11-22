/**
 * @description Lightning Type backing class for Agentforce Coworker · Sales · What changed.
 * Holds the card payload as a single JSON string; the LWC parses it.
 *
 * JSON shape (see genAiFunctions/ecwWhatChanged_Output_d4e6/input/schema.json):
 * { "netText", "summaryText",
 *   "items": [{ "label", "deal", "detail", "amount" (number), "when",
 *               "state" (good|info|warn|bad) }] }
 */
@JsonAccess(serializable='always' deserializable='always')
global class EcwWhatChangedData {

    @AuraEnabled
    global String ecwWhatChangedJSON;

    global EcwWhatChangedData(String ecwWhatChangedJSON) {
        this.ecwWhatChangedJSON = ecwWhatChangedJSON;
    }

    global EcwWhatChangedData() {
        this.ecwWhatChangedJSON = '';
    }
}