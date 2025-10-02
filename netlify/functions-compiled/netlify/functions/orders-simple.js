"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const db_1 = require("./db");
const handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
            const orders = await db_1.db.getOrders();
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(orders),
            };
        }
        if (event.httpMethod === 'POST') {
            const orderData = JSON.parse(event.body || '{}');
            const newOrder = await db_1.db.createOrder(orderData);
            return {
                statusCode: 201,
                headers,
                body: JSON.stringify(newOrder),
            };
        }
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ message: 'Method not allowed' }),
        };
    }
    catch (error) {
        console.error('Orders API Error:', error);
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
