/**
 * @description Lightning Type backing class for ASA HVAC · Service Plan Selector.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Choose a comfort plan",
 *   "subtitle": "Annual maintenance memberships that keep your system running",
 *   "currency": "USD",
 *   "cadence": "yr",
 *   "currentPlanId": "basic",
 *   "plans": [
 *     { "id": "plus", "name": "Comfort Plus", "price": 249, "tagline": "Most popular",
 *       "badge": "Most popular", "recommended": true,
 *       "features": ["2 tune-ups (heating + cooling)", "15% off repairs"] }
 *   ],
 *   "submitText": "Enroll in plan"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaHvacServicePlanData {

    @AuraEnabled
    global String hvacServicePlanJSON;

    global AsaHvacServicePlanData(String hvacServicePlanJSON) {
        this.hvacServicePlanJSON = hvacServicePlanJSON;
    }

    global AsaHvacServicePlanData() {
        this.hvacServicePlanJSON = '';
    }
}
