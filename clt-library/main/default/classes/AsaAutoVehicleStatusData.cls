/**
 * @description Lightning Type backing class for ASA Automotive · Connected Car Status.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Your vehicle",
 *   "vehicle": { "name": "Trailblazer EV", "trim": "RS AWD", "imageUrl": "", "initials": "TB" },
 *   "isElectric": true,
 *   "range": { "value": 248, "total": 312, "unit": "mi" },
 *   "battery": 78,
 *   "odometer": 18452, "odometerUnit": "mi",
 *   "tires": [ { "pos": "FL", "psi": 34, "status": "good" } ],
 *   "items": [ { "label": "Next service", "value": "in 1,200 mi", "status": "good" } ],
 *   "alerts": [ "Rear-left tire pressure is low (28 psi)" ],
 *   "updatedText": "Updated 3 min ago",
 *   "submitText": "Schedule service",
 *   "submitValue": "I'd like to schedule service for my vehicle"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaAutoVehicleStatusData {

    @AuraEnabled
    global String autoVehicleStatusJSON;

    global AsaAutoVehicleStatusData(String autoVehicleStatusJSON) {
        this.autoVehicleStatusJSON = autoVehicleStatusJSON;
    }

    global AsaAutoVehicleStatusData() {
        this.autoVehicleStatusJSON = '';
    }
}
