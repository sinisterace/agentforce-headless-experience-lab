/**
 * @description Coverage for AsaFinServAdvisorMeetingData — verifies the default
 * constructor yields an empty JSON string and the JSON constructor round-trips
 * its value unchanged.
 */
@IsTest
private class AsaFinServAdvisorMeetingDataTest {

    @IsTest
    static void defaultConstructorYieldsEmptyJson() {
        AsaFinServAdvisorMeetingData dto = new AsaFinServAdvisorMeetingData();
        System.assertEquals('', dto.finServAdvisorMeetingJSON, 'Default constructor should yield empty string');
    }

    @IsTest
    static void jsonConstructorRoundTripsValue() {
        String payload = '{"title":"Book time with your advisor","advisor":{"name":"Jordan Lee","title":"Senior Financial Advisor"},"days":[{"date":"2026-08-14","slots":[{"id":"slot-1","time":"09:00","meetingType":"video"}]}]}';
        AsaFinServAdvisorMeetingData dto = new AsaFinServAdvisorMeetingData(payload);
        System.assertEquals(payload, dto.finServAdvisorMeetingJSON, 'JSON constructor should round-trip the value');
    }
}