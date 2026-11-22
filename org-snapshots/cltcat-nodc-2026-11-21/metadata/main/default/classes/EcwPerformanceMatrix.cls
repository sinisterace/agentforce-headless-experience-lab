/**
 * Invocable data source for Agentforce Coworker · Marketing · Performance matrix.
 * CURATED by design (template-safe, seed-stable, no org Ids) — returns a JSON payload
 * for the ecwPerformanceMatrix card. Same pattern as the other ecw CLTs with no backing objects.
 */
public with sharing class EcwPerformanceMatrix {

    public class Request { @InvocableVariable public String details; }
    public class Response { @InvocableVariable public String json; }

    @InvocableMethod(label='Get Agentforce Coworker · Marketing · Performance matrix' description='Returns a JSON payload for the ecwPerformanceMatrix card.')
    public static List<Response> run(List<Request> requests) {
        Response resp = new Response();
        resp.json = buildPayloadJson();
        return new List<Response>{ resp };
    }

    @TestVisible
    static String buildPayloadJson() {
        return '{"title": "Content performance", "xLabel": "Reach", "yLabel": "Engagement rate", "items": [{"name": "Product launch webinar", "type": "Webinar", "reach": 48000, "engagement": 62, "conversions": 540, "trend": "up"}, {"name": "ROI calculator", "type": "Tool", "reach": 31000, "engagement": 74, "conversions": 880, "trend": "up"}, {"name": "State of the industry report", "type": "Ebook", "reach": 72000, "engagement": 28, "conversions": 210, "trend": "down"}, {"name": "Weekly newsletter", "type": "Email", "reach": 96000, "engagement": 41, "conversions": 320, "trend": "flat"}, {"name": "Customer story: Northwind", "type": "Blog", "reach": 12000, "engagement": 58, "conversions": 190, "trend": "up"}, {"name": "Paid retargeting set", "type": "Ad", "reach": 54000, "engagement": 22, "conversions": 140, "trend": "down"}]}';
    }
}