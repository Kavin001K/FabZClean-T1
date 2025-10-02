"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const db_1 = require("./db");
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
            // Test database connection
            const connectionTest = await db_1.db.testConnection();
            // Get some sample data
            const orders = await db_1.db.getOrders();
            const customers = await db_1.db.getCustomers();
            const metrics = await db_1.db.getDashboardMetrics();
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: 'Database integration test successful!',
                    connection: connectionTest,
                    data: {
                        ordersCount: orders.length,
                        customersCount: customers.length,
                        metrics
                    },
                    timestamp: new Date().toISOString()
                }),
            };
        }
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ message: 'Method not allowed' }),
        };
    }
    catch (error) {
        console.error('Database test error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Database test failed',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            }),
        };
    }
};
exports.handler = handler;
