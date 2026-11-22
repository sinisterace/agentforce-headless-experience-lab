/**
 * @description Lightning Type backing class for ASA Technology, Media & Comms · Plan Comparison.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Compare plans",
 *   "subtitle": "Pick the plan that fits you",
 *   "currency": "USD",
 *   "cadence": "mo",
 *   "currentPlanId": "essential",
 *   "plans": [
 *     { "id": "essential", "name": "Essential", "price": 45, "tagline": "For light users",
 *       "features": ["10 GB data", "5G nationwide", "SD streaming"] },
 *     { "id": "unlimited", "name": "Unlimited Plus", "price": 70, "tagline": "Our most popular",
 *       "badge": "Most popular", "recommended": true,
 *       "features": ["Unlimited data", "HD streaming", "50 GB hotspot", "5G Ultra"] }
 *   ],
 *   "submitText": "Switch plan"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaTmcPlanCompareData {

    @AuraEnabled
    global String tmcPlanCompareJSON;

    global AsaTmcPlanCompareData(String tmcPlanCompareJSON) {
        this.tmcPlanCompareJSON = tmcPlanCompareJSON;
    }

    global AsaTmcPlanCompareData() {
        this.tmcPlanCompareJSON = '';
    }
}
