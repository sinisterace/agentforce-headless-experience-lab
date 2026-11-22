/**
 * @description Lightning Type backing class for ASA Retail · Returns & Exchange.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Start a return",
 *   "subtitle": "Choose what you'd like to send back",
 *   "orderLabel": "Order #4821 · Mar 2",
 *   "items": [
 *     { "id": "i1", "name": "Trailblazer Running Shoe", "sku": "TR3-BLK-10",
 *       "variant": "Size 10 · Black", "price": 128, "category": "shoes" }
 *   ],
 *   "reasons": [
 *     { "id": "too_small", "label": "Too small" }
 *   ],
 *   "resolutions": [
 *     { "id": "refund", "kind": "refund", "label": "Refund", "description": "Back to original payment" }
 *   ]
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaRetailReturnsData {

    @AuraEnabled
    global String retailReturnsJSON;

    global AsaRetailReturnsData(String retailReturnsJSON) {
        this.retailReturnsJSON = retailReturnsJSON;
    }

    global AsaRetailReturnsData() {
        this.retailReturnsJSON = '';
    }
}
