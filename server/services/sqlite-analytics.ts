/**
 * SQLite Analytics Service
 * 
 * Provides full analytics and logging capabilities using SQLite when MongoDB is unavailable.
 * This ensures analytics, logs, notifications, and tracking work even in SQL-only mode.
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

// Get database path from environment or use default
const DB_PATH = process.env.IS_PRODUCTION === 'true'
    ? process.env.DATABASE_PATH || '/home/ubuntu/fabzclean_data/fabzclean.db'
    : './fabzclean.db';

let db: Database.Database | null = null;

/**
 * Initialize the SQLite analytics database connection and create tables
 */
export function initSqliteAnalytics(): void {
    try {
        db = new Database(DB_PATH);
        db.pragma('foreign_keys = ON');
        createAnalyticsTables();
        console.log('✅ SQLite Analytics initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize SQLite Analytics:', error);
        db = null;
    }
}

/**
 * Create analytics tables if they don't exist
 */
function createAnalyticsTables(): void {
    if (!db) return;

    db.exec(`
    -- Analytics Events Table (High Volume)
    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY,
      eventType TEXT NOT NULL,
      path TEXT,
      userId TEXT,
      sessionId TEXT,
      franchiseId TEXT,
      meta TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      expiresAt TEXT
    );

    -- Webhook Logs Table
    CREATE TABLE IF NOT EXISTS webhook_logs (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      eventType TEXT,
      payload TEXT NOT NULL,
      headers TEXT,
      processingStatus TEXT DEFAULT 'received',
      errorMessage TEXT,
      receivedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      processedAt TEXT
    );

    -- Notification Logs Table
    CREATE TABLE IF NOT EXISTS notification_logs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      recipient TEXT NOT NULL,
      templateName TEXT,
      status TEXT DEFAULT 'pending',
      provider TEXT NOT NULL,
      providerResponse TEXT,
      orderId TEXT,
      customerId TEXT,
      franchiseId TEXT,
      sentAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- App Events Table (Errors, Performance)
    CREATE TABLE IF NOT EXISTS app_events (
      id TEXT PRIMARY KEY,
      eventType TEXT NOT NULL,
      category TEXT NOT NULL,
      path TEXT,
      userId TEXT,
      sessionId TEXT,
      franchiseId TEXT,
      deviceInfo TEXT,
      data TEXT,
      duration INTEGER,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Driver Locations Table (GPS Tracking)
    CREATE TABLE IF NOT EXISTS driver_locations (
      id TEXT PRIMARY KEY,
      driverId INTEGER NOT NULL,
      orderId TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      speed REAL,
      heading REAL,
      accuracy REAL,
      battery REAL,
      isOnline INTEGER DEFAULT 1,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Audit Trail Table (Enhanced)
    CREATE TABLE IF NOT EXISTS audit_trail (
      id TEXT PRIMARY KEY,
      actorId TEXT NOT NULL,
      actorType TEXT DEFAULT 'user',
      actorName TEXT,
      action TEXT NOT NULL,
      targetResource TEXT NOT NULL,
      targetId TEXT,
      franchiseId TEXT,
      previousValue TEXT,
      newValue TEXT,
      changesDiff TEXT,
      meta TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(eventType);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_franchise ON analytics_events(franchiseId);
    CREATE INDEX IF NOT EXISTS idx_webhook_logs_provider ON webhook_logs(provider);
    CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(processingStatus);
    CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
    CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
    CREATE INDEX IF NOT EXISTS idx_notification_logs_order ON notification_logs(orderId);
    CREATE INDEX IF NOT EXISTS idx_app_events_category ON app_events(category);
    CREATE INDEX IF NOT EXISTS idx_app_events_timestamp ON app_events(timestamp);
    CREATE INDEX IF NOT EXISTS idx_driver_locations_driver ON driver_locations(driverId);
    CREATE INDEX IF NOT EXISTS idx_driver_locations_timestamp ON driver_locations(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_trail_actor ON audit_trail(actorId);
    CREATE INDEX IF NOT EXISTS idx_audit_trail_resource ON audit_trail(targetResource);
  `);
}

/**
 * Check if SQLite analytics is available
 */
export function isSqliteAnalyticsAvailable(): boolean {
    return db !== null;
}

// ============================================================================
// ANALYTICS EVENTS
// ============================================================================

export interface AnalyticsEventData {
    eventType: string;
    path?: string;
    userId?: string;
    sessionId?: string;
    franchiseId?: string;
    meta?: Record<string, unknown>;
}

