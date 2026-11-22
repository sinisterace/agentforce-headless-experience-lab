/**
 * @description Lightning Type backing class for ASA Legal · Practice-Area Selector.
 * Holds the card payload as a single JSON string. The LWC parses it.
 *
 * JSON Format Expected (must match the LWC's parse logic AND the
 * genAiFunction input/schema.json description EXACTLY):
 * {
 *   "title": "How can we help?",
 *   "subtitle": "Tap an area to see how we can help - then start your conversation",
 *   "areas": [
 *     {
 *       "id": "injury",
 *       "name": "Personal Injury",
 *       "blurb": "Accidents, negligence & claims",
 *       "icon": "injury",
 *       "description": "We pursue full compensation for accident and negligence victims.",
 *       "services": ["Car & truck accidents", "Slip & fall"],
 *       "stat": "$50M+ recovered",
 *       "href": "/practice-areas/personal-injury"
 *     }
 *   ],
 *   "linkText": "Learn more",
 *   "submitText": "Get help with {name}",
 *   "submitValue": "I need help with"
 * }
 *
 * A single JSON-string field is deliberately used so one DTO/Flow shape serves
 * any card type in the ASA CLT catalogue.
 */
@JsonAccess(serializable='always' deserializable='always')
global class AsaLegalPracticeAreasData {

    @AuraEnabled
    global String legalPracticeAreasJSON;

    global AsaLegalPracticeAreasData(String legalPracticeAreasJSON) {
        this.legalPracticeAreasJSON = legalPracticeAreasJSON;
    }

    global AsaLegalPracticeAreasData() {
        this.legalPracticeAreasJSON = '';
    }
}
