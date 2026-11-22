/**
 * @description Lightning Type backing class for an Agentforce Coworker · Finance CLT.
 * Holds the card payload as a single JSON string; the LWC parses it.
 */
@JsonAccess(serializable='always' deserializable='always')
global class EcwApApprovalsData {
    @AuraEnabled
    global String ecwApApprovalsJSON;
    global EcwApApprovalsData(String ecwApApprovalsJSON) { this.ecwApApprovalsJSON = ecwApApprovalsJSON; }
    global EcwApApprovalsData() { this.ecwApApprovalsJSON = ''; }
}