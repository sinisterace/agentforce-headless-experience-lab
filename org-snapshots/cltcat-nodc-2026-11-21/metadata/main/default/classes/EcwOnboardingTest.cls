@IsTest
private class EcwOnboardingTest {
    @IsTest
    static void returnsPayload() {
        List<EcwOnboarding.Response> out = EcwOnboarding.getOnboarding(new List<EcwOnboarding.Request>{ new EcwOnboarding.Request() });
        System.assertEquals(1, out.size());
        System.assert(String.isNotBlank(out[0].json), 'payload should not be blank');
        System.assert(out[0].json.contains('"hires"'), 'payload should carry "hires"');
    }
}