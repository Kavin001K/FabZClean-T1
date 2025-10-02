"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const storage_1 = require("./server/storage");
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
            const deliveries = await storage_1.storage.getDeliveries();
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(deliveries),
            };
        }
        if (event.httpMethod === 'POST') {
            const deliveryData = JSON.parse(event.body || '{}');
            const newDelivery = await storage_1.storage.createDelivery(deliveryData);
            return {
                statusCode: 201,
                headers,
                body: JSON.stringify(newDelivery),
            };
        }
        if (event.httpMethod === 'PUT') {
            const deliveryData = JSON.parse(event.body || '{}');
            const updatedDelivery = await storage_1.storage.updateDelivery(deliveryData.id, deliveryData);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(updatedDelivery),
            };
        }
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ message: 'Method not allowed' }),
        };
    }
    catch (error) {
        console.error('Deliveries API Error:', error);
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
