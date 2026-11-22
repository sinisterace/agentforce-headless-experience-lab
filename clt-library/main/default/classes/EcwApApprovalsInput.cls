/**
 * Input shape for the interactive AP approvals editor CLT.
 *
 * The ecwApApprovals LWC, when rendered as an Agentforce input editor
 * (targetType c__ecwApApprovalsInput), dispatches a `valuechange` event whose
 * detail.value matches these fields. Referenced by the lightningType bundle
 * ecwApApprovalsInput (schema.json → @apexClassType/c__EcwApApprovalsInput) and
 * consumed by EcwApApprove's user_input action input.
 */
public with sharing class EcwApApprovalsInput {
    @InvocableVariable(label='Decision' description='approve or hold')
    public String decision;

    @InvocableVariable(label='Invoices' description='Human-readable list of the chosen invoices/POs')
    public String invoices;

    @InvocableVariable(label='Count' description='How many invoices/POs were chosen')
    public Integer count;

    @InvocableVariable(label='Total amount' description='Compact total of the chosen items, e.g. $140K')
    public String totalAmount;
}
