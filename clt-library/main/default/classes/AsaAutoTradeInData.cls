/**
 * @description Lightning Type backing class for ASA Automotive · Trade-In Estimator.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Your trade-in estimate",
 *   "vehicle": { "name": "2021 Trailblazer LT", "detail": "42,300 mi · Good condition", "imageUrl": "", "initials": "TB" },
 *   "currency": "USD",
 *   "estimate": 18400,
 *   "low": 16900,
 *   "high": 19800,
 *   "offerText": "Instant offer good for 7 days",
 *   "factors": [
 *     { "label": "Mileage", "detail": "42,300 mi — below average", "impact": "positive" }
 *   ],
 *   "submitText": "Apply to a purchase",
 *   "submitValue": "I'd like to apply my trade-in toward a purchase",
 *   "secondaryText": "Book an appraisal",
 *   "secondaryValue": "I'd like to book an in-person appraisal"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaAutoTradeInData {

    @AuraEnabled
    global String autoTradeInJSON;

    global AsaAutoTradeInData(String autoTradeInJSON) {
        this.autoTradeInJSON = autoTradeInJSON;
    }

    global AsaAutoTradeInData() {
        this.autoTradeInJSON = '';
    }
}
