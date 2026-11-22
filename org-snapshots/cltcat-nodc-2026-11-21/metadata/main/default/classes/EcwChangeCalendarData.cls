/**
 * @description Lightning Type backing class for an Agentforce Coworker · IT CLT.
 * Holds the card payload as a single JSON string; the LWC parses it.
 */
@JsonAccess(serializable='always' deserializable='always')
global class EcwChangeCalendarData {

    @AuraEnabled
    global String ecwChangeCalendarJSON;

    global EcwChangeCalendarData(String ecwChangeCalendarJSON) {
        this.ecwChangeCalendarJSON = ecwChangeCalendarJSON;
    }

    global EcwChangeCalendarData() {
        this.ecwChangeCalendarJSON = '';
    }
}