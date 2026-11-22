/**
 * @description Lightning Type backing class for ASA Energy & Utilities · Rebate Offers.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Rebates you qualify for",
 *   "subtitle": "Save on energy-efficient upgrades",
 *   "currency": "USD",
 *   "offers": [
 *     { "id": "thermostat", "name": "Smart thermostat", "category": "thermostat",
 *       "rebateAmount": 75, "detail": "ENERGY STAR models", "badge": "Popular" }
 *   ],
 *   "submitText": "Apply for rebate",
 *   "submitValue": "Apply for the rebate"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaEnergyRebateOffersData {

    @AuraEnabled
    global String energyRebateOffersJSON;

    global AsaEnergyRebateOffersData(String energyRebateOffersJSON) {
        this.energyRebateOffersJSON = energyRebateOffersJSON;
    }

    global AsaEnergyRebateOffersData() {
        this.energyRebateOffersJSON = '';
    }
}