import { Request, Response, NextFunction } from 'express';
import { memoryDb } from '../database/client';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
}

export interface AuditParams {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'STATUS_CHANGE' | 'EXPORT';
  entity: string;
  entityId?: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  details?: Record<string, any>;
}

export function recordAuditLog(params: AuditParams) {
  const logEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    ...params,
    detailsJson: params.details ? JSON.stringify(params.details) : undefined,
    timestamp: new Date().toISOString(),
  };

  memoryDb.auditLogs.unshift(logEntry);
  if (memoryDb.auditLogs.length > 500) {
    memoryDb.auditLogs.pop();
  }
}
