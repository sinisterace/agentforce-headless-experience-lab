/**
 * Invocable data source for the Agentforce Coworker · Finance · "Month-end close" CLT.
 *
 * Returns the month-end close checklist for the finance team — task status, % complete,
 * and blockers — as a JSON payload for the ecwMonthEndClose card. CURATED by design (the
 * seed org has no close/task objects). No org Ids baked in; consistent across the fleet.
 */
public with sharing class EcwMonthEndClose {

    public class Request { @InvocableVariable public String details; }
    public class Response { @InvocableVariable public String json; }

    @InvocableMethod(label='Get Month-End Close (ecwMonthEndClose)'
        description='Returns the month-end close checklist with status and blockers, as a JSON payload for the Month-End Close card.')
    public static List<Response> getMonthEndClose(List<Request> requests) {
        Response resp = new Response();
        resp.json = buildPayloadJson();
        return new List<Response>{ resp };
    }

    @TestVisible
    static String buildPayloadJson() {
        List<Map<String, Object>> tasks = new List<Map<String, Object>>{
            task('Bank reconciliations', 'done', null),
            task('Accruals & prepaids', 'done', null),
            task('Accounts payable cutoff', 'done', null),
            task('Accounts receivable & revenue recognition', 'in_progress', '2 contracts pending review'),
            task('Fixed assets & depreciation', 'in_progress', null),
            task('Intercompany eliminations', 'blocked', 'Awaiting FX rates from Treasury'),
            task('Payroll & commissions accrual', 'done', null),
            task('Expense accruals', 'done', null),
            task('Flux / variance analysis', 'todo', null),
            task('Management reporting pack', 'todo', null),
            task('Final review & sign-off', 'todo', null)
        };
        Integer done = 0;
        for (Map<String, Object> t : tasks) if (t.get('state') == 'done') done++;
        Integer pct = (Integer) Math.round((Double) done / tasks.size() * 100);

        return JSON.serialize(new Map<String, Object>{
            'headline' => done + ' of ' + tasks.size() + ' tasks complete',
            'pct' => pct,
            'targetText' => 'Close target: Business Day 5',
            'tasks' => tasks
        });
    }

    static Map<String, Object> task(String name, String state, String note) {
        Map<String, Object> t = new Map<String, Object>{ 'name' => name, 'state' => state };
        if (note != null) t.put('note', note);
        return t;
    }
}