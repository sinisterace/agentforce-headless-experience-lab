/**
 * @description Lightning Type backing class for Agentforce Coworker · IT · System status.
 * Holds the card payload as a single JSON string; the LWC parses it.
 *
 * JSON shape (see genAiFunctions/ecwSystemStatus_Output_c1d2/input/schema.json):
 * { "overall" (operational|degraded|down), "headline",
 *   "services": [{ "name", "state" (operational|degraded|down), "note" }] }
 */
@JsonAccess(serializable='always' deserializable='always')
global class EcwSystemStatusData {

    @AuraEnabled
    global String ecwSystemStatusJSON;

    global EcwSystemStatusData(String ecwSystemStatusJSON) {
        this.ecwSystemStatusJSON = ecwSystemStatusJSON;
    }

    global EcwSystemStatusData() {
        this.ecwSystemStatusJSON = '';
    }
}
