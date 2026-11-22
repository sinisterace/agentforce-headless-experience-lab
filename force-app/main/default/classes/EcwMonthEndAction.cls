/**
 * Handler for the Employee Agent's interactive "act on a month-end task" action.
 *
 * The agent calls this action's user_input tool, which renders the ecwMonthEndClose
 * card as an input editor. When the finance user taps "Mark complete" or
 * "Chase blocker" on a task, the card dispatches `valuechange` and the choice
 * arrives here as an EcwMonthEndCloseInput. The demo org has no close objects, so
 * this records nothing — it just returns a human confirmation for the agent to relay.
 */
public with sharing class EcwMonthEndAction {
    public class Request {
        @InvocableVariable(required=true label='Selection' description='The month-end task the user acted on.')
        public EcwMonthEndCloseInput selection;
    }
    public class Response {
        @InvocableVariable(label='Confirmation' description='Confirmation to relay to the user.')
        public String confirmation;
    }

    @InvocableMethod(label='Act on Month-End Task (ecwMonthEndClose)'
        description='Records the finance user\'s month-end task action (complete / chase blocker) and returns a confirmation.')
    public static List<Response> run(List<Request> requests) {
        Response resp = new Response();
        EcwMonthEndCloseInput sel = (requests != null && !requests.isEmpty()) ? requests[0].selection : null;
        if (sel == null || String.isBlank(sel.task)) {
            resp.confirmation = 'No task was selected.';
            return new List<Response>{ resp };
        }
        if ('chase'.equalsIgnoreCase(sel.taskAction)) {
            String notePart = String.isNotBlank(sel.note) ? (' — ' + sel.note) : '';
            resp.confirmation = 'Flagged the blocker on "' + sel.task + '" to the owner' + notePart + '.';
        } else {
            resp.confirmation = 'Marked month-end task complete: "' + sel.task + '".';
        }
        return new List<Response>{ resp };
    }
}