/**
 * @description Lightning Type backing class for an Agentforce Coworker · HR CLT.
 * Holds the card payload as a single JSON string; the LWC parses it.
 */
@JsonAccess(serializable='always' deserializable='always')
global class EcwOnboardingData {
    @AuraEnabled
    global String ecwOnboardingJSON;
    global EcwOnboardingData(String ecwOnboardingJSON) { this.ecwOnboardingJSON = ecwOnboardingJSON; }
    global EcwOnboardingData() { this.ecwOnboardingJSON = ''; }
}
