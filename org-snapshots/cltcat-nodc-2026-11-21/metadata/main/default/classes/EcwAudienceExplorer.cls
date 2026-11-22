/**
 * Invocable data source for Agentforce Coworker · Marketing · Audience builder.
 * CURATED by design (template-safe, seed-stable, no org Ids) — returns a JSON payload
 * for the ecwAudienceExplorer card. Same pattern as the other ecw CLTs with no backing objects.
 */
public with sharing class EcwAudienceExplorer {

    public class Request { @InvocableVariable public String details; }
    public class Response { @InvocableVariable public String json; }

    @InvocableMethod(label='Get Agentforce Coworker · Marketing · Audience builder' description='Returns a JSON payload for the ecwAudienceExplorer card.')
    public static List<Response> run(List<Request> requests) {
        Response resp = new Response();
        resp.json = buildPayloadJson();
        return new List<Response>{ resp };
    }

    @TestVisible
    static String buildPayloadJson() {
        return '{"title": "Audience builder", "baseLabel": "All contacts", "baseSize": 128000, "criteria": [{"key": "industry", "label": "Healthcare & public sector", "fraction": 0.34, "on": true}, {"key": "engaged", "label": "Engaged in last 90 days", "fraction": 0.52, "on": true}, {"key": "nurture", "label": "Not already in a nurture", "fraction": 0.61, "on": false}], "threshold": {"label": "Min. engagement score", "min": 0, "max": 100, "value": 40}}';
    }
}