/**
 * Invocable data source for the Agentforce Coworker · HR · "Open roles" CLT.
 * Returns open requisitions for the HR/People team, as a JSON payload for the
 * ecwOpenRoles card. CURATED (seed org has no HR objects), themed to the company's
 * departments. No org Ids baked in.
 */
public with sharing class EcwOpenRoles {

    public class Request { @InvocableVariable public String details; }
    public class Response { @InvocableVariable public String json; }

    @InvocableMethod(label='Get Open Roles (ecwOpenRoles)'
        description='Returns open requisitions with stage, days open, and candidate counts, as a JSON payload for the Open Roles card.')
    public static List<Response> getOpenRoles(List<Request> requests) {
        Response resp = new Response();
        resp.json = buildPayloadJson();
        return new List<Response>{ resp };
    }

    @TestVisible
    static String buildPayloadJson() {
        List<Map<String, Object>> roles = new List<Map<String, Object>>{
            role('Field Installation Technician', 'Installation & Field', 'Interviewing', 22, 6, 'Alex Monroe', 'ok'),
            role('Enterprise Account Executive', 'Sales', 'Offer out', 41, 2, 'Jordan Lee', 'warn'),
            role('Support Engineer', 'Customer Service', 'Sourcing', 9, 14, 'Priya Nair', 'ok'),
            role('Security Systems Architect', 'IT', 'Interviewing', 55, 3, 'Devin Clark', 'bad'),
            role('Staff Accountant', 'Finance & Admin', 'Screening', 17, 8, 'Rosa Behn', 'ok')
        };
        return JSON.serialize(new Map<String, Object>{
            'headline' => roles.size() + ' open roles',
            'roles' => roles
        });
    }

    static Map<String, Object> role(String title, String dept, String stage, Integer daysOpen, Integer candidates, String hm, String state) {
        return new Map<String, Object>{ 'title' => title, 'dept' => dept, 'stage' => stage, 'daysOpen' => daysOpen, 'candidates' => candidates, 'hiringManager' => hm, 'state' => state };
    }
}