/**
 * @description Lightning Type backing class for ASA HVAC · Technician ETA Tracker.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Your technician is on the way",
 *   "status": "enroute",
 *   "headline": "Marcus is heading to your home",
 *   "etaText": "Arriving in ~15 min",
 *   "windowText": "Arrival window 1:00–3:00 PM",
 *   "updatedText": "Updated 1 min ago",
 *   "technician": { "name": "Marcus Reed", "role": "Senior HVAC Technician",
 *     "rating": 4.9, "photoUrl": "", "initials": "MR", "skills": "AC repair · Heat pumps" },
 *   "job": { "number": "WO-48213", "type": "AC not cooling", "address": "128 Maple Ave" },
 *   "steps": [ { "label": "Scheduled", "state": "done", "timeText": "9:00 AM" } ],
 *   "submitText": "Message technician",
 *   "submitValue": "I'd like to message my technician",
 *   "secondaryText": "Reschedule visit",
 *   "secondaryValue": "I'd like to reschedule my service visit"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaHvacTechTrackerData {

    @AuraEnabled
    global String hvacTechTrackerJSON;

    global AsaHvacTechTrackerData(String hvacTechTrackerJSON) {
        this.hvacTechTrackerJSON = hvacTechTrackerJSON;
    }

    global AsaHvacTechTrackerData() {
        this.hvacTechTrackerJSON = '';
    }
}