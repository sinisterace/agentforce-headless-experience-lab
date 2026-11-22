/**
 * @description Lightning Type backing class for an Agentforce Coworker · Finance CLT.
 * Holds the card payload as a single JSON string; the LWC parses it.
 */
@JsonAccess(serializable='always' deserializable='always')
global class EcwMonthEndCloseData {
    @AuraEnabled
    global String ecwMonthEndCloseJSON;
    global EcwMonthEndCloseData(String ecwMonthEndCloseJSON) { this.ecwMonthEndCloseJSON = ecwMonthEndCloseJSON; }
    global EcwMonthEndCloseData() { this.ecwMonthEndCloseJSON = ''; }
}