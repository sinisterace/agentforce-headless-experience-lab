/**
 * Invocable data source for the Agentforce Coworker · Sales · "What changed" CLT.
 *
 * Returns a recent deal-motion feed (won, advanced, slipped, new, lost) as a JSON
 * payload for the ecwWhatChanged LWC. The feed is CURATED/STATIC by design: real
 * change events require Opportunity field-history tracking plus live usage, which
 * freshly-cloned demo orgs don't have — so this ships a representative feed that
 * renders consistently everywhere. No org-specific values are baked in, so it is
 * safe to templatize. (To go live later, swap buildPayloadJson() for a query over
 * OpportunityFieldHistory + recent closes/creates — the Flow/LWC contract is ready.)
 */
public with sharing class EcwWhatChanged {

    public class Request { @InvocableVariable public String details; }
    public class Response { @InvocableVariable public String json; }

    @InvocableMethod(label='Get What Changed (ecwWhatChanged)'
        description='Returns a recent deal-motion feed (won, advanced, slipped, new, lost) as a JSON payload for the What Changed card.')
    public static List<Response> getWhatChanged(List<Request> requests) {
        Response resp = new Response();
        resp.json = buildPayloadJson();
        return new List<Response>{ resp };
    }

    @TestVisible
    static String buildPayloadJson() {
        List<Map<String, Object>> items = new List<Map<String, Object>>{
            new Map<String, Object>{ 'label' => 'Won',      'deal' => 'Entry System Upgrade - Juniper Mesa Schools',       'detail' => 'Closed Won',                        'amount' => 250000, 'when' => '2d ago', 'state' => 'good' },
            new Map<String, Object>{ 'label' => 'Advanced', 'deal' => 'Warehouse Camera Expansion - Amber Valley Resorts', 'detail' => 'Prospecting → Proposal',            'amount' => 250000, 'when' => '3d ago', 'state' => 'info' },
            new Map<String, Object>{ 'label' => 'New',      'deal' => 'Visitor Kiosk Pilot - Ravenwood Storage',          'detail' => 'Added to pipeline',                 'amount' => 125000, 'when' => '4d ago', 'state' => 'info' },
            new Map<String, Object>{ 'label' => 'Slipped',  'deal' => 'Entry System Upgrade - Yucca Trail Schools',        'detail' => 'Close date moved out 3 weeks',      'amount' => 250000, 'when' => '5d ago', 'state' => 'warn' },
            new Map<String, Object>{ 'label' => 'Lost',     'deal' => 'Warehouse Camera Expansion - Teal Ridge Schools',   'detail' => 'Closed Lost — went with incumbent', 'amount' => 125000, 'when' => '6d ago', 'state' => 'bad' }
        };

        return JSON.serialize(new Map<String, Object>{
            'netText' => '+$510K',
            'summaryText' => '5 updates this week',
            'items' => items
        });
    }
}
