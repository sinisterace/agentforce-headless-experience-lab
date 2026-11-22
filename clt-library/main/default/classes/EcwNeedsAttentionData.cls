/**
 * @description Lightning Type backing class for Agentforce Coworker · Sales · Needs attention.
 * Holds the card payload as a single JSON string; the LWC parses it. A single
 * JSON-string field keeps one DTO/Flow shape serving the whole CLT catalogue.
 *
 * JSON shape (see genAiFunctions/ecwNeedsAttention_Output_b2c4/input/schema.json):
 * { "atRiskTotal" (number), "count" (number),
 *   "items": [{ "name", "account", "stage", "amount" (number), "flag", "state" (bad|warn) }] }
 */
@JsonAccess(serializable='always' deserializable='always')
global class EcwNeedsAttentionData {

    @AuraEnabled
    global String ecwNeedsAttentionJSON;

    global EcwNeedsAttentionData(String ecwNeedsAttentionJSON) {
        this.ecwNeedsAttentionJSON = ecwNeedsAttentionJSON;
    }

    global EcwNeedsAttentionData() {
        this.ecwNeedsAttentionJSON = '';
    }
}
