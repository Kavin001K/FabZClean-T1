import mongoose, { Schema, Document } from 'mongoose';

// ============================================
// 1. FLEXIBLE AUDIT LOG
// Allows storing "metadata" as ANY JSON object without defined columns
// ============================================
export interface IAuditLog extends Document {
    action: string;
    userId?: string;
    employeeId?: string;
    resourceType: string;
    resourceId?: string;
    metadata: Record<string, unknown>;
    timestamp: Date;
    franchiseId?: string;
    ipAddress?: string;
    userAgent?: string;
}

const AuditLogSchema = new Schema({
    action: { type: String, required: true, index: true },
    userId: { type: String, index: true },
    employeeId: { type: String, index: true },
    resourceType: { type: String, required: true },
    resourceId: { type: String },
    metadata: { type: Schema.Types.Mixed }, // Store any JSON here
    franchiseId: { type: String, index: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now, expires: '90d' } // Auto-delete after 90 days (TTL)
});

// Compound index for common queries
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ franchiseId: 1, timestamp: -1 });
AuditLogSchema.index({ employeeId: 1, timestamp: -1 });

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
    franchiseId?: string;
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
    franchiseId: { type: String, index: true },
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
    duration?: number;
    deviceType?: string;
    browser?: string;
    os?: string;
}

const AnalyticsEventSchema = new Schema({
    eventType: { type: String, required: true, index: true },
    path: { type: String },
    userId: { type: String, index: true },
    sessionId: { type: String },
    franchiseId: { type: String, index: true },
    meta: { type: Object },
    duration: { type: Number },
    deviceType: { type: String },
    browser: { type: String },
    os: { type: String },
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
    templateId?: string;
    status: 'sent' | 'delivered' | 'failed' | 'pending' | 'read';
    provider: string;
    providerResponse?: Record<string, unknown>;
    providerMessageId?: string;
    orderId?: string;
    customerId?: string;
    franchiseId?: string;
    messageContent?: string;
    sentAt: Date;
    deliveredAt?: Date;
    readAt?: Date;
    errorCode?: string;
    errorMessage?: string;
    retryCount?: number;
}

const NotificationLogSchema = new Schema({
    type: { type: String, required: true, enum: ['whatsapp', 'sms', 'email', 'push'], index: true },
    recipient: { type: String, required: true },
    templateName: { type: String },
    templateId: { type: String },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'failed', 'pending', 'read'],
        default: 'pending',
        index: true
    },
    provider: { type: String, required: true },
    providerResponse: { type: Object },
    providerMessageId: { type: String, index: true },
    orderId: { type: String, index: true },
    customerId: { type: String },
    franchiseId: { type: String, index: true },
    messageContent: { type: String },
    deliveredAt: { type: Date },
    readAt: { type: Date },
    errorCode: { type: String },
    errorMessage: { type: String },
    retryCount: { type: Number, default: 0 },
    sentAt: { type: Date, default: Date.now, expires: '60d' } // Keep for 60 days
});

// ============================================
// 5. PAYMENT TRANSACTIONS
// Detailed payment tracking for all payment methods
// ============================================
export interface IPaymentTransaction extends Document {
    paymentId: string;
    orderId: string;
    orderNumber?: string;
    customerId?: string;
    franchiseId?: string;
    amount: number;
    currency: string;
    paymentMethod: 'cash' | 'card' | 'upi' | 'netbanking' | 'wallet' | 'credit' | 'other';
    paymentGateway?: string;
    gatewayTransactionId?: string;
    gatewayOrderId?: string;
    status: 'initiated' | 'pending' | 'completed' | 'failed' | 'refunded' | 'partial_refund';
    refundAmount?: number;
    refundReason?: string;
    employeeId?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    completedAt?: Date;
}

const PaymentTransactionSchema = new Schema({
    paymentId: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, required: true, index: true },
    orderNumber: { type: String },
    customerId: { type: String, index: true },
    franchiseId: { type: String, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'upi', 'netbanking', 'wallet', 'credit', 'other'],
        required: true
    },
    paymentGateway: { type: String },
    gatewayTransactionId: { type: String, index: true },
    gatewayOrderId: { type: String },
    status: {
        type: String,
        enum: ['initiated', 'pending', 'completed', 'failed', 'refunded', 'partial_refund'],
        default: 'initiated',
        index: true
    },
    refundAmount: { type: Number },
    refundReason: { type: String },
    employeeId: { type: String },
    metadata: { type: Object },
    completedAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

PaymentTransactionSchema.index({ franchiseId: 1, createdAt: -1 });
PaymentTransactionSchema.index({ customerId: 1, createdAt: -1 });

