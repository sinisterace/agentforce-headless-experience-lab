import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CltPlayground } from './CltPlayground';
import type { Recommendation } from '@/types/catalog';

function rec(overrides: Partial<Recommendation> = {}): Recommendation {
  return {
    cltApiName: 'asaFinServAccountSelector',
    industryKey: 'financial_services',
    capabilityKey: 'account_selector',
    label: 'Account Selector',
    description: 'Pick one of your accounts.',
    displayOrder: 0,
    defaultPayloadJson: JSON.stringify({
      title: 'Which account can I help you with?',
      mode: 'single',
      accounts: [
        { id: 'chk-1234', name: 'Everyday Checking', type: 'Checking', mask: '1234', balance: 4820.55, currency: 'USD', badge: 'Primary' },
        { id: 'sav-5678', name: 'High-Yield Savings', type: 'Savings', mask: '5678', balance: 15230.0, currency: 'USD' },
      ],
    }),
    dtoFieldName: 'finServAccountSelectorJSON',
    ...overrides,
  };
}

describe('CltPlayground — account selector', () => {
  it('seeds the live preview from the catalogue default payload', () => {
    render(<CltPlayground recommendation={rec()} accentColor="#0b5cab" />);
    expect(screen.getByText('Which account can I help you with?')).toBeInTheDocument();
    expect(screen.getByText('Everyday Checking')).toBeInTheDocument();
    expect(screen.getByText('High-Yield Savings')).toBeInTheDocument();
  });

  it('mirrors the deployed LWC test-mode fallback when accounts are emptied', () => {
    // Empty accounts => the real LWC loads baked sample data; the preview must match.
    render(<CltPlayground recommendation={rec({ defaultPayloadJson: JSON.stringify({ title: 'x', mode: 'single', accounts: [] }) })} accentColor="#0b5cab" />);
    expect(screen.getByText(/Test mode/i)).toBeInTheDocument();
    expect(screen.getByText('Rewards Card')).toBeInTheDocument();
  });

  it('exposes the live JSON payload with the LWC-true field name', () => {
    render(<CltPlayground recommendation={rec()} accentColor="#0b5cab" />);
    fireEvent.click(screen.getByRole('button', { name: /Structure & data/i }));
    fireEvent.click(screen.getByRole('tab', { name: /JSON/i }));
    // The DTO field name is called out in the inspector subheader.
    expect(screen.getByText('finServAccountSelectorJSON')).toBeInTheDocument();
  });

  it('offers only Structure and JSON inspector views (no Edit)', () => {
    render(<CltPlayground recommendation={rec()} accentColor="#0b5cab" />);
    fireEvent.click(screen.getByRole('button', { name: /Structure & data/i }));
    expect(screen.getByRole('tab', { name: /Structure/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /JSON/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /Edit/i })).not.toBeInTheDocument();
  });
});

describe('CltPlayground — dispatch by dtoFieldName', () => {
  it('renders the recent-transactions preview for finServTransactionsJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaFinServTransactions',
          capabilityKey: 'transaction_dispute',
          dtoFieldName: 'finServTransactionsJSON',
          label: 'Recent Transactions',
          defaultPayloadJson: JSON.stringify({ title: 'Your recent transactions', transactions: [] }),
        })}
        accentColor="#0b5cab"
      />
    );
    // Empty transactions => transactions test-mode fallback (preview is always on stage).
    expect(screen.getByText(/Test mode/i)).toBeInTheDocument();
  });

  it('renders the advisor-appointment preview for finServAdvisorMeetingJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaFinServAdvisorMeeting',
          capabilityKey: 'advisor_appointment',
          dtoFieldName: 'finServAdvisorMeetingJSON',
          label: 'Advisor Appointment',
          defaultPayloadJson: JSON.stringify({ title: 'Book time with your advisor', advisor: { name: '' }, days: [] }),
        })}
        accentColor="#0b5cab"
      />
    );
    expect(screen.getByText(/Test mode/i)).toBeInTheDocument();
  });

  it('renders the money-movement preview for finServMoneyMovementJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaFinServMoneyMovement',
          capabilityKey: 'money_movement',
          dtoFieldName: 'finServMoneyMovementJSON',
          label: 'Money Movement',
          defaultPayloadJson: JSON.stringify({ title: 'Send money', recipients: [], amountPresets: [] }),
        })}
        accentColor="#0b5cab"
      />
    );
    expect(screen.getByText(/Test mode/i)).toBeInTheDocument();
  });
});

