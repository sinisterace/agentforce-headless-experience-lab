/**
 * @description Lightning Type backing class for Agentforce Coworker · Service · Case 360.
 * Holds the card payload as a single JSON string; the LWC parses it.
 *
 * JSON shape (see genAiFunctions/ecwCase360_Output_f6a8/input/schema.json):
 * { "caseNumber", "subject", "account", "contact",
 *   "facts": [{ "label", "value", "state" (bad|warn|good, optional) }] }
 */
@JsonAccess(serializable='always' deserializable='always')
global class EcwCase360Data {

    @AuraEnabled
    global String ecwCase360JSON;

    global EcwCase360Data(String ecwCase360JSON) {
        this.ecwCase360JSON = ecwCase360JSON;
    }

    global EcwCase360Data() {
        this.ecwCase360JSON = '';
    }
}