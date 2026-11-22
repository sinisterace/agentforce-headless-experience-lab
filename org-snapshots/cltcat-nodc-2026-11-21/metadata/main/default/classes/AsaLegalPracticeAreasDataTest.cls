/**
 * @description Coverage for AsaLegalPracticeAreasData (the CLT DTO for the
 * ASA Legal · Practice-Area Selector renderer).
 */
@isTest
private class AsaLegalPracticeAreasDataTest {
    @isTest
    static void constructsWithPayload() {
        String json = '{"title":"How can we help?","areas":[{"id":"injury","name":"Personal Injury"}]}';
        AsaLegalPracticeAreasData dto = new AsaLegalPracticeAreasData(json);
        System.assertEquals(json, dto.legalPracticeAreasJSON, 'payload should round-trip');
    }

    @isTest
    static void constructsEmpty() {
        AsaLegalPracticeAreasData dto = new AsaLegalPracticeAreasData();
        System.assertEquals('', dto.legalPracticeAreasJSON, 'no-arg ctor defaults to empty string');
    }
}