/**
 * @description Lightning Type backing class for ASA Automotive · Test Drive Scheduler.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Book a test drive",
 *   "vehicle": { "name": "Trailblazer EV RS", "trim": "AWD · Radiant Red", "imageUrl": "", "initials": "TB" },
 *   "location": { "name": "Trailblazer Motors – Downtown", "address": "500 Market St, San Francisco" },
 *   "days": [
 *     { "date": "2026-09-02", "slots": [ { "id": "a", "time": "10:00", "driveType": "showroom" } ] }
 *   ],
 *   "submitText": "Book test drive"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaAutoTestDriveData {

    @AuraEnabled
    global String autoTestDriveJSON;

    global AsaAutoTestDriveData(String autoTestDriveJSON) {
        this.autoTestDriveJSON = autoTestDriveJSON;
    }

    global AsaAutoTestDriveData() {
        this.autoTestDriveJSON = '';
    }
}
