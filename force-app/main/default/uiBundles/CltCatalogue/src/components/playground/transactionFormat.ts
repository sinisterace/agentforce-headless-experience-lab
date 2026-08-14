import {
  ArrowLeftRight,
  ArrowDownCircle,
  CreditCard,
  ShoppingBag,
  ShoppingCart,
  Plane,
  Receipt,
  UtensilsCrossed,
} from 'lucide-react';

/**
 * Presentation helpers for the Recent Transactions card, split out of the
 * component file so React Fast Refresh stays happy (a module that mixes
 * component and non-component exports can't hot-reload in place).
 *
 * These mirror the deployed asaFinServTransactions LWC exactly.
 */

/** Row icon by category. */
export function transactionCategoryIcon(category?: string) {
  switch (String(category || 'Other').toLowerCase()) {
    case 'groceries':
      return ShoppingCart;
    case 'dining':
      return UtensilsCrossed;
    case 'travel':
      return Plane;
    case 'shopping':
      return ShoppingBag;
    case 'bills':
      return Receipt;
    case 'transfer':
      return ArrowLeftRight;
    case 'income':
      return ArrowDownCircle;
    default:
      return CreditCard;
  }
}

function formatMoney(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
}

/** Signed amount: debits "-$84.23", credits "+$2,450.00". */
export function formatSignedAmount(amount: number, currency = 'USD'): string {
  const num = Number(amount);
  const body = formatMoney(Math.abs(Number.isNaN(num) ? 0 : num), currency);
  return `${num < 0 ? '-' : '+'}${body}`;
}

/** ISO yyyy-mm-dd → "Aug 9" (parsed as a local date to avoid a tz day-shift). */
export function formatTransactionDate(value?: string): string {
  if (!value) return '';
  const s = String(value);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s;
  try {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
  } catch {
    return s;
  }
}
