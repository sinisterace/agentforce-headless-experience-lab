/**
 * @description Lightning Type backing class for ASA Financial Services · Account Selector.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Which account can I help you with?",
 *   "mode": "single",
 *   "accounts": [
 *     { "id": "chk-1234", "name": "Everyday Checking", "type": "Checking",
 *       "mask": "1234", "balance": 4820.55, "currency": "USD",
 *       "available": 9257.82, "badge": "Primary" }
 *   ],
 *   "submitText": "Continue"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaFinServAccountSelectorData {

    @AuraEnabled
    global String finServAccountSelectorJSON;

    global AsaFinServAccountSelectorData(String finServAccountSelectorJSON) {
        this.finServAccountSelectorJSON = finServAccountSelectorJSON;
    }

    global AsaFinServAccountSelectorData() {
        this.finServAccountSelectorJSON = '';
    }
}