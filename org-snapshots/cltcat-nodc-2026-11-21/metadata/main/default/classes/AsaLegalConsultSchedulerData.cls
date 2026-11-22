/**
 * @description Lightning Type backing class for ASA Legal · Consultation Scheduler.
 * Holds the scheduler payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Book your free consultation",
 *   "subtitle": "",
 *   "attorneyName": "Marcus Vale",
 *   "attorneyTitle": "Managing Partner - Personal Injury",
 *   "attorneyPhoto": "lawyer-1",
 *   "modes": [
 *     { "id": "in_person", "label": "In person", "icon": "in_person" },
 *     { "id": "phone", "label": "Phone", "icon": "phone" },
 *     { "id": "video", "label": "Video", "icon": "video" }
 *   ],
 *   "days": [
 *     { "id": "mon", "label": "Mon", "sublabel": "Aug 17",
 *       "slots": [ { "id": "m1", "label": "9:00 AM" }, { "id": "m2", "label": "11:30 AM" } ] }
 *   ],
 *   "note": "Free 30-minute consultation - no obligation",
 *   "submitText": "Confirm consultation",
 *   "submitValue": "I would like to book"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaLegalConsultSchedulerData {

    @AuraEnabled
    global String legalConsultSchedulerJSON;

    global AsaLegalConsultSchedulerData(String legalConsultSchedulerJSON) {
        this.legalConsultSchedulerJSON = legalConsultSchedulerJSON;
    }

    global AsaLegalConsultSchedulerData() {
        this.legalConsultSchedulerJSON = '';
    }
}