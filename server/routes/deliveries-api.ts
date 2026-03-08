/**
 * Delivery Partner Portal API Routes
 * 
 * Provides authenticated delivery drivers with their assigned orders,
 * history, and aggregated earnings.
 */

import { Router } from 'express';
import { db as storage } from '../db';
import { jwtRequired } from '../middleware/auth';
import { createSuccessResponse, createErrorResponse } from '../services/serialization';

const router = Router();
router.use(jwtRequired);

/**
 * GET /api/deliveries/me/active
 * Returns active orders assigned to the authenticated delivery partner.
 */
router.get('/me/active', async (req, res) => {
    try {
        const employeeId = req.employee?.id;
        if (!employeeId) {
            return res.status(401).json(createErrorResponse('Authentication required', 401));
        }

        const allOrders = await storage.listOrders();

        // Filter: assigned to this driver AND in an active delivery status
        const activeStatuses = ['ready_for_delivery', 'out_for_delivery', 'assigned'];
        const myActiveOrders = allOrders.filter((order: any) =>
            order.deliveryPartnerId === employeeId &&
            activeStatuses.includes(order.status)
        );

        res.json(createSuccessResponse(myActiveOrders, `Found ${myActiveOrders.length} active deliveries`));
    } catch (error: any) {
        console.error('[Deliveries API] Error fetching active orders:', error);
        res.status(500).json(createErrorResponse('Failed to fetch active deliveries', 500));
    }
});

/**
 * GET /api/deliveries/me/history
 * Returns completed deliveries for the authenticated driver + monthly aggregated earnings.
 */
router.get('/me/history', async (req, res) => {
    try {
        const employeeId = req.employee?.id;
        if (!employeeId) {
            return res.status(401).json(createErrorResponse('Authentication required', 401));
        }

        const allOrders = await storage.listOrders();

        // Filter: assigned to this driver AND delivered
        const myDeliveredOrders = allOrders.filter((order: any) =>
            order.deliveryPartnerId === employeeId &&
            order.status === 'delivered'
        ).sort((a: any, b: any) =>
            new Date(b.deliveredAt || b.updatedAt || 0).getTime() -
            new Date(a.deliveredAt || a.updatedAt || 0).getTime()
        );

        // Calculate current month earnings
        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const currentMonthOrders = myDeliveredOrders.filter((order: any) => {
            const deliveredDate = new Date(order.deliveredAt || order.updatedAt || 0);
            const orderMonth = `${deliveredDate.getFullYear()}-${String(deliveredDate.getMonth() + 1).padStart(2, '0')}`;
            return orderMonth === currentMonthKey;
        });

        const totalEarningsThisMonth = currentMonthOrders.reduce(
            (sum: number, order: any) => sum + (order.deliveryEarningsCalculated || 0), 0
        );

        const totalDeliveriesThisMonth = currentMonthOrders.length;

        res.json(createSuccessResponse({
            orders: myDeliveredOrders,
            earnings: {
                currentMonth: currentMonthKey,
                totalEarnings: totalEarningsThisMonth,
                totalDeliveries: totalDeliveriesThisMonth,
            }
        }));
    } catch (error: any) {
        console.error('[Deliveries API] Error fetching history:', error);
        res.status(500).json(createErrorResponse('Failed to fetch delivery history', 500));
    }
});

export default router;
