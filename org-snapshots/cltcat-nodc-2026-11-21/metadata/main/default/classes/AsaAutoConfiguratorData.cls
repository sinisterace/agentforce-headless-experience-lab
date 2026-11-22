/**
 * @description Lightning Type backing class for ASA Automotive · Vehicle Configurator.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Build your Trailblazer EV",
 *   "model": "Trailblazer EV",
 *   "currency": "USD",
 *   "basePrice": 41990,
 *   "colors": [ { "id": "red", "label": "Radiant Red", "hex": "#dc2626", "priceDelta": 595, "selected": true } ],
 *   "optionGroups": [ { "id": "trim", "label": "Trim", "selectedId": "rs",
 *       "options": [ { "id": "rs", "label": "RS", "priceDelta": 3200, "detail": "Sport-tuned" } ] } ],
 *   "submitText": "Reserve this build",
 *   "submitValue": "I'd like to reserve this configuration"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaAutoConfiguratorData {

    @AuraEnabled
    global String autoConfiguratorJSON;

    global AsaAutoConfiguratorData(String autoConfiguratorJSON) {
        this.autoConfiguratorJSON = autoConfiguratorJSON;
    }

    global AsaAutoConfiguratorData() {
        this.autoConfiguratorJSON = '';
    }
}