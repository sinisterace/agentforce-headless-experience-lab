/**
 * @description Lightning Type backing class for an Agentforce Coworker · HR CLT.
 * Holds the card payload as a single JSON string; the LWC parses it.
 */
@JsonAccess(serializable='always' deserializable='always')
global class EcwTimeOffData {
    @AuraEnabled
    global String ecwTimeOffJSON;
    global EcwTimeOffData(String ecwTimeOffJSON) { this.ecwTimeOffJSON = ecwTimeOffJSON; }
    global EcwTimeOffData() { this.ecwTimeOffJSON = ''; }
}
