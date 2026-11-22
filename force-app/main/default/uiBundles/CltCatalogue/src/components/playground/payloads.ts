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

export type InsuranceIdCoverage = {
  /** e.g. "Liability", "Collision", "Comprehensive". */
  label: string;
  /** Optional limit/deductible detail, e.g. "$500 deductible". */
  detail?: string;
};

/** Digital proof-of-insurance ("insurance ID card") — a wallet-style card the
 *  visitor can pull up and share. Administrative only; no PII beyond what a
 *  physical ID card shows. */
export type InsuranceIdCardPayload = {
  /** Eyebrow above the card, e.g. "Proof of insurance". */
  title?: string;
  /** Carrier / brand name shown on the card. */
  carrier?: string;
  /** Line of business, e.g. "Auto". */
  policyType?: string;
  policyholder?: string;
  policyNumber?: string;
  /** Insured item, e.g. "2022 Tesla Model 3". */
  vehicle?: string;
  /** Plate or VIN-last-4. */
  plate?: string;
  effectiveDate?: string;
  expirationDate?: string;
  /** "Active" | "Lapsed" | ... drives the status pill. */
  status?: string;
  coverages?: InsuranceIdCoverage[];
  /** Primary action (agent hand-off), e.g. "Email me a copy". */
  submitText?: string;
  submitValue?: string;
  /** Secondary ghost action, e.g. "Add to wallet". */
  secondaryText?: string;
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
  /** Trust pill, e.g. "Accepting new patients". */
  badge?: string;
  /** Star rating, e.g. 4.9. */
  rating?: number;
  /** Optional review count shown beside the rating. */
  reviews?: number;
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
  /** Reassurance line under the picker, e.g. insurance / telehealth note. */
  note?: string;
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

/* ── Technology, Media & Communications ──────────────────────────────────── */

export type PlanComparePlan = {
  /** Stable identifier sent back to the agent when the plan is chosen. */
  id: string;
  name: string;
  /** Price in the payload (or plan) currency; rendered per cadence. */
  price: number;
  /** One short line under the name. */
  tagline?: string;
  /** Overrides the payload currency for this plan. */
  currency?: string;
  /** Short corner tag, e.g. "Most popular" — ignored on the current plan. */
  badge?: string;
  /** Accent-highlights this plan (at most one; not the current plan). */
  recommended?: boolean;
  /** Short check-marked feature strings (2–5). */
  features?: string[];
};

export type TmcPlanComparePayload = {
  title: string;
  subtitle?: string;
  /** ISO currency code for all plans without their own; defaults to USD. */
  currency?: string;
  /** Billing-period suffix: mo | yr | wk. Defaults to mo. */
  cadence?: string;
  /** id of the plan the customer is on — marked "Current plan", not selectable. */
  currentPlanId?: string;
  plans: PlanComparePlan[];
  /** Confirm-button label; defaults to "Switch plan". */
  submitText?: string;
};

export type UsageCategory = {
  label: string;
  amount: number;
  /** Hex color for the segment + dot; auto-assigned from a palette when absent. */
  color?: string;
};

export type TmcDataUsagePayload = {
  title?: string;
  /** Billing-cycle status line, e.g. "12 days left · resets Sep 30". */
  cycleText?: string;
  /** Amount consumed this cycle. Absent → the card shows its test-mode sample. */
  used?: number;
  /** The allowance; omit (or 0) for an unlimited plan. */
  total?: number;
  /** Unit of measure, e.g. GB | MB | min | texts. Defaults to GB. */
  unit?: string;
  /** Usage breakdown shown as a stacked bar + legend. */
  categories?: UsageCategory[];
  /** Short callout under the gauge (tinted amber near / red over the limit). */
  note?: string;
  /** Optional action-button label, e.g. "Add a data pass". */
  submitText?: string;
  submitValue?: string;
};

export type StatusService = {
  id?: string;
  name: string;
  /** operational | degraded | down | maintenance. Defaults to operational. */
  status?: string;
  /** One short line; defaults to the status label. */
  detail?: string;
  /** internet | tv | mobile | voice | home — picks the glyph. */
  icon?: string;
};

export type TmcServiceStatusPayload = {
  title?: string;
  /** operational | degraded | outage | maintenance; derived from services if omitted. */
  overall?: string;
  /** Short sentence under the banner label. */
  headline?: string;
  /** Affected location, e.g. neighborhood + ZIP. */
  area?: string;
  /** Estimated restore time, e.g. "Est. restore by 4:30 PM". */
  etaText?: string;
  /** Freshness stamp, e.g. "Updated 2 min ago". */
  updatedText?: string;
  services: StatusService[];
  /** Optional action-button label, e.g. "Notify me when it's fixed". */
  submitText?: string;
  submitValue?: string;
};

export type BillItem = {
  id?: string;
  label: string;
  /** Negative (or category "discount") renders as a credit. */
  amount: number;
  /** plan | data | device | streaming | taxes | onetime | discount | other. */
  category?: string;
};

export type TmcBillExplainerPayload = {
  title?: string;
  /** ISO currency code for all amounts; defaults to USD. */
  currency?: string;
  /** Total due; computed from items when omitted. */
  total?: number;
  /** Due date shown as a pill, e.g. "Due Sep 28". */
  dueDateText?: string;
  /** Billing period, e.g. "Sep 1 – Sep 30". */
  periodText?: string;
  items: BillItem[];
  /** Change vs last month; positive = up (amber), negative = down (green). */
  deltaAmount?: number;
  /** Short plain-language reason for the change. */
  deltaText?: string;
  /** Small footnote, e.g. an autopay reminder. */
  note?: string;
  /** Primary button label, e.g. "Pay now". */
  submitText?: string;
  submitValue?: string;
  /** Secondary button label, e.g. "Set up autopay". */
  secondaryText?: string;
  secondaryValue?: string;
};

/* ── Manufacturing ───────────────────────────────────────────────────────── */

export type EquipmentMetric = {
  label: string;
  value: string | number;
  unit?: string;
  /** good | warn | bad — colors the tile. */
  state?: string;
};

export type MfgEquipmentMonitorPayload = {
  title?: string;
  asset: { name: string; model?: string; assetId?: string; location?: string; imageUrl?: string };
  /** running | idle | fault | maintenance | offline. */
  status?: string;
  statusLabel?: string;
  updatedText?: string;
  metrics: EquipmentMetric[];
  trend?: { label?: string; points: number[] };
  submitText?: string;
  submitValue?: string;
};

export type MfgPartReorderPayload = {
  title?: string;
  part: {
    name: string;
    sku?: string;
    category?: string;
    imageUrl?: string;
    unitPrice?: number;
    currency?: string;
    leadTime?: string;
    inStock?: number;
    minOrder?: number;
    incrementStep?: number;
  };
  quantity?: number;
  submitText?: string;
  submitValue?: string;
};

export type WorkOrderMilestone = {
  label: string;
  /** done | current | todo. */
  state: string;
  timeText?: string;
  owner?: string;
};

export type MfgWorkOrderPayload = {
  title?: string;
  orderNumber?: string;
  product?: string;
  /** low | normal | high | urgent. */
  priority?: string;
  etaText?: string;
  updatedText?: string;
  milestones: WorkOrderMilestone[];
  submitText?: string;
  submitValue?: string;
};

export type QuoteLineItem = {
  id: string;
  /** Catalog / SKU number shown in the ITEM # column. */
  itemNumber?: string;
  description: string;
  /** Unit of measure, e.g. EA, BX, KIT. */
  uom?: string;
  unitPrice?: number;
  /** Starting quantity (default 1). */
  quantity?: number;
};

export type MfgQuoteBuilderPayload = {
  title?: string;
  /** Cart / quote reference shown in the header, e.g. "QT-00042". */
  cartId?: string;
  /** Small pill beside the title, e.g. "Draft quote". */
  statusLabel?: string;
  /** Customer / delivery site. */
  shipTo?: string;
  shipToId?: string;
  /** Billing account. */
  billTo?: string;
  currency?: string;
  /** Line items; empty → test-mode sample data. */
  lineItems: QuoteLineItem[];
  poLabel?: string;
  poPlaceholder?: string;
  /** Right-hand text beside "Shipping & Handling" before fees are calculated. */
  shippingText?: string;
  /** Acknowledgement checkbox copy; required before submit. */
  acknowledgeText?: string;
  /** Primary CTA (agent action). */
  submitText?: string;
  submitValue?: string;
  /** Secondary ghost button, e.g. "Save & close". */
  secondaryText?: string;
};

/* ── Energy & Utilities ──────────────────────────────────────────────────── */

export type EnergyOutageStep = {
  label: string;
  /** done | current | todo. */
  state: string;
  timeText?: string;
};

export type EnergyOutageTrackerPayload = {
  title?: string;
  /** investigating | outage | restoring | restored — drives the hero color + label. */
  status?: string;
  headline?: string;
  /** Affected location, e.g. neighborhood + ZIP. */
  area?: string;
  cause?: string;
  affectedText?: string;
  etaText?: string;
  updatedText?: string;
  crew?: string;
  /** Restoration track; derived from status when omitted. */
  steps?: EnergyOutageStep[];
  submitText?: string;
  submitValue?: string;
};

export type EnergyUsageBar = {
  label?: string;
  value: number;
};

export type EnergyUsageBreakdown = {
  label: string;
  amount: number;
  /** Hex color for the segment + dot; auto-assigned from a palette when absent. */
  color?: string;
};

export type EnergyUsageCostPayload = {
  title?: string;
  cycleText?: string;
  /** Projected bill amount; rendered large. Absent → the card shows its test-mode sample. */
  projectedCost?: number;
  currency?: string;
  /** Label above the projected cost; defaults to "Projected bill". */
  projectedText?: string;
  usedUnits?: number;
  /** Unit of measure; defaults to kWh. */
  unit?: string;
  /** Change vs last month as a percent — negative = down (green), positive = up (amber). */
  deltaPct?: number;
  deltaText?: string;
  /** Usage columns rendered as a vertical bar chart. */
  bars?: EnergyUsageBar[];
  /** Cost drivers rendered as a segmented meter + legend. */
  breakdown?: EnergyUsageBreakdown[];
  submitText?: string;
  submitValue?: string;
};

export type EnergyBudgetSeries = {
  /** 6–12 recent monthly bills → the jagged actual line. */
  actual: number[];
  /** The flat budget line. */
  budget?: number;
};

export type EnergyBudgetBillingPayload = {
  title?: string;
  subtitle?: string;
  currency?: string;
  /** Flat monthly payment; rendered large. */
  monthlyAmount?: number;
  currentAvgText?: string;
  termText?: string;
  series?: EnergyBudgetSeries;
  bullets?: string[];
  submitText?: string;
  submitValue?: string;
  secondaryText?: string;
  secondaryValue?: string;
};

export type EnergyRebateOffer = {
  /** Stable identifier sent back to the agent on selection. */
  id: string;
  name: string;
  /** thermostat | hvac | heat_pump | ev_charger | solar | insulation | water_heater | appliance. */
  category?: string;
  /** Shown large in the voucher stub. */
  rebateAmount?: number;
  detail?: string;
  /** Small corner tag, e.g. "Popular". */
  badge?: string;
};

export type EnergyRebateOffersPayload = {
  title?: string;
  subtitle?: string;
  currency?: string;
  offers: EnergyRebateOffer[];
  /** Confirm-button label; defaults to "Apply for rebate". */
  submitText?: string;
  submitValue?: string;
};

/* ── HVAC ────────────────────────────────────────────────────────────────── */

export type HvacThermostatPreset = {
  /** Stable id sent back on selection. */
  id: string;
  label: string;
  targetTemp: number;
  /** heat | cool | auto | off | fan — optional; inherits the card mode when absent. */
  mode?: string;
};

export type HvacThermostatPayload = {
  title?: string;
  /** Current indoor temperature; shown large in the dial center. Absent → test-mode sample. */
  currentTemp?: number;
  /** Target setpoint; defaults to currentTemp. */
  targetTemp?: number;
  /** heat | cool | auto | off | fan — drives the dial + accent color. Defaults to auto. */
  mode?: string;
  /** F | C. Defaults to F. */
  unit?: string;
  /** Indoor humidity percent, shown as a chip. */
  humidity?: number;
  statusText?: string;
  /** Dial + stepper bounds. Default 50 / 90 (F). */
  minTemp?: number;
  maxTemp?: number;
  presets?: HvacThermostatPreset[];
  submitText?: string;
  submitValue?: string;
};

export type HvacTechStep = {
  label: string;
  /** done | current | todo. */
  state: string;
  timeText?: string;
};

export type HvacTechnician = {
  name: string;
  role?: string;
  /** Numeric rating, rendered as a star + value. */
  rating?: number;
  /** Falls back to initials if it fails to load. */
  photoUrl?: string;
  /** 1–2 letters; derived from name when absent. */
  initials?: string;
  /** Short specialties line. */
  skills?: string;
};

export type HvacJob = {
  number?: string;
  /** The service reason, e.g. "AC not cooling". */
  type?: string;
  address?: string;
};

export type HvacTechTrackerPayload = {
  title?: string;
  /** scheduled | dispatched | enroute | arriving | onsite | complete — drives the hero + derived track. */
  status?: string;
  headline?: string;
  etaText?: string;
  windowText?: string;
  updatedText?: string;
  technician?: HvacTechnician;
  job?: HvacJob;
  /** En-route track; derived from status when omitted. */
  steps?: HvacTechStep[];
  submitText?: string;
  submitValue?: string;
  secondaryText?: string;
  secondaryValue?: string;
};

export type HvacSystemRow = {
  label: string;
  /** good | watch | due | fault — drives the pill + left-rail color. */
  status: string;
  detail?: string;
  /** furnace | ac | thermostat | ductwork | filter | heatpump | water_heater. */
  icon?: string;
};

export type HvacFilterLife = {
  /** 0–100 bar fill; green >50, amber 20–50, red <20. */
  lifePct: number;
  daysLeft?: number;
  label?: string;
};

export type HvacSystemHealthPayload = {
  title?: string;
  /** 0–100 overall health; rendered as a radial gauge. Absent → test-mode sample. */
  score?: number;
  scoreLabel?: string;
  statusText?: string;
  updatedText?: string;
  systems?: HvacSystemRow[];
  filter?: HvacFilterLife;
  nextServiceText?: string;
  recommendationText?: string;
  submitText?: string;
  submitValue?: string;
};

export type HvacPlan = {
  /** Stable identifier sent back to the agent on selection. */
  id: string;
  name: string;
  /** Shown large; formatted as currency. */
  price?: number;
  tagline?: string;
  /** Small ribbon tag, e.g. "Most popular". */
  badge?: string;
  /** Adds an accent highlight border. */
  recommended?: boolean;
  /** Included benefits rendered as a checklist. */
  features?: string[];
  /** Per-plan currency override; falls back to the payload currency. */
  currency?: string;
};

export type HvacServicePlanPayload = {
  title?: string;
  subtitle?: string;
  currency?: string;
  /** mo | yr | wk — rendered as a price suffix (/mo, /yr, /wk). */
  cadence?: string;
  /** id of the customer's current plan; that card is locked, not selectable. */
  currentPlanId?: string;
  plans: HvacPlan[];
  /** Confirm-button label; defaults to "Enroll in plan". */
  submitText?: string;
  submitValue?: string;
};

/* ── Automotive ──────────────────────────────────────────────────────────── */

/** Shared vehicle reference across the Automotive cards. */
export type AutoVehicleRef = {
  name: string;
  /** Trim/color line (Configurator, Test Drive, Connected Car Status). */
  trim?: string;
  /** Condition/mileage line (Trade-In). */
  detail?: string;
  /** Full image URL; falls back to initials if it fails to load. */
  imageUrl?: string;
  /** 1–2 letters shown when there is no image. */
  initials?: string;
};

/* Vehicle Configurator */
export type AutoColor = {
  id: string;
  label: string;
  /** CSS color for the swatch, e.g. "#dc2626". */
  hex?: string;
  /** Added to the estimate; default 0. */
  priceDelta?: number;
  /** The default color. */
  selected?: boolean;
};

export type AutoConfigOption = {
  id: string;
  label: string;
  priceDelta?: number;
  detail?: string;
};

export type AutoOptionGroup = {
  id: string;
  label: string;
  /** Default option id; else the first option. */
  selectedId?: string;
  options: AutoConfigOption[];
};

export type AutoConfiguratorPayload = {
  title?: string;
  model?: string;
  currency?: string;
  basePrice?: number;
  colors?: AutoColor[];
  optionGroups?: AutoOptionGroup[];
  submitText?: string;
  submitValue?: string;
};

/* Test Drive Scheduler */
export type AutoLocation = {
  name?: string;
  address?: string;
};

export type AutoTestDriveSlot = {
  /** Stable id sent back on selection. */
  id: string;
  /** 24h "HH:MM"; rendered as "1:30 PM". */
  time: string;
  /** showroom | at_home — drives the slot glyph + hue. */
  driveType?: string;
};

export type AutoTestDriveDay = {
  /** ISO "YYYY-MM-DD". */
  date: string;
  slots: AutoTestDriveSlot[];
};

export type AutoTestDrivePayload = {
  title?: string;
  vehicle?: AutoVehicleRef;
  location?: AutoLocation;
  days: AutoTestDriveDay[];
  submitText?: string;
};

/* Connected Car Status */
export type AutoRange = {
  value: number;
  total?: number;
  /** mi | km. */
  unit?: string;
};

export type AutoTire = {
  /** FL | FR | RL | RR. */
  pos: string;
  psi?: number;
  /** good | low | high. */
  status?: string;
};

export type AutoStatusItem = {
  label: string;
  value?: string;
  /** good | watch | bad. */
  status?: string;
};

export type AutoVehicleStatusPayload = {
  title?: string;
  vehicle?: AutoVehicleRef;
  isElectric?: boolean;
  range?: AutoRange;
  battery?: number;
  odometer?: number;
  odometerUnit?: string;
  tires?: AutoTire[];
  items?: AutoStatusItem[];
  alerts?: string[];
  updatedText?: string;
  submitText?: string;
  submitValue?: string;
};

/* Trade-In Estimator */
export type AutoTradeInFactor = {
  label: string;
  detail?: string;
  /** positive | neutral | negative — drives the up/down glyph + color. */
  impact?: string;
};

export type AutoTradeInPayload = {
  title?: string;
  vehicle?: AutoVehicleRef;
  currency?: string;
  /** Estimated trade-in value, shown large. Absent → test-mode sample. */
  estimate?: number;
  /** Range floor; defaults to estimate × 0.9. */
  low?: number;
  /** Range ceiling; defaults to estimate × 1.1. Marker sits at estimate. */
  high?: number;
  offerText?: string;
  factors?: AutoTradeInFactor[];
  submitText?: string;
  submitValue?: string;
  secondaryText?: string;
  secondaryValue?: string;
};

/* ── Public Sector & Education ───────────────────────────────────────────── */

export type PseAppStep = {
  label: string;
  /** done | current | todo | denied. */
  state?: string;
  /** Optional short date shown under the step, e.g. "Sep 3". */
  timeText?: string;
};

export type PseAppStatusPayload = {
  title?: string;
  /** What the application is for, e.g. "Building permit", "Admission application". */
  applicationType?: string;
  /** The case/reference id, shown prominently. */
  referenceNumber?: string;
  /** submitted | review | approved | issued | denied — drives the tracker + pill. */
  status?: string;
  statusLabel?: string;
  submittedText?: string;
  updatedText?: string;
  /** Progress track; derived from status when omitted. */
  steps?: PseAppStep[];
  nextActionText?: string;
  submitText?: string;
  submitValue?: string;
};

export type PseProgram = {
  /** Stable id sent back on selection. */
  id: string;
  name: string;
  /** assistance | education | health | housing | tax | employment | utility — drives the card glyph. */
  category?: string;
  detail?: string;
  /** Short pill, e.g. "Likely eligible". */
  eligibility?: string;
  /** Small corner tag, e.g. "Popular". */
  badge?: string;
};

export type PseProgramsFinderPayload = {
  title?: string;
  subtitle?: string;
  programs: PseProgram[];
  /** Confirm-button label; defaults to "Apply for selected". */
  submitText?: string;
  submitValue?: string;
};

export type PseRequestType = {
  /** Stable id sent back on selection. */
  id: string;
  label: string;
  description?: string;
  /** road | light | graffiti | trash | water | building | tree | sidewalk | noise | other. */
  icon?: string;
};

export type PseServiceRequestPayload = {
  title?: string;
  subtitle?: string;
  /** Optional context banner (address / intersection) above the grid. */
  locationText?: string;
  requestTypes: PseRequestType[];
  submitText?: string;
  submitValue?: string;
};

export type PseDocument = {
  /** Stable id sent back on selection. */
  id: string;
  name: string;
  detail?: string;
  /** required | received | optional. 'received' → shown checked, not selectable. */
  status?: string;
};

export type PseDocsChecklistPayload = {
  title?: string;
  subtitle?: string;
  documents: PseDocument[];
  submitText?: string;
  submitValue?: string;
};

/* ── Legal ─────────────────────────────────────────────────────────────────── */

/** One practice-area card in the Legal Practice-Area Selector. */
export type LegalPracticeArea = {
  /** Stable id sent back on selection. */
  id: string;
  name: string;
  /** One-line description, e.g. "Divorce, custody & support". */
  blurb?: string;
  /** injury | family | estate | business | immigration | criminal | employment | realestate | other. */
  icon?: string;
  /** Longer paragraph revealed when the row is expanded. */
  description?: string;
  /** Common matter types shown as chips, e.g. ["Car accidents", "Slip & fall"]. */
  services?: string[];
  /** A single trust signal, e.g. "$50M+ recovered" or "Free consultation". */
  stat?: string;
  /** The firm's practice-area page. Rendered as a display-only "Learn more"
   * affordance (styled like a link but intentionally not clickable). */
  href?: string;
};

export type LegalPracticeAreasPayload = {
  title?: string;
  subtitle?: string;
  areas: LegalPracticeArea[];
  /** "Learn more" link label (default "Learn more"). */
  linkText?: string;
  submitText?: string;
  submitValue?: string;
};

/** One question in the Free Case Evaluation intake. */
export type LegalEvalQuestion = {
  id: string;
  label: string;
  /** choice → selectable pills; date → a date input. Defaults to choice. */
  type?: string;
  options?: string[];
};

export type LegalCaseEvaluationPayload = {
  title?: string;
  subtitle?: string;
  /** The matter/practice area this review is about, shown as a banner chip. */
  matter?: string;
  questions: LegalEvalQuestion[];
  describeLabel?: string;
  describePlaceholder?: string;
  /** Consent checkbox label (e.g. agree to Privacy Policy / Terms). */
  consentText?: string;
  /** Legal disclaimer — accurately, that a web submission does NOT create an
   *  attorney–client relationship (not that it's privileged). */
  disclaimer?: string;
  /** Footer note, e.g. expected response time. */
  footerNote?: string;
  submitText?: string;
  submitValue?: string;
};

/** One attorney in the Meet Your Attorney matcher. */
export type LegalAttorney = {
  id: string;
  name: string;
  /** Role, e.g. "Managing Partner". */
  title?: string;
  /** Practice focus, e.g. "Personal Injury & Litigation". */
  focus?: string;
  /** Headshot URL (falls back to initials). */
  photo?: string;
  initials?: string;
  /** Years of experience. */
  years?: number;
  /** Star rating 0–5. */
  rating?: number;
  /** Matters handled, e.g. "500+". */
  casesWon?: string;
  /** Bar admission, e.g. "CA #148203". */
  bar?: string;
  blurb?: string;
};

export type LegalAttorneyMatchPayload = {
  title?: string;
  subtitle?: string;
  attorneys: LegalAttorney[];
  submitText?: string;
  submitValue?: string;
};

/** One selectable time slot in the Consultation Scheduler. */
export type LegalConsultSlot = {
  id: string;
  label: string;
  disabled?: boolean;
};

/** One day column in the Consultation Scheduler. */
export type LegalConsultDay = {
  id: string;
  label: string;
  sublabel?: string;
  slots: LegalConsultSlot[];
};

/** One consultation mode (in person / phone / video). */
export type LegalConsultMode = {
  id: string;
  label: string;
  /** in_person | phone | video. */
  icon?: string;
};

export type LegalConsultSchedulerPayload = {
  title?: string;
  subtitle?: string;
  attorneyName?: string;
  /** Attorney title/focus shown in the hero, e.g. "Managing Partner · Personal Injury". */
  attorneyTitle?: string;
  /** Headshot: a bundled key ("lawyer-1"|"lawyer-2"|"lawyer-3") or an image URL. */
  attorneyPhoto?: string;
  modes?: LegalConsultMode[];
  days: LegalConsultDay[];
  /** Reassurance line under the picker. */
  note?: string;
  submitText?: string;
  submitValue?: string;
};

/* ── Travel & Hospitality ────────────────────────────────────────────────── */

export type TravelSeat = {
  /** Seat label, e.g. "14A". */
  id: string;
  row: number;
  col: string;
  /** open | taken | selected (default open). */
  status?: string;
  /** standard | extra_legroom | exit | premium (drives colour + price). */
  kind?: string;
  /** Add-on price for the seat. */
  price?: number;
};

export type TravelSeatMapPayload = {
  title?: string;
  /** Context line, e.g. "SFO → JFK · Flight AF128". */
  flight?: string;
  /** Column letters in order, e.g. ["A","B","C","D","E","F"]. */
  columns?: string[];
  /** Aisle gap is drawn after this column letter. */
  aisleAfter?: string;
  /** Seats; empty → test-mode sample. */
  seats: TravelSeat[];
  currency?: string;
  submitText?: string;
  submitValue?: string;
};

export type TravelAirportPoint = {
  /** Airport code, e.g. "SFO". */
  code: string;
  city?: string;
  /** Scheduled/estimated time, e.g. "10:35 AM". */
  time?: string;
  gate?: string;
  terminal?: string;
  /** Baggage-claim belt (destination only). */
  baggage?: string;
};

export type TravelFlightStatusPayload = {
  title?: string;
  /** scheduled | boarding | departed | in_air | landed | delayed | cancelled. */
  status?: string;
  statusLabel?: string;
  origin?: TravelAirportPoint;
  dest?: TravelAirportPoint;
  /** 0–100 — the plane's position along the route arc. */
  progressPct?: number;
  aircraft?: string;
  durationText?: string;
  updatedText?: string;
  submitText?: string;
  submitValue?: string;
};

export type TravelBoardingPassPayload = {
  title?: string;
  airline?: string;
  passenger?: string;
  from?: string;
  fromCity?: string;
  to?: string;
  toCity?: string;
  flight?: string;
  date?: string;
  boardingTime?: string;
  departTime?: string;
  gate?: string;
  terminal?: string;
  seat?: string;
  /** Boarding group, e.g. "B". */
  group?: string;
  status?: string;
  submitText?: string;
  submitValue?: string;
  secondaryText?: string;
};

export type TravelRoom = {
  id: string;
  name: string;
  /** e.g. "1 King bed". */
  bed?: string;
  /** e.g. "420 sq ft". */
  size?: string;
  sleeps?: number;
  amenities?: string[];
  price?: number;
  cadence?: string;
  currency?: string;
  imageUrl?: string;
  /** e.g. "Only 2 left" / "Best value". */
  badge?: string;
};

export type TravelRoomSelectorPayload = {
  title?: string;
  subtitle?: string;
  rooms: TravelRoom[];
  currency?: string;
  submitText?: string;
  submitValue?: string;
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
  | 'insuranceIdCardJSON'
  | 'healthcareApptSchedulerJSON'
  | 'healthcareFindCareJSON'
  | 'healthcareCareOptionsJSON'
  | 'healthcareRxRefillJSON'
  | 'retailProductCarouselJSON'
  | 'retailOrderTrackingJSON'
  | 'retailReturnsJSON'
  | 'retailStorePickupJSON'
  | 'tmcPlanCompareJSON'
  | 'tmcDataUsageJSON'
  | 'tmcServiceStatusJSON'
  | 'tmcBillExplainerJSON'
  | 'mfgEquipmentMonitorJSON'
  | 'mfgPartReorderJSON'
  | 'mfgWorkOrderJSON'
  | 'mfgQuoteBuilderJSON'
  | 'energyOutageTrackerJSON'
  | 'energyUsageCostJSON'
  | 'energyBudgetBillingJSON'
  | 'energyRebateOffersJSON'
  | 'hvacThermostatJSON'
  | 'hvacTechTrackerJSON'
  | 'hvacSystemHealthJSON'
  | 'hvacServicePlanJSON'
  | 'autoConfiguratorJSON'
  | 'autoTestDriveJSON'
  | 'autoVehicleStatusJSON'
  | 'autoTradeInJSON'
  | 'pseAppStatusJSON'
  | 'pseProgramsFinderJSON'
  | 'pseServiceRequestJSON'
  | 'pseDocsChecklistJSON'
  | 'legalPracticeAreasJSON'
  | 'legalCaseEvaluationJSON'
  | 'legalAttorneyMatchJSON'
  | 'legalConsultSchedulerJSON'
  | 'travelSeatMapJSON'
  | 'travelFlightStatusJSON'
  | 'travelBoardingPassJSON'
  | 'travelRoomSelectorJSON'
  | 'ecwSalesPipelineJSON'
  | 'ecwNeedsAttentionJSON' | 'ecwForecastJSON' | 'ecwWhatChangedJSON'
  | 'ecwFieldDispatchJSON' | 'ecwEscalationJSON' | 'ecwCase360JSON' | 'ecwCsatPulseJSON'
  | 'ecwCampaignFunnelJSON' | 'ecwPerformanceMatrixJSON' | 'ecwAbTestJSON' | 'ecwAudienceExplorerJSON'
  | 'ecwSystemStatusJSON' | 'ecwKnownIssuesJSON' | 'ecwChangeCalendarJSON' | 'ecwMyItRequestsJSON'
  | 'ecwBudgetActualJSON' | 'ecwApApprovalsJSON' | 'ecwArAgingJSON' | 'ecwMonthEndCloseJSON'
  | 'ecwHeadcountJSON' | 'ecwTimeOffJSON' | 'ecwOpenRolesJSON' | 'ecwOnboardingJSON'
  | 'ecwCardJSON';

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
