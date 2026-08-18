/**
 * @description Lightning Type backing class for ASA Manufacturing · Quote Builder.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Configure your quote",
 *   "product": "TB-9000 Assembly Cell",
 *   "currency": "USD",
 *   "basePrice": 48000,
 *   "optionGroups": [
 *     { "id": "material", "label": "Frame material", "selectedId": "steel",
 *       "options": [ { "id": "steel", "label": "Powder-coated steel", "priceDelta": 0 },
 *                    { "id": "stainless", "label": "Stainless 304", "priceDelta": 3200, "detail": "Washdown-rated" } ] },
 *     { "id": "controls", "label": "Control package",
 *       "options": [ { "id": "standard", "label": "Standard PLC", "priceDelta": 0 },
 *                    { "id": "advanced", "label": "Advanced PLC + HMI", "priceDelta": 5400 } ] }
 *   ],
 *   "quantity": 1,
 *   "submitText": "Request quote",
 *   "submitValue": "Request a formal quote for the configured TB-9000 Assembly Cell"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaMfgQuoteBuilderData {

    @AuraEnabled
    global String mfgQuoteBuilderJSON;

    global AsaMfgQuoteBuilderData(String mfgQuoteBuilderJSON) {
        this.mfgQuoteBuilderJSON = mfgQuoteBuilderJSON;
    }

    global AsaMfgQuoteBuilderData() {
        this.mfgQuoteBuilderJSON = '';
    }
}
