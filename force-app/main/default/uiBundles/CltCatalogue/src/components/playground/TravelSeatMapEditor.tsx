import { useEffect, useMemo, useState } from 'react';
import { Check, Plane } from 'lucide-react';
import type { TravelSeat, TravelSeatMapPayload } from './payloads';

/**
 * Live preview for the ASA Travel · Seat Map CLT (DTO field travelSeatMapJSON).
 * An interactive cabin: the visitor taps an open seat to pick it. Seats are
 * colour-coded by kind (standard / extra legroom / exit / premium) and status
 * (open / taken / selected). LWC-true fields: title?, flight?, columns?[],
 * aisleAfter?, seats (object[] of { id, row, col, status?, kind?, price? }),
 * currency?, submitText?. Empty seats → test-mode sample so it renders with no data.
 */

const KIND_LABEL: Record<string, string> = {
  standard: 'Standard',
  extra_legroom: 'Extra legroom',
  exit: 'Exit row',
  premium: 'Premium',
};
function normKind(k?: string): string {
  const raw = String(k || 'standard').toLowerCase().replace(/[^a-z_]/g, '');
  if (raw === 'extralegroom' || raw === 'extra_legroom' || raw === 'legroom') return 'extra_legroom';
  if (raw === 'exit' || raw === 'exitrow') return 'exit';
  if (raw === 'premium' || raw === 'first' || raw === 'business') return 'premium';
  return 'standard';
}

function money(n?: number, currency = 'USD'): string {
  const v = Number(n) || 0;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v);
  } catch {
    return `$${Math.round(v)}`;
  }
}

function makeTestSeats(): TravelSeat[] {
  const cols = ['A', 'B', 'C', 'D', 'E', 'F'];
  const taken = new Set(['12C', '13A', '13F', '14D', '15B', '15E', '16A', '17F', '18C', '18D']);
  const out: TravelSeat[] = [];
  for (let row = 12; row <= 18; row++) {
    const kind = row === 12 ? 'extra_legroom' : row === 14 ? 'exit' : 'standard';
    const price = row === 12 ? 45 : row === 14 ? 30 : 0;
    for (const col of cols) {
      const id = `${row}${col}`;
      out.push({ id, row, col, status: taken.has(id) ? 'taken' : 'open', kind, price });
    }
  }
  return out;
}
const TEST: TravelSeatMapPayload = {
  title: 'Choose your seat',
  flight: 'SFO → JFK · Flight AF128',
  columns: ['A', 'B', 'C', 'D', 'E', 'F'],
  aisleAfter: 'C',
  currency: 'USD',
  seats: makeTestSeats(),
  submitText: 'Select seat',
};

/** Faithful preview: the interactive seat map, including test-mode fallback. */
export function TravelSeatMapPreview({ value, accentColor }: { value: TravelSeatMapPayload; accentColor: string }) {
  const valid = (value.seats ?? []).filter((s) => s && s.id != null && s.row != null && s.col);
  const isTestMode = valid.length === 0;
  const src = isTestMode ? TEST : value;
  const currency = src.currency || 'USD';
  const columns = (src.columns && src.columns.length ? src.columns : ['A', 'B', 'C', 'D', 'E', 'F']).map(String);
  const aisleAfter = src.aisleAfter || columns[Math.floor(columns.length / 2) - 1];
  const seats = isTestMode ? TEST.seats : valid;
  const title = (src.title || 'Choose your seat').trim() || 'Choose your seat';
  const submitText = (src.submitText || 'Select seat').trim() || 'Select seat';

  // row → col → seat
  const grid = useMemo(() => {
    const rows = new Map<number, Map<string, TravelSeat>>();
    for (const s of seats) {
      const r = Number(s.row);
      if (!rows.has(r)) rows.set(r, new Map());
      rows.get(r)!.set(String(s.col), s);
    }
    return [...rows.entries()].sort((a, b) => a[0] - b[0]);
  }, [seats]);

  const [selected, setSelected] = useState('');
  const seedKey = grid.map(([r]) => r).join(',') + `|${isTestMode}`;
  useEffect(() => { setSelected(''); /* eslint-disable-next-line */ }, [seedKey]);

  const selSeat = seats.find((s) => s.id === selected);
  const posLabel = (col: string): string => {
    const i = columns.indexOf(col);
    if (i === 0 || i === columns.length - 1) return 'Window';
    const aisleIdx = columns.indexOf(aisleAfter);
    if (i === aisleIdx || i === aisleIdx + 1) return 'Aisle';
    return 'Middle';
  };
  const selKind = selSeat ? normKind(selSeat.kind) : 'standard';
  const detail = selSeat
    ? [`${selSeat.id}`, posLabel(String(selSeat.col)), KIND_LABEL[selKind]].join(' · ')
    : '';

  return (
    <div className="clt-live-preview travel-seatmap-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      <div className="asa-sm-head">
        <div className="asa-sm-headtext">
          <h3 className="selector-title">{title}</h3>
          {src.flight && <p className="asa-sm-flight">{src.flight}</p>}
        </div>
        <span className="asa-sm-plane" aria-hidden="true"><Plane /></span>
      </div>

      <div className="asa-sm-cabin">
        <div className="asa-sm-nose" aria-hidden="true" />
        <div className="asa-sm-collabels" aria-hidden="true">
          <span className="asa-sm-rownum" />
          {columns.map((c) => (
            <span key={`h-${c}`} className={`asa-sm-collabel${c === aisleAfter ? ' has-aisle' : ''}`}>{c}</span>
          ))}
        </div>
        {grid.map(([row, cols]) => (
          <div className="asa-sm-row" key={row}>
            <span className="asa-sm-rownum">{row}</span>
            {columns.map((col) => {
              const seat = cols.get(col);
              const aisle = col === aisleAfter ? ' has-aisle' : '';
              if (!seat) return <span key={`${row}-${col}`} className={`asa-sm-seat is-empty${aisle}`} aria-hidden="true" />;
              const kind = normKind(seat.kind);
              const status = String(seat.status || 'open').toLowerCase();
              const isTaken = status === 'taken' || status === 'unavailable';
              const isSel = seat.id === selected;
              const cls = `asa-sm-seat is-${kind}${isTaken ? ' is-taken' : ''}${isSel ? ' is-selected' : ''}${aisle}`;
              return (
                <button
                  key={`${row}-${col}`}
                  type="button"
                  className={cls}
                  disabled={isTaken}
                  aria-pressed={isSel}
                  aria-label={`Seat ${seat.id}`}
                  onClick={() => setSelected(seat.id)}
                >
                  {isSel ? <Check aria-hidden="true" /> : <span className="asa-sm-seat-col">{col}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="asa-sm-legend" aria-hidden="true">
        <span className="asa-sm-leg"><span className="asa-sm-sw is-standard" /> Available</span>
        <span className="asa-sm-leg"><span className="asa-sm-sw is-extra_legroom" /> Extra legroom</span>
        <span className="asa-sm-leg"><span className="asa-sm-sw is-exit" /> Exit row</span>
        <span className="asa-sm-leg"><span className="asa-sm-sw is-taken" /> Taken</span>
      </div>

      {selSeat && (
        <div className="asa-sm-selbar">
          <span className="asa-sm-seldetail">{detail}</span>
          <span className="asa-sm-selprice">{Number(selSeat.price) > 0 ? `+${money(selSeat.price, currency)}` : 'Included'}</span>
        </div>
      )}

      {selSeat && (
        <div className="submit-container">
          <button type="button" className="asa-sm-submit">{submitText}</button>
        </div>
      )}
    </div>
  );
}
