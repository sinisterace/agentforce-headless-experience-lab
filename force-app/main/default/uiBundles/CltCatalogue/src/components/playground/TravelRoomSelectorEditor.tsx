import { useState } from 'react';
import { BedDouble, Check, Maximize2, Users } from 'lucide-react';
import type { TravelRoom, TravelRoomSelectorPayload } from './payloads';

/**
 * Live preview for the ASA Travel · Room Selector CLT (DTO field
 * travelRoomSelectorJSON). Hotel room cards the visitor picks from. LWC-true
 * fields: title?, subtitle?, rooms (object[] of { id, name, bed?, size?, sleeps?,
 * amenities?[], price?, cadence?, currency?, imageUrl?, badge? }), currency?,
 * submitText?. Empty rooms → test-mode sample so it renders with no data.
 */

function money(n?: number, currency = 'USD'): string {
  const v = Number(n) || 0;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v);
  } catch {
    return `$${Math.round(v)}`;
  }
}

const TEST: TravelRoomSelectorPayload = {
  title: 'Choose your room',
  subtitle: 'The Shoreline Resort · Jul 12–15 · 2 guests',
  currency: 'USD',
  rooms: [
    { id: 'r1', name: 'Ocean View King', bed: '1 King bed', size: '420 sq ft', sleeps: 2, amenities: ['Ocean view', 'Balcony', 'Free WiFi'], price: 389, cadence: 'night', badge: 'Best value' },
    { id: 'r2', name: 'Garden Double Queen', bed: '2 Queen beds', size: '480 sq ft', sleeps: 4, amenities: ['Garden view', 'Free WiFi', 'Mini bar'], price: 329, cadence: 'night' },
    { id: 'r3', name: 'Beachfront Suite', bed: '1 King + sofa bed', size: '720 sq ft', sleeps: 3, amenities: ['Beachfront', 'Living room', 'Soaking tub'], price: 612, cadence: 'night', badge: 'Only 2 left' },
  ],
  submitText: 'Reserve',
};

/** Faithful preview: the room selector, including test-mode fallback. */
export function TravelRoomSelectorPreview({ value, accentColor }: { value: TravelRoomSelectorPayload; accentColor: string }) {
  const valid = (value.rooms ?? []).filter((r) => r && (r.name || r.id));
  const isTestMode = valid.length === 0;
  const src = isTestMode ? TEST : { ...value, rooms: valid };
  const currency = src.currency || 'USD';
  const rooms = isTestMode ? TEST.rooms : valid;
  const title = (src.title || 'Choose your room').trim() || 'Choose your room';
  const submitText = (src.submitText || 'Reserve').trim() || 'Reserve';

  const [selected, setSelected] = useState('');
  const keyFor = (r: TravelRoom, i: number) => (r.id ? String(r.id) : `room-${i}`);

  return (
    <div className="clt-live-preview travel-room-container" style={{ '--customer-accent': accentColor } as React.CSSProperties}>
      {title && <h3 className="selector-title">{title}</h3>}
      {src.subtitle && <p className="asa-card-sub">{src.subtitle}</p>}

      <div className="asa-rm-list">
        {rooms.map((room, index) => {
          const key = keyFor(room, index);
          const isSel = selected === key;
          const amenities = (room.amenities ?? []).filter((a) => a != null && String(a).trim()).slice(0, 3);
          const meta = [room.bed, room.size, room.sleeps ? `Sleeps ${room.sleeps}` : ''].filter(Boolean);
          return (
            <button
              type="button"
              key={key}
              className={isSel ? 'asa-rm-card is-selected' : 'asa-rm-card'}
              aria-pressed={isSel}
              onClick={() => setSelected(key)}
            >
              <span className="asa-rm-photo" aria-hidden="true">
                {room.imageUrl ? <img src={room.imageUrl} alt="" /> : <BedDouble />}
                {room.badge && <span className="asa-rm-badge">{room.badge}</span>}
                <span className={isSel ? 'asa-rm-check on' : 'asa-rm-check'}><Check aria-hidden="true" /></span>
              </span>
              <span className="asa-rm-body">
                <span className="asa-rm-name">{room.name || 'Room'}</span>
                {meta.length > 0 && (
                  <span className="asa-rm-meta">
                    {room.bed && <span className="asa-rm-meta-item"><BedDouble aria-hidden="true" /> {room.bed}</span>}
                    {room.size && <span className="asa-rm-meta-item"><Maximize2 aria-hidden="true" /> {room.size}</span>}
                    {room.sleeps ? <span className="asa-rm-meta-item"><Users aria-hidden="true" /> Sleeps {room.sleeps}</span> : null}
                  </span>
                )}
                {amenities.length > 0 && (
                  <span className="asa-rm-amenities">
                    {amenities.map((a, i) => (
                      <span className="asa-rm-amenity" key={`${key}-a-${i}`}>{String(a).trim()}</span>
                    ))}
                  </span>
                )}
                <span className="asa-rm-priceline">
                  <span className="asa-rm-price">{money(room.price, room.currency || currency)}</span>
                  <span className="asa-rm-cadence">/ {room.cadence || 'night'}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="submit-container">
          <button type="button" className="asa-rm-submit">{submitText}</button>
        </div>
      )}
    </div>
  );
}
