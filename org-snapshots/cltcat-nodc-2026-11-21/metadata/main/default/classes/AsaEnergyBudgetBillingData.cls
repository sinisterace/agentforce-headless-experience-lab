/**
 * @description Lightning Type backing class for ASA Energy & Utilities · Budget Billing.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Smooth out your bill",
 *   "subtitle": "Budget Billing keeps your payment the same every month",
 *   "currency": "USD",
 *   "monthlyAmount": 118,
 *   "currentAvgText": "Your bills now swing $64–$210",
 *   "termText": "Recalculated every 12 months",
 *   "series": { "actual": [96,120,168,210,150,88,64,72,110,175,190,140], "budget": 118 },
 *   "bullets": [ "No surprises in peak season", "Cancel anytime" ],
 *   "submitText": "Enroll in Budget Billing",
 *   "submitValue": "Enroll me in Budget Billing",
 *   "secondaryText": "Maybe later",
 *   "secondaryValue": "I'd like to think about Budget Billing"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaEnergyBudgetBillingData {

    @AuraEnabled
    global String energyBudgetBillingJSON;

    global AsaEnergyBudgetBillingData(String energyBudgetBillingJSON) {
        this.energyBudgetBillingJSON = energyBudgetBillingJSON;
    }

    global AsaEnergyBudgetBillingData() {
        this.energyBudgetBillingJSON = '';
    }
}