"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
// Sample data for demonstration
const sampleOrders = [
    {
        id: "1",
        orderNumber: "ORD-001",
        customerName: "John Doe",
        customerEmail: "john@example.com",
        customerPhone: "+1234567890",
        status: "pending",
        paymentStatus: "pending",
        totalAmount: "25.00",
        items: [{ productId: "1", productName: "Dry Cleaning", quantity: 1, price: "25.00" }],
        shippingAddress: { instructions: "Leave at door", pickupDate: "2024-01-15" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        date: new Date().toISOString(),
        total: 25.00,
        service: "Dry Cleaning",
        priority: "Normal"
    }
];
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
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(sampleOrders),
            };
        }
        if (event.httpMethod === 'POST') {
            const orderData = JSON.parse(event.body || '{}');
            const newOrder = {
                id: Date.now().toString(),
                ...orderData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
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
