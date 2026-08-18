import type { TileNode } from './TileRenderer';
import type {
  FinServAccountSelectorPayload,
  FinServTransactionsPayload,
  FinServAdvisorMeetingPayload,
  FinServMoneyMovementPayload,
} from '@/components/playground/payloads';

/**
 * Per-CLT BuilderKit tile builders for the Financial Services CLTs. Each returns
 * a Slack "tile/mosaic" node tree (see TileRenderer) composed from the CLT's
 * LWC-true payload — the authentic way these CLTs render in Slack (declarative
 * tiles), distinct from the Enhanced Chat v2 LWC. Data is resolved inline rather
 * than left as "{!$attrs.…}" bindings since we render with the payload in hand.
 */

const t = (definition: string, attributes?: Record<string, any>, children?: TileNode[]): TileNode => ({ type: 'block', definition, attributes, children });
const text = (text: string, attributes: Record<string, any> = {}): TileNode => t('tile/text', { text, ...attributes });

function money(amount?: number, currency = 'USD'): string {
  const n = Number(amount);
  if (!isFinite(n)) return '';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

function shortDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function weekdayDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function time12(hhmm?: string): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm || ''));
  if (!m) return String(hhmm || '');
  let h = Number(m[1]);
  const min = m[2];
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${min} ${ap}`;
}

const ACCOUNT_ICON: Record<string, string> = {
  checking: 'wallet', savings: 'landmark', 'credit card': 'card', credit: 'card', loan: 'building', investment: 'up',
};
const RECIPIENT_ICON: Record<string, string> = {
  person: 'user', card: 'card', account: 'cash', business: 'building', external: 'landmark',
};

/** Wrap card content in a mosaic → single container → padded column. */
function shell(children: TileNode[]): TileNode {
  return t('tile/mosaic', undefined, [
    t('tile/container', undefined, [t('tile/column', { gap: 'md', padding: 'md' }, children)]),
  ]);
}

/* ── #1 Account Selector ─────────────────────────────────────────────────── */
function accountSelector(p: FinServAccountSelectorPayload): TileNode {
  const accounts = (p.accounts ?? []).filter((a) => a && a.name);
  const rows = accounts.map((a) => {
    const icon = ACCOUNT_ICON[String(a.type || '').toLowerCase()] || 'wallet';
    const left = t('tile/row', { gap: 'sm', align: 'center' }, [
      t('tile/icon', { name: icon, size: 'md', color: 'primary' }),
      t('tile/column', { gap: 'none' }, [
        text(a.name, { variant: 'body', weight: 'semibold' }),
        text(`${a.type}${a.mask ? ` ••${a.mask}` : ''}`, { variant: 'caption', color: 'muted' }),
      ]),
    ]);
    const rightKids: TileNode[] = [text(money(a.balance, a.currency), { variant: 'body', weight: 'bold' })];
    if (a.badge) rightKids.push(t('tile/badge', { label: a.badge, variant: 'info', size: 'sm' }));
    const right = t('tile/column', { gap: 'xs', align: 'end' }, rightKids);
    return t('tile/container', undefined, [
      t('tile/row', { justify: 'between', align: 'center', padding: 'sm' }, [left, right]),
    ]);
  });
  return shell([
    text(p.title || 'Which account can I help you with?', { variant: 'h2', weight: 'bold' }),
    t('tile/column', { gap: 'sm' }, rows),
    t('tile/button', { label: p.submitText || 'Continue', variant: 'primary' }),
  ]);
}

/* ── #2 Recent Transactions ──────────────────────────────────────────────── */
function transactions(p: FinServTransactionsPayload): TileNode {
  const txns = (p.transactions ?? []).filter((x) => x && x.merchant);
  const rows = txns.map((x) => {
    const credit = Number(x.amount) > 0;
    const amt = `${credit ? '+' : ''}${money(x.amount, x.currency)}`;
    return {
      merchant: x.merchant,
      date: shortDate(x.date),
      amount: amt,
      amountClass: credit ? 'credit' : 'debit',
    };
  });
  const kids: TileNode[] = [text(p.title || 'Your recent transactions', { variant: 'h2', weight: 'bold' })];
  if (p.accountLabel) kids.push(text(p.accountLabel, { variant: 'caption', color: 'muted' }));
  kids.push(
    t('tile/table', {
      columns: [
        { key: 'merchant', header: 'Merchant' },
        { key: 'date', header: 'Date' },
        { key: 'amount', header: 'Amount' },
      ],
      rows,
      ariaLabel: 'Recent transactions',
      variant: 'striped',
      hoverable: true,
    }),
    t('tile/button', { label: p.disputeText || 'Dispute a charge', variant: 'default' }),
  );
  return shell(kids);
}

/* ── #3 Advisor Appointment ──────────────────────────────────────────────── */
function advisorMeeting(p: FinServAdvisorMeetingPayload): TileNode {
  const advisor = p.advisor ?? { name: 'Your advisor' };
  const advisorRow = t('tile/row', { gap: 'sm', align: 'center' }, [
    t('tile/icon', { name: 'user', size: 'lg', color: 'primary' }),
    t('tile/column', { gap: 'none' }, [
      text(advisor.name, { variant: 'body', weight: 'semibold' }),
      ...(advisor.title || advisor.specialty ? [text([advisor.title, advisor.specialty].filter(Boolean).join(' · '), { variant: 'caption', color: 'muted' })] : []),
    ]),
  ]);
  const dayBlocks: TileNode[] = [];
  (p.days ?? []).forEach((d) => {
    const slots = (d.slots ?? []).filter((s) => s && s.time);
    if (!slots.length) return;
    dayBlocks.push(
      t('tile/column', { gap: 'sm' }, [
        text(weekdayDate(d.date), { variant: 'h4', weight: 'semibold' }),
        t('tile/row', { gap: 'sm', wrap: true }, slots.map((s) => t('tile/button', { label: time12(s.time), variant: 'default' }))),
      ]),
    );
  });
  return shell([
    text(p.title || 'Book time with your advisor', { variant: 'h2', weight: 'bold' }),
    t('tile/container', undefined, [t('tile/column', { padding: 'sm' }, [advisorRow])]),
    ...dayBlocks,
    t('tile/button', { label: p.submitText || 'Book appointment', variant: 'primary' }),
  ]);
}

/* ── #4 Money Movement ───────────────────────────────────────────────────── */
function moneyMovement(p: FinServMoneyMovementPayload): TileNode {
  const recipients = (p.recipients ?? []).filter((r) => r && r.name);
  const currency = p.currency || 'USD';
  const recRows = recipients.map((r) => {
    const icon = RECIPIENT_ICON[String(r.type || '').toLowerCase()] || 'user';
    return t('tile/row', { gap: 'sm', align: 'center' }, [
      t('tile/icon', { name: icon, size: 'md', color: 'primary' }),
      t('tile/column', { gap: 'none' }, [
        text(r.name, { variant: 'body', weight: 'semibold' }),
        ...(r.detail || r.mask ? [text([r.detail, r.mask ? `••${r.mask}` : ''].filter(Boolean).join(' · '), { variant: 'caption', color: 'muted' })] : []),
      ]),
    ]);
  });
  const chips = (p.amountPresets ?? []).map((a) => t('tile/button', { label: a.label || money(a.amount, currency), variant: 'default' }));
  if (p.allowOther) chips.push(t('tile/button', { label: p.otherText || 'Other amount', variant: 'default' }));

  const kids: TileNode[] = [text(p.title || 'Send money', { variant: 'h2', weight: 'bold' })];
  if (p.fromAccount) kids.push(text(`From ${p.fromAccount.label}${p.fromAccount.mask ? ` ••${p.fromAccount.mask}` : ''}`, { variant: 'caption', color: 'muted' }));
  kids.push(
    text('Recipient', { variant: 'h4', weight: 'semibold' }),
    t('tile/container', undefined, [t('tile/column', { gap: 'sm', padding: 'sm' }, recRows)]),
  );
  if (chips.length) {
    kids.push(text('Amount', { variant: 'h4', weight: 'semibold' }), t('tile/row', { gap: 'sm', wrap: true }, chips));
  }
  kids.push(t('tile/button', { label: p.submitText || 'Continue', variant: 'primary' }));
  return shell(kids);
}

/* ── generic fallback (non-FS CLTs) ──────────────────────────────────────── */
function generic(label: string, description?: string): TileNode {
  const kids: TileNode[] = [text(label || 'Custom Lightning Type', { variant: 'h2', weight: 'bold' })];
  if (description) kids.push(text(description, { variant: 'body', color: 'muted' }));
  kids.push(t('tile/badge', { label: 'Renders as Slack tiles', variant: 'info', size: 'sm' }));
  return shell(kids);
}

/**
 * Build the Slack tile tree for a CLT. Financial Services CLTs get bespoke
 * layouts; anything else falls back to a minimal tile card so the frame never
 * breaks when a non-FS CLT is selected.
 */
export function buildTiles(dtoFieldName: string, payload: any, meta: { label: string; description?: string }): TileNode {
  switch (dtoFieldName) {
    case 'finServAccountSelectorJSON':
      return accountSelector(payload as FinServAccountSelectorPayload);
    case 'finServTransactionsJSON':
      return transactions(payload as FinServTransactionsPayload);
    case 'finServAdvisorMeetingJSON':
      return advisorMeeting(payload as FinServAdvisorMeetingPayload);
    case 'finServMoneyMovementJSON':
      return moneyMovement(payload as FinServMoneyMovementPayload);
    default:
      return generic(meta.label, meta.description);
  }
}
