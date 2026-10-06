/**
 * Analytics report engine (pure: events + applications + leads in, report out).
 *
 * Sessions are the unit: every event carries an anonymous session id, so we can say
 * "of 1,000 people who started an application, N finished step 2" without any personal data.
 * Applications and leads come from the real admissions tables, so submitted/enquiry numbers
 * stay authoritative even if a browser blocked tracking.
 */

export interface StoredEvent {
  eventType: string;
  pagePath: string;
  visitorId: string;
  sessionId: string;
  source: string;
  device: string;
  program?: string;
  step?: number;
  action?: string;
  label?: string;
  metadata?: unknown;
  ts: number;
}

export const FUNNEL = [
  { key: 'viewed', label: 'Viewed a program' },
  { key: 'started', label: 'Started an application' },
  { key: 'personal', label: 'Personal details done' },
  { key: 'program', label: 'Program chosen' },
  { key: 'academic', label: 'Academic record done' },
  { key: 'submitted', label: 'Application submitted' },
  { key: 'paid', label: 'Application fee paid' },
] as const;
type Flags = Record<(typeof FUNNEL)[number]['key'], boolean>;
const DAY = 86_400_000;
const APPLY_STEPS = ['Personal details', 'Program choice', 'Academic record', 'Documents and review'];

interface Session {
  id: string;
  visitor: string;
  t0: number;
  startedAt?: number;
  source: string;
  device: string;
  program?: string;
  flags: Flags;
  pages: number;
  hadApply: boolean;
  last: StoredEvent;
  progViews: Map<string, number>;
  progClicks: Map<string, Set<string>>;
}

const emptyFlags = (): Flags => ({ viewed: false, started: false, personal: false, program: false, academic: false, submitted: false, paid: false });

