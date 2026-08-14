/**
 * The LWC-true payload shapes for the CLTs. These are the field names the
 * deployed Lightning Web Components actually read from their DTO JSON string —
 * NOT the GenAiFunction prompt-schema names, which can differ.
 *
 * The playground edits against these shapes and the preview mirrors each LWC's
 * render, including its baked test-mode fallback when the list is empty. Seed
 * values come from the catalogue row's Default_Payload_JSON__c.
 */

export type AccountEntry = {
  /** Stable identifier sent back to the agent on selection. */
  id: string;
  name: string;
  /** Checking | Savings | Credit Card | Loan | Investment (drives the row icon). */
  type: string;
  /** Last 4 digits of the account number, shown masked. */
  mask: string;
  balance: number;
  /** ISO currency code; defaults to USD. */
  currency?: string;
  /** Optional available balance (e.g. available credit / after holds). */
  available?: number;
  /** Optional tag, e.g. "Primary". */
  badge?: string;
};

export type FinServAccountSelectorPayload = {
  title: string;
  mode: 'single' | 'multiple';
  accounts: AccountEntry[];
  /** Button label in multiple mode; defaults to "Continue". */
  submitText?: string;
};

export type TransactionEntry = {
  /** Stable identifier sent back to the agent when disputed. */
  id: string;
  merchant: string;
  /** ISO yyyy-mm-dd. */
  date: string;
  /** Negative for money out (debits), positive for money in (credits). */
  amount: number;
  /** ISO currency code; defaults to USD. */
  currency?: string;
  /** Groceries | Dining | Travel | Shopping | Bills | Transfer | Income | Other (drives the row icon). */
  category?: string;
  /** e.g. "Posted" or "Pending"; "Pending" shows a pill. */
  status?: string;
  /** Set false to show but disable selection (e.g. income, already disputed). */
  disputable?: boolean;
};

export type FinServTransactionsPayload = {
  title: string;
  /** The account these transactions belong to, e.g. "Everyday Checking ••1234". */
  accountLabel?: string;
  transactions: TransactionEntry[];
  /** Confirm-button label; defaults to "Dispute this charge". */
  disputeText?: string;
};

export type MeetingSlot = {
  /** Stable identifier sent back to the agent when booked. */
  id: string;
  /** 24-hour "HH:MM" preferred (e.g. "09:00", "14:30"); rendered as "9:00 AM". */
  time: string;
  /** video | phone | in-branch (drives the slot icon); defaults to video. */
  meetingType?: string;
};

export type MeetingDay = {
  /** ISO yyyy-mm-dd. */
  date: string;
  slots: MeetingSlot[];
};

export type Advisor = {
  name: string;
  /** e.g. "Senior Financial Advisor". */
  title?: string;
  /** A short focus line, e.g. "Retirement planning". */
  specialty?: string;
  /** https image URL for the avatar. */
  photoUrl?: string;
  /** 1-2 letters shown when there is no photo; auto-derived from name if omitted. */
  initials?: string;
};

export type FinServAdvisorMeetingPayload = {
  title: string;
  advisor: Advisor;
  days: MeetingDay[];
  /** Confirm-button label; defaults to "Book appointment". */
  submitText?: string;
};

export type Recipient = {
  /** Stable identifier sent back to the agent on selection. */
  id: string;
  name: string;
  /** person | card | account | business | external (drives the row icon). */
  type?: string;
  /** Last 4 digits, shown masked. */
  mask?: string;
  /** Short descriptor, e.g. "Checking" or "Credit Card". */
  detail?: string;
};

export type AmountPreset = {
  /** Stable identifier sent back to the agent on selection. */
  id: string;
  amount: number;
  /** Chip label; if omitted the amount is formatted as currency. */
  label?: string;
};

export type FromAccount = {
  label: string;
  /** Last 4 digits. */
  mask?: string;
};

export type FinServMoneyMovementPayload = {
  title: string;
  /** The account the money comes from. */
  fromAccount?: FromAccount;
  recipients: Recipient[];
  amountPresets: AmountPreset[];
  /** ISO currency code; defaults to USD. */
  currency?: string;
  /** Show an "Other amount" chip that hands off to the conversation. */
  allowOther?: boolean;
  /** "Other amount" chip label; defaults to "Other amount". */
  otherText?: string;
  /** Confirm-button label; defaults to "Continue". */
  submitText?: string;
};

