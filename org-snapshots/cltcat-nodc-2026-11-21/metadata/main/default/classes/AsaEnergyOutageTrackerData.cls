/**
 * @description Lightning Type backing class for ASA Energy & Utilities · Outage Tracker.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Outage status",
 *   "status": "restoring",
 *   "headline": "Crews are on site restoring power",
 *   "area": "Maple Grove · ZIP 55311",
 *   "cause": "Storm — downed line",
 *   "affectedText": "1,240 customers affected",
 *   "etaText": "Est. restore by 6:45 PM",
 *   "updatedText": "Updated 4 min ago",
 *   "crew": "Crew #17 on site",
 *   "steps": [ { "label": "Outage detected", "state": "done", "timeText": "3:02 PM" } ],
 *   "submitText": "Text me when power is back",
 *   "submitValue": "Please text me when power is restored"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaEnergyOutageTrackerData {

    @AuraEnabled
    global String energyOutageTrackerJSON;

    global AsaEnergyOutageTrackerData(String energyOutageTrackerJSON) {
        this.energyOutageTrackerJSON = energyOutageTrackerJSON;
    }

    global AsaEnergyOutageTrackerData() {
        this.energyOutageTrackerJSON = '';
    }
}