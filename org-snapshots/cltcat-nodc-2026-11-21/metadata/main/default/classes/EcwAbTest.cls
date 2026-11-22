/**
 * Invocable data source for Agentforce Coworker · Marketing · A/B test.
 * CURATED by design (template-safe, seed-stable, no org Ids) — returns a JSON payload
 * for the ecwAbTest card. Same pattern as the other ecw CLTs with no backing objects.
 */
public with sharing class EcwAbTest {

    public class Request { @InvocableVariable public String details; }
    public class Response { @InvocableVariable public String json; }

    @InvocableMethod(label='Get Agentforce Coworker · Marketing · A/B test' description='Returns a JSON payload for the ecwAbTest card.')
    public static List<Response> run(List<Request> requests) {
        Response resp = new Response();
        resp.json = buildPayloadJson();
        return new List<Response>{ resp };
    }

    @TestVisible
    static String buildPayloadJson() {
        return '{"title": "A/B test results", "testName": "Nurture email — subject line", "audience": "18,400 sent · 50/50 split", "variants": [{"key": "A", "name": "Variant A", "preview": "Your Q2 playbook is ready", "sent": 9200, "openRate": 41, "ctr": 3.2, "convRate": 1.1, "revenue": 28000}, {"key": "B", "name": "Variant B", "preview": "3 moves to hit Q2 — inside", "sent": 9200, "openRate": 44, "ctr": 5.1, "convRate": 1.8, "revenue": 46000}], "confidence": 97, "winner": "B", "lift": "+59% CTR", "projected": "+$18K/qtr"}';
    }
}