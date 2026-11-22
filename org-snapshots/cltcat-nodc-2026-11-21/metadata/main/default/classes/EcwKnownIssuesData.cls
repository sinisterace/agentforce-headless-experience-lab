/**
 * @description Lightning Type backing class for an Agentforce Coworker · IT CLT.
 * Holds the card payload as a single JSON string; the LWC parses it.
 */
@JsonAccess(serializable='always' deserializable='always')
global class EcwKnownIssuesData {

    @AuraEnabled
    global String ecwKnownIssuesJSON;

    global EcwKnownIssuesData(String ecwKnownIssuesJSON) {
        this.ecwKnownIssuesJSON = ecwKnownIssuesJSON;
    }

    global EcwKnownIssuesData() {
        this.ecwKnownIssuesJSON = '';
    }
}