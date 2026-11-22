import { CreditCard, Landmark, PiggyBank, TrendingUp, Wallet } from 'lucide-react';

/**
 * Presentation helpers for the Account Selector, split out of the component file
 * so React Fast Refresh stays happy (a module that mixes component and
 * non-component exports can't hot-reload in place).
 */

/** Row icon by account type. */
export function accountTypeIcon(type: string) {
  switch (type) {
    case 'Savings':
      return PiggyBank;
    case 'Credit Card':
      return CreditCard;
    case 'Investment':
      return TrendingUp;
    case 'Loan':
      return Landmark;
    default:
      return Wallet;
  }
}

/** Per-type card-hue modifier class (mirrors the deployed LWC's wallet cards). */
export function accountTypeModifier(type: string): string {
  switch ((type || '').toLowerCase()) {
    case 'savings':
      return 'is-savings';
    case 'credit card':
    case 'credit':
      return 'is-credit';
    case 'loan':
      return 'is-loan';
    case 'investment':
      return 'is-investment';
    default:
      return 'is-checking';
  }
}

/** Format a numeric balance as currency; falls back gracefully for odd input. */
export function formatMoney(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
}
