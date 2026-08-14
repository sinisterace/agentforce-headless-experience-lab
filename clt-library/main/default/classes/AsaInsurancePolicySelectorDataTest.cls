/**
 * @description Coverage for AsaInsurancePolicySelectorData — verifies the default
 * constructor yields an empty JSON string and the JSON constructor round-trips
 * its value unchanged.
 */
@IsTest
private class AsaInsurancePolicySelectorDataTest {

    @IsTest
    static void defaultConstructorYieldsEmptyJson() {
        AsaInsurancePolicySelectorData dto = new AsaInsurancePolicySelectorData();
        System.assertEquals('', dto.insurancePolicySelectorJSON, 'Default constructor should yield empty string');
    }

    @IsTest
    static void jsonConstructorRoundTripsValue() {
        String payload = '{"mode":"single","policies":[{"id":"pol-1","name":"Auto","type":"Auto","policyNumber":"8842","premium":142.50,"status":"Active"}]}';
        AsaInsurancePolicySelectorData dto = new AsaInsurancePolicySelectorData(payload);
        System.assertEquals(payload, dto.insurancePolicySelectorJSON, 'JSON constructor should round-trip the value');
    }
}