/* ── Insurance ─────────────────────────────────────────────────────────── */

export type PolicyEntry = {
  /** Stable identifier sent back to the agent on selection. */
  id: string;
  name: string;
  /** Auto | Home | Renters | Life | Health | Umbrella | Pet | Travel (drives the card icon). */
  type: string;
  /** Last characters of the policy number, shown masked. */
  policyNumber?: string;
  /** Recurring premium amount. */
  premium?: number;
  /** How often the premium is billed, e.g. "monthly", "annual", "6-month". */
  cadence?: string;
  /** ISO currency code; defaults to USD. */
  currency?: string;
  /** ISO yyyy-mm-dd. */
  renewalDate?: string;
  /** Active | Pending | Lapsed | Cancelled (drives the status pill). */
  status: string;
  /** Short coverage summary, e.g. "Collision + Comprehensive · $500 deductible". */
  coverage?: string;
  /** Optional tag, e.g. "Primary". */
  badge?: string;
};

export type InsurancePolicySelectorPayload = {
  title: string;
  mode: 'single' | 'multiple';
  policies: PolicyEntry[];
  /** Button label in multiple mode; defaults to "Continue". */
  submitText?: string;
};

export type ClaimPolicyContext = {
  label: string;
  /** Last characters of the policy number. */
  policyNumber?: string;
  /** Photo of the insured item (e.g. the vehicle); shown as a rounded hero image above the label. Same-origin URL (e.g. /resource/<Name>) for Enhanced Chat v2. */
  imageUrl?: string;
};

export type IncidentType = {
  /** Stable identifier sent back to the agent on selection. */
  id: string;
  label: string;
  /** Optional one-line helper under the label. */
  description?: string;
  /** collision | theft | weather | water | fire | glass | liability | medical | other (drives the tile icon). */
  icon?: string;
};

export type InsuranceFileClaimPayload = {
  title: string;
  /** The policy the claim is filed against, shown as context. */
  policy?: ClaimPolicyContext;
  incidentTypes: IncidentType[];
  /** Confirm-button label; defaults to "Start claim". */
  submitText?: string;
};

export type ClaimStep = {
  label: string;
  /** done | current | todo. */
  state: string;
};

export type ClaimEntry = {
  /** Stable identifier sent back to the agent on selection. */
  id: string;
  claimNumber: string;
  /** e.g. "Auto collision". */
  type?: string;
  /** The policy this claim belongs to. */
  policyLabel?: string;
  /** ISO yyyy-mm-dd the claim was filed. */
  filedDate?: string;
  /** Claim amount / payout. */
  amount?: number;
  /** ISO currency code; defaults to USD. */
  currency?: string;
  /** submitted | review | approved | paid | denied (drives the stepper). */
  status: string;
  /** Optional display label override for the status. */
  statusLabel?: string;
  /** Optional explicit steps; otherwise derived from status. */
  steps?: ClaimStep[];
  /** ISO yyyy-mm-dd of the last update. */
  updatedDate?: string;
  /** Short next-action hint sent back on selection. */
  nextActionText?: string;
};

export type InsuranceClaimStatusPayload = {
  title: string;
  claims: ClaimEntry[];
  /** Button label; defaults to "View claim details". */
  submitText?: string;
};

/* ── Healthcare ────────────────────────────────────────────────────────── */

export type ApptProvider = {
  name: string;
  /** e.g. "Primary Care · Internal Medicine". */
  specialty?: string;
  /** 1-2 letters shown when there is no photo; auto-derived from name if omitted. */
  initials?: string;
  /** https image URL for the avatar. */
  imageUrl?: string;
};

export type ApptLocation = {
  name: string;
  address?: string;
};

export type ApptSlot = {
  /** Stable identifier sent back to the agent when booked. */
  id: string;
  /** 24-hour "HH:MM" (e.g. "09:00", "14:30"); rendered as "9:00 AM". */
  time: string;
  /** in-person | video | phone (drives the slot icon + hue); defaults to in-person. */
  visitType?: string;
};

