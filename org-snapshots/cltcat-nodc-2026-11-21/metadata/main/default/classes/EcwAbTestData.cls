/** Lightning Type backing class for Agentforce Coworker · Marketing · A/B test. Holds the card payload JSON; the LWC parses it. */
@JsonAccess(serializable='always' deserializable='always')
global class EcwAbTestData {

    @AuraEnabled
    global String ecwAbTestJSON;

    global EcwAbTestData(String ecwAbTestJSON) { this.ecwAbTestJSON = ecwAbTestJSON; }

    global EcwAbTestData() { this.ecwAbTestJSON = ''; }
}