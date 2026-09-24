import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { config } from './config';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './auth/routes';
import usersRoutes from './users/routes';
import cmsRoutes from './cms/routes';
import admissionsRoutes from './admissions/routes';
import enquiriesRoutes from './enquiries/routes';
import paymentsRoutes from './payments/routes';
import searchRoutes from './search/routes';
import seoRoutes from './seo/routes';
import analyticsRoutes from './analytics/routes';
import aiRoutes from './ai/routes';
import top3Routes from './top3/routes';

export const app = express();

// Behind nginx/Netlify the client IP arrives in X-Forwarded-For
app.set('trust proxy', 1);

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Cross-Origin Resource Sharing: only the web app origin is allowed
app.use(
  cors({
    origin: config.clientOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature', 'x-applicant-token', 'x-applicant-email'],
  })
);

// Request parsing (raw body kept for webhook signature verification)
app.use(
  express.json({
    limit: '2mb',
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Rate limiting
const rateLimitResponse = {
  success: false,
  error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
};

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false, message: rateLimitResponse }));
app.use(
  '/api/auth/login',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Please try again in 15 minutes.' } },
  })
);
app.use(
  ['/api/admissions/apply', '/api/admissions/upload', '/api/enquiries', '/api/enquiries/visit', '/api/payments/create-order', '/api/payments/verify', '/api/payments/webhook', '/api/analytics/event'],
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false, message: rateLimitResponse })
);

// Logging
app.use(requestLogger);

// Static assets: ONLY public media is accessible directly. Private documents are never exposed!
app.use('/public-media', express.static(config.storage.publicMedia));

// Root SEO routes (sitemap.xml and robots.txt at web root)
app.use('/', seoRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.env,
    platform: 'Deekshaam Production Platform API',
  });
});

// API route mounts
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/admissions', admissionsRoutes);
app.use('/api/enquiries', enquiriesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/top3', top3Routes);
app.use('/api/seo', seoRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

// 404 Route Handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `API endpoint ${req.method} ${req.originalUrl} not found`,
    },
  });
});

// Global Error Handler
app.use(errorHandler);
