import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

type Metric = 'views' | 'starts' | 'submitted';
const METRICS: { id: Metric; label: string }[] = [
  { id: 'views', label: 'Page views' },
  { id: 'starts', label: 'Apply starts' },
  { id: 'submitted', label: 'Submitted' },
];
const RANGES = [7, 30, 90];
const n = (v: number) => Math.round(v).toLocaleString('en-IN');

const Segmented: React.FC<{ label: string; options: { id: string | number; label: string }[]; value: string | number; onChange: (v: any) => void }> = ({ label, options, value, onChange }) => (
  <div className="an-seg" role="group" aria-label={label}>
    {options.map((o) => (
      <button key={o.id} type="button" aria-pressed={o.id === value} onClick={() => onChange(o.id)}>{o.label}</button>
    ))}
  </div>
);

const Delta: React.FC<{ pct?: number | null; pts?: number }> = ({ pct, pts }) => {
  const v = pts !== undefined ? pts : pct;
  if (v === null || v === undefined) return <span className="an-delta flat">No earlier data</span>;
  const up = v >= 0;
  // Arrow and sign carry the meaning, not colour alone.
  return <span className={`an-delta ${up ? 'up' : 'down'}`}>{up ? '▲ +' : '▼ -'}{Math.abs(v)}{pts !== undefined ? ' pts' : '%'}</span>;
};

const Spark: React.FC<{ data: number[]; w?: number; h?: number }> = ({ data, w = 96, h = 30 }) => {
  const lo = Math.min(...data), hi = Math.max(...data), span = hi - lo || 1;
  const pts = data.map((v, i) => `${(2 + (i * (w - 4)) / (data.length - 1)).toFixed(1)},${(h - 3 - ((v - lo) / span) * (h - 6)).toFixed(1)}`).join(' ');
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true"><polyline points={pts} fill="none" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
};

/** Funnel rows; the step that loses the most people after the start is marked. */
const Funnel: React.FC<{ steps: { key: string; label: string; count: number }[]; from?: number }> = ({ steps, from = 0 }) => {
  const rows = steps.slice(from);
  const base = rows[0]?.count || 0;
  let leak = -1, worst = 0;
  rows.forEach((s, i) => {
    if (i < 2 - from || i === 0 || rows[i - 1].count < 10 || s.count === 0) return; // mirror the server: leaks count after the start step
    const drop = 1 - s.count / rows[i - 1].count;
    if (drop > worst) { worst = drop; leak = i; }
  });
  if (!base) return <p className="an-empty">No one has reached this step in this range yet.</p>;
  return (
    <div className="an-funnel">
      {rows.map((s, i) => {
        const keep = i === 0 ? null : Math.round((s.count / (rows[i - 1].count || 1)) * 100);
        return (
          <div key={s.key} className={`an-frow${i === leak ? ' leak' : ''}`}>
            <span className="an-flabel">{s.label}</span>
            <div className="an-track"><div className="an-fill" style={{ width: `${(s.count / base) * 100}%` }} /></div>
            <span className="an-fcount">{n(s.count)}</span>
            <span className="an-fnote">{i === 0 ? 'Everyone who began' : i === leak ? `Lose ${100 - (keep as number)}% here` : `${keep}% continue`}</span>
          </div>
        );
      })}
    </div>
  );
};

const BarList: React.FC<{ rows: { label: string; value: number; text: string; note?: string }[]; max?: number }> = ({ rows, max }) => {
  const top = max || Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="an-bars">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="an-bar-head"><span>{r.label}</span><b>{r.text}</b></div>
          <div className="an-bar"><div style={{ width: `${(r.value / top) * 100}%` }} /></div>
          {r.note && <small>{r.note}</small>}
        </div>
      ))}
    </div>
  );
};

const Facts: React.FC<{ rows: { label: string; text: string }[] }> = ({ rows }) => (
  <ul className="an-facts">{rows.map((r) => <li key={r.label}><span>{r.label}</span><b>{r.text}</b></li>)}</ul>
);

const Notes: React.FC<{ eyebrow: string; title: string; items: { title: string; body: string }[] }> = ({ eyebrow, title, items }) => (
  <section className="an-notes" aria-label={title}>
    <span className="an-eyebrow">{eyebrow}</span>
    <h2>{title}</h2>
    {items.length === 0 ? <p>Nothing stands out yet. Check back as more visits and applications arrive.</p> : (
      <div className="an-note-grid">{items.map((i) => <div key={i.title}><strong>{i.title}</strong><p>{i.body}</p></div>)}</div>
    )}
  </section>
);

