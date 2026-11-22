/**
 * Invocable data source for the Agentforce Coworker · IT · "Known issues" CLT.
 *
 * Returns the active IT incidents affecting employees — impact, status, workaround,
 * and latest update — as a JSON payload for the ecwKnownIssues card. CURATED by
 * design (the seed org has no ITSM incident objects) and themed to the company's
 * domain. No org Ids are baked in, so it reads consistently across the fleet.
 */
public with sharing class EcwKnownIssues {

    public class Request { @InvocableVariable public String details; }
    public class Response { @InvocableVariable public String json; }

    @InvocableMethod(label='Get Known Issues (ecwKnownIssues)'
        description='Returns active IT incidents affecting employees, as a JSON payload for the Known Issues card.')
    public static List<Response> getKnownIssues(List<Request> requests) {
        Response resp = new Response();
        resp.json = buildPayloadJson();
        return new List<Response>{ resp };
    }

    @TestVisible
    static String buildPayloadJson() {
        List<Map<String, Object>> incidents = new List<Map<String, Object>>{
            new Map<String, Object>{
                'id' => 'INC-20481', 'title' => 'Badge Access System — intermittent reader timeouts',
                'severity' => 'P2', 'state' => 'Investigating', 'started' => '1h 20m ago',
                'impact' => 'HQ east-entrance badge readers; some employees see delayed unlocks.',
                'workaround' => 'Use the main-lobby reader or ask the front desk for a manual override.',
                'update' => 'Engineering identified a firmware regression; a fix is rolling out across readers.'
            },
            new Map<String, Object>{
                'id' => 'INC-20474', 'title' => 'Camera Cloud — slower video uploads',
                'severity' => 'P3', 'state' => 'Monitoring', 'started' => '3h ago',
                'impact' => 'Recorded clips take longer than usual to appear in Camera Cloud.',
                'workaround' => 'No action needed; uploads are completing, just delayed.',
                'update' => 'A capacity fix was applied; latency is recovering and being monitored.'
            }
        };

        Integer n = incidents.size();
        return JSON.serialize(new Map<String, Object>{
            'openCount' => n,
            'headline' => n == 1 ? '1 active incident' : n + ' active incidents',
            'incidents' => incidents
        });
    }
}
