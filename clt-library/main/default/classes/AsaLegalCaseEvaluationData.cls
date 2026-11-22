/**
 * @description Lightning Type backing class for ASA Legal · Free Case Evaluation.
 * Holds the guided intake payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "Free case review",
 *   "subtitle": "Tell us a little and we'll assess your options",
 *   "matter": "Personal Injury",
 *   "questions": [
 *     { "id": "when", "label": "When did this happen?", "type": "choice",
 *       "options": ["Past week", "Past month", "1-6 months ago", "Over 6 months ago"] },
 *     { "id": "injured", "label": "Was anyone injured?", "type": "choice", "options": ["Yes", "No", "Not sure"] }
 *   ],
 *   "describeLabel": "Briefly describe your situation",
 *   "describePlaceholder": "Share what happened, in your own words.",
 *   "consentText": "I agree to the Privacy Policy and Terms of Use.",
 *   "disclaimer": "Submitting this form does not create an attorney-client relationship.",
 *   "footerNote": "An attorney will review your request and respond within 1 business day.",
 *   "submitText": "Request my free review",
 *   "submitValue": "I would like a free case review"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaLegalCaseEvaluationData {

    @AuraEnabled
    global String legalCaseEvaluationJSON;

    global AsaLegalCaseEvaluationData(String legalCaseEvaluationJSON) {
        this.legalCaseEvaluationJSON = legalCaseEvaluationJSON;
    }

    global AsaLegalCaseEvaluationData() {
        this.legalCaseEvaluationJSON = '';
    }
}
