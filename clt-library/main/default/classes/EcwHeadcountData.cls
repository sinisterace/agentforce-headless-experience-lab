/**
 * @description Lightning Type backing class for an Agentforce Coworker · HR CLT.
 * Holds the card payload as a single JSON string; the LWC parses it.
 */
@JsonAccess(serializable='always' deserializable='always')
global class EcwHeadcountData {
    @AuraEnabled
    global String ecwHeadcountJSON;
    global EcwHeadcountData(String ecwHeadcountJSON) { this.ecwHeadcountJSON = ecwHeadcountJSON; }
    global EcwHeadcountData() { this.ecwHeadcountJSON = ''; }
}
