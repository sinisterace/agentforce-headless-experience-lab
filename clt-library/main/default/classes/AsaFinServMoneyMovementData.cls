/**
 * @description Lightning Type backing class for ASA Financial Services · Money
 * Movement. Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Send money",
 *   "fromAccount": { "label": "Everyday Checking", "mask": "1234" },
 *   "recipients": [
 *     { "id": "rcp-1", "name": "Alex Rivera", "type": "person", "mask": "4821", "detail": "Checking" },
 *     { "id": "rcp-2", "name": "Rewards Card", "type": "card", "mask": "9012", "detail": "Credit Card" }
 *   ],
 *   "amountPresets": [
 *     { "id": "amt-1", "label": "$50", "amount": 50 },
 *     { "id": "amt-2", "label": "Minimum", "amount": 35 }
 *   ],
 *   "currency": "USD",
 *   "allowOther": true,
 *   "otherText": "Other amount",
 *   "submitText": "Continue"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaFinServMoneyMovementData {

    @AuraEnabled
    global String finServMoneyMovementJSON;

    global AsaFinServMoneyMovementData(String finServMoneyMovementJSON) {
        this.finServMoneyMovementJSON = finServMoneyMovementJSON;
    }

    global AsaFinServMoneyMovementData() {
        this.finServMoneyMovementJSON = '';
    }
}
