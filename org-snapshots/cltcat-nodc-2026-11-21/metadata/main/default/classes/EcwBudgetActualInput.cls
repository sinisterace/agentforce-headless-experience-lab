/**
 * Input shape for the interactive Budget vs actual editor CLT.
 *
 * The ecwBudgetActual LWC, when rendered as an Agentforce input editor
 * (targetType c__ecwBudgetActualInput), dispatches a `valuechange` event whose
 * detail.value matches these fields. Referenced by the lightningType bundle
 * ecwBudgetActualInput (schema.json → @apexClassType/c__EcwBudgetActualInput) and
 * consumed by EcwBudgetInvestigate's user_input action input.
 */
public with sharing class EcwBudgetActualInput {
    @InvocableVariable(label='Department' description='The department line the user chose to investigate')
    public String dept;

    @InvocableVariable(label='Variance' description='Human-readable variance, e.g. $120K over budget')
    public String variance;

    @InvocableVariable(label='Percent of budget' description='Actual as a percent of budget, e.g. 110%')
    public String pct;
}