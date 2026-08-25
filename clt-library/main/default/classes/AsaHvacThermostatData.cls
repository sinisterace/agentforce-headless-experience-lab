/**
 * @description Lightning Type backing class for ASA HVAC · Smart Thermostat Control.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Living room thermostat",
 *   "currentTemp": 71,
 *   "targetTemp": 72,
 *   "mode": "cool",
 *   "unit": "F",
 *   "humidity": 44,
 *   "statusText": "Cooling to 72°",
 *   "minTemp": 50,
 *   "maxTemp": 90,
 *   "presets": [
 *     { "id": "comfort", "label": "Comfort", "targetTemp": 72, "mode": "cool" }
 *   ],
 *   "submitText": "Set thermostat",
 *   "submitValue": "Set my thermostat"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaHvacThermostatData {

    @AuraEnabled
    global String hvacThermostatJSON;

    global AsaHvacThermostatData(String hvacThermostatJSON) {
        this.hvacThermostatJSON = hvacThermostatJSON;
    }

    global AsaHvacThermostatData() {
        this.hvacThermostatJSON = '';
    }
}
