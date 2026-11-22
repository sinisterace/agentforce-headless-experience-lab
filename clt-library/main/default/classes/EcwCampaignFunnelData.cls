/** Lightning Type backing class for Agentforce Coworker · Marketing · Campaign conversion. Holds the card payload JSON; the LWC parses it. */
@JsonAccess(serializable='always' deserializable='always')
global class EcwCampaignFunnelData {

    @AuraEnabled
    global String ecwCampaignFunnelJSON;

    global EcwCampaignFunnelData(String ecwCampaignFunnelJSON) { this.ecwCampaignFunnelJSON = ecwCampaignFunnelJSON; }

    global EcwCampaignFunnelData() { this.ecwCampaignFunnelJSON = ''; }
}
