/**
 * @description Lightning Type backing class for an Agentforce Coworker · HR CLT.
 * Holds the card payload as a single JSON string; the LWC parses it.
 */
@JsonAccess(serializable='always' deserializable='always')
global class EcwOpenRolesData {
    @AuraEnabled
    global String ecwOpenRolesJSON;
    global EcwOpenRolesData(String ecwOpenRolesJSON) { this.ecwOpenRolesJSON = ecwOpenRolesJSON; }
    global EcwOpenRolesData() { this.ecwOpenRolesJSON = ''; }
}