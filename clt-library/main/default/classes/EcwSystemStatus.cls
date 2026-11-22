/**
 * Invocable data source for the Agentforce Coworker · IT · "System status" CLT.
 *
 * Returns the health of the apps and services an employee relies on, as a JSON
 * payload for the ecwSystemStatus card. CURATED by design (the seed org has no
 * ITSM/monitoring objects) and themed to the company's domain (badge access,
 * camera cloud, visitor kiosk) plus standard corp apps. No org Ids are baked in,
 * so it reads consistently across the templatized fleet.
 */
public with sharing class EcwSystemStatus {

    public class Request { @InvocableVariable public String details; }
    public class Response { @InvocableVariable public String json; }

    @InvocableMethod(label='Get System Status (ecwSystemStatus)'
        description='Returns the health of the services an employee uses, as a JSON payload for the System Status card.')
    public static List<Response> getSystemStatus(List<Request> requests) {
        Response resp = new Response();
        resp.json = buildPayloadJson();
        return new List<Response>{ resp };
    }

    static Map<String, Object> svc(String name, String state, String uptime, String note) {
        Map<String, Object> m = new Map<String, Object>{ 'name' => name, 'state' => state, 'uptime' => uptime };
        if (note != null) m.put('note', note);
        return m;
    }

    @TestVisible
    static String buildPayloadJson() {
        List<Map<String, Object>> services = new List<Map<String, Object>>{
            svc('Email & Calendar', 'operational', '99.99%', null),
            svc('VPN / Remote Access', 'operational', '99.97%', null),
            svc('Salesforce CRM', 'operational', '100%', null),
            svc('Badge Access System', 'degraded', '98.2%', 'Intermittent reader timeouts at HQ east entrance. Engineering is rolling out a firmware fix.'),
            svc('Camera Cloud', 'operational', '99.95%', null),
            svc('Visitor Kiosk Platform', 'operational', '99.98%', null),
            svc('Workday / HR', 'operational', '99.99%', null),
            svc('Wi-Fi (HQ)', 'operational', '99.9%', null)
        };

        Integer degraded = 0, down = 0, total = services.size();
        for (Map<String, Object> s : services) {
            String st = (String) s.get('state');
            if (st == 'degraded') degraded++;
            else if (st == 'down') down++;
        }
        Integer ok = total - degraded - down;
        String overall = down > 0 ? 'down' : (degraded > 0 ? 'degraded' : 'operational');
        String headline;
        if (down > 0) headline = down + (down == 1 ? ' service down' : ' services down');
        else if (degraded > 0) headline = degraded + (degraded == 1 ? ' service degraded' : ' services degraded');
        else headline = 'All systems operational';

        return JSON.serialize(new Map<String, Object>{
            'overall' => overall,
            'headline' => headline,
            'opsText' => ok + ' of ' + total + ' operational',
            'overallUptime' => '99.7%',
            'services' => services
        });
    }
}
