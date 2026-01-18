import { Router } from "express";
import { z } from "zod";
import { db as storage } from "../db";
import {
    jwtRequired,
    requireRole,
} from "../middleware/auth";
import { createErrorResponse, createSuccessResponse, createPaginatedResponse } from "../services/serialization";
import type { UserRole } from "../../shared/supabase";

const router = Router();

const AUDIT_VIEW_ROLES: UserRole[] = ["admin", "franchise_manager"];

// Get audit logs with pagination, filtering, and role-based isolation
router.get('/', jwtRequired, requireRole(AUDIT_VIEW_ROLES), async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            employeeId,
            action,
            startDate,
            endDate,
            entityType,
            franchiseId
        } = req.query;

        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 20;
        const offset = (pageNum - 1) * limitNum;

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

        const { data, count } = await storage.getAuditLogs({
            page: pageNum,
            limit: limitNum,
            employeeId: actualEmployeeId,
            franchiseId: actualFranchiseId,
            action,
            startDate,
            endDate,
            entityType,
            sortBy: req.query.sortBy === 'createdAt' ? 'createdAt' : req.query.sortBy as string,
            sortOrder: req.query.sortOrder as string
        });

        const response = createPaginatedResponse(data || [], {
            total: count || 0,
            page: pageNum,
            limit: limitNum,
            hasMore: (offset + limitNum) < (count || 0)
        });

        res.json(response);
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json(createErrorResponse('Failed to fetch audit logs', 500));
    }
});

// Get unique actions for filter dropdown
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

            // System
            'settings_update', 'backup_created', 'data_export'
        ];

        res.json(createSuccessResponse(knownActions));
    } catch (error) {
        console.error('Get audit actions error:', error);
        res.status(500).json(createErrorResponse('Failed to fetch audit actions', 500));
    }
});

export default router;
