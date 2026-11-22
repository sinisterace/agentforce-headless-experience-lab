/**
 * @description Lightning Type backing class for ASA Manufacturing · Part Reorder.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Reorder part",
 *   "part": {
 *     "name": "Industrial I/O Controller", "sku": "IOC-4820-DIN", "category": "controller",
 *     "imageUrl": "/resource/asaMfgIoController", "unitPrice": 486, "currency": "USD",
 *     "leadTime": "Ships in 3–5 business days", "inStock": 142, "minOrder": 1, "incrementStep": 1
 *   },
 *   "quantity": 2,
 *   "submitText": "Reorder",
 *   "submitValue": "Reorder"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaMfgPartReorderData {

    @AuraEnabled
    global String mfgPartReorderJSON;

    global AsaMfgPartReorderData(String mfgPartReorderJSON) {
        this.mfgPartReorderJSON = mfgPartReorderJSON;
    }

    global AsaMfgPartReorderData() {
        this.mfgPartReorderJSON = '';
    }
}
