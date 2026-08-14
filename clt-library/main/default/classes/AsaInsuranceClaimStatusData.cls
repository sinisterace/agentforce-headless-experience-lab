/**
 * @description Lightning Type backing class for ASA Insurance · Claim Status Tracker.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Your claims",
 *   "claims": [
 *     { "id": "clm-4471", "claimNumber": "CLM-4471", "type": "Collision",
 *       "policyLabel": "Auto — 2022 Tesla Model 3", "filedDate": "2026-07-28",
 *       "amount": 3200.00, "currency": "USD", "status": "Review",
 *       "statusLabel": "In review", "updatedDate": "2026-08-05",
 *       "nextActionText": "Upload the repair estimate",
 *       "steps": [ { "label": "Submitted", "state": "done" },
 *                  { "label": "Review", "state": "current" },
 *                  { "label": "Approved", "state": "upcoming" },
 *                  { "label": "Paid", "state": "upcoming" } ] }
 *   ],
 *   "submitText": "Ask about a claim"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaInsuranceClaimStatusData {

    @AuraEnabled
    global String insuranceClaimStatusJSON;

    global AsaInsuranceClaimStatusData(String insuranceClaimStatusJSON) {
        this.insuranceClaimStatusJSON = insuranceClaimStatusJSON;
    }

    global AsaInsuranceClaimStatusData() {
        this.insuranceClaimStatusJSON = '';
    }
}
