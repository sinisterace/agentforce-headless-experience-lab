/**
 * @description Lightning Type backing class for ASA Healthcare · Prescription Refill.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Refill prescriptions",
 *   "medications": [
 *     { "id": "m1", "name": "Atorvastatin", "dosage": "20 mg tablet",
 *       "supplyText": "3 days left", "status": "low", "refillsLeft": 2 }
 *   ],
 *   "pharmacy": { "name": "Walgreens · Market St", "address": "700 Market St", "hours": "Open until 10 PM" },
 *   "submitText": "Request refill"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaHealthcareRxRefillData {

    @AuraEnabled
    global String healthcareRxRefillJSON;

    global AsaHealthcareRxRefillData(String healthcareRxRefillJSON) {
        this.healthcareRxRefillJSON = healthcareRxRefillJSON;
    }

    global AsaHealthcareRxRefillData() {
        this.healthcareRxRefillJSON = '';
    }
}