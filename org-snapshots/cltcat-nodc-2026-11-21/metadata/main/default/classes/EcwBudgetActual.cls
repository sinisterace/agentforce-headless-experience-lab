/**
 * Invocable data source for the Agentforce Coworker · Finance · "Budget vs actual" CLT.
 *
 * Returns departmental budget-vs-actual for the finance team as a JSON payload for
 * the ecwBudgetActual card. CURATED by design (the seed org has no budget objects)
 * and themed to the company's departments. No org Ids baked in; consistent across
 * the fleet.
 */
public with sharing class EcwBudgetActual {

    public class Request { @InvocableVariable public String details; }
    public class Response { @InvocableVariable public String json; }

    @InvocableMethod(label='Get Budget vs Actual (ecwBudgetActual)'
        description='Returns departmental budget vs actual for the finance team, as a JSON payload for the Budget vs Actual card.')
    public static List<Response> getBudgetActual(List<Request> requests) {
        Response resp = new Response();
        resp.json = buildPayloadJson();
        return new List<Response>{ resp };
    }

    @TestVisible
    static String buildPayloadJson() {
        List<Map<String, Object>> lines = new List<Map<String, Object>>{
            line('Sales', 2400000, 1680000),
            line('Customer Service', 1800000, 1710000),
            line('IT', 1200000, 1320000),
            line('Facilities', 900000, 540000),
            line('R&D', 1500000, 1050000)
        };
        Decimal totalBudget = 0, totalActual = 0;
        for (Map<String, Object> l : lines) {
            totalBudget += (Decimal) l.get('budget');
            totalActual += (Decimal) l.get('actual');
        }
        Integer pct = (Integer) Math.round(totalActual / totalBudget * 100);

        return JSON.serialize(new Map<String, Object>{
            'periodLabel' => 'FY26 · YTD',
            'headline' => pct + '% of budget used',
            'totalBudget' => totalBudget,
            'totalActual' => totalActual,
            'lines' => lines
        });
    }

    static Map<String, Object> line(String dept, Decimal budget, Decimal actual) {
        Decimal pct = actual / budget * 100;
        String state = pct > 100 ? 'over' : (pct >= 90 ? 'warn' : 'ok');
        return new Map<String, Object>{ 'dept' => dept, 'budget' => budget, 'actual' => actual, 'state' => state };
    }
}