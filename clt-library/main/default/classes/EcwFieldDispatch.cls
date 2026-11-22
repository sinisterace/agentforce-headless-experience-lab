/**
 * Invocable data source for the Agentforce Coworker · Service · "Field dispatch" CLT.
 *
 * Returns an at-risk service appointment and a ranked set of candidate technicians to
 * reassign to, as a JSON payload for the ecwFieldDispatch card.
 *
 * CURATED by design: this org (and the orgfarm template it seeds) has no Field Service
 * data — 0 ServiceAppointment / ServiceResource rows — so there is nothing to query.
 * The payload is seed-stable and carries no org Ids, so it is portable across the
 * templatized fleet (same approach as the other ecw CLTs with no backing objects).
 * If a future template ships real FSL data, swap buildPayloadJson for a WITH USER_MODE
 * query over ServiceAppointment + candidate ServiceResources and keep the same shape.
 */
public with sharing class EcwFieldDispatch {

    public class Request { @InvocableVariable public String details; }
    public class Response { @InvocableVariable public String json; }

    @InvocableMethod(label='Get Field Dispatch (ecwFieldDispatch)'
        description='Returns an at-risk service appointment and ranked candidate technicians to reassign to, as a JSON payload for the Field Dispatch card.')
    public static List<Response> getFieldDispatch(List<Request> requests) {
        Response resp = new Response();
        resp.json = buildPayloadJson();
        return new List<Response>{ resp };
    }

    static Map<String, Object> cand(String name, String status, Integer fit, Decimal rating, Integer eta, Decimal dist, Integer skills, Integer util, Boolean best, Integer top, Integer left) {
        return new Map<String, Object>{
            'name' => name, 'status' => status, 'fit' => fit, 'rating' => rating,
            'etaMin' => eta, 'distanceKm' => dist, 'skillsMatch' => skills, 'utilization' => util,
            'best' => best, 'pos' => new Map<String, Object>{ 'top' => top, 'left' => left }
        };
    }

    @TestVisible
    static String buildPayloadJson() {
        return JSON.serialize(new Map<String, Object>{
            'title' => 'Reassign at-risk appointment',
            'appointment' => new Map<String, Object>{
                'number' => 'SA-10427', 'customer' => 'Northwind Traders', 'jobType' => 'HVAC — no cooling',
                'address' => '1200 W 5th St, Austin TX', 'window' => 'Today · 2:00–4:00 PM',
                'slaText' => 'SLA breaches in 48m', 'slaState' => 'bad', 'priority' => 'High',
                'currentTech' => 'Marcus Hale', 'currentIssue' => 'Running 55m behind on a prior job'
            },
            'site' => new Map<String, Object>{ 'top' => 46, 'left' => 50 },
            'candidates' => new List<Object>{
                cand('Dana Price', 'Available now', 94, 4.9, 12, 3.1, 100, 62, true, 30, 24),
                cand('Grace Lin', 'Finishing nearby', 81, 4.7, 23, 5.4, 80, 78, false, 70, 70),
                cand('Omar Haddad', 'Available now', 68, 4.8, 34, 8.9, 60, 45, false, 24, 78)
            }
        });
    }
}
