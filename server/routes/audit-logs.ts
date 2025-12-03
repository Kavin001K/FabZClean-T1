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

// Get audit logs with pagination and filtering
router.get('/', jwtRequired, requireRole(AUDIT_VIEW_ROLES), async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            employeeId,
            action,
            startDate,
            endDate,
            entityType
        } = req.query;

        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 20;
        const offset = (pageNum - 1) * limitNum;

        // Build query
        let query = storage.supabase
            .from('audit_logs')
            .select('*', { count: 'exact' });

        // Apply filters
        if (employeeId) {
            query = query.eq('employee_id', employeeId);
        }
        if (action) {
            query = query.eq('action', action);
        }
        if (entityType) {
            query = query.eq('entity_type', entityType);
        }
        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        if (endDate) {
            query = query.lte('created_at', endDate);
        }

        // Apply pagination and sorting
        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limitNum - 1);

        if (error) throw error;

        // Transform data if needed (e.g., parse JSON details if it comes as string)
        // Supabase client usually handles JSON automatically

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
        // This is a bit of a hack since Supabase doesn't support DISTINCT easily via JS client in all cases
        // But we can use a stored procedure or just fetch distinct values if the table isn't huge
        // For now, let's just return a static list of known actions or fetch recent ones

        // Better approach: RPC call if we had one, or just hardcode common ones + fetch recent
        const knownActions = [
            'login', 'logout',
            'create_order', 'update_order', 'delete_order', 'update_order_status',
            'payment_received', 'print_document',
            'create_employee', 'update_employee',
            'change_password'
        ];

        res.json(createSuccessResponse(knownActions));
    } catch (error) {
        console.error('Get audit actions error:', error);
        res.status(500).json(createErrorResponse('Failed to fetch audit actions', 500));
    }
});

export default router;
