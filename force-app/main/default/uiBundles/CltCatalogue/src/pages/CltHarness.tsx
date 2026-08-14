import { useMemo, useState } from 'react';
import { AlertTriangle, RotateCcw, Sparkles } from 'lucide-react';
import { WIDGET_REGISTRY } from '@/components/playground/widgets/registry';
import { CltPlayground } from '@/components/playground/CltPlayground';
import { ChannelViewer } from '@/components/channels/ChannelViewer';
import { pretty, safeParse, type CltKind } from '@/components/playground/payloads';
import type { CompanyProfile, Recommendation } from '@/types/catalog';
import drMayaChen from '@/assets/dr-maya-chen.jpg';

/**
 * Standalone CLT dev harness (route: #preview). A design loop that is fully
 * decoupled from the intake → scan → confirm flow and needs no Apex/org: pick any
 * registered widget, edit its payload as raw JSON, and see it render live in the
 * HXL-style playground (Preview | Structure | Data + Edit) AND inside the client
 * channels (ChatGPT, Agentforce, Claude). `vite dev` gives instant HMR.
 *
 * It reuses the exact registry, CltPlayground, and ChannelViewer the real app
 * ships, so what you see here is what the catalogue renders — this file only
 * synthesizes a Recommendation + a throwaway CompanyProfile to drive them.
 */

const KINDS = Object.keys(WIDGET_REGISTRY) as CltKind[];