describe('CltPlayground — healthcare dispatch by dtoFieldName', () => {
  it('renders the appointment-scheduler preview for healthcareApptSchedulerJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaHealthcareApptScheduler',
          industryKey: 'healthcare',
          capabilityKey: 'appointment_scheduler',
          dtoFieldName: 'healthcareApptSchedulerJSON',
          label: 'Appointment Scheduler',
          defaultPayloadJson: JSON.stringify({ title: 'Book a visit', provider: { name: '' }, days: [] }),
        })}
        accentColor="#0f766e"
      />
    );
    expect(screen.getByText(/Test mode/i)).toBeInTheDocument();
  });

  it('renders the find-care preview for healthcareFindCareJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaHealthcareFindCare',
          industryKey: 'healthcare',
          capabilityKey: 'find_care',
          dtoFieldName: 'healthcareFindCareJSON',
          label: 'Find Care Near You',
          defaultPayloadJson: JSON.stringify({ title: 'Care near you', facilities: [] }),
        })}
        accentColor="#0f766e"
      />
    );
    expect(screen.getByText(/Test mode/i)).toBeInTheDocument();
  });

  it('renders the care-options preview for healthcareCareOptionsJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaHealthcareCareOptions',
          industryKey: 'healthcare',
          capabilityKey: 'care_options',
          dtoFieldName: 'healthcareCareOptionsJSON',
          label: 'Care Options',
          defaultPayloadJson: JSON.stringify({ title: 'How would you like to get care?', options: [] }),
        })}
        accentColor="#0f766e"
      />
    );
    expect(screen.getByText(/Test mode/i)).toBeInTheDocument();
  });

  it('renders the prescription-refill preview for healthcareRxRefillJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaHealthcareRxRefill',
          industryKey: 'healthcare',
          capabilityKey: 'rx_refill',
          dtoFieldName: 'healthcareRxRefillJSON',
          label: 'Prescription Refill',
          defaultPayloadJson: JSON.stringify({ title: 'Refill prescriptions', medications: [] }),
        })}
        accentColor="#0f766e"
      />
    );
    expect(screen.getByText(/Test mode/i)).toBeInTheDocument();
  });
});

describe('CltPlayground — Technology, Media & Comms', () => {
  it('renders the plan-comparison preview for tmcPlanCompareJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaTmcPlanCompare',
          industryKey: 'technology_comms',
          capabilityKey: 'plan_compare',
          dtoFieldName: 'tmcPlanCompareJSON',
          label: 'Plan Comparison',
          defaultPayloadJson: JSON.stringify({ title: 'Compare plans', plans: [] }),
        })}
        accentColor="#0891b2"
      />
    );
    expect(screen.getByText(/Test mode/i)).toBeInTheDocument();
  });

  it('renders the data-usage preview for tmcDataUsageJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaTmcDataUsage',
          industryKey: 'technology_comms',
          capabilityKey: 'data_usage',
          dtoFieldName: 'tmcDataUsageJSON',
          label: 'Data Usage Meter',
          defaultPayloadJson: JSON.stringify({ title: 'Your data this cycle' }),
        })}
        accentColor="#0891b2"
      />
    );
    expect(screen.getByText(/Test mode/i)).toBeInTheDocument();
  });

  it('renders the service-status preview for tmcServiceStatusJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaTmcServiceStatus',
          industryKey: 'technology_comms',
          capabilityKey: 'service_status',
          dtoFieldName: 'tmcServiceStatusJSON',
          label: 'Service Status',
          defaultPayloadJson: JSON.stringify({ title: 'Service status', services: [] }),
        })}
        accentColor="#0891b2"
      />
    );
    expect(screen.getByText(/Test mode/i)).toBeInTheDocument();
  });

  it('renders the bill-explainer preview for tmcBillExplainerJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaTmcBillExplainer',
          industryKey: 'technology_comms',
          capabilityKey: 'bill_explainer',
          dtoFieldName: 'tmcBillExplainerJSON',
          label: 'Bill Explainer',
          defaultPayloadJson: JSON.stringify({ title: 'Your bill', items: [] }),
        })}
        accentColor="#0891b2"
      />
    );
    expect(screen.getByText(/Test mode/i)).toBeInTheDocument();
  });
});