// ============================================
// 6. FILE STORAGE METADATA
// Track all uploaded files (invoices, bills, images, PDFs)
// ============================================
export interface IFileStorage extends Document {
    fileId: string;
    originalName: string;
    storedName: string;
    mimeType: string;
    size: number;
    path: string;
    url?: string;
    category: 'invoice' | 'bill' | 'receipt' | 'document' | 'image' | 'barcode' | 'signature' | 'report' | 'other';
    entityType?: string; // 'order', 'customer', 'employee', 'franchise', etc.
    entityId?: string;
    orderId?: string;
    orderNumber?: string;
    customerId?: string;
    employeeId?: string;
    franchiseId?: string;
    description?: string;
    tags?: string[];
    isArchived: boolean;
    checksum?: string;
    metadata?: Record<string, unknown>;
    createdBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

const FileStorageSchema = new Schema({
    fileId: { type: String, required: true, unique: true, index: true },
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    url: { type: String },
    category: {
        type: String,
        enum: ['invoice', 'bill', 'receipt', 'document', 'image', 'barcode', 'signature', 'report', 'other'],
        default: 'other',
        index: true
    },
    entityType: { type: String, index: true },
    entityId: { type: String, index: true },
    orderId: { type: String, index: true },
    orderNumber: { type: String },
    customerId: { type: String, index: true },
    employeeId: { type: String },
    franchiseId: { type: String, index: true },
    description: { type: String },
    tags: [{ type: String }],
    isArchived: { type: Boolean, default: false },
    checksum: { type: String },
    metadata: { type: Object },
    createdBy: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

FileStorageSchema.index({ entityType: 1, entityId: 1 });
FileStorageSchema.index({ franchiseId: 1, category: 1, createdAt: -1 });
FileStorageSchema.index({ tags: 1 });

// ============================================
// 7. ORDER HISTORY/TIMELINE
// Detailed tracking of all order status changes
// ============================================
export interface IOrderHistory extends Document {
    orderId: string;
    orderNumber?: string;
    franchiseId?: string;
    previousStatus?: string;
    newStatus: string;
    action: string;
    notes?: string;
    employeeId?: string;
    employeeName?: string;
    metadata?: Record<string, unknown>;
    timestamp: Date;
}

const OrderHistorySchema = new Schema({
    orderId: { type: String, required: true, index: true },
    orderNumber: { type: String },
    franchiseId: { type: String, index: true },
    previousStatus: { type: String },
    newStatus: { type: String, required: true },
    action: { type: String, required: true },
    notes: { type: String },
    employeeId: { type: String },
    employeeName: { type: String },
    metadata: { type: Object },
    timestamp: { type: Date, default: Date.now }
});

OrderHistorySchema.index({ orderId: 1, timestamp: -1 });

// ============================================
// 8. DAILY REPORTS CACHE
// Pre-computed daily reports for fast dashboard loading
// ============================================
export interface IDailyReport extends Document {
    reportDate: string; // YYYY-MM-DD format
    franchiseId?: string;
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    cashRevenue: number;
    cardRevenue: number;
    upiRevenue: number;
    creditRevenue: number;
    averageOrderValue: number;
    newCustomers: number;
    repeatCustomers: number;
    totalItems: number;
    topServices?: { serviceId: string; name: string; count: number; revenue: number }[];
    employeeStats?: { employeeId: string; name: string; ordersProcessed: number }[];
    createdAt: Date;
    updatedAt: Date;
}

const DailyReportSchema = new Schema({
    reportDate: { type: String, required: true, index: true },
    franchiseId: { type: String, index: true },
    totalOrders: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    pendingOrders: { type: Number, default: 0 },
    cancelledOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    cashRevenue: { type: Number, default: 0 },
    cardRevenue: { type: Number, default: 0 },
    upiRevenue: { type: Number, default: 0 },
    creditRevenue: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    newCustomers: { type: Number, default: 0 },
    repeatCustomers: { type: Number, default: 0 },
    totalItems: { type: Number, default: 0 },
    topServices: [{
        serviceId: String,
        name: String,
        count: Number,
        revenue: Number
    }],
    employeeStats: [{
        employeeId: String,
        name: String,
        ordersProcessed: Number
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

DailyReportSchema.index({ reportDate: 1, franchiseId: 1 }, { unique: true });

// Export Models
export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export const WebhookDump = mongoose.model<IWebhookDump>('WebhookDump', WebhookDumpSchema);
export const AnalyticsEvent = mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema);
export const NotificationLog = mongoose.model<INotificationLog>('NotificationLog', NotificationLogSchema);
export const PaymentTransaction = mongoose.model<IPaymentTransaction>('PaymentTransaction', PaymentTransactionSchema);
export const FileStorage = mongoose.model<IFileStorage>('FileStorage', FileStorageSchema);
export const OrderHistory = mongoose.model<IOrderHistory>('OrderHistory', OrderHistorySchema);
export const DailyReport = mongoose.model<IDailyReport>('DailyReport', DailyReportSchema);
