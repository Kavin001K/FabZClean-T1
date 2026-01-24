import { Router } from "express";
import { z } from "zod";
import { db as storage } from "../db";
import {
    jwtRequired,
    requireRole,
} from "../middleware/auth";
import {
    createErrorResponse,
    createSuccessResponse,
    createPaginatedResponse
} from "../services/serialization";
import {
    getActiveSessions,
    getRecentAnomalies,
    getSeverity,
    getCategory,
    maskSensitiveData
} from "../middleware/surveillance";
import type { UserRole } from "../../shared/supabase";

const router = Router();

const AUDIT_VIEW_ROLES: UserRole[] = ["admin", "franchise_manager"];

// ============ SURVEILLANCE STATS ============

/**
 * Get surveillance dashboard statistics
 * Returns KPIs for the Security Pulse ribbon
 */
router.get('/stats', jwtRequired, requireRole(AUDIT_VIEW_ROLES), async (req, res) => {
    try {
        const requestingUser = (req as any).employee;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Build franchise filter
        let franchiseFilter = '';
        const params: any[] = [];

        if (requestingUser.role !== 'admin' && requestingUser.franchiseId) {
            franchiseFilter = ' AND franchiseId = ?';
            params.push(requestingUser.franchiseId);
        }

        // High-severity actions in last 24 hours
        const highSeverityActions = [
            'delete_order', 'delete_employee', 'delete_customer',
            'revoke_access', 'role_change', 'refund_issued',
            'manual_credit_adjustment', 'price_override', 'data_export'
        ];
        const severityPlaceholders = highSeverityActions.map(() => '?').join(',');

        const highSeverityResult = storage.db.prepare(`
            SELECT COUNT(*) as count FROM audit_logs 
            WHERE action IN (${severityPlaceholders})
            AND createdAt >= ?
            ${franchiseFilter}
        `).get([...highSeverityActions, last24h.toISOString(), ...params]) as any;

        // Communication logs (WhatsApp) today
        const communicationResult = storage.db.prepare(`
            SELECT COUNT(*) as count FROM audit_logs 
            WHERE action LIKE '%whatsapp%'
            AND createdAt >= ?
            ${franchiseFilter}
        `).get([today.toISOString(), ...params]) as any;

        // Total logs today
        const totalTodayResult = storage.db.prepare(`
            SELECT COUNT(*) as count FROM audit_logs 
            WHERE createdAt >= ?
            ${franchiseFilter}
        `).get([today.toISOString(), ...params]) as any;

        // Failed login attempts in last 24h
        const failedLoginsResult = storage.db.prepare(`
            SELECT COUNT(*) as count FROM audit_logs 
            WHERE action = 'failed_login'
            AND createdAt >= ?
            ${franchiseFilter}
        `).get([last24h.toISOString(), ...params]) as any;

        // Active sessions (from in-memory tracker)
        const activeSessions = getActiveSessions(30);

        // Security anomalies
        const anomalies = getRecentAnomalies();

        // Category breakdown for today
        const categoryBreakdown = storage.db.prepare(`
            SELECT 
                CASE 
                    WHEN action LIKE '%payment%' OR action LIKE '%credit%' OR action LIKE '%refund%' THEN 'financial'
                    WHEN action LIKE '%transit%' OR action LIKE '%delivery%' THEN 'logistics'
                    WHEN action LIKE '%login%' OR action LIKE '%password%' OR action LIKE '%access%' THEN 'security'
                    WHEN action LIKE '%whatsapp%' OR action LIKE '%email%' OR action LIKE '%sms%' THEN 'communication'
                    ELSE 'lifecycle'
                END as category,
                COUNT(*) as count
            FROM audit_logs
            WHERE createdAt >= ?
            ${franchiseFilter}
            GROUP BY category
        `).all([today.toISOString(), ...params]) as any[];

        res.json(createSuccessResponse({
            highSeverityCount: highSeverityResult?.count || 0,
            communicationCount: communicationResult?.count || 0,
            totalToday: totalTodayResult?.count || 0,
            failedLogins: failedLoginsResult?.count || 0,
            activeSessions,
            anomalyCount: anomalies.length,
            anomalies: anomalies.slice(0, 5), // Top 5 anomalies
            categoryBreakdown: categoryBreakdown.reduce((acc: any, curr: any) => {
                acc[curr.category] = curr.count;
                return acc;
            }, {})
        }));
    } catch (error) {
        console.error('Get surveillance stats error:', error);
        res.status(500).json(createErrorResponse('Failed to fetch surveillance stats', 500));
    }
});

