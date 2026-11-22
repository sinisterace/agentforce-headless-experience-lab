/**
 * @description Lightning Type backing class for ASA Financial Services · Advisor
 * Appointment. Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Book time with your advisor",
 *   "advisor": {
 *     "name": "Jordan Lee",
 *     "title": "Senior Financial Advisor",
 *     "specialty": "Retirement planning",
 *     "photoUrl": "https://.../jordan.jpg",
 *     "initials": "JL"
 *   },
 *   "days": [
 *     { "date": "2026-08-14",
 *       "slots": [
 *         { "id": "slot-1", "time": "09:00", "meetingType": "video" },
 *         { "id": "slot-2", "time": "13:00", "meetingType": "in-branch" }
 *       ] }
 *   ],
 *   "submitText": "Book appointment"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaFinServAdvisorMeetingData {

    @AuraEnabled
    global String finServAdvisorMeetingJSON;

    global AsaFinServAdvisorMeetingData(String finServAdvisorMeetingJSON) {
        this.finServAdvisorMeetingJSON = finServAdvisorMeetingJSON;
    }

    global AsaFinServAdvisorMeetingData() {
        this.finServAdvisorMeetingJSON = '';
    }
}
