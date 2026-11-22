/**
 * @description Lightning Type backing class for Agentforce Coworker · Service · CSAT pulse.
 * Holds the card payload as a single JSON string; the LWC parses it.
 *
 * JSON shape (see genAiFunctions/ecwCsatPulse_Output_b8c0/input/schema.json):
 * { "score", "scoreMax", "label", "deltaText", "deltaState" (good|bad),
 *   "trend": [number...], "comments": [{ "text", "who", "state" (good|bad) }] }
 */
@JsonAccess(serializable='always' deserializable='always')
global class EcwCsatPulseData {

    @AuraEnabled
    global String ecwCsatPulseJSON;

    global EcwCsatPulseData(String ecwCsatPulseJSON) {
        this.ecwCsatPulseJSON = ecwCsatPulseJSON;
    }

    global EcwCsatPulseData() {
        this.ecwCsatPulseJSON = '';
    }
}