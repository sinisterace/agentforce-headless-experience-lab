/**
 * @description Lightning Type backing class for Agentforce Coworker · Sales · My pipeline.
 * Holds the card payload as a single JSON string; the LWC parses it. A single
 * JSON-string field keeps one DTO/Flow shape serving the whole CLT catalogue.
 *
 * JSON shape (see genAiFunctions/ecwSalesPipeline_Output_a1f7/input/schema.json):
 * { "title", "periodLabel", "updatedText", "currency",
 *   "openTotal" (number), "deltaPct" (number), "deltaText",
 *   "stages": [{ "label", "amount" (number) }],
 *   "stats":  [{ "label", "value", "state" (good|warn|bad, optional) }],
 *   "submitText", "submitValue" }
 */
@JsonAccess(serializable='always' deserializable='always')
global class EcwSalesPipelineData {

    @AuraEnabled
    global String ecwSalesPipelineJSON;

    global EcwSalesPipelineData(String ecwSalesPipelineJSON) {
        this.ecwSalesPipelineJSON = ecwSalesPipelineJSON;
    }

    global EcwSalesPipelineData() {
        this.ecwSalesPipelineJSON = '';
    }
}
