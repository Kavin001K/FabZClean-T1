import { db } from '../db';
import { auditLogs } from '../../shared/schema';
import { AuditLog, WebhookDump, AnalyticsEvent, NotificationLog } from '../models/mongo-schemas';
import { RoutePoint, WebhookLog, AuditTrail, AppEvent } from '../models/no-sql-schemas';
import { isMongoConnected } from '../mongo-db';

/**
 * HybridLogger: Unified logging service that writes to both SQL and MongoDB.
 * - SQL: Critical business data with referential integrity
 * - MongoDB: Flexible, high-volume data for analytics and debugging
 */
export class HybridLogger {

    /**
     * Logs critical business actions to SQL (for integrity) 
     * AND flexible metadata to MongoDB (for analysis)
     */
    static async logAction(params: {
        action: string;
        userId: number;
        details: string;
        resourceType?: string;
        resourceId?: string;
        franchiseId?: number;
        flexibleData?: Record<string, unknown>;
    }): Promise<void> {
        const { action, userId, details, resourceType, resourceId, franchiseId, flexibleData } = params;

        try {
            // 1. Write to SQL (Critical Path - Maintain Relation)
            await db.insert(auditLogs).values({
                action,
                userId,
                details,
                entityType: resourceType,
                entityId: resourceId ? parseInt(resourceId, 10) : undefined,
                ipAddress: (flexibleData?.ip as string) || undefined,
            });

            // 2. Write to MongoDB (Flexible Path) - Non-blocking
            if (isMongoConnected()) {
                AuditLog.create({
                    action,
                    userId: userId.toString(),
                    resourceType: resourceType || 'system',
                    resourceId,
                    franchiseId: franchiseId?.toString(),
                    metadata: flexibleData || {},
                    timestamp: new Date()
                }).catch(err => {
                    console.error('MongoDB AuditLog write failed:', err.message);
                });
            }

        } catch (err) {
            console.error('HybridLogger.logAction failed:', err);
            // Don't crash the request if logging fails
        }
    }

    /**
     * Store raw webhook payloads for debugging
     */
    static async logWebhook(params: {
        provider: string;
        eventType?: string;
        payload: Record<string, unknown>;
        headers?: Record<string, string>;
    }): Promise<string | null> {
        if (!isMongoConnected()) {
            console.warn('MongoDB not connected, skipping webhook log');
            return null;
        }

        try {
            const doc = await WebhookDump.create({
                provider: params.provider,
                eventType: params.eventType,
                payload: params.payload,
                headers: params.headers,
                processingStatus: 'received',
                receivedAt: new Date()
            });
            return doc._id.toString();
        } catch (err) {
            console.error('HybridLogger.logWebhook failed:', err);
            return null;
        }
    }

    /**
     * Update webhook processing status
     */
    static async updateWebhookStatus(
        webhookId: string,
        status: 'processed' | 'failed',
        errorMessage?: string
    ): Promise<void> {
        if (!isMongoConnected()) return;

        try {
            await WebhookDump.findByIdAndUpdate(webhookId, {
                processingStatus: status,
                errorMessage
            });
        } catch (err) {
            console.error('HybridLogger.updateWebhookStatus failed:', err);
        }
    }

    /**
     * Log analytics events (page views, clicks, etc.)
     */
    static async logAnalytics(params: {
        eventType: string;
        path?: string;
        userId?: string;
        sessionId?: string;
        franchiseId?: string;
        meta?: Record<string, unknown>;
    }): Promise<void> {
        if (!isMongoConnected()) return;

        try {
            await AnalyticsEvent.create({
                ...params,
                timestamp: new Date()
            });
        } catch (err) {
            console.error('HybridLogger.logAnalytics failed:', err);
        }
    }

    /**
     * Batch log multiple analytics events (for high-volume scenarios)
     */
    static async logAnalyticsBatch(events: Array<{
        eventType: string;
        path?: string;
        userId?: string;
        meta?: Record<string, unknown>;
    }>): Promise<void> {
        if (!isMongoConnected() || events.length === 0) return;

        try {
            const docs = events.map(e => ({
                ...e,
                timestamp: new Date()
            }));
            await AnalyticsEvent.insertMany(docs, { ordered: false });
        } catch (err) {
            console.error('HybridLogger.logAnalyticsBatch failed:', err);
        }
    }

    /**
     * Log notification attempts (WhatsApp, SMS, Email)
     */
    static async logNotification(params: {
        type: 'whatsapp' | 'sms' | 'email' | 'push';
        recipient: string;
        templateName?: string;
        status: 'sent' | 'delivered' | 'failed' | 'pending';
        provider: string;
        providerResponse?: Record<string, unknown>;
        orderId?: string;
        customerId?: string;
        franchiseId?: string;
    }): Promise<string | null> {
        if (!isMongoConnected()) {
            console.warn('MongoDB not connected, skipping notification log');
            return null;
        }

        try {
            const doc = await NotificationLog.create({
                ...params,
                sentAt: new Date()
            });
            return doc._id.toString();
        } catch (err) {
            console.error('HybridLogger.logNotification failed:', err);
            return null;
        }
    }

    /**
     * Get recent audit logs for a user (from MongoDB for speed)
     */
    static async getUserAuditLogs(userId: string, limit = 50): Promise<Array<Record<string, unknown>>> {
        if (!isMongoConnected()) return [];

        try {
            const logs = await AuditLog.find({ userId })
                .sort({ timestamp: -1 })
                .limit(limit)
                .lean();
            return logs;
        } catch (err) {
            console.error('HybridLogger.getUserAuditLogs failed:', err);
            return [];
        }
    }

