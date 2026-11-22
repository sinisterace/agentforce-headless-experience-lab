/**
 * @description Coverage for AsaTravelBoardingPassData (the CLT DTO for the
 * ASA Travel · Digital Boarding Pass renderer).
 */
@isTest
private class AsaTravelBoardingPassDataTest {
    @isTest
    static void constructsWithPayload() {
        String json = '{"airline":"Aero Air","flight":"AF128","from":"SFO","to":"JFK"}';
        AsaTravelBoardingPassData dto = new AsaTravelBoardingPassData(json);
        System.assertEquals(json, dto.travelBoardingPassJSON, 'payload should round-trip');
    }

    @isTest
    static void constructsEmpty() {
        AsaTravelBoardingPassData dto = new AsaTravelBoardingPassData();
        System.assertEquals('', dto.travelBoardingPassJSON, 'no-arg ctor defaults to empty string');
    }
}