const TrendChart: React.FC<{ cur: number[]; prev: number[]; label: string }> = ({ cur, prev, label }) => {
  const hi = Math.max(1, ...cur, ...prev) * 1.1;
  const line = (a: number[]) => a.map((v, i) => `${((i * 640) / 11).toFixed(1)},${(238 - (v / hi) * 236).toFixed(1)}`).join(' ');
  return (
    <div className="an-chart">
      <div className="an-y"><span>{n(hi)}</span><span>{n(hi / 2)}</span><span>0</span></div>
      <div className="an-plot">
        <svg viewBox="0 0 640 240" preserveAspectRatio="none" width="100%" height="240" role="img" aria-label={`${label} per week for the last 12 weeks, previous 12 weeks dashed`}>
          <line x1="0" y1="2" x2="640" y2="2" stroke="#e5e7eb" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="120" x2="640" y2="120" stroke="#e5e7eb" vectorEffect="non-scaling-stroke" />
          <line x1="0" y1="238" x2="640" y2="238" stroke="#9ca3af" vectorEffect="non-scaling-stroke" />
          <polyline points={line(prev)} fill="none" stroke="#6b7280" strokeWidth="2.5" strokeDasharray="6 5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <polyline points={line(cur)} fill="none" stroke="#0f766e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="an-x"><span>12 weeks ago</span><span>8 weeks ago</span><span>4 weeks ago</span><span>This week</span></div>
      </div>
    </div>
  );
};

