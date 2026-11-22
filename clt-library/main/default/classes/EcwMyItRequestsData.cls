/**
 * @description Lightning Type backing class for an Agentforce Coworker · IT CLT.
 * Holds the card payload as a single JSON string; the LWC parses it.
 */
@JsonAccess(serializable='always' deserializable='always')
global class EcwMyItRequestsData {

    @AuraEnabled
    global String ecwMyItRequestsJSON;

    global EcwMyItRequestsData(String ecwMyItRequestsJSON) {
        this.ecwMyItRequestsJSON = ecwMyItRequestsJSON;
    }

    global EcwMyItRequestsData() {
        this.ecwMyItRequestsJSON = '';
    }
}
