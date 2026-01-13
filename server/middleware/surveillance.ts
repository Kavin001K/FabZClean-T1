/**
 * Surveillance Middleware
 * 
 * This middleware provides "Total Surveillance" by automatically logging
 * every authenticated API request with full context.
 * 
 * Features:
 * - Logs all authenticated HTTP requests
 * - Captures request body, query params, and response status
 * - Measures request duration for performance monitoring
 * - Non-blocking: runs in background after response is sent
 */

import { Request, Response, NextFunction } from "express";
import { db } from "../db";

// Paths to exclude from logging (health checks, static files, etc.)
const EXCLUDED_PATHS = [
    '/api/health',
    '/health',
    '/favicon.ico',
    '/api/ping',
];

// Sensitive fields to redact from logs
const SENSITIVE_FIELDS = ['password', 'token', 'refreshToken', 'accessToken', 'secret', 'apiKey'];

/**
 * Redact sensitive information from an object
 */
function redactSensitive(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    const redacted: any = Array.isArray(obj) ? [...obj] : { ...obj };

    for (const key of Object.keys(redacted)) {
        if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
            redacted[key] = '[REDACTED]';
        } else if (typeof redacted[key] === 'object') {
            redacted[key] = redactSensitive(redacted[key]);
        }
    }

    return redacted;
}

/**
 * Surveillance middleware that logs all authenticated API requests
 */
export const surveillanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Skip excluded paths
    if (EXCLUDED_PATHS.some(path => req.path.startsWith(path))) {
        return next();
    }

    // Capture the original 'end' function to log AFTER response is sent
    const originalEnd = res.end;
    const startTime = Date.now();

    // @ts-ignore - Overriding end function signature
    res.end = function (chunk?: any, encoding?: BufferEncoding | (() => void), callback?: () => void) {
        // Only log authenticated requests to avoid noise
        if ((req as any).employee) {
            const duration = Date.now() - startTime;
            const employee = (req as any).employee;

            // Prepare log details - redact sensitive data
            const logDetails: any = {
                query: req.query,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                method: req.method,
                path: req.path,
            };

            // Only include body for mutating requests
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
                logDetails.body = redactSensitive(req.body);
            }

            // Don't await this, let it run in background to keep app fast
            db.logAction(
                employee.id || employee.employeeId,
                `HTTP_${req.method}`,
                'API_ROUTE',
                req.path,
                logDetails,
                req.ip || (req as any).connection?.remoteAddress,
                req.get('user-agent')
            ).catch(err => {
                console.error('[SURVEILLANCE] Failed to log request:', err);
            });
        }

        // Call original end with proper signature handling
        if (typeof encoding === 'function') {
            return originalEnd.call(this, chunk, encoding);
        }
        return originalEnd.call(this, chunk, encoding, callback);
    };

    next();
};

/**
 * Critical action logger for specific high-importance operations
 * Use this for actions that need immediate, detailed logging
 */
export async function logCriticalAction(
    employee: { id?: string; employeeId?: string; role: string; franchiseId?: string },
    action: string,
    entityType: string,
    entityId: string,
    details: any,
    req?: Request
) {
    await db.logAction(
        employee.id || employee.employeeId || 'UNKNOWN',
        action,
        entityType,
        entityId,
        {
            ...details,
            _critical: true,
            _context: {
                role: employee.role,
                franchiseId: employee.franchiseId || 'NONE',
            }
        },
        req?.ip || 'LOCALHOST',
        req?.get('user-agent')
    );
}

export default surveillanceMiddleware;
