import { Request, Response } from 'express';
import { z } from 'zod';
import { memoryDb } from '../database/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { buildReport, StoredEvent } from './report';

// ponytail: in-memory ring buffer (resets on restart). Move to a database table when
// history beyond one process lifetime matters; buildReport only needs an array of events.
const MAX_EVENTS = 100_000;

const id = z.string().regex(/^[a-zA-Z0-9-]{8,64}$/);
const short = z.string().max(100);
const eventSchema = z.object({
  eventType: z.enum(['page_view', 'apply_step', 'apply_error', 'apply_submitted', 'payment_success', 'cta_click', 'top3_impression', 'top3_click']),
  pagePath: z.string().max(300).startsWith('/'),
  referrer: z.string().max(500).nullish(),
  visitorId: id.optional(),
  sessionId: id.optional(),
  device: z.enum(['phone', 'tablet', 'desktop']).optional(),
  utm: z.object({ source: short.optional(), medium: short.optional(), campaign: short.optional() }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview|monitor|curl|python-requests/i;

/** Human label for where a session came from. UTM beats referrer; own-site referrers are ignored by the client. */
export function classifySource(referrer?: string | null, utmSource?: string): string {
  const raw = (utmSource || '').toLowerCase();
  let host = '';
  try { host = new URL(referrer || '').hostname.replace(/^www\./, '').toLowerCase(); } catch { /* no referrer */ }
  const probe = raw || host;
  if (!probe) return 'Direct';
  if (/google/.test(probe)) return 'Google search';
  if (/bing|msn/.test(probe)) return 'Bing';
  if (/duckduckgo|yahoo|ecosia/.test(probe)) return 'Other search';
  if (/instagram/.test(probe)) return 'Instagram';
  if (/youtube|youtu\.be/.test(probe)) return 'YouTube';
  if (/facebook|fb\.|meta/.test(probe)) return 'Facebook';
  if (/linkedin/.test(probe)) return 'LinkedIn';
  if (/whatsapp|wa\.me/.test(probe)) return 'WhatsApp';
  if (/(^|\.)t\.co$|twitter|(^|\.)x\.com$/.test(probe)) return 'X';
  return raw ? 'Campaign' : 'Other sites';
}

export function trackEvent(req: Request, res: Response) {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid analytics event' } });
  }
  const e = parsed.data;
  const path = e.pagePath.split(/[?#]/)[0].replace(/(.)\/+$/, '$1');
  // Staff and crawlers never count as visitors.
  if (path.startsWith('/admin') || BOT.test(String(req.headers['user-agent'] || ''))) return res.status(202).json({ success: true });

  const md = e.metadata || {};
  const ts = Date.now();
  const visitorId = e.visitorId || `anon-${ts.toString(36)}`;
  const event: StoredEvent & { id: string; timestamp: string } = {
    id: `evt-${ts}-${Math.random().toString(36).slice(2, 6)}`,
    eventType: e.eventType,
    pagePath: path,
    visitorId,
    sessionId: e.sessionId || visitorId,
    source: classifySource(e.referrer, e.utm?.source),
    device: e.device || 'desktop',
    program: typeof md.program === 'string' ? md.program.toLowerCase().slice(0, 40) : undefined,
    step: typeof md.step === 'number' ? md.step : undefined,
    action: typeof md.action === 'string' ? md.action.slice(0, 20) : undefined,
    label: typeof md.label === 'string' ? md.label.slice(0, 60) : undefined,
    // Top 3 engine events keep their full (size-capped) metadata for ranking analysis.
    metadata: e.eventType.startsWith('top3_') && JSON.stringify(md).length < 2000 ? md : undefined,
    ts,
    timestamp: new Date(ts).toISOString(),
  };
  memoryDb.analyticsEvents.push(event);
  if (memoryDb.analyticsEvents.length > MAX_EVENTS) memoryDb.analyticsEvents.splice(0, memoryDb.analyticsEvents.length - MAX_EVENTS);
  res.status(202).json({ success: true });
}

export function getReport(req: AuthenticatedRequest, res: Response) {
  const range = [7, 30, 90].includes(Number(req.query.range)) ? Number(req.query.range) : 30;
  const programs = memoryDb.programs.filter((p) => p.status === 'PUBLISHED').map((p) => ({ slug: p.slug, code: p.code, title: p.title }));
  res.json({ success: true, data: buildReport(memoryDb.analyticsEvents, memoryDb.applications, memoryDb.leads, programs, range) });
}

export function getSummary(_req: AuthenticatedRequest, res: Response) {
  const totalApplications = memoryDb.applications.length;
  const pendingReview = memoryDb.applications.filter((a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW').length;
  const totalLeads = memoryDb.leads.length;
  const newLeads = memoryDb.leads.filter((l) => l.status === 'NEW').length;
  const totalPayments = memoryDb.payments.length;
  const successfulPayments = memoryDb.payments.filter((p) => p.status === 'SUCCESS');
  const revenuePaise = successfulPayments.reduce((acc, curr) => acc + curr.amount, 0);

  const totalPageviews = memoryDb.analyticsEvents.filter((e) => e.eventType === 'page_view').length;

  res.json({
    success: true,
    data: {
      applications: { total: totalApplications, pendingReview },
      leads: { total: totalLeads, newLeads },
      payments: { totalTransactions: totalPayments, successfulCount: successfulPayments.length, totalRevenueINR: revenuePaise / 100 },
      traffic: { pageViews: totalPageviews, recentEvents: memoryDb.analyticsEvents.slice(-10).reverse() },
    },
  });
}
