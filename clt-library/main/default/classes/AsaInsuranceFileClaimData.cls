/**
 * @description Lightning Type backing class for ASA Insurance · File a Claim.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "What happened?",
 *   "policy": { "label": "Auto — 2022 Tesla Model 3", "policyNumber": "8842" },
 *   "incidentTypes": [
 *     { "id": "inc-collision", "label": "Collision", "description": "Accident with another vehicle", "icon": "collision" }
 *   ],
 *   "submitText": "Start claim"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaInsuranceFileClaimData {

    @AuraEnabled
    global String insuranceFileClaimJSON;

    global AsaInsuranceFileClaimData(String insuranceFileClaimJSON) {
        this.insuranceFileClaimJSON = insuranceFileClaimJSON;
    }

    global AsaInsuranceFileClaimData() {
        this.insuranceFileClaimJSON = '';
    }
}
