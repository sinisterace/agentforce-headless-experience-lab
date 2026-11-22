/** Lightning Type backing class for Agentforce Coworker · Marketing · Audience builder. Holds the card payload JSON; the LWC parses it. */
@JsonAccess(serializable='always' deserializable='always')
global class EcwAudienceExplorerData {

    @AuraEnabled
    global String ecwAudienceExplorerJSON;

    global EcwAudienceExplorerData(String ecwAudienceExplorerJSON) { this.ecwAudienceExplorerJSON = ecwAudienceExplorerJSON; }

    global EcwAudienceExplorerData() { this.ecwAudienceExplorerJSON = ''; }
}