/**
 * Invocable data source for Agentforce Coworker · Marketing · Campaign conversion.
 * CURATED by design (template-safe, seed-stable, no org Ids) — returns a JSON payload
 * for the ecwCampaignFunnel card. Same pattern as the other ecw CLTs with no backing objects.
 */
public with sharing class EcwCampaignFunnel {

    public class Request { @InvocableVariable public String details; }
    public class Response { @InvocableVariable public String json; }

    @InvocableMethod(label='Get Agentforce Coworker · Marketing · Campaign conversion' description='Returns a JSON payload for the ecwCampaignFunnel card.')
    public static List<Response> run(List<Request> requests) {
        Response resp = new Response();
        resp.json = buildPayloadJson();
        return new List<Response>{ resp };
    }

    @TestVisible
    static String buildPayloadJson() {
        return '{"title": "Campaign conversion", "campaign": "Spring Launch — Paid + Email", "periodLabel": "Last 30 days", "outcome": "128 won · $512K pipeline", "stages": [{"label": "Impressions", "count": 1240000, "topChannel": "Paid social", "detail": "$0.004 CPM"}, {"label": "Clicks", "count": 38400, "topChannel": "Paid search", "detail": "3.1% CTR"}, {"label": "Leads", "count": 5120, "topChannel": "Landing pages", "detail": "$9.40 CPL"}, {"label": "MQLs", "count": 1870, "topChannel": "Email nurture", "detail": "49% accept"}, {"label": "SQLs", "count": 640, "topChannel": "BDR outreach", "detail": "34% accept"}, {"label": "Won", "count": 128, "topChannel": "AE", "detail": "$512K pipeline"}]}';
    }
}
