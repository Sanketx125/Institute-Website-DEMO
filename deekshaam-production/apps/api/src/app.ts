import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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

export const app = express();

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature'],
  })
);

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
