@isTest
private class EcwCampaignFunnelTest {
    @isTest static void returnsPayload() {
        EcwCampaignFunnel.Request req = new EcwCampaignFunnel.Request(); req.details = '';
        List<EcwCampaignFunnel.Response> out = EcwCampaignFunnel.run(new List<EcwCampaignFunnel.Request>{ req });
        System.assertEquals(1, out.size());
        String payload = out[0].json;
        System.assert(String.isNotBlank(payload));
        System.assertNotEquals(null, JSON.deserializeUntyped(payload));
    }
    @isTest static void wrapper() {
        System.assertEquals('x', new EcwCampaignFunnelData('x').ecwCampaignFunnelJSON);
        System.assertEquals('', new EcwCampaignFunnelData().ecwCampaignFunnelJSON);
    }
}
