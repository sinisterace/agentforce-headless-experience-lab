/**
 * @description Lightning Type backing class for ASA Public Sector & Education ·
 * Application Status Tracker. Holds the card payload as a single JSON string.
 * The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Your application status",
 *   "applicationType": "Building permit",
 *   "referenceNumber": "APP-2026-1043",
 *   "status": "review",
 *   "statusLabel": "Under review",
 *   "submittedText": "Submitted Sep 3",
 *   "updatedText": "Updated 2 days ago",
 *   "steps": [ { "label": "Submitted", "state": "done", "timeText": "Sep 3" } ],
 *   "nextActionText": "We may request additional documents.",
 *   "submitText": "Message the office",
 *   "submitValue": "I'd like to message the office about my application"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaPseAppStatusData {

    @AuraEnabled
    global String pseAppStatusJSON;

    global AsaPseAppStatusData(String pseAppStatusJSON) {
        this.pseAppStatusJSON = pseAppStatusJSON;
    }

    global AsaPseAppStatusData() {
        this.pseAppStatusJSON = '';
    }
}