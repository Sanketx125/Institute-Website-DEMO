import { Request, Response } from 'express';
import { memoryDb } from '../database/client';
import { AuthenticatedRequest } from '../middleware/auth';

export function trackEvent(req: Request, res: Response) {
  const { eventType, pagePath, referrer, metadata } = req.body;

  if (!eventType || !pagePath) {
    return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing eventType or pagePath' } });
  }

  const event = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    eventType,
    pagePath,
    referrer: referrer || null,
    userAgent: req.headers['user-agent'] || null,
    metadata: metadata || null,
    timestamp: new Date().toISOString(),
  };

  memoryDb.analyticsEvents.unshift(event);
  if (memoryDb.analyticsEvents.length > 2000) {
    memoryDb.analyticsEvents.pop();
  }

  res.status(202).json({ success: true });
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
      applications: {
        total: totalApplications,
        pendingReview,
      },
      leads: {
        total: totalLeads,
        newLeads,
      },
      payments: {
        totalTransactions: totalPayments,
        successfulCount: successfulPayments.length,
        totalRevenueINR: revenuePaise / 100,
      },
      traffic: {
        pageViews: totalPageviews,
        recentEvents: memoryDb.analyticsEvents.slice(0, 10),
      },
    },
  });
}
