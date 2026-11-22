/**
 * @description Lightning Type backing class for ASA Financial Services · Recent
 * Transactions. Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Your recent transactions",
 *   "accountLabel": "Everyday Checking ••1234",
 *   "transactions": [
 *     { "id": "txn-001", "merchant": "Whole Foods Market", "date": "2026-08-09",
 *       "amount": -84.23, "currency": "USD", "category": "Groceries",
 *       "status": "Posted", "disputable": true }
 *   ],
 *   "disputeText": "Dispute this charge"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaFinServTransactionsData {

    @AuraEnabled
    global String finServTransactionsJSON;

    global AsaFinServTransactionsData(String finServTransactionsJSON) {
        this.finServTransactionsJSON = finServTransactionsJSON;
    }

    global AsaFinServTransactionsData() {
        this.finServTransactionsJSON = '';
    }
}