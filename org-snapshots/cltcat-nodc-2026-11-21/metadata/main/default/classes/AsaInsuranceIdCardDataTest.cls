/**
 * @description Coverage for AsaInsuranceIdCardData (the CLT DTO for the
 * ASA Insurance · Digital ID Card renderer).
 */
@isTest
private class AsaInsuranceIdCardDataTest {
    @isTest
    static void constructsWithPayload() {
        String json = '{"carrier":"Meridian Mutual","policyNumber":"AUTO-8842-XY"}';
        AsaInsuranceIdCardData dto = new AsaInsuranceIdCardData(json);
        System.assertEquals(json, dto.insuranceIdCardJSON, 'payload should round-trip');
    }

    @isTest
    static void constructsEmpty() {
        AsaInsuranceIdCardData dto = new AsaInsuranceIdCardData();
        System.assertEquals('', dto.insuranceIdCardJSON, 'no-arg ctor defaults to empty string');
    }
}