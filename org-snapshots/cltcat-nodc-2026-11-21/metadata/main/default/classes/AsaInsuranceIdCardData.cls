/**
 * @description Lightning Type backing class for ASA Insurance · Digital ID Card.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Proof of insurance",
 *   "carrier": "Meridian Mutual",
 *   "policyType": "Auto",
 *   "policyholder": "Jordan Rivera",
 *   "policyNumber": "AUTO-8842-XY",
 *   "vehicle": "2022 Tesla Model 3",
 *   "plate": "8ABC123",
 *   "effectiveDate": "Jan 1, 2026",
 *   "expirationDate": "Jul 1, 2026",
 *   "status": "Active",
 *   "coverages": [ { "label": "Liability" }, { "label": "Collision", "detail": "$500 ded." } ],
 *   "submitText": "Email me a copy",
 *   "submitValue": "Email me a copy of my insurance ID card",
 *   "secondaryText": "Add to wallet"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaInsuranceIdCardData {

    @AuraEnabled
    global String insuranceIdCardJSON;

    global AsaInsuranceIdCardData(String insuranceIdCardJSON) {
        this.insuranceIdCardJSON = insuranceIdCardJSON;
    }

    global AsaInsuranceIdCardData() {
        this.insuranceIdCardJSON = '';
    }
}