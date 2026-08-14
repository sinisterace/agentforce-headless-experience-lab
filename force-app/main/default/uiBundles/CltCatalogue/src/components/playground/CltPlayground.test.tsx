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

  it('re-renders the preview as accounts are edited in the inspector', () => {
    render(<CltPlayground recommendation={rec()} accentColor="#0b5cab" />);
    // Editing lives behind the inspector toggle → open it, switch to Edit.
    fireEvent.click(screen.getByRole('button', { name: /Structure & data/i }));
    fireEvent.click(screen.getByRole('tab', { name: /Edit/i }));
    fireEvent.click(screen.getByRole('button', { name: /Add account/i }));
    // New account appears in the preview.
    expect(screen.getByText('New account')).toBeInTheDocument();
  });

  it('exposes the live JSON payload with the LWC-true field name', () => {
    render(<CltPlayground recommendation={rec()} accentColor="#0b5cab" />);
    fireEvent.click(screen.getByRole('button', { name: /Structure & data/i }));
    fireEvent.click(screen.getByRole('tab', { name: /JSON/i }));
    // The DTO field name is called out in the inspector subheader.
    expect(screen.getByText('finServAccountSelectorJSON')).toBeInTheDocument();
  });
});

describe('CltPlayground — dispatch by dtoFieldName', () => {
  it('renders the recent-transactions editor for finServTransactionsJSON', () => {
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
    // The transactions editor is reachable via the inspector's Edit tab.
    fireEvent.click(screen.getByRole('button', { name: /Structure & data/i }));
    fireEvent.click(screen.getByRole('tab', { name: /Edit/i }));
    expect(screen.getByRole('button', { name: /Add transaction/i })).toBeInTheDocument();
  });

  it('renders the advisor-appointment editor for finServAdvisorMeetingJSON', () => {
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
    // No bookable slots => test-mode fallback (preview is always on stage).
    expect(screen.getByText(/Test mode/i)).toBeInTheDocument();
    // The appointment editor is reachable via the inspector's Edit tab.
    fireEvent.click(screen.getByRole('button', { name: /Structure & data/i }));
    fireEvent.click(screen.getByRole('tab', { name: /Edit/i }));
    expect(screen.getByRole('button', { name: /Add day/i })).toBeInTheDocument();
  });

  it('renders the money-movement editor for finServMoneyMovementJSON', () => {
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
    // No recipients => test-mode fallback (preview is always on stage).
    expect(screen.getByText(/Test mode/i)).toBeInTheDocument();
    // The money-movement editor is reachable via the inspector's Edit tab.
    fireEvent.click(screen.getByRole('button', { name: /Structure & data/i }));
    fireEvent.click(screen.getByRole('tab', { name: /Edit/i }));
    expect(screen.getByRole('button', { name: /Add recipient/i })).toBeInTheDocument();
  });
});

describe('CltPlayground — healthcare dispatch by dtoFieldName', () => {
  it('renders the appointment-scheduler editor for healthcareApptSchedulerJSON', () => {
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
    // No days with slots => test-mode fallback (preview is always on stage).
    expect(screen.getByText(/Test mode/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Structure & data/i }));
    fireEvent.click(screen.getByRole('tab', { name: /Edit/i }));
    expect(screen.getByRole('button', { name: /Add day/i })).toBeInTheDocument();
  });

  it('renders the find-care editor for healthcareFindCareJSON', () => {
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
    fireEvent.click(screen.getByRole('button', { name: /Structure & data/i }));
    fireEvent.click(screen.getByRole('tab', { name: /Edit/i }));
    expect(screen.getByRole('button', { name: /Add facility/i })).toBeInTheDocument();
  });

  it('renders the care-options editor for healthcareCareOptionsJSON', () => {
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
    fireEvent.click(screen.getByRole('button', { name: /Structure & data/i }));
    fireEvent.click(screen.getByRole('tab', { name: /Edit/i }));
    expect(screen.getByRole('button', { name: /Add option/i })).toBeInTheDocument();
  });

  it('renders the prescription-refill editor for healthcareRxRefillJSON', () => {
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
    fireEvent.click(screen.getByRole('button', { name: /Structure & data/i }));
    fireEvent.click(screen.getByRole('tab', { name: /Edit/i }));
    expect(screen.getByRole('button', { name: /Add medication/i })).toBeInTheDocument();
  });
});