const getEventTs = (e: any): number => {
  if (typeof e.ts === 'number' && !isNaN(e.ts) && e.ts > 0) return e.ts;
  if (e.timestamp) {
    const parsed = Date.parse(e.timestamp);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return Date.now();
};

export function buildSessions(events: StoredEvent[]): Session[] {
  const map = new Map<string, Session>();
  const normalizedEvents = events.map((e) => ({ ...e, ts: getEventTs(e) }));
  for (const e of normalizedEvents.sort((a, b) => a.ts - b.ts)) {
    const id = e.sessionId || e.visitorId;
    let s = map.get(id);
    if (!s) {
      s = { id, visitor: e.visitorId, t0: e.ts, source: e.source, device: e.device, flags: emptyFlags(), pages: 0, hadApply: false, last: e, progViews: new Map(), progClicks: new Map() };
      map.set(id, s);
    }
    s.last = e;
    if (e.program) s.program = e.program;
    if (e.eventType === 'page_view') {
      s.pages++;
      const m = e.pagePath.match(/^\/programs\/([^/]+)$/);
      if (m) {
        s.flags.viewed = true;
        s.program = m[1];
        s.progViews.set(m[1], (s.progViews.get(m[1]) || 0) + 1);
      } else if (e.pagePath === '/programs') s.flags.viewed = true;
    } else if (e.eventType === 'apply_step') {
      s.hadApply = true;
      if (e.action === 'view' && e.step === 1 && !s.flags.started) { s.flags.started = true; s.startedAt = e.ts; }
      if (e.action === 'complete') {
        if (e.step === 1) s.flags.personal = true;
        if (e.step === 2) s.flags.program = true;
        if (e.step === 3) s.flags.academic = true;
      }
    } else if (e.eventType === 'apply_submitted') { s.hadApply = true; s.flags.submitted = true; }
    else if (e.eventType === 'payment_success') s.flags.paid = true;
    else if (e.eventType === 'cta_click' && e.program && e.label) {
      const set = s.progClicks.get(e.program) || new Set<string>();
      set.add(e.label);
      s.progClicks.set(e.program, set);
    }
  }
  return [...map.values()];
}

const inRange = (t: number, from: number, to: number) => t > from && t <= to;
const pct = (num: number, den: number) => (den ? Math.round((num / den) * 1000) / 10 : 0);
const deltaPct = (cur: number, prev: number) => (prev > 0 ? Math.round((cur / prev - 1) * 100) : null);
const funnelOf = (ss: Session[]) => FUNNEL.map((f) => ss.filter((s) => s.flags[f.key]).length);

function exitLabel(s: Session): string {
  const e = s.last;
  if (e.eventType === 'apply_step' || e.eventType === 'apply_error') return `Apply: ${APPLY_STEPS[(e.step || 1) - 1] || 'form'}`;
  const p = e.pagePath;
  if (/^\/programs\/./.test(p)) return 'Program pages';
  if (p === '/programs' || p === '/compare') return 'Programs list';
  if (p === '/') return 'Home page';
  if (/^\/jobs/.test(p)) return 'Job pathways';
  if (p === '/admissions') return 'Admissions page';
  if (p === '/contact' || p === '/visit') return 'Contact and visit';
  return 'Other pages';
}

const matchesProgram = (text: string | undefined, slug: string, code: string) => {
  const t = String(text || '').toLowerCase().replace(/[^a-z]/g, '');
  return t === slug.replace(/[^a-z]/g, '') || t === code.toLowerCase().replace(/[^a-z]/g, '');
};

export interface ProgramRef { slug: string; code: string; title: string }

export function buildReport(events: StoredEvent[], apps: any[], leads: any[], programs: ProgramRef[], rangeDays: number, now = Date.now()) {
  const from = now - rangeDays * DAY;
  const prevFrom = from - rangeDays * DAY;
  const all = buildSessions(events);
  const cur = all.filter((s) => inRange(s.t0, from, now));
  const prev = all.filter((s) => inRange(s.t0, prevFrom, from));
  const parseSafeDate = (val?: string) => {
    if (!val) return 0;
    const parsed = Date.parse(val);
    return isNaN(parsed) ? 0 : parsed;
  };
  const appsIn = (a: number, b: number) => apps.filter((x) => {
    const t = parseSafeDate(x.submittedAt || x.createdAt);
    return t > 0 && inRange(t, a, b);
  });
  const leadsIn = (a: number, b: number) => leads.filter((x) => {
    const t = parseSafeDate(x.createdAt);
    return t > 0 && inRange(t, a, b);
  });
  const curApps = appsIn(from, now), prevApps = appsIn(prevFrom, from);
  const curLeads = leadsIn(from, now), prevLeads = leadsIn(prevFrom, from);

  // ---- overall
  const funnel = funnelOf(cur);
  const startedCur = funnel[1];
  const startedPrev = funnelOf(prev)[1];
  const visitors = new Set(cur.map((s) => s.visitor)).size;
  const visitorsPrev = new Set(prev.map((s) => s.visitor)).size;
  const rate = (subs: number, starts: number) => pct(subs, starts);

  const buckets = 8;
  const series = (items: { t: number }[]) => {
    const out = new Array(buckets).fill(0);
    for (const it of items) {
      if (typeof it.t === 'number' && !isNaN(it.t) && isFinite(it.t)) {
        out[Math.min(buckets - 1, Math.max(0, Math.floor(((it.t - from) / (now - from)) * buckets)))]++;
      }
    }
    return out;
  };
  const sVisitors = series(cur.map((s) => ({ t: s.t0 })));
  const sStarts = series(cur.filter((s) => s.startedAt).map((s) => ({ t: s.startedAt! })));
  const sSubs = series(curApps.map((a) => ({ t: parseSafeDate(a.submittedAt || a.createdAt) || now })));
  const sLeads = series(curLeads.map((l) => ({ t: parseSafeDate(l.createdAt) || now })));
  const sRate = sSubs.map((v, i) => (sStarts[i] ? Math.round((v / sStarts[i]) * 100) : 0));

  const kpis = [
    { key: 'visitors', label: 'Visitors', value: visitors, delta: deltaPct(visitors, visitorsPrev), series: sVisitors },
    { key: 'starts', label: 'Applications started', value: startedCur, delta: deltaPct(startedCur, startedPrev), series: sStarts },
    { key: 'submitted', label: 'Applications submitted', value: curApps.length, delta: deltaPct(curApps.length, prevApps.length), series: sSubs },
    { key: 'rate', label: 'Start to submit rate', value: rate(curApps.length, startedCur), unit: '%', deltaPts: Math.round((rate(curApps.length, startedCur) - rate(prevApps.length, startedPrev)) * 10) / 10, series: sRate },
    { key: 'leads', label: 'Enquiries and visit bookings', value: curLeads.length, delta: deltaPct(curLeads.length, prevLeads.length), series: sLeads },
  ];

  // ---- sources, devices, exits
  const group = <T extends string>(ss: Session[], pick: (s: Session) => T) => {
    const m = new Map<T, Session[]>();
    ss.forEach((s) => m.set(pick(s), [...(m.get(pick(s)) || []), s]));
    return m;
  };
  const sources = [...group(cur, (s) => s.source).entries()]
    .map(([label, ss]) => ({ label, sessions: ss.length, started: ss.filter((s) => s.flags.started).length, startRate: pct(ss.filter((s) => s.flags.started).length, ss.length) }))
    .sort((a, b) => b.sessions - a.sessions);
  const devices = [...group(cur, (s) => s.device).entries()]
    .map(([label, ss]) => {
      const started = ss.filter((s) => s.flags.started).length;
      const submitted = ss.filter((s) => s.flags.submitted).length;
      return { label, sessions: ss.length, share: pct(ss.length, cur.length), started, submitted, finishRate: pct(submitted, started) };
    })
    .sort((a, b) => b.sessions - a.sessions);
  const engaged = cur.filter((s) => s.pages > 1 || s.hadApply);
  const leavers = engaged.filter((s) => !s.flags.submitted);
  const exits = [...group(leavers, exitLabel).entries()]
    .map(([label, ss]) => ({ label, sessions: ss.length, pct: pct(ss.length, leavers.length) }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 6);

  // ---- weekly trend (12 weeks, plus the 12 before) for charts
  const WEEK = 7 * DAY;
  const weekIdx = (t: number) => Math.floor((now - t) / WEEK); // 0 = this week
  const weekly = (items: number[]) => {
    const out = new Array(24).fill(0);
    items.forEach((t) => { const i = weekIdx(t); if (i >= 0 && i < 24) out[i]++; });
    return { cur: out.slice(0, 12).reverse(), prev: out.slice(12, 24).reverse() };
  };

  // ---- per program
  const programReports = programs.map((p) => {
    const mine = (s: Session) => s.program === p.slug;
    const sessionsHere = all.filter(mine);
    const inCur = cur.filter(mine);
    const inPrev = prev.filter(mine);
    const viewsOf = (ss: Session[]) => ss.reduce((n, s) => n + (s.progViews.get(p.slug) || 0), 0);
    const views = viewsOf(cur.filter((s) => s.progViews.has(p.slug)));
    const viewsPrev = viewsOf(prev.filter((s) => s.progViews.has(p.slug)));
    const starts = inCur.filter((s) => s.flags.started).length;
    const startsPrev = inPrev.filter((s) => s.flags.started).length;
    const appsP = curApps.filter((a) => a.programSlug === p.slug);
    const appsPrev = prevApps.filter((a) => a.programSlug === p.slug);
    const leadsP = curLeads.filter((l) => matchesProgram(l.program, p.slug, p.code)).length;
    const pageSessions = cur.filter((s) => s.progViews.has(p.slug));
    const did = (label: string) => pct(pageSessions.filter((s) => s.progClicks.get(p.slug)?.has(label)).length, pageSessions.length);
    const share = (rows: any[], key: string, limit = 8) => {
      const m = new Map<string, number>();
      rows.forEach((r) => { const v = String(r[key] || '').trim(); if (v) m.set(v, (m.get(v) || 0) + 1); });
      return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([label, n]) => ({ label, count: n, pct: pct(n, rows.length) }));
    };
    const pf = funnelOf(inCur);
    const allApps = apps.filter((a) => a.programSlug === p.slug);
    return {
      slug: p.slug, code: p.code, title: p.title,
      views, starts, submitted: appsP.length, leads: leadsP,
      startToSubmit: rate(appsP.length, starts),
      change: {
        views: deltaPct(views, viewsPrev), starts: deltaPct(starts, startsPrev), submitted: deltaPct(appsP.length, appsPrev.length),
      },
      weekly: {
        views: weekly(sessionsHere.flatMap((s) => (s.progViews.has(p.slug) ? [s.t0] : []))),
        starts: weekly(sessionsHere.filter((s) => s.startedAt).map((s) => s.startedAt!)),
        submitted: weekly(allApps.map((a) => parseSafeDate(a.submittedAt || a.createdAt) || now)),
      },
      funnel: FUNNEL.map((f, i) => ({ key: f.key, label: f.label, count: pf[i] })),
      areas: share(appsP, 'specialization'),
      cities: share(appsP, 'city', 5),
      streams: share(appsP, 'stream', 4),
      behaviour: [
        { label: 'Opened a semester', pct: did('semester') },
        { label: 'Clicked Apply', pct: did('apply') },
        { label: 'Asked to visit campus', pct: did('visit') },
      ],
      pageSessions: pageSessions.length,
      actions: [] as { title: string; body: string }[],
    };
  });

  const validTs = events.map(getEventTs).filter((t) => typeof t === 'number' && !isNaN(t) && isFinite(t) && t > 0);
  const trackingSince = validTs.length > 0 ? new Date(Math.min(...validTs)).toISOString() : null;

  const out = {
    range: rangeDays,
    generatedAt: new Date(now).toISOString(),
    trackingSince,
    sessions: cur.length,
    kpis,
    funnel: FUNNEL.map((f, i) => ({ key: f.key, label: f.label, count: funnel[i] })),
    programs: programReports,
    sources, devices, exits,
    insights: [] as { title: string; body: string }[],
  };
  out.insights = buildInsights(out);
  out.programs.forEach((p) => { p.actions = programActions(p); });
  return out;
}

type Report = ReturnType<typeof buildReport>;

const LEAK_ADVICE: Record<string, string> = {
  personal: 'Applicants stall on the first form. Cut required fields to the essentials and confirm the phone number format clearly.',
  program: 'Applicants hesitate choosing a program. Add a one-line comparison of BBA, BCA and B.Com beside the choice.',
  academic: 'The academic record screen loses people. Explain which marks to enter and allow saving a draft.',
  submitted: 'People reach the last screen but do not submit. Check document upload (allow phone camera and larger files) and make the review screen reassuring.',
  paid: 'Applicants submit but do not pay the fee. Show the amount early and offer a clear payment retry.',
};

export function buildInsights(r: Report) {
  const out: { title: string; body: string }[] = [];
  const MIN = 20;
  if (r.sessions < 50) out.push({ title: 'Still collecting data', body: `Only ${r.sessions} sessions in this range. Percentages will firm up as traffic grows; treat early patterns as hints.` });

  // biggest leak after people start
  let worst = -1, worstDrop = 0;
  for (let i = 2; i < r.funnel.length; i++) {
    const prev = r.funnel[i - 1].count;
    // A step nobody has reached yet is not a measured leak (it may simply not be live), so skip it.
    if (prev >= MIN && r.funnel[i].count > 0) {
      const drop = 1 - r.funnel[i].count / prev;
      if (drop > worstDrop) { worstDrop = drop; worst = i; }
    }
  }
  if (worst > 0) out.push({ title: `${r.funnel[worst].label} loses ${Math.round(worstDrop * 100)}% of applicants`, body: LEAK_ADVICE[r.funnel[worst].key] });

  const dev = r.devices.filter((d) => d.started >= MIN);
  const phone = dev.find((d) => d.label === 'phone'), desk = dev.find((d) => d.label === 'desktop');
  if (phone && desk && desk.finishRate - phone.finishRate >= 10) out.push({ title: `Phones finish ${phone.finishRate}% of applications, desktop ${desk.finishRate}%`, body: 'Test the form and uploads on a mid-range phone; most visitors are on phones.' });

  const movers = r.programs.filter((p) => p.change.starts !== null && p.starts >= 10);
  if (movers.length) {
    const up = [...movers].sort((a, b) => b.change.starts! - a.change.starts!)[0];
    const down = [...movers].sort((a, b) => a.change.starts! - b.change.starts!)[0];
    if (up.change.starts! > 0) out.push({ title: `${up.code} applications are up ${up.change.starts}%`, body: 'Confirm seat capacity and counsellor time, and keep its job pathways and visit slots easy to find.' });
    if (down.change.starts! < 0 && down !== up) out.push({ title: `${down.code} applications are down ${Math.abs(down.change.starts!)}%`, body: 'Review its page: curriculum clarity, pathway listings and the questions parents ask on calls.' });
  }

  const src = r.sources.filter((s) => s.sessions >= 30);
  if (src.length >= 2) {
    const best = [...src].sort((a, b) => b.startRate - a.startRate)[0];
    const low = [...src].sort((a, b) => a.startRate - b.startRate)[0];
    if (best !== low && best.startRate - low.startRate >= 3) out.push({ title: `${best.label} converts best, ${low.label} least`, body: `${best.startRate}% of ${best.label} visitors start an application against ${low.startRate}% from ${low.label}. Send ${low.label} traffic to a program page, not the home page.` });
  }
  return out;
}

/** Per-program suggested steps (same rules, scoped to one program). */
export function programActions(p: Report['programs'][number]) {
  const out: { title: string; body: string }[] = [];
  const MIN = 10;
  let worst = -1, worstDrop = 0;
  for (let i = 2; i < p.funnel.length; i++) {
    const prev = p.funnel[i - 1].count;
    if (prev >= MIN && p.funnel[i].count > 0 && 1 - p.funnel[i].count / prev > worstDrop) { worstDrop = 1 - p.funnel[i].count / prev; worst = i; }
  }
  if (worst > 0) out.push({ title: `${p.funnel[worst].label} is the biggest leak (${Math.round(worstDrop * 100)}% stop)`, body: LEAK_ADVICE[p.funnel[worst].key] });
  if (p.change.starts !== null) out.push(p.change.starts >= 0
    ? { title: `Demand is up ${p.change.starts}%`, body: 'Protect the experience: confirm seats and make sure visit slots are easy to find.' }
    : { title: `Demand is down ${Math.abs(p.change.starts)}%`, body: 'Refresh the page with student stories, partner roles and a short video, then compare in four weeks.' });
  const top = p.areas[0];
  if (top) out.push({ title: `${top.label} leads interest (${top.pct}%)`, body: 'Feature it higher on the page and in campaigns.' });
  const visit = p.behaviour.find((b) => b.label.startsWith('Asked to visit'));
  if (visit && p.pageSessions >= MIN && visit.pct < 5) out.push({ title: `Only ${visit.pct}% ask to visit campus`, body: 'Put a visit prompt next to the curriculum and the apply button.' });
  return out;
}
