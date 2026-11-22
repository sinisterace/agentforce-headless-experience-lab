import { useMemo, useState } from 'react';
import './EcwCampaignFunnelCard.css';

/** React preview mirror of the deployed `ecwCampaignFunnel` LWC (Marketing · Campaign conversion). */
export type EcwFunnelStage = { label: string; count: number; topChannel?: string; detail?: string };
export type EcwCampaignFunnelPayload = {
  title?: string;
  campaign?: string;
  periodLabel?: string;
  outcome?: string;
  stages: EcwFunnelStage[];
};

const RAMP = ['#0b5cae', '#1372cf', '#2f8aed', '#5aa6f5', '#86c0fa', '#a9d3fd'];

export const CAMPAIGN_FUNNEL_TEST: EcwCampaignFunnelPayload = {
  title: 'Campaign conversion',
  campaign: 'Spring Launch — Paid + Email',
  periodLabel: 'Last 30 days',
  outcome: '128 won · $512K pipeline',
  stages: [
    { label: 'Impressions', count: 1240000, topChannel: 'Paid social', detail: '$0.004 CPM' },
    { label: 'Clicks', count: 38400, topChannel: 'Paid search', detail: '3.1% CTR' },
    { label: 'Leads', count: 5120, topChannel: 'Landing pages', detail: '$9.40 CPL' },
    { label: 'MQLs', count: 1870, topChannel: 'Email nurture', detail: '49% accept' },
    { label: 'SQLs', count: 640, topChannel: 'BDR outreach', detail: '34% accept' },
    { label: 'Won', count: 128, topChannel: 'AE', detail: '$512K pipeline' },
  ],
};

function compact(n: number): string {
  const x = Number(n);
  if (!isFinite(x)) return '';
  const a = Math.abs(x);
  const strip = (v: string) => String(Number(v));
  if (a >= 1e6) return `${strip((x / 1e6).toFixed(2))}M`;
  if (a >= 1e3) return `${strip((x / 1e3).toFixed(1))}K`;
  return String(Math.round(x));
}

export function EcwCampaignFunnelCard({ value }: { value?: Partial<EcwCampaignFunnelPayload> }) {
  const hasContent = !!(value && Array.isArray(value.stages) && value.stages.length >= 2);
  const src = (hasContent ? value : CAMPAIGN_FUNNEL_TEST) as EcwCampaignFunnelPayload;

  const model = useMemo(() => {
    const raw = (src.stages || [])
      .filter((s) => s && s.label && isFinite(Number(s.count)))
      .map((s, i) => ({
        key: `cf-${i}`,
        index: i,
        label: String(s.label),
        count: Number(s.count),
        topChannel: s.topChannel ? String(s.topChannel) : '',
        detail: s.detail ? String(s.detail) : '',
        width: 0,
        color: '',
        conv: null as number | null,
      }));
    const max = raw.reduce((m, s) => Math.max(m, s.count), 0) || 1;
    raw.forEach((s, i) => {
      const norm = s.count / max;
      s.width = Math.round((22 + 78 * Math.pow(norm, 0.32)) * 10) / 10;
      s.color = RAMP[Math.min(i, RAMP.length - 1)];
      s.conv = i === 0 ? null : s.count / raw[i - 1].count;
    });
    let leakIdx = -1;
    let leakVal = Infinity;
    raw.forEach((s, i) => {
      if (i > 0 && s.conv !== null && s.conv < leakVal) {
        leakVal = s.conv;
        leakIdx = i;
      }
    });
    const defaultKey = leakIdx >= 0 ? raw[leakIdx].key : raw[0]?.key || '';
    return { raw, leakIdx, defaultKey };
  }, [src]);

  const [activeKey, setActiveKey] = useState(model.defaultKey);
  const active = activeKey || model.defaultKey;

  return (
    <div className="clt-live-preview ecw-cf">
      <div className="ecw-cf-hero">
        <span className="ecw-cf-eyebrow">{src.title || 'Campaign conversion'}</span>
        <div className="ecw-cf-hero-row">
          <strong className="ecw-cf-campaign">{src.campaign}</strong>
          {src.periodLabel ? <span className="ecw-cf-period">{src.periodLabel}</span> : null}
        </div>
        {src.outcome ? <span className="ecw-cf-outcome">{src.outcome}</span> : null}
      </div>

      <ul className="ecw-cf-funnel">
        {model.raw.map((s, i) => {
          const next = model.raw[i + 1];
          const isActive = s.key === active;
          const connLeak = !!next && i + 1 === model.leakIdx;
          const convVal = next ? next.conv : null;
          const detailText = [s.topChannel, s.detail].filter(Boolean).join(' · ');
          return (
            <li
              key={s.key}
              className={isActive ? 'ecw-cf-stage is-active' : 'ecw-cf-stage'}
              tabIndex={0}
              onMouseOver={() => setActiveKey(s.key)}
              onFocus={() => setActiveKey(s.key)}
              onMouseOut={() => setActiveKey(model.defaultKey)}
              onBlur={() => setActiveKey(model.defaultKey)}
            >
              <div className="ecw-cf-rowtop">
                <span className="ecw-cf-label">{s.label}</span>
                <span className="ecw-cf-count">{compact(s.count)}</span>
              </div>
              <div
                className={isActive ? 'ecw-cf-band is-active' : 'ecw-cf-band'}
                style={{ width: `${s.width}%`, background: s.color, animationDelay: `${(i * 0.06).toFixed(2)}s` }}
              ></div>
              {isActive && detailText ? <div className="ecw-cf-detail">{detailText}</div> : null}
              {next ? (
                <div className="ecw-cf-conn">
                  <div
                    className="ecw-cf-taper"
                    style={{ clipPath: `polygon(0 0, ${s.width}% 0, ${next.width}% 100%, 0 100%)` }}
                  ></div>
                  <span className={connLeak ? 'ecw-cf-conv is-leak' : 'ecw-cf-conv'}>
                    <span className="ecw-cf-conv-val">
                      {convVal !== null ? `${(convVal * 100).toFixed(convVal < 0.1 ? 1 : 0)}% continue` : ''}
                    </span>
                    {connLeak ? <span className="ecw-cf-leak">biggest drop</span> : null}
                  </span>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
