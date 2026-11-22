/**
 * Invocable data source for the Agentforce Coworker · HR · "Onboarding" CLT.
 * Returns new hires in onboarding with their progress for the HR/People team, as a JSON
 * payload for the ecwOnboarding card. CURATED (seed org has no HR objects). No org Ids baked in.
 */
public with sharing class EcwOnboarding {

    public class Request { @InvocableVariable public String details; }
    public class Response { @InvocableVariable public String json; }

    @InvocableMethod(label='Get Onboarding (ecwOnboarding)'
        description='Returns new hires in onboarding with their stage and detail, as a JSON payload for the Onboarding card.')
    public static List<Response> getOnboarding(List<Request> requests) {
        Response resp = new Response();
        resp.json = buildPayloadJson();
        return new List<Response>{ resp };
    }

    @TestVisible
    static String buildPayloadJson() {
        List<String> stages = new List<String>{ 'Offer', 'Paperwork', 'Equipment', 'Day 1', '30-day' };
        List<Map<String, Object>> hires = new List<Map<String, Object>>{
            hire('Dana Price', 'Account Executive · Sales', 'Starts Monday', stages, 2, 'Laptop shipped; badge access pending from IT.', 'info'),
            hire('Omar Haddad', 'Field Installation Tech · Installation', 'Started 3 days ago', stages, 3, 'On site for Day 1; van and tools assigned.', 'info'),
            hire('Grace Lin', 'Support Engineer · Customer Service', 'Started 2 weeks ago', stages, 4, '30-day check-in scheduled with manager.', 'good'),
            hire('Theo Novak', 'Staff Accountant · Finance', 'Offer accepted', stages, 1, 'Background check in progress.', 'warn')
        };
        return JSON.serialize(new Map<String, Object>{
            'headline' => hires.size() + ' new hires onboarding',
            'hires' => hires
        });
    }

    static Map<String, Object> hire(String name, String role, String start, List<String> stages, Integer idx, String detail, String state) {
        return new Map<String, Object>{ 'name' => name, 'role' => role, 'start' => start, 'stages' => stages, 'stageIndex' => idx, 'detail' => detail, 'state' => state };
    }
}