/** A future ISO date, `offset` days from today (browser runtime — Date is fine here). */
function isoInDays(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * A richer-than-defaults sample per widget so the harness opens on real content
 * (not the empty-payload test-mode fallback). Field names are LWC-true (see
 * payloads.ts). Financial-services-flavored so it doubles as a starting point.
 */
function sampleFor(kind: CltKind): Record<string, unknown> {
  switch (kind) {
    case 'finServMoneyMovementJSON':
      return {
        title: 'Send money',
        fromAccount: { label: 'Everyday Checking', mask: '1234' },
        recipients: [
          { id: 'rcp-1', name: 'Alex Rivera', type: 'person', mask: '4821', detail: 'Checking' },
          { id: 'rcp-2', name: 'Rewards Card', type: 'card', mask: '9012', detail: 'Credit Card' },
          { id: 'rcp-3', name: 'High-Yield Savings', type: 'account', mask: '5678', detail: 'Savings' },
        ],
        amountPresets: [
          { id: 'amt-1', label: '$50', amount: 50 },
          { id: 'amt-2', label: '$100', amount: 100 },
          { id: 'amt-3', label: '$250', amount: 250 },
          { id: 'amt-4', label: 'Minimum', amount: 35 },
        ],
        currency: 'USD',
        allowOther: true,
        otherText: 'Other amount',
        submitText: 'Continue',
      };
    case 'finServAdvisorMeetingJSON':
      return {
        title: 'Book time with your advisor',
        advisor: {
          name: 'Jordan Lee',
          title: 'Senior Financial Advisor',
          specialty: 'Retirement & investment planning',
          initials: 'JL',
        },
        days: [
          {
            date: isoInDays(3),
            slots: [
              { id: 'slot-1', time: '09:00', meetingType: 'video' },
              { id: 'slot-2', time: '10:30', meetingType: 'phone' },
              { id: 'slot-3', time: '13:00', meetingType: 'in-branch' },
            ],
          },
          {
            date: isoInDays(4),
            slots: [
              { id: 'slot-4', time: '11:00', meetingType: 'video' },
              { id: 'slot-5', time: '14:30', meetingType: 'phone' },
              { id: 'slot-6', time: '16:00', meetingType: 'in-branch' },
            ],
          },
        ],
        submitText: 'Book appointment',
      };
    case 'finServTransactionsJSON':
      return {
        title: 'Your recent transactions',
        accountLabel: 'Everyday Checking ••1234',
        transactions: [
          { id: 'txn-1', merchant: 'Whole Foods Market', date: isoInDays(-2), amount: -84.23, currency: 'USD', category: 'Groceries', status: 'Posted' },
          { id: 'txn-2', merchant: 'Delta Air Lines', date: isoInDays(-4), amount: -412.6, currency: 'USD', category: 'Travel', status: 'Posted' },
          { id: 'txn-3', merchant: 'Payroll Deposit', date: isoInDays(-5), amount: 2450.0, currency: 'USD', category: 'Income', status: 'Posted', disputable: false },
          { id: 'txn-4', merchant: 'Corner Bistro', date: isoInDays(-6), amount: -56.8, currency: 'USD', category: 'Dining', status: 'Pending' },
        ],
        disputeText: 'Dispute this charge',
      };
    case 'insurancePolicySelectorJSON':
      return {
        title: 'Which policy can I help you with?',
        mode: 'single',
        policies: [
          { id: 'pol-8842', name: 'Auto — 2022 Tesla Model 3', type: 'Auto', policyNumber: '8842', premium: 142.5, cadence: 'monthly', currency: 'USD', renewalDate: isoInDays(80), status: 'Active', coverage: 'Collision + Comprehensive · $500 deductible', badge: 'Primary' },
          { id: 'pol-3391', name: 'Homeowners — 14 Elm St', type: 'Home', policyNumber: '3391', premium: 1820.0, cadence: 'annual', currency: 'USD', renewalDate: isoInDays(190), status: 'Active', coverage: 'Dwelling $420k · $1,000 deductible' },
          { id: 'pol-5567', name: 'Term Life — 20yr', type: 'Life', policyNumber: '5567', premium: 48.0, cadence: 'monthly', currency: 'USD', renewalDate: isoInDays(400), status: 'Active', coverage: '$500,000 benefit' },
        ],
        submitText: 'Continue',
      };
    case 'insuranceFileClaimJSON':
      return {
        title: 'What happened?',
        policy: { label: 'Auto — 2022 Tesla Model 3', policyNumber: '8842', imageUrl: '/resource/asaInsuranceTeslaModel3' },
        incidentTypes: [
          { id: 'collision', label: 'Collision', description: 'Accident with another vehicle or object', icon: 'collision' },
          { id: 'theft', label: 'Theft or break-in', description: 'Vehicle or contents stolen', icon: 'theft' },
          { id: 'weather', label: 'Weather or storm', description: 'Hail, wind, flood, or fallen tree', icon: 'weather' },
          { id: 'glass', label: 'Glass or windshield', description: 'Cracked or shattered glass', icon: 'glass' },
        ],
        submitText: 'Start claim',
      };
    case 'insuranceClaimStatusJSON':
      return {
        title: 'Your claims',
        claims: [
          { id: 'clm-4471', claimNumber: 'CLM-4471', type: 'Collision', policyLabel: 'Auto — 2022 Tesla Model 3', filedDate: isoInDays(-14), amount: 3200.0, currency: 'USD', status: 'Review', statusLabel: 'In review', updatedDate: isoInDays(-7), nextActionText: 'Upload the repair estimate' },
          { id: 'clm-3120', claimNumber: 'CLM-3120', type: 'Water damage', policyLabel: 'Homeowners — 14 Elm St', filedDate: isoInDays(-60), amount: 8750.0, currency: 'USD', status: 'Paid', statusLabel: 'Paid', updatedDate: isoInDays(-40) },
        ],
        submitText: 'Ask about a claim',
      };
    case 'healthcareApptSchedulerJSON':
      return {
        title: 'Book a visit',
        provider: { name: 'Dr. Maya Chen', specialty: 'Primary Care · Internal Medicine', initials: 'MC', imageUrl: drMayaChen },
        location: { name: 'Yerba Buena Medical Group', address: '150 4th St, San Francisco' },
        days: [
          {
            date: isoInDays(3),
            slots: [
              { id: 's1', time: '09:00', visitType: 'in-person' },
              { id: 's2', time: '10:30', visitType: 'video' },
              { id: 's3', time: '13:15', visitType: 'phone' },
            ],
          },
          {
            date: isoInDays(4),
            slots: [
              { id: 's4', time: '09:30', visitType: 'video' },
              { id: 's5', time: '11:45', visitType: 'in-person' },
              { id: 's6', time: '15:00', visitType: 'in-person' },
            ],
          },
        ],
        submitText: 'Confirm appointment',
      };
    case 'healthcareFindCareJSON':
      return {
        title: 'Care near you',
        subtitle: 'Near Moscone Center · SoMa, San Francisco',
        facilities: [
          { id: 'f1', name: 'GoHealth Urgent Care – SoMa', type: 'urgent_care', distance: '0.3 mi', openNow: true, hours: 'Open until 8:00 PM', waitTime: '15 min wait', address: '876 Folsom St, San Francisco', phone: '+14155550142', services: ['X-ray', 'Labs', 'Stitches'], mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=876%20Folsom%20St%2C%20San%20Francisco%2C%20CA%2094107' },
          { id: 'f2', name: 'One Medical – Yerba Buena', type: 'primary_care', distance: '0.2 mi', openNow: true, hours: 'Open until 6:00 PM', address: '631 Mission St, San Francisco', phone: '+14155550111', services: ['Primary care', 'Vaccines', 'Labs'], mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=631%20Mission%20St%2C%20San%20Francisco%2C%20CA%2094105' },
          { id: 'f3', name: 'Saint Francis Memorial Hospital ER', type: 'er', distance: '1.5 mi', openNow: true, hours: 'Open 24 hours', address: '900 Hyde St, San Francisco', phone: '+14155550190', mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=900%20Hyde%20St%2C%20San%20Francisco%2C%20CA%2094109' },
          { id: 'f4', name: 'Walgreens Pharmacy – Powell St', type: 'pharmacy', distance: '0.6 mi', openNow: false, hours: 'Opens 8:00 AM Mon', address: '135 Powell St, San Francisco', phone: '+14155550170', services: ['Rx pickup', 'Vaccines'], mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=135%20Powell%20St%2C%20San%20Francisco%2C%20CA%2094102' },
        ],
      };
    case 'healthcareCareOptionsJSON':
      return {
        title: 'How would you like to get care?',
        subtitle: 'Choose the option that fits your needs',
        options: [
          { id: 'o1', channel: 'nurse_line', label: '24/7 Nurse Advice Line', description: 'Talk to a registered nurse now', meta: 'Avg wait 3 min', actionType: 'call', actionValue: '+18005551234' },
          { id: 'o2', channel: 'video', label: 'Video visit', description: 'See a provider by video in about 15 minutes', meta: '$0 with your plan', actionType: 'link', actionValue: 'https://example.com/video-visit', recommended: true },
          { id: 'o3', channel: 'in_person', label: 'Schedule an in-person visit', description: 'Book a time at a clinic near you', actionType: 'book', actionValue: 'Schedule an in-person visit' },
          { id: 'o4', channel: 'er', label: 'Emergency care', description: 'For severe or life-threatening symptoms', actionType: 'call', actionValue: '911' },
        ],
        disclaimer: 'If this is a medical emergency, call 911. This tool does not provide medical advice.',
      };
    case 'healthcareRxRefillJSON':
      return {
        title: 'Refill prescriptions',
        subtitle: 'Select the medications to refill',
        medications: [
          { id: 'm1', name: 'Atorvastatin', dosage: '20 mg tablet', supplyText: '3 days left', status: 'low', refillsLeft: 2 },
          { id: 'm2', name: 'Lisinopril', dosage: '10 mg tablet', supplyText: 'In stock', status: 'ok', refillsLeft: 5 },
          { id: 'm3', name: 'Metformin', dosage: '500 mg tablet', supplyText: 'No refills left', status: 'out', refillsLeft: 0 },
        ],
        pharmacy: { name: 'Walgreens · Market St', address: '700 Market St', hours: 'Open until 10 PM' },
        submitText: 'Request refill',
      };
    case 'retailProductCarouselJSON':
      return {
        title: 'Picked for you',
        subtitle: 'Based on your recent views',
        currency: 'USD',
        products: [
          { id: 'p1', name: 'Trailblazer Running Shoe', sku: 'TR3-BLK-10', category: 'shoes', price: 128, compareAtPrice: 160, rating: 4.7, reviewCount: 2140, badge: '-20%', availability: 'in_stock' },
          { id: 'p2', name: 'Everyday Merino Crew', sku: 'EMC-NVY-M', category: 'apparel', price: 68, rating: 4.8, reviewCount: 512, badge: 'New', availability: 'in_stock' },
          { id: 'p4', name: 'Summit 30L Daypack', sku: 'SMT-30-GRN', category: 'outdoors', price: 95, compareAtPrice: 120, rating: 4.6, reviewCount: 337, availability: 'out' },
        ],
      };
    case 'retailOrderTrackingJSON':
      return {
        title: 'Track order #4821',
        live: true,
        status: 'out_for_delivery',
        etaText: 'Arriving 2:15–2:30 PM',
        courier: { name: 'Alex Rivera', vehicle: 'bike', initials: 'AR', rating: '4.9 ★' },
        destination: { label: 'Home', address: '150 4th St, San Francisco' },
        steps: [
          { label: 'Order placed', state: 'done', time: '11:02 AM' },
          { label: 'Packed & ready', state: 'done', time: '12:20 PM' },
          { label: 'Out for delivery', state: 'current', time: '1:47 PM' },
          { label: 'Delivered', state: 'todo' },
        ],
        submitText: 'Message courier',
        submitValue: 'Message the courier about my order',
      };
    case 'retailReturnsJSON':
      return {
        title: 'Start a return',
        subtitle: "Choose what you'd like to send back",
        orderLabel: 'Order #4821 · Mar 2',
        items: [
          { id: 'i1', name: 'Trailblazer Running Shoe', sku: 'TR3-BLK-10', variant: 'Size 10 · Black', price: 128, category: 'shoes' },
          { id: 'i2', name: 'Everyday Merino Crew', sku: 'EMC-NVY-M', variant: 'Medium · Navy', price: 68, category: 'apparel' },
        ],
        reasons: [
          { id: 'too_small', label: 'Too small' },
          { id: 'too_large', label: 'Too large' },
          { id: 'changed_mind', label: 'Changed my mind' },
          { id: 'defective', label: 'Arrived damaged' },
          { id: 'wrong_item', label: 'Wrong item' },
        ],
        resolutions: [
          { id: 'refund', kind: 'refund', label: 'Refund', description: 'Back to original payment' },
          { id: 'exchange', kind: 'exchange', label: 'Exchange', description: 'Swap for another size' },
          { id: 'credit', kind: 'credit', label: 'Store credit', description: 'Instant, +5% bonus' },
        ],
        submitText: 'Continue return',
      };
    case 'retailStorePickupJSON':
      return {
        title: 'Pick up in store',
        subtitle: 'Ready today at a store near you',
        product: { name: 'Trailblazer Running Shoe', variant: 'Size 10 · Black', category: 'shoes' },
        stores: [
          { id: 's1', name: 'Union Square', distance: '0.4 mi', availability: 'in_stock', pickupEta: 'Ready in 2 hours', address: '333 Post St, San Francisco', hours: 'Open until 9:00 PM', phone: '+14155550142', mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=333%20Post%20St%2C%20San%20Francisco%2C%20CA%2094108' },
          { id: 's2', name: 'Marina District', distance: '2.1 mi', availability: 'low', pickupEta: 'Ready tomorrow 10 AM', address: '2190 Chestnut St, San Francisco', hours: 'Open until 8:00 PM', phone: '+14155550171', mapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=2190%20Chestnut%20St%2C%20San%20Francisco%2C%20CA%2094123' },
          { id: 's3', name: 'Stonestown Galleria', distance: '5.6 mi', availability: 'out', address: '3251 20th Ave, San Francisco', hours: 'Open until 9:00 PM' },
        ],
        submitText: 'Reserve for pickup',
      };
    default: // finServAccountSelectorJSON
      return {
        title: 'Which account can I help you with?',
        mode: 'single',
        accounts: [
          { id: 'chk-1234', name: 'Everyday Checking', type: 'Checking', mask: '1234', balance: 4820.55, currency: 'USD', badge: 'Primary' },
          { id: 'sav-5678', name: 'High-Yield Savings', type: 'Savings', mask: '5678', balance: 15230.0, currency: 'USD' },
          { id: 'crd-9012', name: 'Rewards Card', type: 'Credit Card', mask: '9012', balance: -742.18, currency: 'USD', available: 9257.82 },
        ],
      };
  }
}

/** Throwaway profile the channel frames read (companyName, accent, logo). */
const HARNESS_PROFILE: CompanyProfile = {
  companyName: 'Northern Trail Bank',
  website: 'https://northerntrailbank.example.com',
  industryKey: 'financial_services',
  industryLabel: 'Financial Services',
  summary: 'Harness preview profile.',
  planNarrative: '',
  accentColor: '#0b5cab',
  logoUrl: null,
  signals: [],
  plan: [],
  source: 'fallback',
};

export default function CltHarness() {
  const [kind, setKind] = useState<CltKind>(KINDS[0]);
  const [accent, setAccent] = useState('#0b5cab');
  const [draft, setDraft] = useState(() => pretty(sampleFor(KINDS[0])));

  // Only a valid JSON object drives the widgets; the last-good payload sticks
  // while you're mid-edit so the preview never flickers to an error state.
  const parsed = useMemo(() => safeParse<Record<string, unknown>>(draft), [draft]);
  const [applied, setApplied] = useState<Record<string, unknown>>(() => sampleFor(KINDS[0]));
  const jsonError = parsed === null;
  if (parsed && pretty(parsed) !== pretty(applied)) setApplied(parsed);

  function loadKind(next: CltKind) {
    setKind(next);
    const sample = sampleFor(next);
    setDraft(pretty(sample));
    setApplied(sample);
  }

  function resetKind() {
    loadKind(kind);
  }

  // Synthesize the Recommendation the playground + channels expect.
  const rec: Recommendation = useMemo(
    () => ({
      cltApiName: kind.replace(/JSON$/, ''),
      industryKey: 'harness',
      capabilityKey:
        kind === 'finServTransactionsJSON'
          ? 'transaction_dispute'
          : kind === 'finServAdvisorMeetingJSON'
            ? 'advisor_appointment'
            : kind === 'finServMoneyMovementJSON'
              ? 'money_movement'
              : kind === 'insurancePolicySelectorJSON'
                ? 'policy_selector'
                : kind === 'insuranceFileClaimJSON'
                  ? 'file_a_claim'
                  : kind === 'insuranceClaimStatusJSON'
                    ? 'status_tracker'
                    : kind === 'healthcareApptSchedulerJSON'
                      ? 'appointment_scheduler'
                      : kind === 'healthcareFindCareJSON'
                        ? 'find_care'
                        : kind === 'healthcareCareOptionsJSON'
                          ? 'care_options'
                          : kind === 'healthcareRxRefillJSON'
                            ? 'rx_refill'
                            : kind === 'retailProductCarouselJSON'
                              ? 'product_carousel'
                              : kind === 'retailOrderTrackingJSON'
                                ? 'order_tracking'
                                : kind === 'retailReturnsJSON'
                                  ? 'returns'
                                  : kind === 'retailStorePickupJSON'
                                    ? 'store_pickup'
                                    : 'account_selector',
      label: WIDGET_REGISTRY[kind].label,
      description: 'Dev-harness preview',
      displayOrder: 0,
      defaultPayloadJson: JSON.stringify(applied),
      dtoFieldName: kind,
    }),
    [kind, applied]
  );
  const profile = useMemo(() => ({ ...HARNESS_PROFILE, accentColor: accent }), [accent]);

  // Remount playground + channels when the payload changes so they re-seed.
  const seedKey = `${kind}:${rec.defaultPayloadJson}:${accent}`;

  return (
    <div className="harness theme-light" style={{ '--customer-accent': accent } as React.CSSProperties}>
      <header className="harness-header">
        <span className="harness-brand"><Sparkles aria-hidden="true" /> CLT Preview Harness</span>
        <div className="harness-controls">
          <label>
            Widget
            <select value={kind} onChange={(e) => loadKind(e.target.value as CltKind)}>
              {KINDS.map((k) => (
                <option value={k} key={k}>{WIDGET_REGISTRY[k].label} · {k}</option>
              ))}
            </select>
          </label>
          <label>
            Accent
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} />
          </label>
          <button type="button" onClick={resetKind}><RotateCcw aria-hidden="true" /> Reset sample</button>
          <a href="#" className="harness-exit">← Back to app</a>
        </div>
      </header>

      <div className="harness-body">
        <aside className="harness-payload">
          <div className="harness-payload-head">
            <strong>Payload JSON</strong>
            <small>{kind}</small>
          </div>
          <textarea
            className={jsonError ? 'harness-json invalid' : 'harness-json'}
            value={draft}
            spellCheck={false}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Payload JSON editor"
          />
          {jsonError && <p className="harness-json-error" role="alert"><AlertTriangle aria-hidden="true" /> Invalid JSON — preview shows the last valid payload.</p>}
        </aside>

        <main className="harness-canvas">
          <section className="harness-section">
            <h2>Playground — Preview · Structure · Data</h2>
            <CltPlayground key={`pg:${seedKey}`} recommendation={rec} accentColor={accent} />
          </section>

          <section className="harness-section">
            <h2>Client channels</h2>
            <ChannelViewer key={`ch:${seedKey}`} recommendation={rec} profile={profile} />
          </section>
        </main>
      </div>
    </div>
  );
}
