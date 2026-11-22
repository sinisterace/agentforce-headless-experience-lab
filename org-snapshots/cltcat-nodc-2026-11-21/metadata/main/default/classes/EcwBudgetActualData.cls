/**
 * @description Lightning Type backing class for an Agentforce Coworker · Finance CLT.
 * Holds the card payload as a single JSON string; the LWC parses it.
 */
@JsonAccess(serializable='always' deserializable='always')
global class EcwBudgetActualData {
    @AuraEnabled
    global String ecwBudgetActualJSON;
    global EcwBudgetActualData(String ecwBudgetActualJSON) { this.ecwBudgetActualJSON = ecwBudgetActualJSON; }
    global EcwBudgetActualData() { this.ecwBudgetActualJSON = ''; }
}