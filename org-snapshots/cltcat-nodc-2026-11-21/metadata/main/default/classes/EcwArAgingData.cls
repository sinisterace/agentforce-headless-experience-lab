/**
 * @description Lightning Type backing class for an Agentforce Coworker · Finance CLT.
 * Holds the card payload as a single JSON string; the LWC parses it.
 */
@JsonAccess(serializable='always' deserializable='always')
global class EcwArAgingData {
    @AuraEnabled
    global String ecwArAgingJSON;
    global EcwArAgingData(String ecwArAgingJSON) { this.ecwArAgingJSON = ecwArAgingJSON; }
    global EcwArAgingData() { this.ecwArAgingJSON = ''; }
}