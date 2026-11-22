/**
 * @description Coverage for AsaLegalAttorneyMatchData (the CLT DTO for the
 * ASA Legal · Meet Your Attorney renderer).
 */
@isTest
private class AsaLegalAttorneyMatchDataTest {
    @isTest
    static void constructsWithPayload() {
        String json = '{"title":"Meet your attorney","attorneys":[{"id":"vale","name":"Marcus Vale"}]}';
        AsaLegalAttorneyMatchData dto = new AsaLegalAttorneyMatchData(json);
        System.assertEquals(json, dto.legalAttorneyMatchJSON, 'payload should round-trip');
    }

    @isTest
    static void constructsEmpty() {
        AsaLegalAttorneyMatchData dto = new AsaLegalAttorneyMatchData();
        System.assertEquals('', dto.legalAttorneyMatchJSON, 'no-arg ctor defaults to empty string');
    }
}