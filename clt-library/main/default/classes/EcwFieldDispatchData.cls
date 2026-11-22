/**
 * @description Lightning Type backing class for Agentforce Coworker · Service · Field dispatch.
 * Holds the card payload as a single JSON string; the LWC parses it.
 *
 * JSON shape (see genAiFunctions/ecwFieldDispatch_Output_g7h9/input/schema.json):
 * { "title", "appointment": { number, customer, jobType, address, window, slaText,
 *   slaState (ok|warn|bad), priority, currentTech, currentIssue }, "site": { top, left },
 *   "candidates": [{ name, status, fit (number), rating (number), etaMin (number),
 *   distanceKm (number), skillsMatch (0-100), utilization (0-100), best (bool),
 *   pos: { top, left } }] }
 */
@JsonAccess(serializable='always' deserializable='always')
global class EcwFieldDispatchData {

    @AuraEnabled
    global String ecwFieldDispatchJSON;

    global EcwFieldDispatchData(String ecwFieldDispatchJSON) {
        this.ecwFieldDispatchJSON = ecwFieldDispatchJSON;
    }

    global EcwFieldDispatchData() {
        this.ecwFieldDispatchJSON = '';
    }
}
