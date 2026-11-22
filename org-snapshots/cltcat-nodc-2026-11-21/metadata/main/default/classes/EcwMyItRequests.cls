/**
 * Invocable data source for the Agentforce Coworker · IT · "My IT requests" CLT.
 *
 * Returns the running employee's own IT requests (hardware / access / software) with
 * a progress stage, as a JSON payload for the ecwMyItRequests card. CURATED by design
 * (the seed org has no IT request/ticket objects) and themed to the company's domain.
 * No org Ids baked in; consistent across the fleet.
 */
public with sharing class EcwMyItRequests {

    public class Request { @InvocableVariable public String details; }
    public class Response { @InvocableVariable public String json; }

    @InvocableMethod(label='Get My IT Requests (ecwMyItRequests)'
        description='Returns the running employee\'s own IT requests and their status, as a JSON payload for the My IT Requests card.')
    public static List<Response> getMyItRequests(List<Request> requests) {
        Response resp = new Response();
        resp.json = buildPayloadJson();
        return new List<Response>{ resp };
    }

    @TestVisible
    static String buildPayloadJson() {
        List<Map<String, Object>> reqs = new List<Map<String, Object>>{
            new Map<String, Object>{
                'id' => 'REQ-10234', 'title' => 'MacBook Pro 16" refresh', 'type' => 'Hardware',
                'stages' => new List<String>{ 'Submitted', 'Approved', 'Fulfilling', 'Done' }, 'stageIndex' => 2,
                'detail' => 'Approved by your manager; ships from the IT depot in ~2 days with setup instructions.', 'state' => 'info'
            },
            new Map<String, Object>{
                'id' => 'REQ-10251', 'title' => 'Access: Camera Cloud admin', 'type' => 'Access',
                'stages' => new List<String>{ 'Submitted', 'Approved', 'Granted' }, 'stageIndex' => 1,
                'detail' => 'Pending approval from Jordan Lee (your manager). Typical turnaround is 1 business day.', 'state' => 'warn'
            },
            new Map<String, Object>{
                'id' => 'REQ-10198', 'title' => 'Figma license', 'type' => 'Software',
                'stages' => new List<String>{ 'Submitted', 'Approved', 'Fulfilling', 'Done' }, 'stageIndex' => 3,
                'detail' => 'License assigned — check your email for the activation link.', 'state' => 'good'
            }
        };

        Integer open = 0;
        for (Map<String, Object> r : reqs) {
            List<String> st = (List<String>) r.get('stages');
            if (((Integer) r.get('stageIndex')) < st.size() - 1) open++;
        }
        return JSON.serialize(new Map<String, Object>{
            'openCount' => open,
            'headline' => open == 1 ? '1 open request' : open + ' open requests',
            'requests' => reqs
        });
    }
}