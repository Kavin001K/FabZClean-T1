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
            const services = await storage_1.storage.getServices();
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(services),
            };
        }
        if (event.httpMethod === 'POST') {
            const serviceData = JSON.parse(event.body || '{}');
            const newService = await storage_1.storage.createService(serviceData);
            return {
                statusCode: 201,
                headers,
                body: JSON.stringify(newService),
            };
        }
        if (event.httpMethod === 'PUT') {
            const serviceData = JSON.parse(event.body || '{}');
            const updatedService = await storage_1.storage.updateService(serviceData.id, serviceData);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(updatedService),
            };
        }
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ message: 'Method not allowed' }),
        };
    }
    catch (error) {
        console.error('Services API Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            }),
        };
    }
};
exports.handler = handler;
//# sourceMappingURL=services.js.map