export type ApptDay = {
  /** ISO yyyy-mm-dd. */
  date: string;
  slots: ApptSlot[];
};

export type HealthcareApptSchedulerPayload = {
  title: string;
  provider?: ApptProvider;
  location?: ApptLocation;
  days: ApptDay[];
  /** Confirm-button label; defaults to "Confirm appointment". */
  submitText?: string;
};

export type CareFacility = {
  /** Stable identifier (not sent back — the card is wayfinding only). */
  id: string;
  name: string;
  /** urgent_care | er | primary_care | pharmacy | clinic | hospital | lab | telehealth (drives the icon + hue). */
  type?: string;
  /** e.g. "0.8 mi". */
  distance?: string;
  /** true → "Open now" pill, false → "Closed"; omit for neither. */
  openNow?: boolean;
  hours?: string;
  waitTime?: string;
  address?: string;
  /** E.164 or local digits; rendered as a tel: link. */
  phone?: string;
  services?: string[];
  /** Google Maps (or any) URL opened by the Directions link. */
  mapsUrl?: string;
};

export type HealthcareFindCarePayload = {
  title: string;
  subtitle?: string;
  facilities: CareFacility[];
};

export type CareOption = {
  /** Stable identifier sent back to the agent on a 'book' action. */
  id: string;
  /** nurse_line | video | in_person | urgent | er | pharmacy | message (drives the icon + hue). */
  channel?: string;
  label: string;
  description?: string;
  /** Short trailing tag, e.g. "Avg wait 3 min", "$0 with your plan". */
  meta?: string;
  /** Marks the row with a "Recommended" ribbon. */
  recommended?: boolean;
  /** call | link | book — call/link render as redirect anchors, book hands back to the agent. */
  actionType: string;
  /** phone number (call), https URL (link), or the message text (book). */
  actionValue?: string;
};

export type HealthcareCareOptionsPayload = {
  title: string;
  subtitle?: string;
  options: CareOption[];
  /** Footnote shown with an alert icon, e.g. an emergency-care reminder. */
  disclaimer?: string;
};

export type RxMedication = {
  /** Stable identifier sent back to the agent on selection. */
  id: string;
  name: string;
  dosage?: string;
  /** Short supply note, e.g. "3 days left" or "In stock". */
  supplyText?: string;
  /** ok | low | out (drives the pill color); "out" rows are shown but not selectable. */
  status?: string;
  refillsLeft?: number;
};

export type RxPharmacy = {
  name: string;
  address?: string;
  hours?: string;
};

export type HealthcareRxRefillPayload = {
  title: string;
  subtitle?: string;
  medications: RxMedication[];
  pharmacy?: RxPharmacy;
  /** Confirm-button label; defaults to "Request refill" (with the selected count). */
  submitText?: string;
};

/* ── Retail ────────────────────────────────────────────────────────────── */

export type CarouselProduct = {
  /** Stable identifier sent back to the agent on Add to cart. */
  id: string;
  name: string;
  /** Stock-keeping unit, shown small + monospaced. */
  sku?: string;
  price: number;
  /** ISO currency code; defaults to the payload currency, then USD. */
  currency?: string;
  /** Original price; when higher than price, renders struck-through as a sale. */
  compareAtPrice?: number;
  /** 0–5, rendered as stars (halves allowed). */
  rating?: number;
  reviewCount?: number;
  /** https image URL or /resource/<Name>; when absent, a branded tile keyed by category. */
  imageUrl?: string;
  /** apparel | shoes | electronics | beauty | home | grocery | accessories | outdoors | toys (drives the placeholder glyph + hue). */
  category?: string;
  /** Short corner tag, e.g. "Bestseller", "New", "-20%". */
  badge?: string;
  /** in_stock | low | out — "out" disables Add to cart and dims the card. */
  availability?: string;
  /** Per-card CTA label; defaults to "Add to cart". */
  addLabel?: string;
};

export type RetailProductCarouselPayload = {
  title: string;
  subtitle?: string;
  products: CarouselProduct[];
  /** ISO currency code applied to every product without its own; defaults to USD. */
  currency?: string;
  /** Reserved / fallback CTA label; defaults to "Add to cart". */
  submitText?: string;
};

