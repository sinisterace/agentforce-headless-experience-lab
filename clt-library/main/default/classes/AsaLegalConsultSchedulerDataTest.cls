/**
 * @description Coverage for AsaLegalConsultSchedulerData (the CLT DTO for the
 * ASA Legal · Consultation Scheduler renderer).
 */
@isTest
private class AsaLegalConsultSchedulerDataTest {
    @isTest
    static void constructsWithPayload() {
        String json = '{"attorneyName":"Marcus Vale","days":[{"id":"mon","label":"Mon","slots":[{"id":"m1","label":"9:00 AM"}]}]}';
        AsaLegalConsultSchedulerData dto = new AsaLegalConsultSchedulerData(json);
        System.assertEquals(json, dto.legalConsultSchedulerJSON, 'payload should round-trip');
    }

    @isTest
    static void constructsEmpty() {
        AsaLegalConsultSchedulerData dto = new AsaLegalConsultSchedulerData();
        System.assertEquals('', dto.legalConsultSchedulerJSON, 'no-arg ctor defaults to empty string');
    }
}
