/**
 * @description Coverage for AsaInsuranceClaimStatusData — verifies the default
 * constructor yields an empty JSON string and the JSON constructor round-trips
 * its value unchanged.
 */
@IsTest
private class AsaInsuranceClaimStatusDataTest {

    @IsTest
    static void defaultConstructorYieldsEmptyJson() {
        AsaInsuranceClaimStatusData dto = new AsaInsuranceClaimStatusData();
        System.assertEquals('', dto.insuranceClaimStatusJSON, 'Default constructor should yield empty string');
    }

    @IsTest
    static void jsonConstructorRoundTripsValue() {
        String payload = '{"claims":[{"id":"clm-1","claimNumber":"CLM-1","status":"Review","steps":[{"label":"Submitted","state":"done"}]}]}';
        AsaInsuranceClaimStatusData dto = new AsaInsuranceClaimStatusData(payload);
        System.assertEquals(payload, dto.insuranceClaimStatusJSON, 'JSON constructor should round-trip the value');
    }
}