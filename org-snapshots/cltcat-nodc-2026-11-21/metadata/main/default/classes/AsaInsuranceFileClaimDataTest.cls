/**
 * @description Coverage for AsaInsuranceFileClaimData — verifies the default
 * constructor yields an empty JSON string and the JSON constructor round-trips
 * its value unchanged.
 */
@IsTest
private class AsaInsuranceFileClaimDataTest {

    @IsTest
    static void defaultConstructorYieldsEmptyJson() {
        AsaInsuranceFileClaimData dto = new AsaInsuranceFileClaimData();
        System.assertEquals('', dto.insuranceFileClaimJSON, 'Default constructor should yield empty string');
    }

    @IsTest
    static void jsonConstructorRoundTripsValue() {
        String payload = '{"policy":{"label":"Auto","policyNumber":"8842"},"incidentTypes":[{"id":"inc-1","label":"Collision","icon":"collision"}]}';
        AsaInsuranceFileClaimData dto = new AsaInsuranceFileClaimData(payload);
        System.assertEquals(payload, dto.insuranceFileClaimJSON, 'JSON constructor should round-trip the value');
    }
}