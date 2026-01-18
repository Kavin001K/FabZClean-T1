import mongoose, { Schema, Document } from 'mongoose';

// ============================================
// 1. TELEMETRY/GPS DATA (Time Series Optimized)
// For driver tracking - expires after 30 days
// ============================================
export interface IRoutePoint extends Document {
    driverId: number;
    orderId?: string;
    location: {
        type: string;
        coordinates: [number, number]; // [longitude, latitude]
    };
    speed?: number;
    heading?: number;
    accuracy?: number;
    battery?: number;
    isOnline: boolean;
    timestamp: Date;
}

const RoutePointSchema = new Schema({
    driverId: { type: Number, required: true, index: true },
    orderId: { type: String, index: true },
    location: {
        type: { type: String, default: 'Point', enum: ['Point'] },
        coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    speed: { type: Number },
    heading: { type: Number }, // Compass direction 0-360
    accuracy: { type: Number }, // GPS accuracy in meters
    battery: { type: Number }, // Battery percentage
    isOnline: { type: Boolean, default: true },
    timestamp: { type: Date, default: Date.now, expires: '30d' } // TTL: 30 days
});

// Geospatial index for location queries
RoutePointSchema.index({ location: '2dsphere' });
// Compound index for driver tracking queries
RoutePointSchema.index({ driverId: 1, timestamp: -1 });

// ============================================
// 2. RAW WEBHOOK STORAGE (For Debugging)
// Stores exact payloads from Razorpay, MSG91, etc.
// ============================================
export interface IWebhookLog extends Document {
    source: 'razorpay' | 'msg91' | 'whatsapp' | 'stripe' | 'other';
    event?: string;
    payload: Record<string, unknown>;
    headers?: Record<string, string>;
    processingStatus: 'PENDING' | 'PROCESSED' | 'FAILED';
    error?: string;
    retryCount: number;
    receivedAt: Date;
    processedAt?: Date;
}

const WebhookLogSchema = new Schema({
    source: {
        type: String,
        required: true,
        enum: ['razorpay', 'msg91', 'whatsapp', 'stripe', 'other'],
        index: true
    },
    event: { type: String, index: true },
    payload: { type: Object, required: true },
    headers: { type: Object },
    processingStatus: {
        type: String,
        enum: ['PENDING', 'PROCESSED', 'FAILED'],
        default: 'PENDING',
        index: true
    },
    error: { type: String },
    retryCount: { type: Number, default: 0 },
    receivedAt: { type: Date, default: Date.now, expires: '60d' }, // Keep for 60 days
    processedAt: { type: Date }
});

// Compound index for finding failed webhooks to retry
WebhookLogSchema.index({ processingStatus: 1, source: 1, receivedAt: -1 });

// ============================================
// 3. SYSTEM AUDIT TRAIL (Flexible Metadata)
// Tracks all user actions with before/after values
// ============================================
export interface IAuditTrail extends Document {
    actorId: string;
    actorType: 'user' | 'system' | 'api';
    actorName?: string;
    action: string;
    targetResource: string;
    targetId?: string;
    franchiseId?: string;
    previousValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    changesDiff?: Record<string, { before: unknown; after: unknown }>;
    meta: {
        ip?: string;
        userAgent?: string;
        sessionId?: string;
        requestId?: string;
        [key: string]: unknown;
    };
    createdAt: Date;
}

const AuditTrailSchema = new Schema({
    actorId: { type: String, required: true, index: true },
    actorType: { type: String, enum: ['user', 'system', 'api'], default: 'user' },
    actorName: { type: String },
    action: { type: String, required: true, index: true },
    targetResource: { type: String, required: true, index: true },
    targetId: { type: String, index: true },
    franchiseId: { type: String, index: true },
    previousValue: { type: Object },
    newValue: { type: Object },
    changesDiff: { type: Object },
    meta: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now, expires: '180d' } // Keep for 6 months
});

// Compound indexes for common queries
AuditTrailSchema.index({ actorId: 1, createdAt: -1 });
AuditTrailSchema.index({ targetResource: 1, targetId: 1, createdAt: -1 });
AuditTrailSchema.index({ franchiseId: 1, action: 1, createdAt: -1 });

// ============================================
// 4. REAL-TIME NOTIFICATIONS QUEUE
// For managing notification delivery status
// ============================================
export interface INotificationQueue extends Document {
    type: 'whatsapp' | 'sms' | 'email' | 'push';
    recipient: string;
    templateId?: string;
    payload: Record<string, unknown>;
    status: 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'read';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    attempts: number;
    maxAttempts: number;
    lastError?: string;
    orderId?: string;
    customerId?: string;
    franchiseId?: string;
    scheduledFor?: Date;
    sentAt?: Date;
    deliveredAt?: Date;
    createdAt: Date;
}

const NotificationQueueSchema = new Schema({
    type: {
        type: String,
        required: true,
        enum: ['whatsapp', 'sms', 'email', 'push'],
        index: true
    },
    recipient: { type: String, required: true },
    templateId: { type: String },
    payload: { type: Object, required: true },
    status: {
        type: String,
        enum: ['queued', 'sending', 'sent', 'delivered', 'failed', 'read'],
        default: 'queued',
        index: true
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    lastError: { type: String },
    orderId: { type: String, index: true },
    customerId: { type: String },
    franchiseId: { type: String, index: true },
    scheduledFor: { type: Date },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    createdAt: { type: Date, default: Date.now, expires: '30d' }
});

// Index for finding pending notifications to send
NotificationQueueSchema.index({ status: 1, priority: -1, scheduledFor: 1 });

// ============================================
// 5. APP ANALYTICS & ERROR TRACKING
// High-volume event tracking
// ============================================
export interface IAppEvent extends Document {
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
    data: Record<string, unknown>;
    duration?: number;
    timestamp: Date;
}

const AppEventSchema = new Schema({
    eventType: { type: String, required: true, index: true },
    category: {
        type: String,
        enum: ['pageview', 'click', 'error', 'performance', 'business'],
        required: true,
        index: true
    },
    path: { type: String },
    userId: { type: String, sparse: true },
    sessionId: { type: String },
    franchiseId: { type: String, index: true },
    deviceInfo: { type: Object },
    data: { type: Object, default: {} },
    duration: { type: Number },
    timestamp: { type: Date, default: Date.now, expires: '7d' } // Keep for 7 days only
});

// Compound indexes for analytics queries
AppEventSchema.index({ category: 1, eventType: 1, timestamp: -1 });
AppEventSchema.index({ franchiseId: 1, category: 1, timestamp: -1 });

// Export Models
export const RoutePoint = mongoose.model<IRoutePoint>('RoutePoint', RoutePointSchema);
export const WebhookLog = mongoose.model<IWebhookLog>('WebhookLog', WebhookLogSchema);
export const AuditTrail = mongoose.model<IAuditTrail>('AuditTrail', AuditTrailSchema);
export const NotificationQueue = mongoose.model<INotificationQueue>('NotificationQueue', NotificationQueueSchema);
export const AppEvent = mongoose.model<IAppEvent>('AppEvent', AppEventSchema);
