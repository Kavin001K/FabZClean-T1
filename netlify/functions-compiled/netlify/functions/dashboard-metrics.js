"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const storage_1 = require("./server/storage");
const handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json',
    };
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'CORS preflight' }),
        };
    }
    try {
        if (event.httpMethod === 'GET') {
            const metrics = await storage_1.storage.getDashboardMetrics();
            const customers = await storage_1.storage.getCustomers();
            const transformedMetrics = {
                totalRevenue: metrics.totalRevenue,
                totalOrders: metrics.ordersToday,
                newCustomers: customers.length,
                inventoryItems: 0
            };
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(transformedMetrics),
            };
        }
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ message: 'Method not allowed' }),
        };
    }
    catch (error) {
        console.error('Dashboard Metrics API Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            }),
        };
    }
};
exports.handler = handler;
