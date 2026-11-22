/**
 * Handler for the Employee Agent's interactive "send AR payment reminders" action.
 *
 * The agent calls this action's user_input tool, which renders the ecwArAging card
 * as an input editor. When the finance user selects overdue accounts and taps Send
 * payment reminder, the card dispatches `valuechange` and the chosen selection
 * arrives here as an EcwArAgingInput. The demo org has no AR objects, so this
 * records nothing — it just returns a human confirmation for the agent to relay.
 */
public with sharing class EcwArRemind {
    public class Request {
        @InvocableVariable(required=true label='Selection' description='The overdue accounts the user chose to remind.')
        public EcwArAgingInput selection;
    }
    public class Response {
        @InvocableVariable(label='Confirmation' description='Confirmation to relay to the user.')
        public String confirmation;
    }

    @InvocableMethod(label='Send AR Payment Reminders (ecwArAging)'
        description='Records the finance user\'s choice of overdue accounts to remind and returns a confirmation.')
    public static List<Response> run(List<Request> requests) {
        Response resp = new Response();
        EcwArAgingInput sel = (requests != null && !requests.isEmpty()) ? requests[0].selection : null;
        if (sel == null || String.isBlank(sel.accounts)) {
            resp.confirmation = 'No accounts were selected.';
            return new List<Response>{ resp };
        }
        Integer n = (sel.count != null) ? sel.count : 0;
        resp.confirmation = 'Payment reminder queued for ' + n + ' account' + (n == 1 ? '' : 's') + ': ' + sel.accounts + '.';
        return new List<Response>{ resp };
    }
}
