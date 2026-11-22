/**
 * @description Lightning Type backing class for ASA Public Sector & Education · Documents Checklist.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Documents you'll need",
 *   "subtitle": "For your building permit application",
 *   "documents": [
 *     { "id": "id", "name": "Government-issued ID", "detail": "Driver's license or passport", "status": "received" }
 *   ],
 *   "submitText": "Upload selected",
 *   "submitValue": "I'd like to upload the selected documents"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaPseDocsChecklistData {

    @AuraEnabled
    global String pseDocsChecklistJSON;

    global AsaPseDocsChecklistData(String pseDocsChecklistJSON) {
        this.pseDocsChecklistJSON = pseDocsChecklistJSON;
    }

    global AsaPseDocsChecklistData() {
        this.pseDocsChecklistJSON = '';
    }
}
