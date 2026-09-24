import React, { useEffect, useRef } from 'react';
import { Icon } from '@deekshaam/ui';
import { api } from '../services/api';

/**
 * Shared "Top 3 Picks" hero block. One component instance serves every
 * vertical - only the attribute labels change via the vertical config.
 */

export interface TopPickAttribute {
  label: string;
  value: string;
}

export interface TopPick {
  id: string;
  vertical: string;
  title: string;
  rankScore?: number;
  isSponsored?: boolean;
  city?: string;
  tags?: string[];
  url?: string;
  attributes?: TopPickAttribute[];
  summary?: string;
  image?: string;
  rating?: number;
}

export interface TopPicksConfig {
  vertical: string;
  heading: string;
  subheading?: string;
  ctaLabel: string;
  /** Attribute labels per vertical, e.g. { employer: 'Employer' } */
  attributeLabels?: Record<string, string>;
  filters?: Record<string, string | undefined>;
}

interface TopPicksProps {
  config: TopPicksConfig;
  onNavigate: (path: string) => void;
}

const RANK_LABELS = ['#1', '#2', '#3'];

export const TopPicks: React.FC<TopPicksProps> = ({ config, onNavigate }) => {
  const [result, setResult] = React.useState<{ picks: TopPick[]; isBackfilled: boolean; relaxedFilters?: string[] } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const trackedRef = useRef<string>('');

  useEffect(() => {
    const params = new URLSearchParams({ vertical: config.vertical });
    Object.entries(config.filters || {}).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    api
      .getTopThree(config.vertical, config.filters || {})
      .then((data: any) => {
        setResult(data);
        const key = `${config.vertical}:${JSON.stringify(config.filters || {})}`;
        if (trackedRef.current !== key) {
          trackedRef.current = key;
          api
            .trackEvent({
              eventType: 'top3_impression',
              pagePath: window.location.pathname,
              metadata: {
                vertical: config.vertical,
                filters: config.filters || {},
                isBackfilled: Boolean(data?.isBackfilled),
                pickIds: (data?.picks || []).map((p: TopPick) => p.id),
                sponsored: (data?.picks || []).map((p: TopPick) => Boolean(p.isSponsored)),
              },
            })
            .catch(() => {});
        }
      })
      .catch((e: Error) => setError(e.message));
  }, [config.vertical, JSON.stringify(config.filters || {})]);

  const handleClick = (pick: TopPick, position: number) => {
    api
      .trackEvent({
        eventType: 'top3_click',
        pagePath: window.location.pathname,
        metadata: {
          vertical: config.vertical,
          position,
          listingId: pick.id,
          sponsored: Boolean(pick.isSponsored),
          isBackfilled: Boolean(result?.isBackfilled),
        },
      })
      .catch(() => {});
  };

  if (error) return null;

  const picks = result?.picks || [];
  const isBackfilled = Boolean(result?.isBackfilled);

  return (
    <section className="top3-section" aria-label="Top picks">
      <div className="container">
        <div className="top3-head">
          <div>
            <span className="eyebrow">Curated Shortlist</span>
            <h2>{config.heading}</h2>
            {config.subheading && <p>{config.subheading}</p>}
          </div>
        </div>

        {picks.length === 0 && (
          <p className="top3-empty">Top picks are being curated. More coming soon.</p>
        )}

        {picks.length > 0 && (
          <>
            {isBackfilled && (
              <p className="top3-backfill-note">
                <Icon name="info" size={14} /> Closest matches from related pathways — not exact matches for your filters.
              </p>
            )}
            <div className="top3-grid">
              {picks.map((pick, idx) => (
                <article key={pick.id} className="top3-card" data-rank={idx + 1}>
                  <div className="top3-rank" aria-label={`Rank ${idx + 1}`}>{RANK_LABELS[idx]}</div>
                  {pick.isSponsored && <span className="top3-sponsored">Sponsored</span>}
                  <div className="top3-card-body">
                    <span className="eyebrow">{pick.vertical === 'job' ? 'Job-first pathway' : pick.vertical === 'program' ? 'Degree Program' : 'Certification'}</span>
                    <h3>{pick.title}</h3>
                    {pick.summary && <p className="top3-summary">{pick.summary}</p>}
                    <div className="top3-attributes">
                      {(pick.attributes || []).slice(0, 3).map((attr, i) => (
                        <div key={i} className="top3-attr">
                          <span className="top3-attr-label">{attr.label}</span>
                          <span className="top3-attr-value">{attr.value}</span>
                        </div>
                      ))}
                    </div>
                    {pick.rating != null && (
                      <div className="top3-rating">
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        {' '}{pick.rating.toFixed(1)} trust score
                      </div>
                    )}
                    <a
                      href={pick.url || '#'}
                      className="btn btn-primary small"
                      onClick={(e) => {
                        e.preventDefault();
                        handleClick(pick, idx + 1);
                        if (pick.url) onNavigate(pick.url);
                      }}
                    >
                      {config.ctaLabel} <Icon name="arrow" size={14} />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};
