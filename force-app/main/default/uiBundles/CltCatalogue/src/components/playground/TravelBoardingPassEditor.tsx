import { Plane, Wallet } from 'lucide-react';
import type { TravelBoardingPassPayload } from './payloads';

/**
 * Live preview for the ASA Travel · Digital Boarding Pass CLT (DTO field
 * travelBoardingPassJSON). A wallet-style airline boarding pass the visitor can
 * pull up and add to their wallet. LWC-true fields: title?, airline?, passenger?,
 * from? / fromCity?, to? / toCity?, flight?, date?, boardingTime?, departTime?,
 * gate?, terminal?, seat?, group?, status?, submitText?, secondaryText?. Empty
 * → test-mode sample so it renders with no data.
 */

const TEST: TravelBoardingPassPayload = {
  title: 'Boarding pass',
  airline: 'Aero Air',
  passenger: 'J. RIVERA',
  from: 'SFO',
  fromCity: 'San Francisco',
  to: 'JFK',
  toCity: 'New York',
  flight: 'AF128',
  date: 'Sep 24',
  boardingTime: '10:05 AM',
  departTime: '10:35 AM',
  gate: 'A12',
  terminal: '2',
  seat: '12A',
  group: 'B',
  status: 'Boarding',
  submitText: 'Add to wallet',
  secondaryText: 'Email pass',
};

/** Faithful preview: the digital boarding pass, including test-mode fallback. */
export function TravelBoardingPassPreview({ value, accentColor }: { value: TravelBoardingPassPayload; accentColor: string }) {
  const isTestMode = !(value.flight || value.from || value.to || value.passenger);
  const src = isTestMode ? TEST : value;
  const title = (src.title || 'Boarding pass').trim();
  const airline = (src.airline || 'Airline').trim();
  const status = (src.status || '').trim();
  const submitText = (src.submitText || 'Add to wallet').trim() || 'Add to wallet';
  const secondaryText = (src.secondaryText || '').trim();

  const stubFields = [
    ['Flight', src.flight],
    ['Gate', src.gate],
    ['Seat', src.seat],
    ['Group', src.group],
  ].filter(([, v]) => v != null && String(v).trim()) as [string, string][];

  return (
    <div className="clt-live-preview travel-boardingpass-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {title && <p className="asa-bp-eyebrow">{title}</p>}

      <div className="asa-bp-card">
        <span className="asa-bp-sheen" aria-hidden="true" />
        <div className="asa-bp-top">
          <span className="asa-bp-airline"><Plane aria-hidden="true" /> {airline}</span>
          {status && <span className="asa-bp-status">{status}</span>}
        </div>

        <div className="asa-bp-route">
          <div className="asa-bp-end">
            <span className="asa-bp-code">{src.from || '—'}</span>
            {src.fromCity && <span className="asa-bp-city">{src.fromCity}</span>}
          </div>
          <span className="asa-bp-planeline" aria-hidden="true"><i /><Plane /><i /></span>
          <div className="asa-bp-end is-to">
            <span className="asa-bp-code">{src.to || '—'}</span>
            {src.toCity && <span className="asa-bp-city">{src.toCity}</span>}
          </div>
        </div>

        <div className="asa-bp-times">
          {src.date && <div className="asa-bp-field"><span className="asa-bp-flabel">Date</span><span className="asa-bp-fval">{src.date}</span></div>}
          {src.boardingTime && <div className="asa-bp-field"><span className="asa-bp-flabel">Boards</span><span className="asa-bp-fval">{src.boardingTime}</span></div>}
          {src.departTime && <div className="asa-bp-field"><span className="asa-bp-flabel">Departs</span><span className="asa-bp-fval">{src.departTime}</span></div>}
          {(src.passenger) && <div className="asa-bp-field"><span className="asa-bp-flabel">Passenger</span><span className="asa-bp-fval">{src.passenger}</span></div>}
        </div>

        <div className="asa-bp-stub">
          {stubFields.map(([label, val]) => (
            <div className="asa-bp-field" key={label}>
              <span className="asa-bp-flabel">{label}</span>
              <span className="asa-bp-fval is-strong">{val}</span>
            </div>
          ))}
          <span className="asa-bp-barcode" aria-hidden="true" />
        </div>
      </div>

      <div className="asa-bp-actions">
        <button type="button" className="asa-bp-submit"><Wallet aria-hidden="true" /> {submitText}</button>
        {secondaryText && <button type="button" className="asa-bp-secondary">{secondaryText}</button>}
      </div>
    </div>
  );
}
