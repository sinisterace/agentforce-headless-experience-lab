/**
 * @description Coverage for AsaLegalCaseEvaluationData (the CLT DTO for the
 * ASA Legal · Free Case Evaluation renderer).
 */
@isTest
private class AsaLegalCaseEvaluationDataTest {
    @isTest
    static void constructsWithPayload() {
        String json = '{"title":"Free case review","matter":"Personal Injury","questions":[{"id":"when","label":"When did this happen?"}]}';
        AsaLegalCaseEvaluationData dto = new AsaLegalCaseEvaluationData(json);
        System.assertEquals(json, dto.legalCaseEvaluationJSON, 'payload should round-trip');
    }

    @isTest
    static void constructsEmpty() {
        AsaLegalCaseEvaluationData dto = new AsaLegalCaseEvaluationData();
        System.assertEquals('', dto.legalCaseEvaluationJSON, 'no-arg ctor defaults to empty string');
    }
}