    /**
     * Get analytics summary for dashboard
     */
    static async getAnalyticsSummary(franchiseId?: string, days = 7): Promise<Record<string, number>> {
        if (!isMongoConnected()) return {};

        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const matchStage: Record<string, unknown> = {
                timestamp: { $gte: startDate }
            };
            if (franchiseId) {
                matchStage.franchiseId = franchiseId;
            }

            const results = await AnalyticsEvent.aggregate([
                { $match: matchStage },
                { $group: { _id: '$eventType', count: { $sum: 1 } } }
            ]);

            return results.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {} as Record<string, number>);
        } catch (err) {
            console.error('HybridLogger.getAnalyticsSummary failed:', err);
            return {};
        }
    }

    // ========================================
    // GPS & TELEMETRY METHODS (from no-sql-schemas)
    // ========================================

    /**
     * Log driver GPS location (high frequency - every 5-30 seconds)
     */
    static async logDriverLocation(params: {
        driverId: number;
        orderId?: string;
        latitude: number;
        longitude: number;
        speed?: number;
        heading?: number;
        accuracy?: number;
        battery?: number;
        isOnline?: boolean;
    }): Promise<void> {
        if (!isMongoConnected()) return;

        try {
            await RoutePoint.create({
                driverId: params.driverId,
                orderId: params.orderId,
                location: {
                    type: 'Point',
                    coordinates: [params.longitude, params.latitude]
                },
                speed: params.speed,
                heading: params.heading,
                accuracy: params.accuracy,
                battery: params.battery,
                isOnline: params.isOnline ?? true,
                timestamp: new Date()
            });
        } catch (err) {
            console.error('HybridLogger.logDriverLocation failed:', err);
        }
    }

    /**
     * Get driver's recent route (for tracking UI)
     */
    static async getDriverRoute(driverId: number, hours = 2): Promise<Array<{
        lat: number;
        lng: number;
        timestamp: Date;
        speed?: number;
    }>> {
        if (!isMongoConnected()) return [];

        try {
            const since = new Date();
            since.setHours(since.getHours() - hours);

            const points = await RoutePoint.find({
                driverId,
                timestamp: { $gte: since }
            })
                .sort({ timestamp: 1 })
                .select('location timestamp speed')
                .lean();

            return points.map(p => ({
                lat: p.location.coordinates[1],
                lng: p.location.coordinates[0],
                timestamp: p.timestamp,
                speed: p.speed
            }));
        } catch (err) {
            console.error('HybridLogger.getDriverRoute failed:', err);
            return [];
        }
    }

    /**
     * Get driver's last known location
     */
    static async getDriverLastLocation(driverId: number): Promise<{
        lat: number;
        lng: number;
        timestamp: Date;
        isOnline: boolean;
        battery?: number;
    } | null> {
        if (!isMongoConnected()) return null;

        try {
            const point = await RoutePoint.findOne({ driverId })
                .sort({ timestamp: -1 })
                .lean();

            if (!point) return null;

            return {
                lat: point.location.coordinates[1],
                lng: point.location.coordinates[0],
                timestamp: point.timestamp,
                isOnline: point.isOnline,
                battery: point.battery
            };
        } catch (err) {
            console.error('HybridLogger.getDriverLastLocation failed:', err);
            return null;
        }
    }

    // ========================================
    // ENHANCED AUDIT TRAIL (with before/after)
    // ========================================

    /**
     * Log detailed audit trail with before/after values
     */
    static async logAuditTrail(params: {
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
    }): Promise<void> {
        if (!isMongoConnected()) return;

        try {
            // Calculate diff if both values provided
            let changesDiff: Record<string, { before: unknown; after: unknown }> | undefined;
            if (params.previousValue && params.newValue) {
                changesDiff = {};
                const allKeys = new Set([
                    ...Object.keys(params.previousValue),
                    ...Object.keys(params.newValue)
                ]);

                for (const key of allKeys) {
                    const before = params.previousValue[key];
                    const after = params.newValue[key];
                    if (JSON.stringify(before) !== JSON.stringify(after)) {
                        changesDiff[key] = { before, after };
                    }
                }
            }

            await AuditTrail.create({
                ...params,
                changesDiff,
                createdAt: new Date()
            });
        } catch (err) {
            console.error('HybridLogger.logAuditTrail failed:', err);
        }
    }

    // ========================================
    // APP EVENTS (Errors, Performance, etc.)
    // ========================================

    /**
     * Log app-level events (errors, performance metrics)
     */
    static async logAppEvent(params: {
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
    }): Promise<void> {
        if (!isMongoConnected()) return;

        try {
            await AppEvent.create({
                ...params,
                timestamp: new Date()
            });
        } catch (err) {
            console.error('HybridLogger.logAppEvent failed:', err);
        }
    }

    /**
     * Log error events for monitoring
     */
    static async logError(params: {
        error: Error | string;
        path?: string;
        userId?: string;
        franchiseId?: string;
        context?: Record<string, unknown>;
    }): Promise<void> {
        const errorData = params.error instanceof Error
            ? { message: params.error.message, stack: params.error.stack, name: params.error.name }
            : { message: params.error };

        await this.logAppEvent({
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
}