export const AnalyticsAdmin: React.FC = () => {
  const [range, setRange] = useState(30);
  const [view, setView] = useState('overview');
  const [metric, setMetric] = useState<Metric>('starts');
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    setError('');
    api.getAnalyticsReport(range).then((r: any) => live && setReport(r)).catch((e: Error) => live && setError(e.message || 'Unable to load analytics.'));
    return () => { live = false; };
  }, [range]);

  if (error) return <div className="inline-feedback error" role="alert">{error} Refresh this page to try again.</div>;
  if (!report) return <div role="status">Loading analytics...</div>;

  const programs: any[] = report.programs;
  const program = programs.find((p) => p.slug === view);
  let since: string | null = null;
  if (report.trackingSince) {
    try {
      const d = new Date(report.trackingSince);
      if (!isNaN(d.getTime())) {
        since = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    } catch {
      since = null;
    }
  }

  return (
    <div className="analytics">
      <div className="an-head">
        <div>
          <h1>{program ? `${program.code}: ${program.title}` : 'Analytics'}</h1>
          <p>{program ? 'Demand, drop-off and audience for this program.' : 'How people find the school, which programs they look at, and where applications stall.'}</p>
        </div>
        <div className="an-controls">
          <Segmented label="Date range" value={range} onChange={setRange} options={RANGES.map((r) => ({ id: r, label: `Last ${r} days` }))} />
        </div>
      </div>

      <Segmented label="View" value={view} onChange={setView} options={[{ id: 'overview', label: 'Overview' }, ...programs.map((p) => ({ id: p.slug, label: p.code }))]} />

      {!since && <div className="inline-feedback" role="status">No visits have been recorded yet. Tracking is live: numbers appear here as visitors browse and apply.</div>}

      {!program && (
        <>
          <div className="an-kpis">
            {report.kpis.map((k: any) => (
              <div key={k.key} className="an-kpi">
                <span>{k.label}</span>
                <strong>{n(k.value)}{k.unit || ''}</strong>
                <div><Delta pct={k.delta} pts={k.deltaPts} /><Spark data={k.series} /></div>
              </div>
            ))}
          </div>

          <div className="an-split">
            <section className="an-card an-grow" aria-labelledby="an-funnel">
              <h2 id="an-funnel">Where applicants drop off</h2>
              <p className="an-sub">Visitors who reach each step, from viewing a program to a paid application. The biggest leak after people start is marked.</p>
              <Funnel steps={report.funnel} />
            </section>
            <Notes eyebrow="WORTH ACTING ON" title="What the numbers suggest" items={report.insights} />
          </div>

          <section className="an-card" aria-labelledby="an-prog">
            <h2 id="an-prog">Program demand</h2>
            <p className="an-sub">Trend is apply starts per week over 12 weeks. Select a program for the full picture.</p>
            <div className="table-responsive">
              <table className="data-table an-table">
                <thead><tr><th scope="col">Program</th><th scope="col" className="r">Page views</th><th scope="col" className="r">Apply starts</th><th scope="col" className="r">Submitted</th><th scope="col" className="r">Start to submit</th><th scope="col">Trend</th><th scope="col" className="r">Change in starts</th></tr></thead>
                <tbody>
                  {programs.map((p) => (
                    <tr key={p.slug}>
                      <td><button type="button" className="an-link" onClick={() => setView(p.slug)}>{p.code}</button></td>
                      <td className="r">{n(p.views)}</td><td className="r">{n(p.starts)}</td><td className="r">{n(p.submitted)}</td>
                      <td className="r">{p.starts ? `${p.startToSubmit}%` : '-'}</td>
                      <td><Spark data={p.weekly.starts.cur} w={110} h={32} /></td>
                      <td className="r"><Delta pct={p.change.starts} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="an-split">
            <section className="an-card an-grow" aria-labelledby="an-src">
              <h2 id="an-src">Where visitors come from</h2>
              {report.sources.length === 0 ? <p className="an-empty">No visits in this range.</p> : (
                <BarList rows={report.sources.map((s: any) => ({ label: s.label, value: s.sessions, text: n(s.sessions), note: `${s.startRate}% start an application` }))} />
              )}
            </section>
            <section className="an-card an-grow" aria-labelledby="an-dev">
              <h2 id="an-dev">Devices</h2>
              {report.devices.length === 0 ? <p className="an-empty">No visits in this range.</p> : (
                <>
                  <Facts rows={report.devices.map((d: any) => ({ label: d.label.charAt(0).toUpperCase() + d.label.slice(1), text: `${d.share}% of visits` }))} />
                  <p className="an-sub">Applications finished, of those started:</p>
                  <Facts rows={report.devices.map((d: any) => ({ label: d.label.charAt(0).toUpperCase() + d.label.slice(1), text: d.started ? `${d.finishRate}% (${d.submitted} of ${d.started})` : 'No applications started' }))} />
                </>
              )}
            </section>
            <section className="an-card an-grow" aria-labelledby="an-exit">
              <h2 id="an-exit">Where people leave</h2>
              <p className="an-sub">Last page or step of visits that looked around but did not apply.</p>
              {report.exits.length === 0 ? <p className="an-empty">Not enough visits yet.</p> : <Facts rows={report.exits.map((e: any) => ({ label: e.label, text: `${e.pct}%` }))} />}
            </section>
          </div>
        </>
      )}

      {program && (
        <>
          <div className="an-kpis">
            {[
              { label: 'Page views', value: n(program.views), d: <Delta pct={program.change.views} /> },
              { label: 'Apply starts', value: n(program.starts), d: <Delta pct={program.change.starts} /> },
              { label: 'Submitted', value: n(program.submitted), d: <Delta pct={program.change.submitted} /> },
              { label: 'Start to submit', value: program.starts ? `${program.startToSubmit}%` : '-', d: null },
              { label: 'Enquiries and visits', value: n(program.leads), d: null },
            ].map((k) => (
              <div key={k.label} className="an-kpi"><span>{k.label}</span><strong>{k.value}</strong><div>{k.d}</div></div>
            ))}
          </div>

          <section className="an-card" aria-labelledby="an-trend">
            <div className="an-trend-head">
              <div>
                <h2 id="an-trend">Weekly trend</h2>
                <div className="an-legend"><span><i className="solid" />This period</span><span><i className="dash" />Previous period</span></div>
              </div>
              <Segmented label="Metric" value={metric} onChange={setMetric} options={METRICS} />
            </div>
            <TrendChart cur={program.weekly[metric].cur} prev={program.weekly[metric].prev} label={METRICS.find((m) => m.id === metric)!.label} />
          </section>

          <div className="an-split">
            <section className="an-card an-grow" aria-labelledby="an-pf">
              <h2 id="an-pf">Application steps for this program</h2>
              <Funnel steps={program.funnel} from={1} />
            </section>
            <section className="an-card an-grow" aria-labelledby="an-fa">
              <h2 id="an-fa">Interest by focus area</h2>
              <p className="an-sub">Share of submitted applications.</p>
              {program.areas.length === 0 ? <p className="an-empty">No applications with a focus area yet.</p> : <BarList max={100} rows={program.areas.map((a: any) => ({ label: a.label, value: a.pct, text: `${a.pct}%` }))} />}
            </section>
          </div>

          <div className="an-split">
            <section className="an-card an-grow"><h2>Where applicants live</h2>{program.cities.length ? <Facts rows={program.cities.map((c: any) => ({ label: c.label, text: `${c.pct}%` }))} /> : <p className="an-empty">No applications yet.</p>}</section>
            <section className="an-card an-grow"><h2>10+2 stream</h2>{program.streams.length ? <Facts rows={program.streams.map((c: any) => ({ label: c.label, text: `${c.pct}%` }))} /> : <p className="an-empty">No applications yet.</p>}</section>
            <section className="an-card an-grow"><h2>What visitors do on the page</h2><p className="an-sub">Share of {n(program.pageSessions)} visits.</p><Facts rows={program.behaviour.map((c: any) => ({ label: c.label, text: `${c.pct}%` }))} /></section>
          </div>

          <Notes eyebrow="DECISIONS TO CONSIDER" title={`Suggested next steps for ${program.code}`} items={program.actions} />
        </>
      )}

      <p className="an-foot">
        Visits, steps and clicks are anonymous first-party events{since ? ` recorded since ${since}` : ''}; staff visits, crawlers and browsers with Do Not Track are not counted.
        Submitted applications and enquiries come from the admissions and enquiries lists. History resets if the server restarts.
      </p>
    </div>
  );
};
