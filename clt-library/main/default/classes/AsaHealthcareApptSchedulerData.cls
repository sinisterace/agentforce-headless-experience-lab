/**
 * @description Lightning Type backing class for ASA Healthcare · Appointment Scheduler.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Book a visit",
 *   "provider": { "name": "Dr. Maya Chen", "specialty": "Primary Care", "initials": "MC" },
 *   "location": { "name": "Downtown Health Center", "address": "500 Market St" },
 *   "days": [
 *     { "date": "2026-08-14", "slots": [
 *       { "id": "s1", "time": "09:00", "visitType": "in-person" }
 *     ] }
 *   ],
 *   "submitText": "Confirm appointment"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaHealthcareApptSchedulerData {

    @AuraEnabled
    global String healthcareApptSchedulerJSON;

    global AsaHealthcareApptSchedulerData(String healthcareApptSchedulerJSON) {
        this.healthcareApptSchedulerJSON = healthcareApptSchedulerJSON;
    }

    global AsaHealthcareApptSchedulerData() {
        this.healthcareApptSchedulerJSON = '';
    }
}