export type TrackingStep = {
  label: string;
  /** done | current | todo (drives the timeline dot + connector fill). */
  state: string;
  /** Optional trailing note, e.g. "2:04 PM" or "Today". */
  time?: string;
};

export type TrackingCourier = {
  name: string;
  /** bike | van | car | foot (drives the map marker glyph). */
  vehicle?: string;
  /** 1–2 letters shown when there is no photo; auto-derived from name if omitted. */
  initials?: string;
  /** https image URL or /resource/<Name> for the courier avatar. */
  photoUrl?: string;
  /** Short trailing tag, e.g. "4.9 ★". */
  rating?: string;
};

export type RetailOrderTrackingPayload = {
  title: string;
  /** true → a pulsing "LIVE" badge in the header. */
  live?: boolean;
  /** submitted | packed | out_for_delivery | delivered — positions the courier on the map and seeds the timeline when steps are omitted. */
  status?: string;
  /** Prominent ETA line, e.g. "Arriving 2:15–2:30 PM". */
  etaText?: string;
  courier?: TrackingCourier;
  /** The drop-off, shown on the map + under the ETA. */
  destination?: { label?: string; address?: string };
  /** Explicit timeline; when omitted it is derived from status. */
  steps?: TrackingStep[];
  /** Optional primary action → hands submitValue (or the label) back to the agent. */
  submitText?: string;
  submitValue?: string;
};

export type ReturnItem = {
  /** Stable identifier sent back to the agent on selection. */
  id: string;
  name: string;
  sku?: string;
  /** Purchased variant, e.g. "Size 10 · Black". */
  variant?: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  /** Placeholder glyph key when there is no image (see CarouselProduct.category). */
  category?: string;
};

export type ReturnReason = {
  /** Stable identifier sent back with the return. */
  id: string;
  label: string;
};

export type ReturnResolution = {
  id: string;
  /** refund | exchange | credit (drives the icon). */
  kind?: string;
  label: string;
  description?: string;
};

export type RetailReturnsPayload = {
  title: string;
  subtitle?: string;
  /** Context line, e.g. "Order #4821 · Mar 2". */
  orderLabel?: string;
  items: ReturnItem[];
  /** Reason chips the customer picks from. */
  reasons: ReturnReason[];
  /** How to make the customer whole; defaults to Refund / Exchange / Store credit. */
  resolutions?: ReturnResolution[];
  /** Confirm-button label; defaults to "Continue return". */
  submitText?: string;
};

export type PickupStore = {
  /** Stable identifier sent back to the agent on selection. */
  id: string;
  name: string;
  distance?: string;
  address?: string;
  hours?: string;
  /** in_stock | low | out — "out" is shown but not selectable. */
  availability?: string;
  /** When it will be ready, e.g. "Ready in 2 hours" or "Ready tomorrow 10 AM". */
  pickupEta?: string;
  /** E.164 or local digits; rendered as a tel: link. */
  phone?: string;
  /** Google Maps (or any) URL opened by the Directions link. */
  mapsUrl?: string;
};

export type PickupProduct = {
  name: string;
  /** e.g. "Size 10 · Black". */
  variant?: string;
  imageUrl?: string;
  category?: string;
};

export type RetailStorePickupPayload = {
  title: string;
  subtitle?: string;
  /** The item being picked up, shown as a context row above the stores. */
  product?: PickupProduct;
  stores: PickupStore[];
  /** Confirm-button label; defaults to "Reserve for pickup". */
  submitText?: string;
};

/** The DTO field name a CLT reads, taken from the catalogue row (dtoFieldName). */
export type CltKind =
  | 'finServAccountSelectorJSON'
  | 'finServTransactionsJSON'
  | 'finServAdvisorMeetingJSON'
  | 'finServMoneyMovementJSON'
  | 'insurancePolicySelectorJSON'
  | 'insuranceFileClaimJSON'
  | 'insuranceClaimStatusJSON'
  | 'healthcareApptSchedulerJSON'
  | 'healthcareFindCareJSON'
  | 'healthcareCareOptionsJSON'
  | 'healthcareRxRefillJSON'
  | 'retailProductCarouselJSON'
  | 'retailOrderTrackingJSON'
  | 'retailReturnsJSON'
  | 'retailStorePickupJSON';

export function safeParse<T>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}