// ============ AUDIT LOGS WITH CURSOR PAGINATION ============

/**
 * Get audit logs with cursor-based (keyset) pagination
 * Supports infinite scroll with constant-time fetching
 */
router.get('/', jwtRequired, requireRole(AUDIT_VIEW_ROLES), async (req, res) => {
    try {
        const {
            limit = 30,
            cursor, // Format: "timestamp:id" for keyset pagination
            employeeId,
            action,
            startDate,
            endDate,
            entityType,
            entityId,
            franchiseId,
            category,
            severity,
            criticalOnly
        } = req.query;

        const limitNum = Math.min(parseInt(limit as string) || 30, 100);

        // Apply role-based filtering
        let actualFranchiseId = franchiseId as string | undefined;
        let actualEmployeeId = employeeId as string | undefined;

        // Get requesting user's role and franchise from JWT
        const requestingUser = (req as any).employee;
        if (requestingUser && requestingUser.role !== 'admin') {
            // Franchise managers can only see their franchise's logs
            if (requestingUser.role === 'franchise_manager' && requestingUser.franchiseId) {
                actualFranchiseId = requestingUser.franchiseId;
            }
            // Other roles can only see their own logs
            else if (requestingUser.role !== 'franchise_manager') {
                actualEmployeeId = requestingUser.id || requestingUser.employeeId;
            }
        }

        // Build query
        let query = 'SELECT * FROM audit_logs WHERE 1=1';
        const queryParams: any[] = [];

        if (actualEmployeeId) {
            query += ' AND employeeId = ?';
            queryParams.push(actualEmployeeId);
        }
        if (actualFranchiseId) {
            query += ' AND franchiseId = ?';
            queryParams.push(actualFranchiseId);
        }
        if (action && action !== 'all') {
            query += ' AND action LIKE ?';
            queryParams.push(`%${action}%`);
        }
        if (entityType) {
            query += ' AND entityType = ?';
            queryParams.push(entityType);
        }
        if (entityId) {
            query += ' AND entityId = ?';
            queryParams.push(entityId);
        }
        if (startDate) {
            query += ' AND createdAt >= ?';
            queryParams.push(startDate);
        }
        if (endDate) {
            query += ' AND createdAt <= ?';
            queryParams.push(endDate);
        }

        // Category filter (parse from details JSON)
        if (category) {
            query += ' AND (details LIKE ? OR action LIKE ?)';
            queryParams.push(`%"category":"${category}"%`, `%${category}%`);
        }

        // Critical only filter
        if (criticalOnly === 'true') {
            const criticalActions = [
                'delete_order', 'delete_employee', 'delete_customer',
                'revoke_access', 'role_change', 'refund_issued',
                'manual_credit_adjustment', 'data_export', 'failed_login'
            ];
            const placeholders = criticalActions.map(() => '?').join(',');
            query += ` AND action IN (${placeholders})`;
            queryParams.push(...criticalActions);
        }

        // Cursor-based pagination (keyset)
        if (cursor) {
            const [cursorTime, cursorId] = (cursor as string).split(':');
            query += ' AND (createdAt < ? OR (createdAt = ? AND id < ?))';
            queryParams.push(cursorTime, cursorTime, cursorId);
        }

        // Count total (without cursor for accurate count)
        let countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
        // Remove cursor conditions for total count
        if (cursor) {
            const cursorIndex = countQuery.indexOf(' AND (createdAt < ?');
            if (cursorIndex > -1) {
                countQuery = countQuery.substring(0, cursorIndex);
            }
        }
        const countParams = cursor
            ? queryParams.slice(0, queryParams.length - 3)
            : [...queryParams];
        const total = storage.db.prepare(countQuery).get(countParams) as any;

        // Add ordering and limit
        query += ' ORDER BY createdAt DESC, id DESC LIMIT ?';
        queryParams.push(limitNum + 1); // Fetch one extra to check if there are more

        const rows = storage.db.prepare(query).all(queryParams) as any[];

        // Check if there are more results
        const hasMore = rows.length > limitNum;
        const data = hasMore ? rows.slice(0, limitNum) : rows;

        // Parse details and add computed fields
        const enrichedData = data.map(row => {
            let details = null;
            let oldValue = null;
            let newValue = null;
            let computedCategory = 'system';
            let computedSeverity = 'info';

            if (row.details) {
                try {
                    details = typeof row.details === 'string'
                        ? JSON.parse(row.details)
                        : row.details;
                    oldValue = details?.oldValue || null;
                    newValue = details?.newValue || null;
                    computedCategory = details?.category || getCategory(row.action);
                    computedSeverity = details?.severity || getSeverity(row.action);
                } catch (e) {
                    details = row.details;
                }
            } else {
                computedCategory = getCategory(row.action);
                computedSeverity = getSeverity(row.action);
            }

            return {
                ...row,
                details,
                oldValue,
                newValue,
                category: computedCategory,
                severity: computedSeverity,
                createdAt: row.createdAt
            };
        });

        // Generate next cursor
        const lastItem = data[data.length - 1];
        const nextCursor = hasMore && lastItem
            ? `${lastItem.createdAt}:${lastItem.id}`
            : null;

        res.json({
            success: true,
            data: enrichedData,
            pagination: {
                total: total?.count || 0,
                limit: limitNum,
                hasMore,
                nextCursor
            }
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json(createErrorResponse('Failed to fetch audit logs', 500));
    }
});

// ============ UNIQUE ACTIONS FOR FILTERS ============

router.get('/actions', jwtRequired, requireRole(AUDIT_VIEW_ROLES), async (req, res) => {
    try {
        // Comprehensive list of all tracked actions for filtering
        const knownActions = [
            // Authentication
            'login', 'logout', 'failed_login', 'password_change',

            // Order Management
            'create_order', 'update_order', 'delete_order',
            'order_status_pending', 'order_status_processing', 'order_status_ready',
            'order_status_completed', 'order_status_cancelled', 'order_status_delivered',

            // Transit & Logistics
            'create_transit', 'update_transit', 'complete_transit', 'cancel_transit',

            // Payment
            'payment_received', 'payment_pending', 'mark_paid', 'refund_issued',
            'manual_credit_adjustment',

            // Printing & Documents
            'print_invoice', 'print_tags', 'print_document', 'export_report',

            // User Management
            'create_employee', 'update_employee', 'delete_employee',
            'revoke_access', 'restore_access', 'role_change',

            // Customer Management
            'create_customer', 'update_customer', 'delete_customer',

            // Service Management
            'create_service', 'update_service', 'delete_service',

            // Inventory
            'add_inventory', 'update_inventory', 'low_stock_alert',

            // Communication
            'whatsapp_sent', 'whatsapp_success', 'whatsapp_failed',
            'email_sent', 'sms_sent',

            // System
            'settings_update', 'backup_created', 'data_export', 'database_access'
        ];

        res.json(createSuccessResponse(knownActions));
    } catch (error) {
        console.error('Get audit actions error:', error);
        res.status(500).json(createErrorResponse('Failed to fetch audit actions', 500));
    }
});

// ============ ACTION CATEGORIES ============

router.get('/categories', jwtRequired, requireRole(AUDIT_VIEW_ROLES), async (req, res) => {
    try {
        const categories = [
            { id: 'financial', label: 'Financial', color: 'amber', icon: 'credit-card' },
            { id: 'logistics', label: 'Logistics', color: 'cyan', icon: 'truck' },
            { id: 'security', label: 'Security', color: 'red', icon: 'shield' },
            { id: 'lifecycle', label: 'Lifecycle', color: 'blue', icon: 'refresh' },
            { id: 'communication', label: 'Communication', color: 'green', icon: 'message' },
            { id: 'system', label: 'System', color: 'purple', icon: 'settings' }
        ];

        res.json(createSuccessResponse(categories));
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json(createErrorResponse('Failed to fetch categories', 500));
    }
});

// ============ LOG EXPORT WITH AUDIT TRAIL ============

router.post('/export', jwtRequired, requireRole(['admin']), async (req, res) => {
    try {
        const { format, startDate, endDate, categories } = req.body;
        const employee = (req as any).employee;

        // Log the export action (audit the auditor!)
        await storage.createAuditLog({
            employeeId: employee.id || employee.employeeId,
            franchiseId: employee.franchiseId,
            action: 'data_export',
            entityType: 'audit_logs',
            entityId: 'bulk',
            details: {
                format,
                startDate,
                endDate,
                categories,
                exportedBy: employee.fullName || employee.username,
                exportedAt: new Date().toISOString()
            },
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown'
        });

        // Build export query
        let query = 'SELECT * FROM audit_logs WHERE 1=1';
        const params: any[] = [];

        if (startDate) {
            query += ' AND createdAt >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND createdAt <= ?';
            params.push(endDate);
        }

        query += ' ORDER BY createdAt DESC LIMIT 10000'; // Cap at 10k records

        const logs = storage.db.prepare(query).all(params) as any[];

        // Mask sensitive data in export
        const maskedLogs = logs.map(log => {
            let details = log.details;
            if (typeof details === 'string') {
                try {
                    details = JSON.parse(details);
                } catch (e) { }
            }

            return {
                ...log,
                details: maskSensitiveData(details)
            };
        });

        res.json(createSuccessResponse({
            count: maskedLogs.length,
            data: maskedLogs
        }));
    } catch (error) {
        console.error('Export audit logs error:', error);
        res.status(500).json(createErrorResponse('Failed to export audit logs', 500));
    }
});

// ============ EMPLOYEE ACTIVITY LOOKUP ============

router.get('/employee/:employeeId', jwtRequired, requireRole(AUDIT_VIEW_ROLES), async (req, res) => {
    try {
        const { employeeId } = req.params;
        const requestingUser = (req as any).employee;

        // Non-admins can only view their own activity
        if (requestingUser.role !== 'admin' &&
            requestingUser.id !== employeeId &&
            requestingUser.employeeId !== employeeId) {
            return res.status(403).json(createErrorResponse('Access denied', 403));
        }

        // Get employee info
        const employee = storage.db.prepare(
            'SELECT id, fullName, username, role, franchiseId FROM employees WHERE id = ?'
        ).get(employeeId) as any;

        if (!employee) {
            return res.status(404).json(createErrorResponse('Employee not found', 404));
        }

        // Get recent activity
        const recentActivity = storage.db.prepare(`
            SELECT action, entityType, createdAt, ipAddress
            FROM audit_logs 
            WHERE employeeId = ?
            ORDER BY createdAt DESC
            LIMIT 20
        `).all(employeeId) as any[];

        // Get unique IPs in last 7 days
        const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const uniqueIPs = storage.db.prepare(`
            SELECT DISTINCT ipAddress, MAX(createdAt) as lastSeen
            FROM audit_logs
            WHERE employeeId = ? AND createdAt >= ?
            GROUP BY ipAddress
        `).all(employeeId, last7Days) as any[];

        // Get action breakdown
        const actionBreakdown = storage.db.prepare(`
            SELECT action, COUNT(*) as count
            FROM audit_logs
            WHERE employeeId = ?
            GROUP BY action
            ORDER BY count DESC
            LIMIT 10
        `).all(employeeId) as any[];

        res.json(createSuccessResponse({
            employee: {
                id: employee.id,
                fullName: employee.fullName,
                username: employee.username,
                role: employee.role,
                franchiseId: employee.franchiseId
            },
            recentActivity,
            uniqueIPs,
            actionBreakdown,
            totalActions: actionBreakdown.reduce((sum, a) => sum + a.count, 0)
        }));
    } catch (error) {
        console.error('Get employee activity error:', error);
        res.status(500).json(createErrorResponse('Failed to fetch employee activity', 500));
    }
});

export default router;
