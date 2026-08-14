import { Banknote, Building2, CreditCard, Landmark, User } from 'lucide-react';
import type { FromAccount } from './payloads';

/**
 * Presentation helpers for the Money Movement card, split out of the component
 * file so React Fast Refresh stays happy (a module that mixes component and
 * non-component exports can't hot-reload in place).
 *
 * These mirror the deployed asaFinServMoneyMovement LWC exactly.
 */

/** Row icon by recipient type. */
export function recipientTypeIcon(type?: string) {
  switch (String(type || 'person').toLowerCase()) {
    case 'card':
      return CreditCard;
    case 'account':
      return Landmark;
    case 'business':
      return Building2;
    case 'external':
      return Banknote;
    default: // person
      return User;
  }
}

export function formatMoney(amount: number, currency = 'USD'): string {
  const num = Number(amount);
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number.isNaN(num) ? 0 : num);
  } catch {
    return `${currency} ${(Number.isNaN(num) ? 0 : num).toFixed(2)}`;
  }
}

/** "From" line: object → "Everyday Checking ••1234"; string → itself. */
export function buildFromLabel(fromAccount?: FromAccount | string): string {
  if (!fromAccount) return '';
  if (typeof fromAccount === 'string') return fromAccount;
  const mask = fromAccount.mask ? ` ••${fromAccount.mask}` : '';
  return `${fromAccount.label || ''}${mask}`.trim();
}

/**
 * Source-node display parts: account name + masked tail split apart so the
 * "From" tile can style the mask separately. Mirrors the LWC buildFromParts.
 */
export function buildFromParts(fromAccount?: FromAccount | string): { name: string; mask: string } {
  if (!fromAccount) return { name: '', mask: '' };
  if (typeof fromAccount === 'string') return { name: fromAccount, mask: '' };
  return {
    name: fromAccount.label || 'Your account',
    mask: fromAccount.mask ? `•• ${fromAccount.mask}` : '',
  };
}

/** Recipient detail line: "Checking · •• 4821". */
export function recipientDetail(detail?: string, mask?: string): string {
  const parts = [detail, mask ? `•• ${mask}` : ''].filter((p) => p && String(p).trim());
  return parts.join(' · ');
}
