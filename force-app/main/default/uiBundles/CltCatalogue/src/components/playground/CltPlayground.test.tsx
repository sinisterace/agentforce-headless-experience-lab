import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CltPlayground } from './CltPlayground';
import type { Recommendation } from '@/types/catalog';

/**
 * The customer-facing test-mode badge was removed from the editors; these
 * dispatch tests now assert the dispatched editor still renders a non-blank
 * card (the never-blank fallback), via the shared .clt-live-preview root.
 */
function expectNonBlankPreview() {
  const preview = document.querySelector('.clt-live-preview');
  expect(preview).toBeTruthy();
  expect((preview?.textContent ?? '').trim().length).toBeGreaterThan(0);
}

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
    expectNonBlankPreview();
    expect(screen.getByText('Rewards Card')).toBeInTheDocument();
  });

  it('exposes the live JSON payload via the Source inspector', () => {
    render(<CltPlayground recommendation={rec()} accentColor="#0b5cab" />);
    // The DTO field name is called out in the inspector subheader on the Structure view.
    expect(screen.getByText('finServAccountSelectorJSON')).toBeInTheDocument();
    // The Source view exposes the package, including the Input (JSON payload) sub-tab.
    fireEvent.click(screen.getByRole('tab', { name: /Source/i }));
    expect(screen.getByRole('tab', { name: /Input/i })).toBeInTheDocument();
  });

  it('offers Structure and Source inspector views (redundant Data tab + Edit removed)', () => {
    render(<CltPlayground recommendation={rec()} accentColor="#0b5cab" />);
    expect(screen.getByRole('tab', { name: /Structure/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Source/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /^Data$/i })).not.toBeInTheDocument();
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
    expectNonBlankPreview();
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
    expectNonBlankPreview();
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
    expectNonBlankPreview();
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
    expectNonBlankPreview();
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
    expectNonBlankPreview();
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
    expectNonBlankPreview();
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
    expectNonBlankPreview();
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
    expectNonBlankPreview();
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
    expectNonBlankPreview();
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
    expectNonBlankPreview();
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
    expectNonBlankPreview();
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
    expectNonBlankPreview();
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
    expectNonBlankPreview();
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
    expectNonBlankPreview();
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
    expectNonBlankPreview();
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
    expectNonBlankPreview();
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
    expectNonBlankPreview();
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
    expectNonBlankPreview();
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
    expectNonBlankPreview();
  });
});

describe('CltPlayground — HVAC', () => {
  it('renders the thermostat preview for hvacThermostatJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaHvacThermostat', industryKey: 'hvac', capabilityKey: 'thermostat_control',
          dtoFieldName: 'hvacThermostatJSON', label: 'Smart Thermostat Control',
          defaultPayloadJson: JSON.stringify({ title: 'Thermostat' }),
        })}
        accentColor="#0369a1"
      />
    );
    expectNonBlankPreview();
  });

  it('renders the tech-tracker preview for hvacTechTrackerJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaHvacTechTracker', industryKey: 'hvac', capabilityKey: 'tech_tracker',
          dtoFieldName: 'hvacTechTrackerJSON', label: 'Technician ETA Tracker',
          defaultPayloadJson: JSON.stringify({ title: 'Your technician is on the way', steps: [] }),
        })}
        accentColor="#0369a1"
      />
    );
    expectNonBlankPreview();
  });

  it('renders the system-health preview for hvacSystemHealthJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaHvacSystemHealth', industryKey: 'hvac', capabilityKey: 'system_health',
          dtoFieldName: 'hvacSystemHealthJSON', label: 'Comfort System Health Report',
          defaultPayloadJson: JSON.stringify({ title: 'Your comfort system checkup', systems: [] }),
        })}
        accentColor="#0369a1"
      />
    );
    expectNonBlankPreview();
  });

  it('renders the service-plan preview for hvacServicePlanJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaHvacServicePlan', industryKey: 'hvac', capabilityKey: 'service_plan',
          dtoFieldName: 'hvacServicePlanJSON', label: 'Service Plan Selector',
          defaultPayloadJson: JSON.stringify({ title: 'Choose a comfort plan', plans: [] }),
        })}
        accentColor="#0369a1"
      />
    );
    expectNonBlankPreview();
  });
});

