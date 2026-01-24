/**
 * Surveillance Middleware - Enterprise Audit Logging
 * 
 * This middleware provides "Total Surveillance" by automatically logging
 * every authenticated API request with full context.
 * 
 * Features:
 * - Immutable delta capture (oldValue → newValue)
 * - Sensitive data masking (passwords, tokens)
 * - Action categorization and severity rating
 * - Session fingerprinting (IP, User-Agent)
 * - Security anomaly detection
 * - Non-blocking: runs in background after response is sent
 */

import { Request, Response, NextFunction } from 'express';
import { db } from '../db';

// ============ CONFIGURATION ============

// Paths to exclude from auto-logging
const EXCLUDED_PATHS = [
    '/api/health',
    '/health',
    '/favicon.ico',
    '/api/ping',
    '/api/audit-logs', // Prevent recursive logging
];

// Fields to always mask in audit logs (case-insensitive)
const SENSITIVE_FIELDS = [
    'password',
    'passwordHash',
    'hashedPassword',
    'token',
    'accessToken',
    'refreshToken',
    'apiKey',
    'secret',
    'pin',
    'otp',
    'cvv',
    'cardNumber',
    'ssn',
    'taxId'
];

// High-severity actions that require attention
const HIGH_SEVERITY_ACTIONS = [
    'delete_order',
    'delete_employee',
    'delete_customer',
    'revoke_access',
    'role_change',
    'price_override',
    'manual_credit_adjustment',
    'refund_issued',
    'settings_update',
    'data_export',
    'failed_login',
    'bulk_delete',
    'database_access'
];

// Action category mapping
const ACTION_CATEGORIES: Record<string, string> = {
    // Financial
    'payment_received': 'financial',
    'mark_paid': 'financial',
    'refund_issued': 'financial',
    'manual_credit_adjustment': 'financial',
    'price_override': 'financial',
    'add_credit': 'financial',

    // Logistics
    'create_transit': 'logistics',
    'update_transit': 'logistics',
    'complete_transit': 'logistics',
    'cancel_transit': 'logistics',
    'assign_driver': 'logistics',

    // Security
    'login': 'security',
    'logout': 'security',
    'failed_login': 'security',
    'password_change': 'security',
    'revoke_access': 'security',
    'restore_access': 'security',
    'role_change': 'security',
    'database_access': 'security',

    // Lifecycle (CRUD operations)
    'create_order': 'lifecycle',
    'update_order': 'lifecycle',
    'delete_order': 'lifecycle',
    'create_customer': 'lifecycle',
    'update_customer': 'lifecycle',
    'delete_customer': 'lifecycle',
    'create_employee': 'lifecycle',
    'update_employee': 'lifecycle',
    'delete_employee': 'lifecycle',

    // Communication
    'whatsapp_sent': 'communication',
    'whatsapp_success': 'communication',
    'whatsapp_failed': 'communication',
    'email_sent': 'communication',
    'sms_sent': 'communication',

    // System
    'settings_update': 'system',
    'backup_created': 'system',
    'data_export': 'system',
    'print_invoice': 'system',
    'print_tags': 'system'
};

// ============ UTILITY FUNCTIONS ============

/**
 * Recursively masks sensitive fields in an object
 */
export function maskSensitiveData(obj: any, depth = 0): any {
    if (depth > 10) return obj; // Prevent infinite recursion
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => maskSensitiveData(item, depth + 1));
    }

    const masked: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();

        // Check if field should be masked
        const isSensitive = SENSITIVE_FIELDS.some(field =>
            lowerKey.includes(field.toLowerCase())
        );

        if (isSensitive) {
            masked[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
            masked[key] = maskSensitiveData(value, depth + 1);
        } else {
            masked[key] = value;
        }
    }

    return masked;
}

/**
 * Calculate the delta between two objects
 */
export function calculateDelta(oldValue: any, newValue: any): { changes: any[], summary: string } {
    const changes: any[] = [];

    if (!oldValue || !newValue) {
        return { changes: [], summary: 'No comparison available' };
    }

    const allKeys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);

    for (const key of allKeys) {
        const oldVal = oldValue[key];
        const newVal = newValue[key];

        // Skip internal/timestamp fields
        if (['id', 'createdAt', 'updatedAt'].includes(key)) continue;

        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            changes.push({
                field: key,
                from: oldVal,
                to: newVal
            });
        }
    }

    const summary = changes.length > 0
        ? `${changes.length} field(s) modified: ${changes.map(c => c.field).join(', ')}`
        : 'No changes detected';

    return { changes, summary };
}

