/**
 * @description Lightning Type backing class for ASA Energy & Utilities · Usage & Cost.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Your energy this cycle",
 *   "cycleText": "Sep 1–30 · 8 days left",
 *   "projectedCost": 142.5,
 *   "currency": "USD",
 *   "projectedText": "Projected bill",
 *   "usedUnits": 612,
 *   "unit": "kWh",
 *   "deltaPct": -8,
 *   "deltaText": "less than last month",
 *   "bars": [ { "label": "Wk1", "value": 158 } ],
 *   "breakdown": [ { "label": "Heating & cooling", "amount": 74.2, "color": "#d97706" } ],
 *   "submitText": "See ways to save",
 *   "submitValue": "Show me ways to lower my energy bill"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaEnergyUsageCostData {

    @AuraEnabled
    global String energyUsageCostJSON;

    global AsaEnergyUsageCostData(String energyUsageCostJSON) {
        this.energyUsageCostJSON = energyUsageCostJSON;
    }

    global AsaEnergyUsageCostData() {
        this.energyUsageCostJSON = '';
    }
}
