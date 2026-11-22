/**
 * Input shape for the interactive month-end close editor CLT.
 *
 * The ecwMonthEndClose LWC, when rendered as an Agentforce input editor
 * (targetType c__ecwMonthEndCloseInput), dispatches a `valuechange` event whose
 * detail.value matches these fields. Referenced by the lightningType bundle
 * ecwMonthEndCloseInput (schema.json → @apexClassType/c__EcwMonthEndCloseInput) and
 * consumed by EcwMonthEndAction's user_input action input.
 */
public with sharing class EcwMonthEndCloseInput {
    @InvocableVariable(label='Task action' description='complete or chase')
    public String taskAction;

    @InvocableVariable(label='Task' description='The month-end close task name')
    public String task;

    @InvocableVariable(label='Note' description='Optional note / blocker detail for the task')
    public String note;
}
