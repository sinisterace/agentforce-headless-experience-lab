/**
 * @description Lightning Type backing class for ASA Manufacturing · Quote Builder.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY) — a cart / quote review:
 * {
 *   "title": "Quote",
 *   "cartId": "QT-00042",
 *   "statusLabel": "Draft quote",
 *   "shipTo": "Rivera Robotics · Plant 2",
 *   "shipToId": "#PL-2-0192",
 *   "billTo": "Rivera Manufacturing, Inc.",
 *   "currency": "USD",
 *   "lineItems": [
 *     { "id": "frame", "itemNumber": "TB-9000-FRM", "description": "Assembly cell frame, powder-coated steel", "uom": "EA", "unitPrice": 4800, "quantity": 2 },
 *     { "id": "plc", "itemNumber": "PLC-ADV-24", "description": "Advanced PLC + HMI control package", "uom": "EA", "unitPrice": 5400, "quantity": 1 }
 *   ],
 *   "poLabel": "Purchase Order #",
 *   "poPlaceholder": "Enter PO number…",
 *   "acknowledgeText": "I acknowledge that pricing is an estimate pending a formal quote and confirm the configuration is correct.",
 *   "secondaryText": "Save & close",
 *   "submitText": "Request quote",
 *   "submitValue": "Request a formal quote for this configured order"
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