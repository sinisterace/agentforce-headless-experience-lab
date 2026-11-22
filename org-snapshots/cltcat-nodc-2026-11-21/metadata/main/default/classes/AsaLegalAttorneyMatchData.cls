/**
 * @description Lightning Type backing class for ASA Legal · Meet Your Attorney.
 * Holds the attorney-match payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Meet your attorney",
 *   "subtitle": "Matched to your matter - book a free consult",
 *   "attorneys": [
 *     { "id": "vale", "name": "Marcus Vale", "title": "Managing Partner",
 *       "focus": "Personal Injury & Litigation", "photo": "lawyer-1",
 *       "years": 22, "rating": 4.9, "casesWon": "500+ cases",
 *       "bar": "CA #148203", "blurb": "Trial-tested advocate..." }
 *   ],
 *   "submitText": "Book a consult",
 *   "submitValue": "I would like to book with"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaLegalAttorneyMatchData {

    @AuraEnabled
    global String legalAttorneyMatchJSON;

    global AsaLegalAttorneyMatchData(String legalAttorneyMatchJSON) {
        this.legalAttorneyMatchJSON = legalAttorneyMatchJSON;
    }

    global AsaLegalAttorneyMatchData() {
        this.legalAttorneyMatchJSON = '';
    }
}