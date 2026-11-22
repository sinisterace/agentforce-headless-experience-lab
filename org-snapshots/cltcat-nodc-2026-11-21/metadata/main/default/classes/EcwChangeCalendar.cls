/**
 * Invocable data source for the Agentforce Coworker · IT · "Change calendar" CLT.
 *
 * Returns upcoming IT changes and maintenance windows that affect employees — when,
 * risk, impact, and status — as a JSON payload for the ecwChangeCalendar card.
 * CURATED by design (the seed org has no change-management objects) and themed to
 * the company's domain. No org Ids baked in; consistent across the fleet.
 */
public with sharing class EcwChangeCalendar {

    public class Request { @InvocableVariable public String details; }
    public class Response { @InvocableVariable public String json; }

    @InvocableMethod(label='Get Change Calendar (ecwChangeCalendar)'
        description='Returns upcoming IT changes and maintenance affecting employees, as a JSON payload for the Change Calendar card.')
    public static List<Response> getChangeCalendar(List<Request> requests) {
        Response resp = new Response();
        resp.json = buildPayloadJson();
        return new List<Response>{ resp };
    }

    @TestVisible
    static String buildPayloadJson() {
        List<Map<String, Object>> changes = new List<Map<String, Object>>{
            new Map<String, Object>{ 'title' => 'VPN gateway upgrade', 'when' => 'Sat 11:00 PM', 'risk' => 'low', 'state' => 'Scheduled', 'impact' => 'Remote access briefly unavailable (~15 min) during the cutover.' },
            new Map<String, Object>{ 'title' => 'Workday quarterly update', 'when' => 'Sun 6:00 AM', 'risk' => 'medium', 'state' => 'Scheduled', 'impact' => 'HR self-service read-only for ~2 hours; payroll unaffected.' },
            new Map<String, Object>{ 'title' => 'Badge system firmware patch', 'when' => 'Tue 7:00 PM', 'risk' => 'low', 'state' => 'Approved', 'impact' => 'No expected downtime; readers update in rolling batches.' }
        };

        Integer n = changes.size();
        return JSON.serialize(new Map<String, Object>{
            'headline' => n + (n == 1 ? ' change this week' : ' changes this week'),
            'changes' => changes
        });
    }
}