/**
 * Log an analytics event
 */
export function logAnalyticsEvent(data: AnalyticsEventData): void {
    if (!db) return;

    try {
        const stmt = db.prepare(`
      INSERT INTO analytics_events (id, eventType, path, userId, sessionId, franchiseId, meta, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            randomUUID(),
            data.eventType,
            data.path || null,
            data.userId || null,
            data.sessionId || null,
            data.franchiseId || null,
            data.meta ? JSON.stringify(data.meta) : null,
            new Date().toISOString()
        );
    } catch (error) {
        console.error('SQLite Analytics: Failed to log event:', error);
    }
}

/**
 * Batch log analytics events
 */
export function logAnalyticsEventsBatch(events: AnalyticsEventData[]): void {
    if (!db || events.length === 0) return;

    try {
        const stmt = db.prepare(`
      INSERT INTO analytics_events (id, eventType, path, userId, sessionId, franchiseId, meta, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

        const insertMany = db.transaction((items: AnalyticsEventData[]) => {
            const now = new Date().toISOString();
            for (const item of items) {
                stmt.run(
                    randomUUID(),
                    item.eventType,
                    item.path || null,
                    item.userId || null,
                    item.sessionId || null,
                    item.franchiseId || null,
                    item.meta ? JSON.stringify(item.meta) : null,
                    now
                );
            }
        });

        insertMany(events);
    } catch (error) {
        console.error('SQLite Analytics: Failed to batch log events:', error);
    }
}

/**
 * Get analytics summary
 */
export function getAnalyticsSummary(franchiseId?: string, days: number = 7): Record<string, number> {
    if (!db) return {};

    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        let query = `
      SELECT eventType, COUNT(*) as count 
      FROM analytics_events 
      WHERE timestamp >= ?
    `;
        const params: (string | null)[] = [startDate.toISOString()];

        if (franchiseId) {
            query += ' AND franchiseId = ?';
            params.push(franchiseId);
        }

        query += ' GROUP BY eventType';

        const rows = db.prepare(query).all(...params) as Array<{ eventType: string; count: number }>;

        return rows.reduce((acc, row) => {
            acc[row.eventType] = row.count;
            return acc;
        }, {} as Record<string, number>);
    } catch (error) {
        console.error('SQLite Analytics: Failed to get summary:', error);
        return {};
    }
}

// ============================================================================
// WEBHOOK LOGS
// ============================================================================

export interface WebhookLogData {
    provider: string;
    eventType?: string;
    payload: Record<string, unknown>;
    headers?: Record<string, string>;
}

/**
 * Log a webhook
 */
export function logWebhook(data: WebhookLogData): string | null {
    if (!db) return null;

    try {
        const id = randomUUID();
        const stmt = db.prepare(`
      INSERT INTO webhook_logs (id, provider, eventType, payload, headers, processingStatus, receivedAt)
      VALUES (?, ?, ?, ?, ?, 'received', ?)
    `);

        stmt.run(
            id,
            data.provider,
            data.eventType || null,
            JSON.stringify(data.payload),
            data.headers ? JSON.stringify(data.headers) : null,
            new Date().toISOString()
        );

        return id;
    } catch (error) {
        console.error('SQLite Analytics: Failed to log webhook:', error);
        return null;
    }
}

/**
 * Update webhook status
 */
export function updateWebhookStatus(id: string, status: 'processed' | 'failed', errorMessage?: string): void {
    if (!db) return;

    try {
        const stmt = db.prepare(`
      UPDATE webhook_logs 
      SET processingStatus = ?, errorMessage = ?, processedAt = ?
      WHERE id = ?
    `);

        stmt.run(status, errorMessage || null, new Date().toISOString(), id);
    } catch (error) {
        console.error('SQLite Analytics: Failed to update webhook status:', error);
    }
}

/**
 * Get webhook logs by provider
 */
export function getWebhookLogs(provider?: string, limit: number = 50): Array<Record<string, unknown>> {
    if (!db) return [];

    try {
        let query = 'SELECT * FROM webhook_logs';
        const params: string[] = [];

        if (provider) {
            query += ' WHERE provider = ?';
            params.push(provider);
        }

        query += ' ORDER BY receivedAt DESC LIMIT ?';
        params.push(limit.toString());

        const rows = db.prepare(query).all(...params) as Array<Record<string, unknown>>;

        return rows.map(row => ({
            ...row,
            payload: row.payload ? JSON.parse(row.payload as string) : null,
            headers: row.headers ? JSON.parse(row.headers as string) : null
        }));
    } catch (error) {
        console.error('SQLite Analytics: Failed to get webhook logs:', error);
        return [];
    }
}

// ============================================================================
// NOTIFICATION LOGS
// ============================================================================

export interface NotificationLogData {
    type: 'whatsapp' | 'sms' | 'email' | 'push';
    recipient: string;
    templateName?: string;
    status: 'sent' | 'delivered' | 'failed' | 'pending';
    provider: string;
    providerResponse?: Record<string, unknown>;
    orderId?: string;
    customerId?: string;
    franchiseId?: string;
}

/**
 * Log a notification
 */
export function logNotification(data: NotificationLogData): string | null {
    if (!db) return null;

    try {
        const id = randomUUID();
        const stmt = db.prepare(`
      INSERT INTO notification_logs (id, type, recipient, templateName, status, provider, providerResponse, orderId, customerId, franchiseId, sentAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            id,
            data.type,
            data.recipient,
            data.templateName || null,
            data.status,
            data.provider,
            data.providerResponse ? JSON.stringify(data.providerResponse) : null,
            data.orderId || null,
            data.customerId || null,
            data.franchiseId || null,
            new Date().toISOString()
        );

        return id;
    } catch (error) {
        console.error('SQLite Analytics: Failed to log notification:', error);
        return null;
    }
}

/**
 * Get notification logs
 */
export function getNotificationLogs(filters?: {
    type?: string;
    status?: string;
    orderId?: string;
    limit?: number;
}): Array<Record<string, unknown>> {
    if (!db) return [];

    try {
        let query = 'SELECT * FROM notification_logs WHERE 1=1';
        const params: string[] = [];

        if (filters?.type) {
            query += ' AND type = ?';
            params.push(filters.type);
        }
        if (filters?.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }
        if (filters?.orderId) {
            query += ' AND orderId = ?';
            params.push(filters.orderId);
        }

        query += ` ORDER BY sentAt DESC LIMIT ?`;
        params.push((filters?.limit || 50).toString());

        const rows = db.prepare(query).all(...params) as Array<Record<string, unknown>>;

        return rows.map(row => ({
            ...row,
            providerResponse: row.providerResponse ? JSON.parse(row.providerResponse as string) : null
        }));
    } catch (error) {
        console.error('SQLite Analytics: Failed to get notification logs:', error);
        return [];
    }
}

// ============================================================================
// APP EVENTS (Errors, Performance)
// ============================================================================

export interface AppEventData {
    eventType: string;
    category: 'pageview' | 'click' | 'error' | 'performance' | 'business';
    path?: string;
    userId?: string;
    sessionId?: string;
    franchiseId?: string;
    deviceInfo?: {
        platform?: string;
        browser?: string;
        version?: string;
        isMobile?: boolean;
    };
    data?: Record<string, unknown>;
    duration?: number;
}

/**
 * Log an app event
 */
export function logAppEvent(data: AppEventData): void {
    if (!db) return;

    try {
        const stmt = db.prepare(`
      INSERT INTO app_events (id, eventType, category, path, userId, sessionId, franchiseId, deviceInfo, data, duration, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            randomUUID(),
            data.eventType,
            data.category,
            data.path || null,
            data.userId || null,
            data.sessionId || null,
            data.franchiseId || null,
            data.deviceInfo ? JSON.stringify(data.deviceInfo) : null,
            data.data ? JSON.stringify(data.data) : null,
            data.duration || null,
            new Date().toISOString()
        );
    } catch (error) {
        console.error('SQLite Analytics: Failed to log app event:', error);
    }
}

/**
 * Log an error event
 */
export function logError(params: {
    error: Error | string;
    path?: string;
    userId?: string;
    franchiseId?: string;
    context?: Record<string, unknown>;
}): void {
    const errorData = params.error instanceof Error
        ? { message: params.error.message, stack: params.error.stack, name: params.error.name }
        : { message: params.error };

    logAppEvent({
        eventType: 'error',
        category: 'error',
        path: params.path,
        userId: params.userId,
        franchiseId: params.franchiseId,
        data: {
            ...errorData,
            context: params.context
        }
    });
}

/**
 * Get error logs
 */
export function getErrorLogs(limit: number = 50): Array<Record<string, unknown>> {
    if (!db) return [];

    try {
        const rows = db.prepare(`
      SELECT * FROM app_events 
      WHERE category = 'error' 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(limit) as Array<Record<string, unknown>>;

        return rows.map(row => ({
            ...row,
            deviceInfo: row.deviceInfo ? JSON.parse(row.deviceInfo as string) : null,
            data: row.data ? JSON.parse(row.data as string) : null
        }));
    } catch (error) {
        console.error('SQLite Analytics: Failed to get error logs:', error);
        return [];
    }
}

// ============================================================================
// DRIVER TRACKING (GPS)
// ============================================================================

export interface DriverLocationData {
    driverId: number;
    orderId?: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
    battery?: number;
    isOnline?: boolean;
}

/**
 * Log driver location
 */
export function logDriverLocation(data: DriverLocationData): void {
    if (!db) return;

    try {
        const stmt = db.prepare(`
      INSERT INTO driver_locations (id, driverId, orderId, latitude, longitude, speed, heading, accuracy, battery, isOnline, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            randomUUID(),
            data.driverId,
            data.orderId || null,
            data.latitude,
            data.longitude,
            data.speed || null,
            data.heading || null,
            data.accuracy || null,
            data.battery || null,
            data.isOnline !== false ? 1 : 0,
            new Date().toISOString()
        );
    } catch (error) {
        console.error('SQLite Analytics: Failed to log driver location:', error);
    }
}

/**
 * Get driver route history
 */
export function getDriverRoute(driverId: number, hours: number = 2): Array<{
    lat: number;
    lng: number;
    timestamp: string;
    speed?: number;
}> {
    if (!db) return [];

    try {
        const since = new Date();
        since.setHours(since.getHours() - hours);

        const rows = db.prepare(`
      SELECT latitude, longitude, timestamp, speed 
      FROM driver_locations 
      WHERE driverId = ? AND timestamp >= ?
      ORDER BY timestamp ASC
    `).all(driverId, since.toISOString()) as Array<{
            latitude: number;
            longitude: number;
            timestamp: string;
            speed: number | null;
        }>;

        return rows.map(row => ({
            lat: row.latitude,
            lng: row.longitude,
            timestamp: row.timestamp,
            speed: row.speed || undefined
        }));
    } catch (error) {
        console.error('SQLite Analytics: Failed to get driver route:', error);
        return [];
    }
}

/**
 * Get driver's last known location
 */
export function getDriverLastLocation(driverId: number): {
    lat: number;
    lng: number;
    timestamp: string;
    isOnline: boolean;
    battery?: number;
} | null {
    if (!db) return null;

    try {
        const row = db.prepare(`
      SELECT latitude, longitude, timestamp, isOnline, battery 
      FROM driver_locations 
      WHERE driverId = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `).get(driverId) as {
            latitude: number;
            longitude: number;
            timestamp: string;
            isOnline: number;
            battery: number | null;
        } | undefined;

        if (!row) return null;

        return {
            lat: row.latitude,
            lng: row.longitude,
            timestamp: row.timestamp,
            isOnline: row.isOnline === 1,
            battery: row.battery || undefined
        };
    } catch (error) {
        console.error('SQLite Analytics: Failed to get driver last location:', error);
        return null;
    }
}

// ============================================================================
// AUDIT TRAIL
// ============================================================================

export interface AuditTrailData {
    actorId: string;
    actorType?: 'user' | 'system' | 'api';
    actorName?: string;
    action: string;
    targetResource: string;
    targetId?: string;
    franchiseId?: string;
    previousValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    meta?: Record<string, unknown>;
}

/**
 * Log an audit trail entry with before/after values
 */
export function logAuditTrail(data: AuditTrailData): void {
    if (!db) return;

    try {
        // Calculate diff if both values provided
        let changesDiff: Record<string, { before: unknown; after: unknown }> | null = null;
        if (data.previousValue && data.newValue) {
            changesDiff = {};
            const allKeys = new Set([
                ...Object.keys(data.previousValue),
                ...Object.keys(data.newValue)
            ]);

            for (const key of allKeys) {
                const before = data.previousValue[key];
                const after = data.newValue[key];
                if (JSON.stringify(before) !== JSON.stringify(after)) {
                    changesDiff[key] = { before, after };
                }
            }
        }

        const stmt = db.prepare(`
      INSERT INTO audit_trail (id, actorId, actorType, actorName, action, targetResource, targetId, franchiseId, previousValue, newValue, changesDiff, meta, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            randomUUID(),
            data.actorId,
            data.actorType || 'user',
            data.actorName || null,
            data.action,
            data.targetResource,
            data.targetId || null,
            data.franchiseId || null,
            data.previousValue ? JSON.stringify(data.previousValue) : null,
            data.newValue ? JSON.stringify(data.newValue) : null,
            changesDiff ? JSON.stringify(changesDiff) : null,
            data.meta ? JSON.stringify(data.meta) : null,
            new Date().toISOString()
        );
    } catch (error) {
        console.error('SQLite Analytics: Failed to log audit trail:', error);
    }
}

/**
 * Get audit trail for a user
 */
export function getUserAuditLogs(userId: string, limit: number = 50): Array<Record<string, unknown>> {
    if (!db) return [];

    try {
        const rows = db.prepare(`
      SELECT * FROM audit_trail 
      WHERE actorId = ?
      ORDER BY createdAt DESC
      LIMIT ?
    `).all(userId, limit) as Array<Record<string, unknown>>;

        return rows.map(row => ({
            ...row,
            previousValue: row.previousValue ? JSON.parse(row.previousValue as string) : null,
            newValue: row.newValue ? JSON.parse(row.newValue as string) : null,
            changesDiff: row.changesDiff ? JSON.parse(row.changesDiff as string) : null,
            meta: row.meta ? JSON.parse(row.meta as string) : null
        }));
    } catch (error) {
        console.error('SQLite Analytics: Failed to get user audit logs:', error);
        return [];
    }
}

// ============================================================================
// CLEANUP (Remove old data to keep database small)
// ============================================================================

/**
 * Clean up old analytics data to prevent database bloat
 */
export function cleanupOldData(): void {
    if (!db) return;

    try {
        const now = new Date();

        // Analytics events - 7 days
        const analyticsExpiry = new Date(now);
        analyticsExpiry.setDate(analyticsExpiry.getDate() - 7);
        db.prepare('DELETE FROM analytics_events WHERE timestamp < ?').run(analyticsExpiry.toISOString());

        // Webhook logs - 30 days
        const webhookExpiry = new Date(now);
        webhookExpiry.setDate(webhookExpiry.getDate() - 30);
        db.prepare('DELETE FROM webhook_logs WHERE receivedAt < ?').run(webhookExpiry.toISOString());

        // Notification logs - 60 days
        const notificationExpiry = new Date(now);
        notificationExpiry.setDate(notificationExpiry.getDate() - 60);
        db.prepare('DELETE FROM notification_logs WHERE sentAt < ?').run(notificationExpiry.toISOString());

        // App events - 7 days
        const appEventExpiry = new Date(now);
        appEventExpiry.setDate(appEventExpiry.getDate() - 7);
        db.prepare('DELETE FROM app_events WHERE timestamp < ?').run(appEventExpiry.toISOString());

        // Driver locations - 30 days
        const driverExpiry = new Date(now);
        driverExpiry.setDate(driverExpiry.getDate() - 30);
        db.prepare('DELETE FROM driver_locations WHERE timestamp < ?').run(driverExpiry.toISOString());

        // Audit trail - 180 days (6 months)
        const auditExpiry = new Date(now);
        auditExpiry.setDate(auditExpiry.getDate() - 180);
        db.prepare('DELETE FROM audit_trail WHERE createdAt < ?').run(auditExpiry.toISOString());

        console.log('✅ SQLite Analytics: Cleaned up old data');
    } catch (error) {
        console.error('SQLite Analytics: Failed to cleanup old data:', error);
    }
}

// Export everything
export const SqliteAnalytics = {
    init: initSqliteAnalytics,
    isAvailable: isSqliteAnalyticsAvailable,

    // Analytics
    logEvent: logAnalyticsEvent,
    logEventsBatch: logAnalyticsEventsBatch,
    getSummary: getAnalyticsSummary,

    // Webhooks
    logWebhook,
    updateWebhookStatus,
    getWebhookLogs,

    // Notifications
    logNotification,
    getNotificationLogs,

    // App Events & Errors
    logAppEvent,
    logError,
    getErrorLogs,

    // Driver Tracking
    logDriverLocation,
    getDriverRoute,
    getDriverLastLocation,

    // Audit Trail
    logAuditTrail,
    getUserAuditLogs,

    // Maintenance
    cleanup: cleanupOldData
};

export default SqliteAnalytics;
