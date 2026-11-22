import { useMemo, useState } from 'react';
import type { AutoConfiguratorPayload } from './payloads';

/**
 * Live preview for the ASA Automotive · Vehicle Configurator CLT (DTO field
 * autoConfiguratorJSON). LWC-true fields: title?, model?, currency?, basePrice?,
 * colors[]{id,label,hex,priceDelta?,selected?}, optionGroups[]{id,label,
 * selectedId?,options[]{id,label,priceDelta?,detail?}}, submitText?, submitValue?.
 * An empty payload (no colors AND no optionGroups) drops into test-mode so it
 * renders with no payload — mirroring the LWC. Selection is interactive here.
 */

const TEST: AutoConfiguratorPayload = {
  title: 'Build your electric SUV',
  model: 'Electric SUV',
  currency: 'USD',
  basePrice: 41990,
  colors: [
    { id: 'white', label: 'Glacier White', hex: '#f3f4f6', priceDelta: 0 },
    { id: 'black', label: 'Midnight Black', hex: '#111827' },
    { id: 'red', label: 'Radiant Red', hex: '#dc2626', priceDelta: 595, selected: true },
  ],
  optionGroups: [
    { id: 'trim', label: 'Trim', selectedId: 'rs', options: [
      { id: 'lt', label: 'LT', priceDelta: 0 },
      { id: 'rs', label: 'RS', priceDelta: 3200, detail: 'Sport-tuned' },
    ] },
    { id: 'drive', label: 'Drivetrain', selectedId: 'awd', options: [
      { id: 'fwd', label: 'FWD', priceDelta: 0 },
      { id: 'awd', label: 'AWD', priceDelta: 2500 },
    ] },
    { id: 'pkg', label: 'Packages', selectedId: 'tech', options: [
      { id: 'none', label: 'None', priceDelta: 0 },
      { id: 'tech', label: 'Technology Package', priceDelta: 1800, detail: 'Adaptive cruise, HUD' },
    ] },
  ],
  submitText: 'Reserve this build',
};

function money(amount: number, currency = 'USD'): string {
  const n = Number(amount);
  if (!isFinite(n)) return '';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${currency} ${Math.round(n)}`;
  }
}

/** Faithful preview: mirrors the Vehicle Configurator LWC, including test-mode + live total. */
export function AutoConfiguratorPreview({ value, accentColor }: { value: AutoConfiguratorPayload; accentColor: string }) {
  const hasGroups = Array.isArray(value.optionGroups) && value.optionGroups.filter((g) => g && g.label && Array.isArray(g.options) && g.options.length).length > 0;
  const hasColors = Array.isArray(value.colors) && value.colors.filter((c) => c && c.id && c.label).length > 0;
  const isTestMode = !hasGroups && !hasColors;
  const src = isTestMode ? TEST : value;
  const currency = src.currency || 'USD';

  const colors = useMemo(
    () => (Array.isArray(src.colors) ? src.colors.filter((c) => c && c.id && c.label) : []),
    [src.colors]
  );
  const groups = useMemo(
    () => (Array.isArray(src.optionGroups) ? src.optionGroups.filter((g) => g && g.label && Array.isArray(g.options) && g.options.length) : []),
    [src.optionGroups]
  );

  const initialColor = colors.find((c) => c.selected)?.id ?? colors[0]?.id ?? '';
  const [colorId, setColorId] = useState(initialColor);
  const [sel, setSel] = useState<Record<string, string>>(() => {
    const s: Record<string, string> = {};
    groups.forEach((g) => {
      const valid = g.options.some((o) => o.id === g.selectedId);
      s[g.id] = valid && g.selectedId ? g.selectedId : g.options[0].id;
    });
    return s;
  });

  // Re-seed when a different payload is loaded (key changes remount, but guard anyway).
  const seedKey = useMemo(() => JSON.stringify([colors.map((c) => c.id), groups.map((g) => g.id)]), [colors, groups]);
  const [lastSeed, setLastSeed] = useState(seedKey);
  if (seedKey !== lastSeed) {
    setLastSeed(seedKey);
    setColorId(initialColor);
    const s: Record<string, string> = {};
    groups.forEach((g) => {
      const valid = g.options.some((o) => o.id === g.selectedId);
      s[g.id] = valid && g.selectedId ? g.selectedId : g.options[0].id;
    });
    setSel(s);
  }

  let total = Number(src.basePrice) || 0;
  const chosenColor = colors.find((c) => c.id === colorId);
  if (chosenColor) total += Number(chosenColor.priceDelta) || 0;
  groups.forEach((g) => {
    const opt = g.options.find((o) => o.id === sel[g.id]);
    if (opt) total += Number(opt.priceDelta) || 0;
  });

  const hasBase = (Number(src.basePrice) || 0) > 0;
  const deltaText = (d?: number) => {
    const n = Number(d) || 0;
    return n > 0 ? `+${money(n, currency)}` : n < 0 ? `−${money(Math.abs(n), currency)}` : 'Included';
  };

  return (
    <div className="clt-live-preview configurator-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>

      <div className="asa-cfg-head">
        <h3 className="selector-title">{src.title || 'Build your vehicle'}</h3>
        {src.model && (
          <p className="asa-cfg-model">{src.model}{hasBase && <> · <span className="asa-cfg-base">Base {money(Number(src.basePrice), currency)}</span></>}</p>
        )}
      </div>

      {colors.length > 0 && (
        <div className="asa-cfg-colors">
          <span className="asa-cfg-group-label">Color{chosenColor && <> · <span className="asa-cfg-color-name">{chosenColor.label}</span></>}</span>
          <div className="asa-cfg-swatches">
            {colors.map((c) => (
              <button
                key={c.id}
                type="button"
                className={colorId === c.id ? 'asa-cfg-swatch is-selected' : 'asa-cfg-swatch'}
                aria-label={c.label}
                title={c.label}
                onClick={() => setColorId(c.id)}
              >
                <span className="asa-cfg-swatch-dot" style={{ background: c.hex || '#e2e8f0' }} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="asa-cfg-groups">
        {groups.map((g) => (
          <div className="asa-cfg-group" key={g.id}>
            <span className="asa-cfg-group-label">{g.label}</span>
            <div className="asa-cfg-chips">
              {g.options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className={sel[g.id] === o.id ? 'asa-cfg-chip is-selected' : 'asa-cfg-chip'}
                  onClick={() => setSel((prev) => ({ ...prev, [g.id]: o.id }))}
                >
                  <span className="asa-cfg-chip-main">
                    <span className="asa-cfg-chip-label">{o.label}</span>
                    {o.detail && <span className="asa-cfg-chip-detail">{o.detail}</span>}
                  </span>
                  <span className="asa-cfg-chip-delta">{deltaText(o.priceDelta)}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="asa-cfg-estimate">
        <span className="asa-cfg-est-label">Estimated price</span>
        <span className="asa-cfg-est-value">{money(total, currency)}</span>
        <span className="asa-cfg-est-note">Estimated · excludes tax, title &amp; fees</span>
      </div>

      <button type="button" className="asa-cfg-cta">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 17H3v-6l2-5h9l4 5h3v6h-2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg>
        {src.submitText || 'Reserve this build'}
      </button>
    </div>
  );
}
