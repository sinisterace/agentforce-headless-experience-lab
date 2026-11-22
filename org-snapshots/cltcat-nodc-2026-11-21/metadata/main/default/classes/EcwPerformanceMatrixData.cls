/** Lightning Type backing class for Agentforce Coworker · Marketing · Performance matrix. Holds the card payload JSON; the LWC parses it. */
@JsonAccess(serializable='always' deserializable='always')
global class EcwPerformanceMatrixData {

    @AuraEnabled
    global String ecwPerformanceMatrixJSON;

    global EcwPerformanceMatrixData(String ecwPerformanceMatrixJSON) { this.ecwPerformanceMatrixJSON = ecwPerformanceMatrixJSON; }

    global EcwPerformanceMatrixData() { this.ecwPerformanceMatrixJSON = ''; }
}