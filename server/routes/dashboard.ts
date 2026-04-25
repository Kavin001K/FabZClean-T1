import { Router } from "express";
import { db as storage } from "../db";
import { extractListData } from "../utils/list-result";

const router = Router();

import { authMiddleware } from "../middleware/employee-auth";

const IST_TIME_ZONE = "Asia/Kolkata";

function toNumber(value: unknown): number {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
}

function getIstDayBounds(now: Date = new Date()): { start: Date; end: Date } {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: IST_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
    const datePart = formatter.format(now); // YYYY-MM-DD
    const start = new Date(`${datePart}T00:00:00+05:30`);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
}

async function listAllCustomers(): Promise<any[]> {
    const pageSize = 1000;
    let offset = 0;
    let totalCount = Number.POSITIVE_INFINITY;
    const all: any[] = [];

    while (offset < totalCount) {
        const response = await (storage as any).listCustomers(undefined, {
            limit: pageSize,
            offset,
            sortBy: "createdAt",
            sortOrder: "desc",
        });
        const rows = Array.isArray(response?.data)
            ? response.data
            : extractListData(response);
        totalCount = Number(response?.totalCount ?? all.length + rows.length);
        all.push(...rows);
        if (rows.length < pageSize) break;
        offset += pageSize;
    }

    return all;
}

// Dashboard metrics endpoint
router.get("/metrics", authMiddleware, async (req, res) => {
    try {
        const employee = req.employee;
        const employeeScope = employee?.storeId || employee?.franchiseId;

        // All live orders currently use store_code/store_id (franchise_id is null in prod),
        // so scope in-process using available employee scope fields.
        const rawOrders = await storage.listOrders();
        const allOrders = employee && employee.role !== "admin" && employeeScope
            ? rawOrders.filter((order: any) =>
                String(order.storeId || "").toLowerCase() === String(employeeScope).toLowerCase() ||
                String(order.storeCode || "").toLowerCase() === String(employeeScope).toLowerCase()
            )
            : rawOrders;

        // Pull all customers (default storage.listCustomers() returns first 50 only).
        const customers = await listAllCustomers();
        const products = await storage.listProducts();

        const activeOrders = allOrders.filter((order: any) => order.status !== 'cancelled');
        const totalRevenue = activeOrders.reduce(
            (sum: number, order: any) => sum + toNumber(order.totalAmount),
            0
        );
        const totalOrders = activeOrders.length;
        const totalOutstanding = customers.reduce(
            (sum: number, customer: any) => sum + Math.max(0, toNumber(customer.creditBalance ?? customer.credit_balance)),
            0
        );
        const successfulOrders = activeOrders.filter((order: any) => ['completed', 'delivered'].includes(order.status)).length;

        const { start: today, end: tomorrow } = getIstDayBounds();
        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

        const ordersToday = activeOrders.filter(
            (order: any) => {
                if (!order.createdAt) return false;
                const createdAt = new Date(order.createdAt);
                return createdAt >= today && createdAt < tomorrow;
            }
        ).length;

        const newCustomersToday = customers.filter(
            (customer: any) => {
                if (!customer.createdAt) return false;
                const createdAt = new Date(customer.createdAt);
                return createdAt >= today && createdAt < tomorrow;
            }
        ).length;

        const dueDateStats = activeOrders.reduce((stats: any, order: any) => {
            if (!order.pickupDate) return stats;
            const pickupDate = new Date(order.pickupDate);
            pickupDate.setHours(0, 0, 0, 0);

            if (pickupDate < today) {
                stats.overdue += 1;
            } else if (pickupDate.getTime() === today.getTime()) {
                stats.today += 1;
            } else if (pickupDate.getTime() === tomorrow.getTime()) {
                stats.tomorrow += 1;
            } else if (pickupDate >= dayAfterTomorrow) {
                stats.upcoming += 1;
            }

            return stats;
        }, {
            today: 0,
            tomorrow: 0,
            overdue: 0,
            upcoming: 0,
        });

        const metrics = {
            totalRevenue,
            totalOrders,
            newCustomers: newCustomersToday,
            inventoryItems: products.length,
            bookedRevenue: totalRevenue,
            outstandingCredit: totalOutstanding,
            averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
            successRate: totalOrders > 0 ? (successfulOrders / totalOrders) * 100 : 0,
            ordersToday,
            dueDateStats,
        };

        res.json(metrics);
    } catch (error) {
        console.error("Dashboard metrics error:", error);
        res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
});

export default router;
