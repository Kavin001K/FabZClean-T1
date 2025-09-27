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
            const customers = await storage_1.storage.getCustomers();
            const transformedCustomers = customers.map(customer => ({
                ...customer,
                joinDate: customer.createdAt,
                totalSpent: parseFloat(customer.totalSpent)
            }));
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(transformedCustomers),
            };
        }
        if (event.httpMethod === 'POST') {
            const customerData = JSON.parse(event.body || '{}');
            const newCustomer = await storage_1.storage.createCustomer(customerData);
            return {
                statusCode: 201,
                headers,
                body: JSON.stringify(newCustomer),
            };
        }
        if (event.httpMethod === 'PUT') {
            const customerData = JSON.parse(event.body || '{}');
            const updatedCustomer = await storage_1.storage.updateCustomer(customerData.id, customerData);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(updatedCustomer),
            };
        }
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ message: 'Method not allowed' }),
        };
    }
    catch (error) {
        console.error('Customers API Error:', error);
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
//# sourceMappingURL=customers.js.map