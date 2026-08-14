/**
 * @description Lightning Type backing class for ASA Insurance · Policy Selector.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Which policy can I help you with?",
 *   "mode": "single",
 *   "policies": [
 *     { "id": "pol-8842", "name": "Auto — 2022 Tesla Model 3", "type": "Auto",
 *       "policyNumber": "8842", "premium": 142.50, "cadence": "monthly",
 *       "currency": "USD", "renewalDate": "2026-11-01", "status": "Active",
 *       "coverage": "Collision + Comprehensive · $500 deductible", "badge": "Primary" }
 *   ],
 *   "submitText": "Continue"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaInsurancePolicySelectorData {

    @AuraEnabled
    global String insurancePolicySelectorJSON;

    global AsaInsurancePolicySelectorData(String insurancePolicySelectorJSON) {
        this.insurancePolicySelectorJSON = insurancePolicySelectorJSON;
    }

    global AsaInsurancePolicySelectorData() {
        this.insurancePolicySelectorJSON = '';
    }
}
