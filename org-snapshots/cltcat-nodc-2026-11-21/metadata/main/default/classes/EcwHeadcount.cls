/**
 * Invocable data source for the Agentforce Coworker · HR · "Headcount" CLT.
 * Returns company headcount by department + growth for the HR/People team, as a JSON
 * payload for the ecwHeadcount card. CURATED (seed org has no HR objects), themed to
 * the company's departments. No org Ids baked in; consistent across the fleet.
 */
public with sharing class EcwHeadcount {

    public class Request { @InvocableVariable public String details; }
    public class Response { @InvocableVariable public String json; }

    @InvocableMethod(label='Get Headcount (ecwHeadcount)'
        description='Returns company headcount by department and growth, as a JSON payload for the Headcount card.')
    public static List<Response> getHeadcount(List<Request> requests) {
        Response resp = new Response();
        resp.json = buildPayloadJson();
        return new List<Response>{ resp };
    }

    @TestVisible
    static String buildPayloadJson() {
        List<Map<String, Object>> depts = new List<Map<String, Object>>{
            dept('Operations', 168), dept('Sales', 92), dept('Customer Service', 76),
            dept('Installation & Field', 64), dept('IT', 28), dept('Finance & Admin', 24),
            dept('People & HR', 16), dept('Marketing', 14)
        };
        Integer total = 0;
        for (Map<String, Object> d : depts) total += (Integer) d.get('count');

        return JSON.serialize(new Map<String, Object>{
            'periodLabel' => 'Company headcount',
            'total' => total,
            'growthText' => '+18 this quarter',
            'openRoles' => 11,
            'depts' => depts
        });
    }

    static Map<String, Object> dept(String name, Integer count) {
        return new Map<String, Object>{ 'name' => name, 'count' => count };
    }
}