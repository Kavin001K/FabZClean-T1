import mongoose, { Schema, Document } from 'mongoose';

// ============================================
// 1. FLEXIBLE AUDIT LOG
// Allows storing "metadata" as ANY JSON object without defined columns
// ============================================
export interface IAuditLog extends Document {
    action: string;
    userId?: string;
    resourceType: string;
    resourceId?: string;
    metadata: Record<string, unknown>;
    timestamp: Date;
    franchiseId?: string;
}

const AuditLogSchema = new Schema({
    action: { type: String, required: true, index: true },
    userId: { type: String, index: true },
    resourceType: { type: String, required: true },
    resourceId: { type: String },
    metadata: { type: Schema.Types.Mixed }, // Store any JSON here
    franchiseId: { type: String, index: true },
    timestamp: { type: Date, default: Date.now, expires: '90d' } // Auto-delete after 90 days (TTL)
});

// Compound index for common queries
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ franchiseId: 1, timestamp: -1 });

// ============================================
// 2. RAW WEBHOOK DUMP (For WhatsApp/Payments)
// Perfect for debugging exactly what Razorpay/MSG91 sent you
// ============================================
export interface IWebhookDump extends Document {
    provider: string;
    eventType?: string;
    payload: Record<string, unknown>;
    headers?: Record<string, string>;
    processingStatus: 'received' | 'processed' | 'failed';
    errorMessage?: string;
    receivedAt: Date;
}

const WebhookDumpSchema = new Schema({
    provider: { type: String, required: true, index: true },
    eventType: { type: String, index: true },
    payload: { type: Object, required: true },
    headers: { type: Object },
    processingStatus: {
        type: String,
        enum: ['received', 'processed', 'failed'],
        default: 'received'
    },
    errorMessage: { type: String },
    receivedAt: { type: Date, default: Date.now, expires: '30d' } // Keep webhooks for 30 days
});

// ============================================
// 3. ANALYTICS EVENTS (High Volume)
// For page views, clicks, user behavior tracking
// ============================================
export interface IAnalyticsEvent extends Document {
    eventType: string;
    path?: string;
    userId?: string;
    sessionId?: string;
    franchiseId?: string;
    meta: Record<string, unknown>;
    timestamp: Date;
}

const AnalyticsEventSchema = new Schema({
    eventType: { type: String, required: true, index: true },
    path: { type: String },
    userId: { type: String, index: true },
    sessionId: { type: String },
    franchiseId: { type: String, index: true },
    meta: { type: Object },
    timestamp: { type: Date, default: Date.now, expires: '7d' } // Keep analytics for 7 days
});

// Compound index for analytics queries
AnalyticsEventSchema.index({ eventType: 1, timestamp: -1 });
AnalyticsEventSchema.index({ franchiseId: 1, eventType: 1, timestamp: -1 });

// ============================================
// 4. NOTIFICATION LOGS
// Track all WhatsApp/SMS/Email notifications sent
// ============================================
export interface INotificationLog extends Document {
    type: 'whatsapp' | 'sms' | 'email' | 'push';
    recipient: string;
    templateName?: string;
    status: 'sent' | 'delivered' | 'failed' | 'pending';
    provider: string;
    providerResponse?: Record<string, unknown>;
    orderId?: string;
    customerId?: string;
    franchiseId?: string;
    sentAt: Date;
}

const NotificationLogSchema = new Schema({
    type: { type: String, required: true, enum: ['whatsapp', 'sms', 'email', 'push'], index: true },
    recipient: { type: String, required: true },
    templateName: { type: String },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'failed', 'pending'],
        default: 'pending',
        index: true
    },
    provider: { type: String, required: true },
    providerResponse: { type: Object },
    orderId: { type: String, index: true },
    customerId: { type: String },
    franchiseId: { type: String, index: true },
    sentAt: { type: Date, default: Date.now, expires: '60d' } // Keep for 60 days
});

// Export Models
export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export const WebhookDump = mongoose.model<IWebhookDump>('WebhookDump', WebhookDumpSchema);
export const AnalyticsEvent = mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema);
export const NotificationLog = mongoose.model<INotificationLog>('NotificationLog', NotificationLogSchema);