describe('CltPlayground — Manufacturing', () => {
  it('renders the equipment-monitor preview for mfgEquipmentMonitorJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaMfgEquipmentMonitor', industryKey: 'manufacturing', capabilityKey: 'equipment_monitor',
          dtoFieldName: 'mfgEquipmentMonitorJSON', label: 'Equipment Monitor',
          defaultPayloadJson: JSON.stringify({ title: 'Machine health', asset: { name: '' }, metrics: [] }),
        })}
        accentColor="#334155"
      />
    );
    expect(screen.getByText(/Test mode/i)).toBeInTheDocument();
  });

  it('renders the part-reorder preview for mfgPartReorderJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaMfgPartReorder', industryKey: 'manufacturing', capabilityKey: 'part_reorder',
          dtoFieldName: 'mfgPartReorderJSON', label: 'Part Reorder',
          defaultPayloadJson: JSON.stringify({ title: 'Reorder part', part: { name: '' } }),
        })}
        accentColor="#334155"
      />
    );
    expect(screen.getByText(/Test mode/i)).toBeInTheDocument();
  });

  it('renders the work-order preview for mfgWorkOrderJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaMfgWorkOrder', industryKey: 'manufacturing', capabilityKey: 'work_order',
          dtoFieldName: 'mfgWorkOrderJSON', label: 'Work Order Tracker',
          defaultPayloadJson: JSON.stringify({ title: 'Work order', milestones: [] }),
        })}
        accentColor="#334155"
      />
    );
    expect(screen.getByText(/Test mode/i)).toBeInTheDocument();
  });

  it('renders the quote-builder preview for mfgQuoteBuilderJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaMfgQuoteBuilder', industryKey: 'manufacturing', capabilityKey: 'quote_builder',
          dtoFieldName: 'mfgQuoteBuilderJSON', label: 'Quote Builder',
          defaultPayloadJson: JSON.stringify({ title: 'Configure your quote', optionGroups: [] }),
        })}
        accentColor="#334155"
      />
    );
    expect(screen.getByText(/Test mode/i)).toBeInTheDocument();
  });
});

describe('CltPlayground — Energy & Utilities', () => {
  it('renders the outage-tracker preview for energyOutageTrackerJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaEnergyOutageTracker', industryKey: 'energy_utilities', capabilityKey: 'outage_tracker',
          dtoFieldName: 'energyOutageTrackerJSON', label: 'Outage Tracker',
          defaultPayloadJson: JSON.stringify({ title: 'Outage status', steps: [] }),
        })}
        accentColor="#d97706"
      />
    );
    expect(screen.getByText(/Test mode/i)).toBeInTheDocument();
  });

  it('renders the usage-cost preview for energyUsageCostJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaEnergyUsageCost', industryKey: 'energy_utilities', capabilityKey: 'usage_cost',
          dtoFieldName: 'energyUsageCostJSON', label: 'Usage & Cost',
          defaultPayloadJson: JSON.stringify({ title: 'Your energy this cycle', bars: [], breakdown: [] }),
        })}
        accentColor="#d97706"
      />
    );
    expect(screen.getByText(/Test mode/i)).toBeInTheDocument();
  });

  it('renders the budget-billing preview for energyBudgetBillingJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaEnergyBudgetBilling', industryKey: 'energy_utilities', capabilityKey: 'budget_billing',
          dtoFieldName: 'energyBudgetBillingJSON', label: 'Budget Billing',
          defaultPayloadJson: JSON.stringify({ title: 'Smooth out your bill', bullets: [] }),
        })}
        accentColor="#d97706"
      />
    );
    expect(screen.getByText(/Test mode/i)).toBeInTheDocument();
  });

  it('renders the rebate-offers preview for energyRebateOffersJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaEnergyRebateOffers', industryKey: 'energy_utilities', capabilityKey: 'rebate_offers',
          dtoFieldName: 'energyRebateOffersJSON', label: 'Rebate Offers',
          defaultPayloadJson: JSON.stringify({ title: 'Rebates you qualify for', offers: [] }),
        })}
        accentColor="#d97706"
      />
    );
    expect(screen.getByText(/Test mode/i)).toBeInTheDocument();
  });
});
