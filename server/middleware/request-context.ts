import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

export const CORRELATION_HEADER = 'x-correlation-id';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      requestStartedAt?: number;
    }
  }
}

function shouldSkipLog(path: string): boolean {
  return path === '/api/health' ||
    path.startsWith('/api/health/') ||
    path.startsWith('/uploads/') ||
    path.endsWith('.js') ||
    path.endsWith('.css') ||
    path.endsWith('.map');
}

export function requestContextMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const incoming = req.header(CORRELATION_HEADER);
    const correlationId = incoming && incoming.trim().length > 0 ? incoming.trim() : randomUUID();
    req.correlationId = correlationId;
    req.requestStartedAt = Date.now();
    res.setHeader(CORRELATION_HEADER, correlationId);

    res.on('finish', () => {
      if (shouldSkipLog(req.path)) return;
      const durationMs = Date.now() - (req.requestStartedAt || Date.now());
      const payload = {
        level: res.statusCode >= 500 ? 'error' : 'info',
        ts: new Date().toISOString(),
        correlationId,
        method: req.method,
        path: req.originalUrl || req.path,
        status: res.statusCode,
        durationMs,
        employeeId: (req as any).employee?.employeeId || null,
      };
      console.log(JSON.stringify(payload));
    });

    next();
  };
}
