/**
 * Handler for the Employee Agent's interactive "approve AP invoices" action.
 *
 * The agent calls this action's user_input tool, which renders the ecwApApprovals
 * card as an input editor. When the finance user taps Approve/Hold, the card
 * dispatches `valuechange` and the chosen selection arrives here as an
 * EcwApApprovalsInput. The demo org has no AP objects, so this records nothing —
 * it just returns a human confirmation for the agent to relay.
 */
public with sharing class EcwApApprove {
    public class Request {
        @InvocableVariable(required=true label='Selection' description='The invoices the user chose to approve or hold.')
        public EcwApApprovalsInput selection;
    }
    public class Response {
        @InvocableVariable(label='Confirmation' description='Confirmation to relay to the user.')
        public String confirmation;
    }

    @InvocableMethod(label='Approve AP Invoices (ecwApApprovals)'
        description='Records the finance user\'s approve/hold decision from the AP approvals card and returns a confirmation.')
    public static List<Response> run(List<Request> requests) {
        Response resp = new Response();
        EcwApApprovalsInput sel = (requests != null && !requests.isEmpty()) ? requests[0].selection : null;
        if (sel == null || String.isBlank(sel.invoices)) {
            resp.confirmation = 'No invoices were selected.';
            return new List<Response>{ resp };
        }
        Integer n = (sel.count != null) ? sel.count : 0;
        String verb = ('hold'.equalsIgnoreCase(sel.decision)) ? 'placed on hold' : 'approved';
        String totalPart = ('hold'.equalsIgnoreCase(sel.decision) || String.isBlank(sel.totalAmount))
            ? '' : (' totaling ' + sel.totalAmount);
        resp.confirmation = n + ' invoice' + (n == 1 ? '' : 's') + totalPart + ' ' + verb + ': ' + sel.invoices + '.';
        return new List<Response>{ resp };
    }
}