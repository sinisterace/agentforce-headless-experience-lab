/**
 * @description Lightning Type backing class for ASA Public Sector & Education ·
 * Programs & Benefits Finder. Holds the card payload as a single JSON string.
 * The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Programs & benefits you may qualify for",
 *   "subtitle": "Based on what you've told us",
 *   "programs": [
 *     { "id": "snap", "name": "Food assistance (SNAP)", "category": "assistance",
 *       "detail": "Monthly grocery benefits", "eligibility": "Likely eligible",
 *       "badge": "Popular" }
 *   ],
 *   "submitText": "Apply for selected",
 *   "submitValue": "I'd like to apply for the selected program"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaPseProgramsFinderData {

    @AuraEnabled
    global String pseProgramsFinderJSON;

    global AsaPseProgramsFinderData(String pseProgramsFinderJSON) {
        this.pseProgramsFinderJSON = pseProgramsFinderJSON;
    }

    global AsaPseProgramsFinderData() {
        this.pseProgramsFinderJSON = '';
    }
}