/**
 * Determine severity level for an action
 */
export function getSeverity(action: string): 'info' | 'warning' | 'critical' {
    if (HIGH_SEVERITY_ACTIONS.includes(action)) {
        return 'critical';
    }
    if (action.includes('delete') || action.includes('failed') || action.includes('cancel')) {
        return 'warning';
    }
    return 'info';
}

/**
 * Get category for an action
 */
export function getCategory(action: string): string {
    // Direct match
    if (ACTION_CATEGORIES[action]) {
        return ACTION_CATEGORIES[action];
    }

    // Pattern matching
    if (action.includes('order_status')) return 'lifecycle';
    if (action.includes('payment') || action.includes('credit') || action.includes('refund')) return 'financial';
    if (action.includes('transit') || action.includes('delivery')) return 'logistics';
    if (action.includes('login') || action.includes('password') || action.includes('access')) return 'security';
    if (action.includes('whatsapp') || action.includes('email') || action.includes('sms')) return 'communication';
    if (action.startsWith('HTTP_')) return 'api';

    return 'system';
}

/**
 * Get client IP from request (handles proxies)
 */
export function getClientIP(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded)) {
        return forwarded[0];
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
}

// ============ SURVEILLANCE MIDDLEWARE ============

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

            // Prepare log details - mask sensitive data
            const logDetails: any = {
                query: req.query,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                method: req.method,
                path: req.path,
            };

            // Only include body for mutating requests
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
                logDetails.body = maskSensitiveData(req.body);
            }

            // Get category for the action
            const action = `HTTP_${req.method}`;
            const category = getCategory(action);
            const severity = req.method === 'DELETE' ? 'warning' : 'info';

            // Don't await this, let it run in background to keep app fast
            db.logAction(
                employee.id || employee.employeeId,
                action,
                'API_ROUTE',
                req.path,
                { ...logDetails, category, severity },
                getClientIP(req),
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

// ============ ENHANCED AUDIT LOGGING ============

interface SurveillanceLogData {
    employeeId: string;
    franchiseId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    oldValue?: any;
    newValue?: any;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Create an enhanced audit log with delta capture
 */
export async function createSurveillanceLog(data: SurveillanceLogData): Promise<void> {
    try {
        const severity = getSeverity(data.action);
        const category = getCategory(data.action);

        // Mask sensitive data
        const maskedOldValue = data.oldValue ? maskSensitiveData(data.oldValue) : null;
        const maskedNewValue = data.newValue ? maskSensitiveData(data.newValue) : null;
        const maskedDetails = data.details ? maskSensitiveData(data.details) : null;

        // Calculate delta if both values present
        let delta = null;
        if (maskedOldValue && maskedNewValue) {
            delta = calculateDelta(maskedOldValue, maskedNewValue);
        }

        // Enhanced details with delta info
        const enhancedDetails = {
            ...maskedDetails,
            oldValue: maskedOldValue,
            newValue: maskedNewValue,
            delta: delta?.summary,
            changedFields: delta?.changes?.map(c => c.field),
            category,
            severity
        };

        await db.createAuditLog({
            employeeId: data.employeeId,
            franchiseId: data.franchiseId,
            action: data.action,
            entityType: data.entityType,
            entityId: data.entityId || '',
            details: enhancedDetails,
            ipAddress: data.ipAddress || 'unknown',
            userAgent: data.userAgent || 'unknown'
        });

        // For critical actions, we could trigger alerts here
        if (severity === 'critical') {
            console.warn(`[SURVEILLANCE] Critical action detected: ${data.action} by ${data.employeeId}`);
        }
    } catch (error) {
        console.error('[SURVEILLANCE] Failed to create audit log:', error);
    }
}

/**
 * After-action hook for logging updates with delta
 */
export async function logEntityUpdate(
    req: Request,
    action: string,
    entityType: string,
    entityId: string,
    oldValue: any,
    newValue: any,
    additionalDetails?: any
): Promise<void> {
    const employee = (req as any).employee;

    await createSurveillanceLog({
        employeeId: employee?.id || employee?.employeeId || 'system',
        franchiseId: employee?.franchiseId,
        action,
        entityType,
        entityId,
        oldValue,
        newValue,
        details: additionalDetails,
        ipAddress: getClientIP(req),
        userAgent: req.get('User-Agent') || 'unknown'
    });
}

/**
 * Quick log for simple actions without delta
 */
export async function logAction(
    req: Request,
    action: string,
    entityType: string,
    entityId: string,
    details?: any
): Promise<void> {
    const employee = (req as any).employee;

    await createSurveillanceLog({
        employeeId: employee?.id || employee?.employeeId || 'system',
        franchiseId: employee?.franchiseId,
        action,
        entityType,
        entityId,
        details: maskSensitiveData(details),
        ipAddress: getClientIP(req),
        userAgent: req.get('User-Agent') || 'unknown'
    });
}

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
    const severity = getSeverity(action);
    const category = getCategory(action);

    await db.logAction(
        employee.id || employee.employeeId || 'UNKNOWN',
        action,
        entityType,
        entityId,
        {
            ...maskSensitiveData(details),
            _critical: true,
            _context: {
                role: employee.role,
                franchiseId: employee.franchiseId || 'NONE',
            },
            category,
            severity
        },
        req ? getClientIP(req) : 'LOCALHOST',
        req?.get('user-agent')
    );
}

// ============ SECURITY ANOMALY DETECTION ============

interface LoginAttempt {
    employeeId: string;
    ipAddress: string;
    timestamp: Date;
    success: boolean;
}

const recentLogins: LoginAttempt[] = [];
const MAX_LOGIN_HISTORY = 1000;

/**
 * Track login attempt for anomaly detection
 */
export function trackLoginAttempt(
    employeeId: string,
    ipAddress: string,
    success: boolean
): { isAnomaly: boolean; reason?: string } {
    const now = new Date();

    // Add to history
    recentLogins.push({ employeeId, ipAddress, timestamp: now, success });

    // Trim history
    if (recentLogins.length > MAX_LOGIN_HISTORY) {
        recentLogins.shift();
    }

    // Check for anomalies in last 24 hours
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const userLogins = recentLogins.filter(
        l => l.employeeId === employeeId && l.timestamp > last24h
    );

    // Anomaly 1: Multiple IPs in short time
    const uniqueIPs = new Set(userLogins.map(l => l.ipAddress));
    if (uniqueIPs.size >= 3) {
        return {
            isAnomaly: true,
            reason: `Login from ${uniqueIPs.size} different IPs in 24h`
        };
    }

    // Anomaly 2: Many failed attempts
    const failedAttempts = userLogins.filter(l => !l.success);
    if (failedAttempts.length >= 5) {
        return {
            isAnomaly: true,
            reason: `${failedAttempts.length} failed login attempts in 24h`
        };
    }

    return { isAnomaly: false };
}

/**
 * Get active sessions (unique IP/User combinations) in timeframe
 */
export function getActiveSessions(minutesBack: number = 30): number {
    const cutoff = new Date(Date.now() - minutesBack * 60 * 1000);
    const activeSessions = new Set(
        recentLogins
            .filter(l => l.timestamp > cutoff && l.success)
            .map(l => `${l.employeeId}:${l.ipAddress}`)
    );
    return activeSessions.size;
}

/**
 * Get recent anomalies for dashboard display
 */
export function getRecentAnomalies(): { employeeId: string; reason: string; timestamp: Date }[] {
    const anomalies: { employeeId: string; reason: string; timestamp: Date }[] = [];
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Group logins by employee
    const employeeLogins = new Map<string, LoginAttempt[]>();
    for (const login of recentLogins) {
        if (login.timestamp > last24h) {
            if (!employeeLogins.has(login.employeeId)) {
                employeeLogins.set(login.employeeId, []);
            }
            employeeLogins.get(login.employeeId)!.push(login);
        }
    }

    // Check each employee for anomalies
    for (const [employeeId, logins] of employeeLogins) {
        const uniqueIPs = new Set(logins.map(l => l.ipAddress));
        if (uniqueIPs.size >= 3) {
            anomalies.push({
                employeeId,
                reason: `Multiple IPs (${uniqueIPs.size})`,
                timestamp: logins[logins.length - 1].timestamp
            });
        }

        const failedCount = logins.filter(l => !l.success).length;
        if (failedCount >= 5) {
            anomalies.push({
                employeeId,
                reason: `Failed logins (${failedCount})`,
                timestamp: logins[logins.length - 1].timestamp
            });
        }
    }

    return anomalies;
}

export default surveillanceMiddleware;
