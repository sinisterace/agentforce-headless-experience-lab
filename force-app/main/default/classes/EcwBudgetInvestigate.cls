/**
 * Handler for the Employee Agent's interactive "investigate budget variance" action.
 *
 * The agent calls this action's user_input tool, which renders the ecwBudgetActual
 * card as an input editor. When the finance user taps Investigate on an over/warn
 * department line, the card dispatches `valuechange` and the chosen line arrives
 * here as an EcwBudgetActualInput. The demo org has no budget objects, so this
 * records nothing — it just returns a human confirmation for the agent to relay.
 */
public with sharing class EcwBudgetInvestigate {
    public class Request {
        @InvocableVariable(required=true label='Selection' description='The department line the user chose to investigate.')
        public EcwBudgetActualInput selection;
    }
    public class Response {
        @InvocableVariable(label='Confirmation' description='Confirmation to relay to the user.')
        public String confirmation;
    }

    @InvocableMethod(label='Investigate Budget Variance (ecwBudgetActual)'
        description='Records the finance user\'s request to investigate a department budget variance and returns a confirmation.')
    public static List<Response> run(List<Request> requests) {
        Response resp = new Response();
        EcwBudgetActualInput sel = (requests != null && !requests.isEmpty()) ? requests[0].selection : null;
        if (sel == null || String.isBlank(sel.dept)) {
            resp.confirmation = 'No department was selected.';
            return new List<Response>{ resp };
        }
        String variancePart = String.isNotBlank(sel.variance) ? sel.variance : 'variance';
        String pctPart = String.isNotBlank(sel.pct) ? (', ' + sel.pct + ' of budget') : '';
        resp.confirmation = 'Flagged ' + sel.dept + ' for budget variance review (' + variancePart + pctPart + ').';
        return new List<Response>{ resp };
    }
}