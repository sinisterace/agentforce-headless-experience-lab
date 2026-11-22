/**
 * Invocable data source for the Agentforce Coworker · HR · "Who's out" CLT.
 * Returns who is out this week (PTO / leave) for the HR/People team, as a JSON payload
 * for the ecwTimeOff card. CURATED (seed org has no HR objects). No org Ids baked in.
 */
public with sharing class EcwTimeOff {

    public class Request { @InvocableVariable public String details; }
    public class Response { @InvocableVariable public String json; }

    @InvocableMethod(label='Get Who Is Out (ecwTimeOff)'
        description='Returns who is out this week with dates and leave type, as a JSON payload for the Who\'s Out card.')
    public static List<Response> getTimeOff(List<Request> requests) {
        Response resp = new Response();
        resp.json = buildPayloadJson();
        return new List<Response>{ resp };
    }

    @TestVisible
    static String buildPayloadJson() {
        List<Map<String, Object>> people = new List<Map<String, Object>>{
            person('Jordan Lee', 'Sales Manager', 'Mon–Wed', 'PTO', 'info', 'Covered by Marcus Hale'),
            person('Priya Nair', 'Support Lead', 'All week', 'Parental leave', 'warn', 'Covered by Dana Price'),
            person('Marcus Hale', 'Field Supervisor', 'Thu–Fri', 'PTO', 'info', 'Covered by on-call rotation'),
            person('Sofia Russo', 'Recruiter', 'Fri', 'Sick', 'bad', null),
            person('Devin Clark', 'IT Analyst', 'Wed–Fri', 'PTO', 'info', 'Covered by helpdesk queue')
        };
        return JSON.serialize(new Map<String, Object>{
            'periodLabel' => 'This week',
            'headline' => people.size() + ' out this week',
            'people' => people
        });
    }

    static Map<String, Object> person(String name, String role, String dates, String type, String state, String coverage) {
        Map<String, Object> p = new Map<String, Object>{ 'name' => name, 'role' => role, 'dates' => dates, 'type' => type, 'state' => state };
        if (coverage != null) p.put('coverage', coverage);
        return p;
    }
}