describe('CltPlayground — Automotive', () => {
  it('renders the configurator preview for autoConfiguratorJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaAutoConfigurator', industryKey: 'automotive', capabilityKey: 'vehicle_configurator',
          dtoFieldName: 'autoConfiguratorJSON', label: 'Vehicle Configurator',
          defaultPayloadJson: JSON.stringify({ title: 'Build your vehicle', optionGroups: [] }),
        })}
        accentColor="#dc2626"
      />
    );
    expectNonBlankPreview();
  });

  it('renders the test-drive preview for autoTestDriveJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaAutoTestDrive', industryKey: 'automotive', capabilityKey: 'test_drive',
          dtoFieldName: 'autoTestDriveJSON', label: 'Test Drive Scheduler',
          defaultPayloadJson: JSON.stringify({ title: 'Book a test drive', vehicle: { name: '' }, days: [] }),
        })}
        accentColor="#dc2626"
      />
    );
    expectNonBlankPreview();
  });

  it('renders the vehicle-status preview for autoVehicleStatusJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaAutoVehicleStatus', industryKey: 'automotive', capabilityKey: 'vehicle_status',
          dtoFieldName: 'autoVehicleStatusJSON', label: 'Connected Car Status',
          defaultPayloadJson: JSON.stringify({ title: 'Your vehicle', tires: [], items: [] }),
        })}
        accentColor="#dc2626"
      />
    );
    expectNonBlankPreview();
  });

  it('renders the trade-in preview for autoTradeInJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaAutoTradeIn', industryKey: 'automotive', capabilityKey: 'trade_in',
          dtoFieldName: 'autoTradeInJSON', label: 'Trade-In Estimator',
          defaultPayloadJson: JSON.stringify({ title: 'Your trade-in estimate', factors: [] }),
        })}
        accentColor="#dc2626"
      />
    );
    expectNonBlankPreview();
  });
});

describe('CltPlayground — Public Sector & Education', () => {
  it('renders the application-status preview for pseAppStatusJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaPseAppStatus', industryKey: 'public_sector', capabilityKey: 'application_status',
          dtoFieldName: 'pseAppStatusJSON', label: 'Application Status Tracker',
          defaultPayloadJson: JSON.stringify({ title: 'Your application status', steps: [] }),
        })}
        accentColor="#1e3a8a"
      />
    );
    expectNonBlankPreview();
  });

  it('renders the programs-finder preview for pseProgramsFinderJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaPseProgramsFinder', industryKey: 'public_sector', capabilityKey: 'programs_finder',
          dtoFieldName: 'pseProgramsFinderJSON', label: 'Programs & Benefits Finder',
          defaultPayloadJson: JSON.stringify({ title: 'Programs & benefits', programs: [] }),
        })}
        accentColor="#1e3a8a"
      />
    );
    expectNonBlankPreview();
  });

  it('renders the service-request preview for pseServiceRequestJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaPseServiceRequest', industryKey: 'public_sector', capabilityKey: 'service_request',
          dtoFieldName: 'pseServiceRequestJSON', label: 'Service Request',
          defaultPayloadJson: JSON.stringify({ title: 'Report a problem', requestTypes: [] }),
        })}
        accentColor="#1e3a8a"
      />
    );
    expectNonBlankPreview();
  });

  it('renders the documents-checklist preview for pseDocsChecklistJSON', () => {
    render(
      <CltPlayground
        recommendation={rec({
          cltApiName: 'asaPseDocsChecklist', industryKey: 'public_sector', capabilityKey: 'documents_checklist',
          dtoFieldName: 'pseDocsChecklistJSON', label: 'Documents Checklist',
          defaultPayloadJson: JSON.stringify({ title: "Documents you'll need", documents: [] }),
        })}
        accentColor="#1e3a8a"
      />
    );
    expectNonBlankPreview();
  });
});
